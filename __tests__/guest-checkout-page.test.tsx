import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GuestCheckout } from "@/components/guest-checkout";
import { openSubscriptionCheckout } from "@/lib/razorpay-checkout";

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock("@/components/landing-fonts", () => ({ anek: { variable: "anek" } }));
jest.mock("@/lib/supabase-browser", () => ({ supabaseBrowser: () => ({ auth: { updateUser: jest.fn(async () => ({ error: null })) } }) }));
jest.mock("@/lib/razorpay-checkout", () => ({ openSubscriptionCheckout: jest.fn() }));

const fill = () => {
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Asha" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "asha@example.com" } });
};
const respond = (...bodies: [number, unknown][]) => {
  const mock = jest.fn();
  bodies.forEach(([status, body]) => mock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body }));
  global.fetch = mock as never;
  return mock;
};

test("payment waits for a preparation, then shows the active membership", async () => {
  render(<GuestCheckout initialTier="yearly" enabled prices={{ monthly: 299, yearly: 2999 }} />);
  const pay = screen.getByRole("button", { name: /Pay .*2,999 securely/ });
  expect(pay).toBeDisabled();
  expect(screen.getByRole("radio", { name: /Yearly/ })).toHaveAttribute("aria-checked", "true");
  fill();
  expect(pay).toBeEnabled();
  const fetch = respond(
    [200, { checkoutId: "c1", subscriptionId: "sub_1", keyId: "rzp_test", prefill: { email: "asha@example.com", name: "Asha" } }],
    [200, { status: "active", email: "asha@example.com", signedIn: true, newAccount: true }],
  );
  jest.mocked(openSubscriptionCheckout).mockResolvedValue({ razorpay_payment_id: "pay_1", razorpay_subscription_id: "sub_1", razorpay_signature: "a".repeat(64) });
  fireEvent.click(pay);
  expect(await screen.findByRole("heading", { name: "Your membership is active" })).toBeInTheDocument();
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ action: "checkout", tier: "yearly", email: "asha@example.com", name: "Asha" });
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ action: "verify", checkoutId: "c1", razorpay_payment_id: "pay_1" });
  expect(openSubscriptionCheckout).toHaveBeenCalledWith(expect.objectContaining({ subscription_id: "sub_1", prefill: { email: "asha@example.com", name: "Asha" } }));
  expect(screen.getByLabelText(/Set a password/)).toBeInTheDocument();
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
