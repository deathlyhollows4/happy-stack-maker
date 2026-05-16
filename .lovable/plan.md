## Update Pricing to $20/mo and $112/yr

### Changes
1. **Create Paddle products** with new prices via `batch_create_product`:
   - `pro_monthly` — $20/month (2000 cents)
   - `pro_yearly` — $112/year (11200 cents, save $128)

2. **Update `src/routes/pricing.tsx`** — change displayed prices from $12/$108 to $20/$112, update savings copy ($128/yr saved, ~47% off).

3. **Update `src/routes/index.tsx`** if it references the old prices anywhere on the landing page.

### Notes
- Paddle prices and frontend display must stay in sync — both updated together.
- Products are created in test env; auto-sync to live on publish.