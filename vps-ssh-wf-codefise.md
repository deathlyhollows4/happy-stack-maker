# CodeWise - Single-Source Reference

> **Project:** C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\
> **Live URL:** https://happy-stack-maker.lovable.app/
> **Dev server:** http://localhost:3001 (Vite 7, port 3001)
> **Framework:** TanStack Start v1 (React 19, TypeScript, Vite 7)
> **Styling:** Tailwind CSS v4 + shadcn/ui on Radix primitives
> **Database:** Supabase (RLS-enforced)
> **Payments:** Paddle (Lovable Gateway)
> **AI Gateway:** Lovable, openai/gpt-5-mini
> **Editor:** CodeMirror 6
> **E2E:** Playwright (12 tests at tests/e2e/critical-path.spec.ts)
> **Test creds:** vidhantomar17082004@gmail.com / Jaatdevta@123

## Remote Access (VPS to PC via Tailscale SSH)

VPS (Hostinger, user hermes, /opt/data/) -> Tailscale SOCKS5:1055 -> Windows PC obamabinladen (100.110.252.65).

`
Host obamabinladen
    Hostname 100.110.252.65
    User brawl
    IdentityFile /opt/data/home/.ssh/pc_ed25519
    ProxyCommand python3 /opt/data/home/.ssh/socks5-connect.py %h %p
    StrictHostKeyChecking no
`

### Command patterns

| Action | Command |
|--------|---------|
| Read file | ssh -F /opt/data/.ssh/config obamabinladen 'cmd /c type C:\path\to\file' |
| Run cmd | ssh ... 'powershell -Command "cd C:/project; command"' |
| List dir | ssh ... 'cmd /c dir /b C:\project\src' |
| Build | ssh ... 'powershell -Command "cd C:/project; npm run build"' |
| E2E | ssh ... 'powershell -Command "cd C:/project; npx playwright test --project=chromium tests/e2e/critical-path.spec.ts"' |
| SCP | scp -F /opt/data/.ssh/config /vps/path obamabinladen:'C:/project/dest/' |
| Route check | ssh ... 'powershell -Command "try { (Invoke-WebRequest -Uri http://localhost:3001/learn -UseBasicParsing -TimeoutSec 5).StatusCode } catch { 0 }"' |

### Quirks & Gotchas
- **Paths**: Use forward slashes in PS (C:/Users/...). Outer SSH in single quotes.
- **-File vs -Command**: -File does NOT set working dir, always Set-Location at top.
- **Env vars**: Set  in same chain as target command.
- **Encoding**: PS1 via SCP works UTF-8. Use -Encoding UTF8 for non-ASCII.
- **SOCKS5**: /opt/data/home/.ssh/socks5-connect.py. Tailscale must run --socks5-server=127.0.0.1:1055.
- **Auto-gen files (DO NOT EDIT)**: client.ts, client.server.ts, auth-middleware.ts, auth-attacher.ts, types.ts, paddle.server.ts, paddle.ts.
- **routeTree.gen.ts** auto-regenerates. Edit .tsx files only.
- **Post-sync install**: npm install @lovable.dev/cloud-auth-js@1.1.2 @paddle/paddle-node-sdk
- **Supabase session race**: Use onAuthStateChange with 5s getSession() fallback after auth mutations.
- **Dev vs production**: Local dev lacks Lovable OAuth. Test via live Lovable URL after deploy.
- **Banned patterns**: backdrop-blur, transition-all (use transition-[prop]), Markdown **bold** in JSX (use <strong>), text-zinc-500 (use text-zinc-400). Em dashes banned - use hyphen.
- **Git push fails over SSH**: wincredman can't persist. Use local terminal on PC or provide GH PAT.

## Phase 1-3: Low-Cognitive-Load IA Refactor (13 June 2026)

Committed at d8ac6ec (18 files, +1,036/-515, 3 new: site-header.tsx, blog.tsx, learn.tsx). Unpushed.

### Phase 1 - Navigation clarity
Shared site-header (Learn/Blog/Pricing/Sign in/Start free review). Grouped footer (Product/Learn/Legal). Labels: "Start free review", "Review Code". /explore H1/title to "Blog | CodeWise". Corrupted chars fixed. Admin research link.

### Phase 2 - Content hubs
/learn topic hub with DSA category cards. /blog + /blog/ canonical routes. /explore and /explore/ redirect (307) to /blog. Sitemap updated. Cross-links added.

### Phase 3 - Student workflow
Dashboard next-best-action card (0 reviews/weakest topic/review feedback). KG collapsible. Practice 3-step stepper (topic>language>solve) + Show all options. Submission "What's next?" card with Learn/Practice/Review CTAs. Settings/export already done.

## Phase 4 — Mobile responsive UI + green success styling (13 June 2026)

Uncommitted. 3 files modified: review.tsx, practice.tsx, learn.$slug.tsx.

### Mobile UI fixes

All 3 core student pages received mobile-first responsive overhauls:

| Page | File | Changes |
|------|------|---------|
| Review Code | review.tsx | p-4 md:p-8, text-3xl md:text-5xl, buttons stack on mobile (flex-col sm:flex-row), editor/summary heights match via clamp(40vh,60vw,60vh), button labels shorten on mobile, gap-4 md:gap-6 |
| Submission Detail | submission.$submissionId.tsx | p-4 md:p-8, text-3xl md:text-5xl, Share/Back buttons stack on mobile, matched column heights |
| Shared Review | s.$submissionId.tsx | Header responsive, CTA button smaller on mobile, matched column heights |
| Practice | practice.tsx | p-4 md:p-8, text-3xl md:text-5xl, problem list sidebar uses truncate+min-w-0 to prevent overflow, controls stack on mobile, stepper uses max-w-full |
| Learn topic detail | learn.$slug.tsx | Fixed duplicate navbar — learn.tsx layout already wraps SiteHeader+Outlet+SiteFooter, slug page was duplicating it |

