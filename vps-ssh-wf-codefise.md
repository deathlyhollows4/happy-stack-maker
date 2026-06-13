# VPS-to-PC SSH Workflow for Hermes Agent -- CodeWise Edition

> **Context**: Hermes runs on a Hostinger VPS (Docker container, user `hermes`, home `/opt/data/`). The CodeWise project lives on Vidhan's Windows PC (hostname `obamabinladen`, user `brawl`). This doc covers how Hermes reads, writes, and runs commands on the PC remotely for the CodeWise project.

---

## Architecture

```
VPS (Hostinger)                    Windows PC (obamabinladen)
+-----------------+    Tailscale    +------------------------------+
| Hermes Agent    | --SOCKS5:1055-- | CodeWise project at:         |
| user: hermes    |                 | C:/Users/brawl/              |
| /opt/data/      |                 | OneDrive/Documents/          |
|                 |                 | GOATEDDD/CodeWise/           |
|                 |                 | happy-stack-maker/           |
+-----------------+                 +------------------------------+
```

- Tailscale runs in userspace mode on the VPS (no root needed)
- SOCKS5 proxy on `127.0.0.1:1055` routes traffic through Tailscale network
- SSH connects through SOCKS5 proxy to the PC's Tailscale IP `100.110.252.65`

---

## SSH Config (VPS: `/opt/data/.ssh/config`)

```
Host obamabinladen
    Hostname 100.110.252.65
    User brawl
    IdentityFile /opt/data/home/.ssh/pc_ed25519
    ProxyCommand python3 /opt/data/home/.ssh/socks5-connect.py %h %p
    StrictHostKeyChecking no
```

---

## Common Commands (run from VPS terminal)

### Read a file from PC

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'cmd /c type C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\CODEWISE_HANDOFF_OPENCODE.md'
```

### List a directory on PC

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'cmd /c dir /b C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\src'
```

### Run a PowerShell command

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; <your command>"'
```

### Run a PowerShell script (from file)

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -File C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\<script>.ps1'
```

### Transfer a file VPS to PC (SCP)

```bash
scp -F /opt/data/.ssh/config /path/on/vps/file obamabinladen:'C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker/'
```

### Run a build / type check

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; npm run build"'
```

---

## Real Commands Used in Production

### Run the eval harness with Supabase env var

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; $env:SUPABASE_SERVICE_ROLE_KEY = \"sb_xxx\"; npx -y tsx scripts/eval.ts"'
```

### Update a project file via SCP + PowerShell

```bash
# 1. Write PS1 script on VPS
# 2. SCP it to PC
scp -F /opt/data/.ssh/config /tmp/script.ps1 obamabinladen:'C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker/'
# 3. Execute it
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -File C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\script.ps1'
# 4. Clean up
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; Remove-Item script.ps1"'
```

### Append content to an existing file (NEVER overwrite with SCP)

```bash
# 1. Write PS1 script on VPS with Add-Content
cat > /tmp/append.ps1 << 'PSEOF'
Set-Location "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
$content = @"
... content to append ...
"@
Add-Content -Path "CODEWISE_HANDOFF_OPENCODE.md" -Value $content -Encoding UTF8
PSEOF

# 2. SCP + execute + cleanup
scp -F /opt/data/.ssh/config /tmp/append.ps1 obamabinladen:'C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker/_append.ps1'
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -File C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\_append.ps1'
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "Remove-Item C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\_append.ps1"'
```

---

## Quirks & Gotchas

### Windows path quoting
- Always use forward slashes in paths (`C:/Users/...`)
- Wrap paths in double quotes when using PowerShell `-Command`
- Escape inner double quotes with backslash `\"`
- `cmd /c type` handles simple reads fine; prefer PowerShell for anything complex

### PowerShell -File vs -Command
- `-File` runs a `.ps1` file but does NOT set working directory to the script's location -- always `Set-Location` at the top
- `-Command` runs inline code; use semicolons to chain commands

### Environment variables
- Windows env vars persist per-command, not per-session in SSH
- Always set `$env:VAR = value` in the same command chain as the target script
- Cannot set multiline env vars via `.env` files on Windows -- load from file at runtime

