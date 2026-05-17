import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ priceId: z.string().min(1), environment: z.enum(["sandbox", "live"]) as z.ZodType<PaddleEnv> }).parse(input),
  )
  .handler(async ({ data }) => {
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = await response.json();
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0].id as string;
  });