### Green success styling (review.tsx)
- Concept tags changed from reddish bg-accent/15 text-accent to emerald bg-emerald-500/10 text-emerald-500
- Info-severity issues changed from Info icon + text-accent to CheckCircle2 + text-emerald-500
- No issues found state made more prominent with green styling
- Fix hint borders use emerald for validated/info issues

### Verification
- npm run build: 0 errors (client + SSR)
- No em dashes or banned patterns in changed files
- New git head: 1b626aa mobile-oriented beta v0.0.1

## Route Structure

### Public
| Route | Description |
|-------|-------------|
| / | Home: hero + featured topics + latest blog |
| /learn | Topic hub (DSA cards by category) |
| /learn/$slug | Topic detail |
| /blog | Canonical blog index (H1 "Blog") |
| /blog/$slug | Canonical blog post |
| /explore | 307 redirect to /blog |
| /explore/$slug | 307 redirect to /blog/$slug |
| /pricing | Plans |
| /login, /signup, /forgot-password, /reset-password | Auth |
| /terms, /privacy, /refunds | Legal |
| /sitemap.xml | SEO (includes /learn, /blog, /blog/) |

### Authenticated
| Route | Description |
|-------|-------------|
| /dashboard | Next-best-action + stats + collapsible KG + mastery + reviews |
| /review | Submit code for AI review (mobile responsive) |
| /practice | 3-step stepper (topic/language/solve) + power-user escape |
| /submission/$id | Review results + "What's next?" learn/practice CTAs |
| /settings | Profile, security, appearance, data, research, danger |
| /settings/export | Export JSON/CSV (H1 "Export your data", distinct page) |
| /billing | Subscription |

### IA Components
- **site-header**: Learn=/learn, Blog=/blog, Pricing=/pricing, Sign in=/login, CTA "Start free review"
- **site-footer**: Product/Home/Review Code/Practice/Pricing, Learn/Topics/Blog, Legal/Terms/Refunds/Privacy
- **Auth nav**: Dashboard, Review Code, Practice, Learn. Dropdown: Settings, Billing, Admin, Sign out

## Agent-Mesh Routing

| Agent | Handles | Model |
|-------|---------|-------|
| @Forge | All code, E2E tests, vision analysis | gpt-5.4 |
| @Scout | Browser crawl verification | deepseek-v4-flash |
| @Sentinel | Infra/dev-server issues | deepseek-v4-flash |
| @Maven | Labels/titles/SEO | gpt-5.4-mini |

**Verification protocol**: build (0 errors) -> E2E (12/12 pass) -> re-read modified files (check template-literal leaks) -> HTTP route check -> @Scout crawl -> vision verify with @Forge

## GitNexus
- Repo: happy-stack-maker (VPS clone: /tmp/happy-stack-maker, at 741b0f9)
- Stats: 1,513 nodes, 2,111 edges, 51 clusters, 32 processes
- After major edits: git bundle from PC -> VPS fetch -> gitnexus analyze --force

## Browser Automation (PC)
**CDP Chrome**: Start-Process chrome.exe '--remote-debugging-port=9223','--headless=new','--disable-gpu' (port 9223). Verify: Invoke-WebRequest -Uri http://127.0.0.1:9223/json/version

**browser-harness**: C:\Users\brawl\.local\bin\browser-harness.exe (uv tool). Set , pipe Python code. Chrome + BH in same script session. Hermes skill at /opt/data/.hermes/skills/software-development/browser-harness/SKILL.md.

**E2E tests**: 12 critical-path tests at tests/e2e/critical-path.spec.ts (7.5s). Config: playwright.config.ts. Fix: pricing locator .first().

## Audit & Improvement Plan (11 June 2026)
Full audit at CODEWISE_AUDIT_2026-06-11.md (20KB, 45 findings, 23 fix tasks).

### Resolved
- FSRS interval formula fixed (intervals grow, computes actual retrieval probability)
- FSRS per-concept grading (each graded independently)
- Shared constants in src/lib/review.constants.ts (SYSTEM_PROMPT, schemas deduped)
- eval.ts imports shared + uses extractJson()
- 23 unit tests via vitest (vitest.config.ts). Build PASS, 23/23 PASS.

### Remaining High Priority
- Monolith codewise.functions.ts still ~1,300 lines (28 functions)
- No CI/CD (zero GitHub Actions workflows)
- No observability (43 console.error calls drop to nowhere)
- No auto migration runner (19 SQL files manual)
- Webhook idempotency missing (Paddle retries)
- learn..tsx: 475 lines hardcoded content (should be DB)
- 42/46 shadcn/ui unused (dead code to purge)
- No error boundaries, security headers, rate limiting, DB backups

## VPS Infrastructure
- Tailscale SOCKS5: 127.0.0.1:1055 (userspace)
- Services: gateway:8642, workspace:3000, dashboard:9119, ttyd:4860, cmd-center:9999
- PC dev server: port 3001 (scheduled task CodeWiseDevServer)
- Watchdogs: 7 crons (5m each) + command-center-update (3d)
- MCP servers: gitnexus-shrunk, playwright-shrunk
- SSH config: /opt/data/.ssh/config, key pc_ed25519, socks5-connect.py
- Tailscale: /tmp/tailscale_1.98.4_amd64/, state at /tmp/tailscale.state
- VPS IP: 100.91.215.100, PC IP: 100.110.252.65