### File encoding
- PS1 files written on Linux and SCP'd to Windows work fine (UTF-8)
- Use `-Encoding UTF8` on `Add-Content` and `Set-Content` when writing files containing em dashes, smart quotes, or other non-ASCII characters

### SOCKS5 proxy
- The custom SOCKS5 connector `/opt/data/home/.ssh/socks5-connect.py` expects `host port` as two separate args
- Tailscale daemon must be running on the VPS: `tailscaled --socks5-server=127.0.0.1:1055`

### CodeWise-specific gotchas

- **Lovable auto-generated files -- DO NOT EDIT**: `client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`, `paddle.server.ts`, `paddle.ts`. These are regenerated by Lovable Cloud. Changes will be overwritten.

- **`routeTree.gen.ts` auto-regenerates**: If you add/remove route files, the route tree is regenerated. Edit the route `.tsx` files, not this auto-generated file.

- **Post-sync install**: After a fresh clone or Lovable sync, install Lovable-injected packages:
  ```bash
  npm install @lovable.dev/cloud-auth-js@1.1.2 @paddle/paddle-node-sdk
  ```
  These are injected by Lovable at deploy time but must be installed locally for `tsc --noEmit` to pass.

- **Lovable integrations directory**: Never delete `src/integrations/lovable/` -- it contains the OAuth bridge to Supabase. Deleting it breaks Google sign-in.

- **Supabase session-race pattern**: After any auth mutation (`signIn`, `signUp`, `updateUser`, `setSession`), the session may not be immediately available. Use `supabase.auth.onAuthStateChange` with a fallback `getSession()` timeout (5s) before navigating.

- **Dev vs production**: Local dev (`npm run dev`) does not support Lovable-specific features (OAuth bridge, Cloud Auth). Test via `https://happy-stack-maker.lovable.app/` after push.

- **Push to publish cycle**: Push to GitHub, user republishes on Lovable, test against live URL. Never assume local dev matches production for Lovable-integrated features.

- **Em dashes banned**: CodeWise has a strict no-em-dash policy across all source files. Verify with `Select-String` after edits.

- **GitNexus index**: The CodeWise repo is indexed as `happy-stack-maker` (~2,038 nodes, 3,145+ edges). After major refactors, run `gitnexus status` and `gitnexus analyze` to keep the index fresh.

---

## Tailscale IPs (current as of June 2026)
- VPS: `100.91.215.100` (current daemon IP)
- PC: `100.110.252.65` (obamabinladen)
- Old/stale VPS IP: `100.99.143.109` -- ignore, use current daemon IP

---

## Related Files on VPS
- SSH config: `/opt/data/.ssh/config`
- SSH key: `/opt/data/home/.ssh/pc_ed25519`
- SOCKS5 connector: `/opt/data/home/.ssh/socks5-connect.py`
- Tailscale state: `/tmp/tailscale.state`
- Tailscale binary: `/tmp/tailscale_1.98.4_amd64/`
- GitNexus index: `happy-stack-maker` (CodeWise repo)

---

## Project Quick Reference

| What | Value |
|------|-------|
| PC project root | `C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\` |
| Live URL | `https://happy-stack-maker.lovable.app/` |
| Framework | TanStack Start v1 (React 19, Vite 7) |
| Database | Supabase (RLS-enforced) |
| AI Gateway | Lovable AI Gateway, `openai/gpt-5-mini` |
| Payments | Paddle (merchant of record, via Lovable Gateway) |
| Styling | Tailwind CSS v4 (CSS-first, oklch tokens) |
| Components | shadcn/ui on Radix primitives |
| Editor | CodeMirror 6 |
| GitNexus repo name | `happy-stack-maker` |
| Test credentials | `vidhantomar17082004@gmail.com` / `Jaatdevta@123` |

---

## Agent Mesh Integration (June 11, 2026)

The Hermes instance on this VPS runs a 6-agent mesh. CodeWise is not yet mapped to specific agents in the mesh routing table. If it were:

- @Forge would handle TanStack Start/React code (Lovable compatibility rules enforced)
- @Scout would handle eval harness and data extraction
- @Sentinel would handle Cloudflare Workers deployment config

For the Blunt Nation project's VPS-SSH workflow, see its separate doc at `C:\Users\brawl\OneDrive\Documents\GOATEDDD\bluntnation.com\references\vps-ssh-workflow.md`.

