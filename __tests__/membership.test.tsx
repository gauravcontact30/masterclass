import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Membership } from "@/components/membership";
import { requestJson } from "@/lib/client";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";

jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: jest.requireActual("@/lib/client").errorKey }));
jest.mock("@/lib/razorpay-checkout", () => ({ openRazorpayCheckout: jest.fn() }));

const data = { tier: "free" as const, used: 0, limit: 3, subscription: null, creditBalance: 2 };

beforeEach(() => {
  (requestJson as jest.Mock).mockImplementation((url: string, init?: RequestInit) => {
    if (url === "/api/billing" && !init) return Promise.resolve({ monthly: 299, yearly: 2999, freeLimit: 3, proLimit: 50, perDownload: 49 });
    return Promise.resolve({ orderId: "order_1", amount: 4900, currency: "INR", keyId: "rzp_test" });
  });
});

test("renders a per-download pricing card using the fetched price", async () => {
  render(<Membership enabled data={data} onRefresh={jest.fn()} />);
  await waitFor(() => expect(screen.getByText("₹49")).toBeInTheDocument());
  expect(screen.getByText("Per Download")).toBeInTheDocument();
});

test("shows the available download credit balance", async () => {
  render(<Membership enabled data={data} onRefresh={jest.fn()} />);
  await waitFor(() => expect(screen.getByText(/credits available/i)).toBeInTheDocument());
});

test("buying a download opens Razorpay Checkout with the order the server created", async () => {
  const user = userEvent.setup();
  render(<Membership enabled data={data} onRefresh={jest.fn()} />);
  await waitFor(() => expect(screen.getByText("₹49")).toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: /buy a download/i }));
  await waitFor(() => expect(openRazorpayCheckout).toHaveBeenCalledWith(expect.objectContaining({ key: "rzp_test", amount: 4900, currency: "INR", order_id: "order_1" })));
});
