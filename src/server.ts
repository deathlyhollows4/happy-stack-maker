import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const SERVER_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "LOVABLE_API_KEY",
  "RAZORPAY_SANDBOX_KEY_ID",
  "RAZORPAY_SANDBOX_KEY_SECRET",
  "RAZORPAY_SANDBOX_WEBHOOK_SECRET",
  "RAZORPAY_LIVE_KEY_ID",
  "RAZORPAY_LIVE_KEY_SECRET",
  "RAZORPAY_LIVE_WEBHOOK_SECRET",
] as const;

const PUBLIC_RUNTIME_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "RAZORPAY_SANDBOX_KEY_ID",
  "RAZORPAY_LIVE_KEY_ID",
  "VITE_RAZORPAY_KEY_ID",
] as const;

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function syncRuntimeEnv(env: unknown) {
  if (!env || typeof env !== "object") return;

  const runtimeEnv = env as Record<string, unknown>;
  for (const key of SERVER_ENV_KEYS) {
    const value = runtimeEnv[key];
    if (typeof value === "string" && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readRuntimeString(env: unknown, key: string) {
  const runtimeEnv = env && typeof env === "object" ? (env as Record<string, unknown>) : undefined;
  const runtimeValue = runtimeEnv?.[key];
  if (typeof runtimeValue === "string" && runtimeValue) return runtimeValue;

  const processValue = process.env[key];
  return processValue || undefined;
}

function buildPublicRuntimeEnv(env: unknown) {
  const values: Record<string, string> = {};

  for (const key of PUBLIC_RUNTIME_ENV_KEYS) {
    const value = readRuntimeString(env, key);
    if (value) values[key] = value;
  }

  if (!values.VITE_SUPABASE_URL && values.SUPABASE_URL) {
    values.VITE_SUPABASE_URL = values.SUPABASE_URL;
  }

  if (!values.VITE_SUPABASE_PUBLISHABLE_KEY && values.SUPABASE_PUBLISHABLE_KEY) {
    values.VITE_SUPABASE_PUBLISHABLE_KEY = values.SUPABASE_PUBLISHABLE_KEY;
  }

  if (!values.VITE_RAZORPAY_KEY_ID) {
    values.VITE_RAZORPAY_KEY_ID = values.RAZORPAY_LIVE_KEY_ID ?? values.RAZORPAY_SANDBOX_KEY_ID;
  }

  return values;
}

function serializePublicRuntimeEnv(env: Record<string, string>) {
  return JSON.stringify(env).replace(/</g, "\\u003c");
}

async function injectPublicRuntimeEnv(response: Response, env: unknown): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const publicEnv = buildPublicRuntimeEnv(env);
  if (!publicEnv.VITE_SUPABASE_URL || !publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return response;
  }

  const html = await response.text();
  const script = `<script>window.__CODEWISE_PUBLIC_ENV__=${serializePublicRuntimeEnv(publicEnv)};</script>`;
  const body = html.includes("</head>") ? html.replace("</head>", `${script}</head>`) : `${script}${html}`;

  return new Response(body, response);
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"}. try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// Security headers applied to every response
const securityHeaders: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// CSP applied only to HTML responses
const csp =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://plausible.io; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "img-src 'self' data: https:; " +
  "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://plausible.io; " +
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com;";

function injectSecurityHeaders(response: Response): Response {
  // Clone the response so we can safely mutate headers
  const secure = new Response(response.body, response);

  // Apply base security headers to every response
  for (const [key, value] of Object.entries(securityHeaders)) {
    secure.headers.set(key, value);
  }

  // Apply CSP only to HTML responses
  const contentType = secure.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    secure.headers.set("Content-Security-Policy", csp);
  }

  return secure;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      syncRuntimeEnv(env);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      const withPublicEnv = await injectPublicRuntimeEnv(normalized, env);
      return injectSecurityHeaders(withPublicEnv);
    } catch (error) {
      console.error(error);
      const withPublicEnv = await injectPublicRuntimeEnv(brandedErrorResponse(), env);
      return injectSecurityHeaders(withPublicEnv);
    }
  },
};