---

## APPENDIX: Comprehensive Audit & Improvement Plan (11 June 2026)

Full audit at `CODEWISE_AUDIT_2026-06-11.md` (20KB, 45 findings, 23 fix tasks).

**Triple-agent mesh audit** (@Forge code quality, @Cipher algorithms/security, @Sentinel infrastructure). The CodeWise repo at `C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker\` was cloned to the VPS, indexed in GitNexus (1,655 nodes, 2,298 edges), and analyzed.

### Critical (must fix before new features):
1. **FSRS interval formula degenerate** â€” intervals never grow; `9*S*(1/0.9-1)` = S days forever
2. **FSRS grade applied uniformly to all concepts** â€” one buggy concept downgrades all concepts
3. **28-function monolith** in `src/lib/codewise.functions.ts` (1,284 lines, split into 6 files)
4. **SYSTEM_PROMPT + schemas duplicated** in scripts/eval.ts (eval tests against stale criteria)
5. **No CI/CD pipeline** â€” zero GitHub Actions workflows, manual deploys only
6. **No observability** â€” 43 console.error calls log to a Cloudflare Workers black hole
7. **No automated migration runner** â€” 19 SQL files applied manually

### High Priority (2 weeks):
- No webhook idempotency (Paddle retries cause subscription state oscillation)
- learn.$slug.tsx: 475 lines hardcoded educational content (should be DB-backed)
- 42 of 46 shadcn/ui components are unused dead code
- No React error boundaries (one component crash takes down entire page)
- No security headers (X-Frame-Options, CSP, HSTS)
- No rate limiting on auth endpoints
- No database backup strategy
- No health check endpoint

### Testing Status: ZERO tests
No vitest, jest, or Playwright config. Sessions 25/58 ran Playwright ad-hoc via MCP â€” not reproducible.

### Recommended: 4-week stabilization sprint (23 tasks, ~40 hours)
See `CODEWISE_AUDIT_2026-06-11.md` for full task breakdown, test plan template, and week-by-week roadmap.

### Next session
Copy `CODEWISE_AUDIT_2026-06-11.md` from the VPS (`/tmp/happy-stack-maker/CODEWISE_AUDIT_2026-06-11.md`) to this PC directory. Start with Phase 1 tasks (Critical).

---

## Phase 1 Status: COMPLETE (11 June 2026)

**C1 FSRS interval formula** - Fixed. Computes actual retrieval probability from elapsed time. Intervals grow properly.

**C2 Per-concept grading** - Fixed. Each concept gets its own grade based on matching issues only.

**C4 Shared constants extracted** - \src/lib/review.constants.ts\ created. SYSTEM_PROMPT, schemas deduplicated.

**H9 eval.ts fixed** - Now imports from shared source + uses extractJson().

**Tests added** - 23 unit tests via vitest. Config at vitest.config.ts. Build: PASS. Tests: 23/23 PASS.

**Next: Phase 2** - Split monolith, more tests, CI/CD.


---

## APPENDIX: Browser Automation Setup (13 June 2026)

### Tools Installed

| Tool | Location | Status |
|------|----------|--------|
| Playwright (Python) | pip 1.59.0 | Installed |
| @playwright/test (npm) | dev dependency | Installed |
| browser-harness | C:\Users\brawl\.local\bin\browser-harness.exe | Installed (uv tool) |
| browser-harness source | C:\Users\brawl\Developer\browser-harness\ | Cloned |
| Chrome CDP (headless) | Port 9223, --disable-gpu | Working |

### E2E Test Results (13 June 2026)
All 12 critical-path tests PASS (7.5s).
See tests/e2e/critical-path.spec.ts for the full test suite.
Fix applied: pricing page locator changed to .first() to avoid strict mode violation.

### browser-harness Hermes Skill
Created at: /opt/data/.hermes/skills/software-development/browser-harness/SKILL.md
Integrated into agent-mesh routing table: Forge -> E2E tests, Scout -> CDP scraping, Sentinel -> infra

### CDP Chrome Launch
Start-Process -NoNewWindow -FilePath 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--remote-debugging-port=9223','--user-data-dir=C:/Users/brawl/AppData/Local/Temp/chrome-cdp-profile','--no-first-run','--window-size=1280,720','--headless=new','--disable-gpu'

Verify: Invoke-WebRequest -Uri http://127.0.0.1:9223/json/version

### browser-harness usage (PowerShell)
$env:PATH = 'C:\Users\brawl\.local\bin;C:\Program Files (x86)\VMware\VMware Workstation\bin\;c:\Users\brawl\AppData\Local\Programs\cursor\resources\app\bin;C:\Program Files\Google\Chrome\Application;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Windows\System32\OpenSSH\;C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\Program Files\NVIDIA Corporation\NVIDIA NvDLISR;C:\Program Files\dotnet\;C:\MinGW\bin;C:\Program Files\MySQL\MySQL Shell 8.0\bin\;C:\Users\brawl\AppData\Local\Microsoft\WindowsApps;C:\Users\brawl\AppData\Local\Muse Hub\lib;c:\Users\brawl\AppData\Local\Programs\cursor\resources\app\bin;C:\Program Files\Git\cmd;C:\Program Files\nodejs\;C:\Program Files\Go\bin;C:\Program Files\GitHub CLI\;C:\Program Files\Tailscale\;C:\Users\brawl\AppData\Local\hermes\hermes-agent\venv\Scripts;C:\Users\brawl\AppData\Local\hermes\bin;C:\Users\brawl\AppData\Local\agy\bin;C:\Users\brawl\anaconda3;C:\Users\brawl\anaconda3\Library\mingw-w64\bin;C:\Users\brawl\anaconda3\Library\usr\bin;C:\Users\brawl\anaconda3\Library\bin;C:\Users\brawl\anaconda3\Scripts;C:\Program Files\MySQL\MySQL Shell 8.0\bin\;C:\Users\brawl\AppData\Local\Microsoft\WindowsApps;C:\Users\brawl\AppData\Local\Muse Hub\lib;C:\Users\brawl\AppData\Local\Programs\Microsoft VS Code\bin;C:\Users\brawl\.lmstudio\bin;C:\Users\brawl\AppData\Roaming\npm;C:\Users\brawl\go\bin;C:\Users\brawl\AppData\Local\Programs\Antigravity\bin;C:\Users\brawl\AppData\Local\Programs\Antigravity IDE\bin;C:\Users\brawl\AppData\Local\Kiro-Cli\;C:\Users\brawl\AppData\Local\Programs\Kiro\bin;C:\Users\brawl\AppData\Local\Microsoft\WinGet\Packages\BurntSushi.ripgrep.MSVC_Microsoft.Winget.Source_8wekyb3d8bbwe\ripgrep-15.1.0-x86_64-pc-windows-msvc;C:\Users\brawl\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin;'
$env:BU_CDP_URL = 'http://127.0.0.1:9223'
Pipe Python code to browser-harness via $code | browser-harness

### Updated browser-harness Working Pattern (13 June PM)

**DAEMON NOW WORKS.** The issue was Chrome CDP dying between SSH sessions. Fix: always launch Chrome + run BH in same script.

**Working template:**
`
# 1. Kill old CDP Chrome + launch fresh
Get-CimInstance Win32_Process -Filter ""Name = 'chrome.exe'"" | Where-Object { $_.CommandLine -like ""*9223*"" } | Stop-Process -Force
Start-Process -NoNewWindow -FilePath ""C:\Program Files\Google\Chrome\Application\chrome.exe"" -ArgumentList ""--remote-debugging-port=9223"",""--user-data-dir=C:\Users\brawl\AppData\Local\Temp\chrome-cdp-profile"",""--no-first-run"",""--window-size=1280,720"",""--headless=new"",""--disable-gpu""
Start-Sleep -Seconds 5

# 2. Set env + pipe code
$env:PATH = ""C:\Users\brawl\.local\bin;$env:PATH""
$env:BU_CDP_URL = ""http://127.0.0.1:9223""

$code = @'
goto_url("https://happy-stack-maker.lovable.app")
wait_for_load()
capture_screenshot("C:/Users/brawl/Developer/bh-codewise.png")
print(page_info())
'@

$code | & ""C:\Users\brawl\.local\bin\browser-harness.exe""
`

Key rules:
- Forward slashes in Python file paths (no backslash unicode escapes)
- BU_CDP_URL must be set before running BH
- Chrome + BH in SAME script session
