# VPS-to-PC SSH Workflow for Hermes Agent

> **Context**: Hermes runs on a Hostinger VPS (Docker container, user `hermes`, home `/opt/data/`). The Blunt Nation project lives on Vidhan's Windows PC (hostname `obamabinladen`, user `brawl`). This doc covers how Hermes reads, writes, and runs commands on the PC remotely.

---

## Architecture

```
VPS (Hostinger)                    Windows PC (obamabinladen)
┌─────────────────┐    Tailscale    ┌──────────────────────┐
│ Hermes Agent    │ ──SOCKS5:1055── │ Project files at:     │
│ user: hermes    │                 │ C:/Users/brawl/      │
│ /opt/data/      │                 │ OneDrive/Documents/   │
│                 │                 │ GOATEDDD/             │
└─────────────────┘                 └──────────────────────┘
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
ssh -F /opt/data/.ssh/config obamabinladen 'cmd /c type C:\Users\brawl\OneDrive\Documents\GOATEDDD\bluntnation.com\next_session.md'
```

### List a directory on PC

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'cmd /c dir /b C:\Users\brawl\OneDrive\Documents\GOATEDDD\bluntnation.com'
```

### Run a PowerShell command

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/bluntnation.com; <your command>"'
```

### Run a PowerShell script (from file)

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -File C:\Users\brawl\OneDrive\Documents\GOATEDDD\bluntnation.com\<script>.ps1'
```

### Transfer a file VPS → PC (SCP)

```bash
scp -F /opt/data/.ssh/config /path/on/vps/file obamabinladen:'C:/Users/brawl/OneDrive/Documents/GOATEDDD/bluntnation.com/'
```

---

## Real Commands Used in Production

### Run the GSC indexing script with env var

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "$json = Get-Content -Path \"C:\Users\brawl\OneDrive\Documents\GOATEDDD\bluntnation.com\gsc-service-account-key.json\" -Raw; $env:GOOGLE_SERVICE_ACCOUNT_KEY = $json; cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/bluntnation.com; npx -y tsx scripts/ping-gsc-indexing.ts"'
```

### Update a project file via SCP + PowerShell

```bash
# 1. Write PS1 script on VPS
# 2. SCP it to PC
scp -F /opt/data/.ssh/config /tmp/script.ps1 obamabinladen:'C:/Users/brawl/.../bluntnation.com/'
# 3. Execute it
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -File C:\Users\brawl\...\bluntnation.com\script.ps1'
# 4. Clean up
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/...; Remove-Item script.ps1"'
```

---

## Quirks & Gotchas

### Windows path quoting
- Always use forward slashes in paths (`C:/Users/...`)
- Wrap paths in double quotes when using PowerShell `-Command`
- Escape inner double quotes with backslash `\"`
- `cmd /c type` handles simple reads fine; prefer PowerShell for anything complex

### PowerShell -File vs -Command
- `-File` runs a `.ps1` file but does NOT set working directory to the script's location — always `Set-Location` at the top
- `-Command` runs inline code; use semicolons to chain commands

### Environment variables
- Windows env vars persist per-command, not per-session in SSH
- Always set `$env:VAR = value` in the same command chain as the target script
- Can't set multiline env vars via `.env` files on Windows — load from file at runtime

### File encoding
- PS1 files written on Linux and SCP'd to Windows work fine (UTF-8)
- Avoid Unicode emojis/special chars in PS1 script output — PowerShell may choke on them

### SOCKS5 proxy
- The custom SOCKS5 connector `/opt/data/home/.ssh/socks5-connect.py` expects `host port` as two separate args
- Tailscale daemon must be running on the VPS: `tailscaled --socks5-server=127.0.0.1:1055`

### Tailscale IPs (current as of June 2026)
- VPS: `100.91.215.100` (current daemon IP)
- PC: `100.110.252.65` (obamabinladen)
- Old/stale VPS IP: `100.99.143.109` — ignore, use current daemon IP

---

## Related Files on VPS
- SSH config: `/opt/data/.ssh/config`
- SSH key: `/opt/data/home/.ssh/pc_ed25519`
- SOCKS5 connector: `/opt/data/home/.ssh/socks5-connect.py`
- Tailscale state: `/tmp/tailscale.state`
- Tailscale binary: `/tmp/tailscale_1.98.4_amd64/`

---

## Agent Mesh Integration (June 11, 2026)

The Hermes instance on this VPS now runs a 6-agent mesh. When using delegate_task from Hermes:

- Sub-agents get isolated terminal sessions â€” they don't share state with the orchestrator
- Agent profiles (SOUL.md files) live at /opt/data/.hermes/agents/
- The routing skill at skills/software-development/agent-mesh/ maps domains to agents
- See /opt/data/.hermes/agents/AGENT_MESH.md for full topology

For Blunt Nation specifically:
- @Forge handles code (Next.js, banned patterns enforced)
- @Maven handles SEO/growth strategy
- @Sentinel handles deployments to this VPS
- @Scout handles data scraping and keyword tracking
