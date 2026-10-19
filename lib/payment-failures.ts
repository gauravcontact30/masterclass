/*
 * Plain-English explanations for failed Razorpay payments. Razorpay reports a failure as an error code, the
 * party it came from (source), the stage it stopped at (step), a machine reason and a one-line description;
 * this turns those into what happened, who it was down to and what to do next, for the admin Transactions page.
 */

export type PaymentFailure = {
  code: string | null; source: string | null; step: string | null; reason: string | null; description: string | null;
};
export type FailureExplanation = {
  /** Stable key for grouping failures, the Razorpay reason when there is one. */
  key: string; title: string; cause: string; action: string;
  /** Who the failure was down to, in words an admin can act on. */
  party: "Customer" | "Bank" | "Payment app" | "Razorpay" | "This website" | "Unknown";
  /** Whether nothing went wrong on our side, so the admin need not act. */
  expected: boolean;
};

type Entry = Omit<FailureExplanation, "key" | "party"> & { party?: FailureExplanation["party"] };
const REASONS: Record<string, Entry> = {
  payment_cancelled: { title: "Cancelled by the customer", cause: "The customer closed the checkout or pressed back before paying, so no money moved.", action: "Nothing to fix. If many customers drop off here, check that the price and item are clear before checkout opens.", expected: true, party: "Customer" },
  payment_timed_out: { title: "Payment timed out", cause: "The customer did not finish paying (for example, approving a UPI request or entering an OTP) before the session expired.", action: "Nothing to fix. The customer can try again. Many UPI timeouts in a short spell can mean a slow payment app or bank.", expected: true, party: "Customer" },
  payment_session_expired: { title: "Checkout session expired", cause: "The checkout stayed open too long and expired before the payment was completed.", action: "The customer should start a fresh checkout.", expected: true, party: "Customer" },
  incorrect_otp: { title: "Wrong OTP", cause: "The customer entered a wrong one-time password, so the bank refused to authenticate the payment.", action: "Nothing to fix. The customer can retry with the right OTP.", expected: true, party: "Customer" },
  incorrect_pin: { title: "Wrong UPI or card PIN", cause: "The customer entered a wrong PIN, so the bank declined the payment.", action: "Nothing to fix. The customer can retry with the right PIN.", expected: true, party: "Customer" },
  authentication_failed: { title: "Authentication failed", cause: "The customer could not complete 3-D Secure, OTP or app approval with their bank.", action: "Ask the customer to retry or use another method. Repeated failures for one customer point to their bank.", expected: true, party: "Customer" },
  insufficient_funds: { title: "Not enough balance", cause: "The account or card did not have enough balance or credit for this amount.", action: "Nothing to fix. The customer can use another account or method.", expected: true, party: "Customer" },
  transaction_limit_exceeded: { title: "Spending limit reached", cause: "The customer reached a daily or per-transaction limit set by their bank or UPI app.", action: "Nothing to fix. The customer can retry later or with another method.", expected: true, party: "Customer" },
  card_expired: { title: "Card expired", cause: "The card used had passed its expiry date.", action: "The customer should pay with a valid card.", expected: true, party: "Customer" },
  invalid_card_details: { title: "Card details wrong", cause: "The card number, expiry or CVV entered did not match the card.", action: "The customer should re-enter the card details.", expected: true, party: "Customer" },
  invalid_vpa: { title: "Invalid UPI ID", cause: "The UPI ID entered does not exist or could not be found.", action: "The customer should check the UPI ID or pay by QR or app intent.", expected: true, party: "Customer" },
  card_declined: { title: "Card declined by the bank", cause: "The issuing bank declined the card. Common causes are online or e-commerce use being switched off, a block on the card, or the bank's risk rules.", action: "The customer should enable online transactions or call their bank, or pay another way.", expected: true, party: "Bank" },
  payment_declined: { title: "Declined by the bank", cause: "The customer's bank declined the payment without giving a more specific reason.", action: "The customer should contact their bank or use another method.", expected: true, party: "Bank" },
  international_transaction_not_allowed: { title: "International payment blocked", cause: "The card is issued outside India, or is not enabled for international use, and the payment was refused.", action: "If you want overseas customers, enable international payments in the Razorpay dashboard. Otherwise the customer should use an Indian card or UPI.", expected: false, party: "This website" },
  bank_technical_error: { title: "Bank technical error", cause: "The customer's bank had a technical problem or outage and could not process the payment.", action: "Usually temporary, so the customer can retry in a few minutes. A spike across many customers means a bank outage.", expected: true, party: "Bank" },
  gateway_technical_error: { title: "Payment network error", cause: "The card network, UPI switch or gateway between Razorpay and the bank failed to respond.", action: "Usually temporary. Retrying usually works. Check status.razorpay.com if it keeps happening.", expected: true, party: "Razorpay" },
  server_error: { title: "Razorpay server error", cause: "Razorpay hit an internal error while processing the payment.", action: "Retry. If it keeps happening, raise a ticket with Razorpay support quoting the payment ID.", expected: false, party: "Razorpay" },
  payment_risk_check_failed: { title: "Blocked by a fraud check", cause: "Razorpay's or the bank's risk engine flagged the payment as suspicious and blocked it.", action: "Review the customer. If it was genuine, ask Razorpay support to check the risk decision for this payment ID.", expected: false, party: "Razorpay" },
  payment_failed: { title: "Payment failed", cause: "The payment did not go through and the provider gave no specific reason.", action: "Read the provider message below. The customer can usually retry or use another method.", expected: true },
};
const PARTY: Record<string, FailureExplanation["party"]> = {
  customer: "Customer", issuer_bank: "Bank", bank: "Bank", customer_psp: "Payment app", beneficiary_psp: "Payment app",
  gateway: "Razorpay", internal: "Razorpay", business: "This website", merchant: "This website",
};
const STEPS: Record<string, string> = {
  payment_initiation: "starting the payment", payment_authentication: "authenticating the customer (OTP, PIN or app approval)",
  payment_authorization: "the bank authorising the amount", payment_decision: "the final approve-or-decline decision", payment_capture: "capturing the payment",
};

/** Turns a step code into words, e.g. "payment_authentication" → "authenticating the customer (…)". */
export const describeStep = (step: string | null) => (step ? STEPS[step] ?? step.replaceAll("_", " ") : null);
/** Turns a source code into the party it names. */
export const describeParty = (source: string | null): FailureExplanation["party"] => (source ? PARTY[source] ?? "Unknown" : "Unknown");

/** Explains one failed payment. Falls back to Razorpay's own description when the reason is new or missing. */
export function explainFailure(failure: PaymentFailure): FailureExplanation {
  const reason = failure.reason?.toLowerCase() ?? "";
  const entry = REASONS[reason];
  // The reported source wins; the reason's usual party fills in when Razorpay sends no recognisable source.
  const reported = describeParty(failure.source);
  const party = reported !== "Unknown" ? reported : entry?.party ?? "Unknown";
  if (entry) return { key: reason, ...entry, party };
  const fallback = failure.code === "SERVER_ERROR" ? REASONS.server_error : failure.code === "GATEWAY_ERROR" ? REASONS.gateway_technical_error : null;
  if (fallback) return { key: reason || failure.code!.toLowerCase(), ...fallback, party };
  return {
    key: reason || "unknown",
    title: reason ? reason.replaceAll("_", " ").replace(/^\w/, c => c.toUpperCase()) : "Unknown reason",
    cause: failure.description || "Razorpay did not report why this payment failed.",
    action: "Open the payment in the Razorpay dashboard for the full provider trail.",
    party, expected: false,
  };
}
