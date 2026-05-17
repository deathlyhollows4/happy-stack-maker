// One-off script: update pro_yearly price to $199 in Paddle sandbox
// Run: npx tsx scripts/update-yearly-price.ts

import "dotenv/config";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";

const env = (process.argv[2] || "sandbox") as "sandbox" | "live";

const CONNECTION_KEY =
  env === "sandbox"
    ? process.env.PADDLE_SANDBOX_API_KEY
    : process.env.PADDLE_LIVE_API_KEY;

const LOVABLE_KEY = process.env.LOVABLE_API_KEY;

if (!CONNECTION_KEY) {
  console.error(`PADDLE_${env.toUpperCase()}_API_KEY is not set`);
  process.exit(1);
}

if (!LOVABLE_KEY) {
  console.error("LOVABLE_API_KEY is not set");
  process.exit(1);
}

const GATEWAY = "https://connector-gateway.lovable.dev/paddle";

const paddle = new Paddle(CONNECTION_KEY, {
  environment: GATEWAY as unknown as Environment,
  customHeaders: {
    "X-Connection-Api-Key": CONNECTION_KEY,
    "Lovable-API-Key": LOVABLE_KEY,
  },
});

async function main() {
  // Step 1: Find the price by external_id
  const prices = await paddle.products.list();
  let targetPriceId: string | null = null;

  for await (const product of prices) {
    const productPrices = await paddle.prices.list({ productId: product.id });
    for await (const price of productPrices) {
      // @ts-expect-error custom_data may not be typed
      const extId = price.customData?.external_id as string | undefined;
      if (extId === "pro_yearly") {
        targetPriceId = price.id;
        console.log(`Found pro_yearly: price_id=${price.id}, current amount=${price.unitPrice?.amount} ${price.unitPrice?.currencyCode}`);
        break;
      }
    }
    if (targetPriceId) break;
  }

  if (!targetPriceId) {
    console.error('Could not find price with external_id "pro_yearly"');
    process.exit(1);
  }

  // Step 2: Update the price to $199
  const updated = await paddle.prices.update(targetPriceId, {
    unitPrice: { amount: "19900", currencyCode: "USD" }, // Paddle uses cents
    description: "Pro Yearly — deal price $199/yr (normally $240/yr)",
  });

  console.log(`Updated: new amount=${updated.unitPrice?.amount} ${updated.unitPrice?.currencyCode}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
