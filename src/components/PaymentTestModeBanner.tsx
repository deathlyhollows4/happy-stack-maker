import { isBillingTestMode } from "@/lib/payments";

export function PaymentTestModeBanner() {
  if (!isBillingTestMode()) return null;
  return (
    <div className="w-full border-b border-orange-300 bg-orange-100 px-4 py-2 text-center text-sm text-orange-800">
      Checkout is running in Razorpay test mode. Use test payment details only.
    </div>
  );
}
