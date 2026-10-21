import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GuestCheckout } from "@/components/guest-checkout";
import { openSubscriptionCheckout } from "@/lib/razorpay-checkout";

jest.mock("@/components/landing-fonts", () => ({ landingFont: () => ({ variable: "anek", className: "anek" }) }));
const signInWithOtp = jest.fn(async () => ({ error: null }));
jest.mock("@/lib/supabase-browser", () => ({ supabaseBrowser: () => ({ auth: { signInWithOtp } }) }));
jest.mock("@/lib/razorpay-checkout", () => ({ openSubscriptionCheckout: jest.fn() }));

const fill = () => {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Asha" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "asha@example.com" } });
};
const respond = (...bodies: [number, unknown][]) => {
  const mock = jest.fn();
  bodies.forEach(([status, body]) => mock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body }));
  global.fetch = mock as never;
  return mock;
};

test("checkout needs no course selection, then emails the new account a sign-in link", async () => {
  render(<GuestCheckout initialTier="yearly" enabled prices={{ monthly: 299, yearly: 2999 }} />);
  const pay = screen.getByRole("button", { name: /Pay .*2,999 securely/ });
  // One membership covers every category: there is no course picker to complete first.
  expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  expect(screen.getByRole("radio", { name: /Yearly/ })).toHaveAttribute("aria-checked", "true");
  fill();
  expect(pay).toBeEnabled();
  const fetch = respond(
    [200, { checkoutId: "c1", subscriptionId: "sub_1", keyId: "rzp_test", prefill: { email: "asha@example.com", name: "Asha" } }],
    [200, { status: "active", email: "asha@example.com", newAccount: true }],
  );
  jest.mocked(openSubscriptionCheckout).mockResolvedValue({ razorpay_payment_id: "pay_1", razorpay_subscription_id: "sub_1", razorpay_signature: "a".repeat(64) });
  fireEvent.click(pay);
  expect(await screen.findByRole("heading", { name: "Your membership is active" })).toBeInTheDocument();
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ action: "checkout", tier: "yearly", currency: "INR", email: "asha@example.com", name: "Asha" });
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ action: "verify", checkoutId: "c1", razorpay_payment_id: "pay_1" });
  expect(openSubscriptionCheckout).toHaveBeenCalledWith(expect.objectContaining({ subscription_id: "sub_1", prefill: { email: "asha@example.com", name: "Asha" } }));
  // The link goes to the inbox; this browser is never signed in directly.
  expect(await screen.findByText(/We emailed a sign-in link to asha@example.com/)).toBeInTheDocument();
  expect(signInWithOtp).toHaveBeenCalledTimes(1);
  expect(signInWithOtp).toHaveBeenCalledWith({ email: "asha@example.com", options: expect.objectContaining({ shouldCreateUser: false }) });
});

test("an email with an account is sent to sign in instead of paying", async () => {
  render(<GuestCheckout initialTier="monthly" enabled prices={{ monthly: 299, yearly: 2999 }} />);
  fill();
  respond([409, { error: "account_exists" }]);
  fireEvent.click(screen.getByRole("button", { name: /Pay/ }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("already has a MasterClass account"));
  expect(screen.getAllByRole("link", { name: "Sign in" }).some(link => link.getAttribute("href") === "/sign-in?email=asha%40example.com")).toBe(true);
  expect(openSubscriptionCheckout).not.toHaveBeenCalled();
});
