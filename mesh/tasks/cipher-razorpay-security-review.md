# @Cipher - Razorpay Security Review

## Goal
Review the Razorpay payment integration for secret handling, identity trust, and subscription entitlement risk.

## Scope
Inspect checkout, webhook, and migration changes for payment spoofing, exposed secrets, and unsafe entitlement updates.

## File ownership
- Owns: mesh/notes/cipher-razorpay-security-review.md
- May inspect: src/**, supabase/**, .env.example, git diff

## Forbidden files
- src/**
- supabase/**
- package.json

## Verification command
read-only task

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
