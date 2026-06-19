import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createSubscriptionCheckout, verifyRazorpaySubscriptionPayment } from "@/lib/payments.functions";
import { getBillingEnvironment, type RazorpayCheckoutRequest } from "@/lib/payments";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-codewise-razorpay="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Razorpay checkout failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.codewiseRazorpay = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout failed to load."));
    document.head.appendChild(script);
  });

  return razorpayScriptPromise;
}

export function useRazorpayCheckout() {
  const [loading, setLoading] = useState(false);
  const createCheckout = useServerFn(createSubscriptionCheckout);
  const verifyCheckout = useServerFn(verifyRazorpaySubscriptionPayment);

  const openCheckout = async (request: RazorpayCheckoutRequest) => {
    setLoading(true);
    try {
      const environment = getBillingEnvironment();
      const session = await createCheckout({
        data: {
          billingPlanCode: request.priceId,
          environment,
          currencyCode: "INR",
        },
      });

      if (!session.ok) {
        throw new Error(session.error);
      }

      await loadRazorpayCheckoutScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const pendingUrl =
        request.successUrl ?? `${window.location.origin}/dashboard?checkout=pending`;

      const checkout = new window.Razorpay({
        key: session.keyId,
        order_id: session.orderId,
        amount: session.amount,
        currency: session.currencyCode,
        name: "CodeWise",
        description:
          request.priceId === "pro_yearly"
            ? "CodeWise Pro Yearly subscription"
            : "CodeWise Pro Monthly subscription",
        prefill: {
          name: request.customerName,
          email: request.customerEmail,
          contact: request.customerContact,
        },
        notes: {
          userId: request.userId,
          billingPlanCode: session.billingPlanCode,
        },
        theme: {
          color: "#1f7a8c",
        },
        handler: async (response: unknown) => {
          try {
            const payload =
              response && typeof response === "object" ? (response as Record<string, unknown>) : {};
            const paymentId =
              typeof payload.razorpay_payment_id === "string" ? payload.razorpay_payment_id : null;
            const orderId =
              typeof payload.razorpay_order_id === "string" ? payload.razorpay_order_id : session.orderId;
            const signature =
              typeof payload.razorpay_signature === "string" ? payload.razorpay_signature : null;

            if (!paymentId || !orderId || !signature) {
              toast.error("Payment completed, but verification details were incomplete.");
              return;
            }

            const verification = await verifyCheckout({
              data: {
                environment,
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
                razorpaySignature: signature,
                billingPlanCode: session.billingPlanCode,
                currencyCode: session.currencyCode,
              },
            });

            if (!verification.ok) {
              toast.error(verification.error);
              return;
            }

            toast.info(verification.message);
            window.location.assign(
              verification.active
                ? pendingUrl.replace("checkout=pending", "checkout=active")
                : pendingUrl,
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Payment verification failed.";
            toast.error(message);
          }
        },
      });

      checkout.open();
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
