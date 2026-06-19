# @Sentinel - Deployment Audit

## Goal
Verify deployment configuration, environment variables, CSP, and webhook URLs needed for production.

## Scope
Review server entry, Vite config, Wrangler/Lovable config, env examples, CSP, and webhook route behavior.

## File ownership
- Owns: mesh/notes/sentinel-deploy-audit.md
- May inspect: src/server.ts, vite.config.ts, wrangler.jsonc, .env.example, src/routes/api/**

## Forbidden files
- .env
- src/**
- supabase/**

## Verification command
read-only task

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
