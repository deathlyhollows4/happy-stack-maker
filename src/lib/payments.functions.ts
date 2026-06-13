import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gatewayFetch } from "@/lib/paddle.server";

const resolvePaddlePriceInput = z.object({
  priceId: z.string().min(1).max(200),
  environment: z.enum(["sandbox", "live"]),
});

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resolvePaddlePriceInput.parse(input))
  .handler(async ({ data }) => {
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = await response.json();
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0].id as string;
  });
