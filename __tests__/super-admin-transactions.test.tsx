import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SuperAdminTransactions } from "@/components/super-admin-transactions";
import { explainFailure } from "@/lib/payment-failures";

const failure = {
  ...explainFailure({ code: "BAD_REQUEST_ERROR", source: "customer", step: "payment_authentication", reason: "incorrect_otp", description: "Payment failed because the OTP was incorrect" }),
  code: "BAD_REQUEST_ERROR", source: "customer", step: "payment_authentication", stepText: "authenticating the customer (OTP, PIN or app approval)",
  reason: "incorrect_otp", description: "Payment failed because the OTP was incorrect",
};
const base = { item: "1 download credit", type: "Download credit", contact: "+919999999999", methodDetail: "a@upi", currency: "INR", refunded: 0, tax: 0.18, orderId: "order_1", invoiceId: null, international: false, references: [] };
const failed = { ...base, id: "pay_fail", createdAt: "2026-10-18T10:00:00Z", customer: "a@x.com", email: "a@x.com", method: "upi", amount: 2, status: "failed", fee: null, error: failure.description, failure };
const paid = { ...base, id: "pay_ok", createdAt: "2026-10-18T11:00:00Z", customer: "a@x.com", email: "a@x.com", method: "upi", amount: 2, status: "captured", fee: 0.05, error: null, failure: null, references: [{ label: "UPI transaction ID", value: "123456" }] };
const result = {
  rows: [failed, paid], page: 1, pages: 1, total: 2, pageSize: 5, suggestions: [],
  summary: { count: 2, captured: 2, refunded: 0, failed: 1, unlocks: 0 },
  insights: {
    attempts: 2, successRate: 0.5, averageTicket: 2, fees: 0.05, tax: 0.01, net: 1.95, lost: 2, recovered: 1, refundCount: 0, customers: 1, international: 0,
    reasons: [{ key: "incorrect_otp", title: failure.title, party: "Customer", expected: true, count: 1, amount: 2, action: failure.action, last: failed.createdAt }],
    byParty: [{ name: "Customer", count: 1 }],
    byType: [{ name: "Download credit", count: 2, amount: 2, paid: 1, failed: 1 }], byMethod: [{ name: "upi", count: 2, amount: 2, paid: 1, failed: 1 }],
    topCustomers: [{ customer: "a@x.com", contact: "+919999999999", count: 1, amount: 2, failed: 1, last: paid.createdAt }],
    recentFailures: [failed],
    daily: Array.from({ length: 14 }, (_, i) => ({ day: `2026-10-${String(6 + i).padStart(2, "0")}`, amount: i === 12 ? 2 : 0, paid: i === 12 ? 1 : 0, failed: i === 12 ? 1 : 0 })),
  },
  facets: { statuses: ["captured", "failed"], types: ["Download credit"], methods: ["upi"] }, generatedAt: "2026-10-19T06:00:00Z",
};

describe("explainFailure", () => {
  it("explains a known reason in plain English with who caused it", () => {
    const out = explainFailure({ code: "BAD_REQUEST_ERROR", source: "issuer_bank", step: "payment_authorization", reason: "card_declined", description: "declined" });
    expect(out).toMatchObject({ key: "card_declined", title: "Card declined by the bank", party: "Bank", expected: true });
  });
  it("falls back to the provider message for an unknown reason", () => {
    const out = explainFailure({ code: "BAD_REQUEST_ERROR", source: null, step: null, reason: "brand_new_reason", description: "Something new happened" });
    expect(out).toMatchObject({ key: "brand_new_reason", title: "Brand new reason", cause: "Something new happened", party: "Unknown", expected: false });
  });
  it("maps server and gateway codes without a reason", () => {
    expect(explainFailure({ code: "SERVER_ERROR", source: null, step: null, reason: null, description: null }).title).toBe("Razorpay server error");
    expect(explainFailure({ code: "GATEWAY_ERROR", source: null, step: null, reason: null, description: null }).title).toBe("Payment network error");
  });
});

describe("SuperAdminTransactions", () => {
  beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => result }); });

  it("shows coloured insight cards and the failure reason in full", async () => {
    render(<SuperAdminTransactions />);
    expect(await screen.findByRole("heading", { name: /why payments failed/i })).toBeInTheDocument();
    expect(screen.getByText("Success rate")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /money breakdown/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /payment mix/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /top customers/i })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /amount collected per day/i }).children).toHaveLength(14);
    // The reason shows in the failure card and under the status pill in the table.
    expect(screen.getAllByText("Wrong OTP").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/wrong one-time password/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("incorrect_otp").length).toBeGreaterThan(0);
  });

  it("opens a detail dialog with the failure explanation and a Razorpay link", async () => {
    render(<SuperAdminTransactions />);
    fireEvent.click(await screen.findByRole("button", { name: "View details of payment pay_fail" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("region", { name: /why this payment failed/i })).toBeInTheDocument();
    expect(within(dialog).getByText("BAD_REQUEST_ERROR")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /open in razorpay/i })).toHaveAttribute("href", "https://learning.razorpay.com/app/payments/pay_fail");
  });

  it("drills into failed payments from a failure reason and exports CSV", async () => {
    render(<SuperAdminTransactions />);
    expect(await screen.findByRole("link", { name: /export csv/i })).toHaveAttribute("href", expect.stringContaining("format=csv"));
    fireEvent.click(within(screen.getByRole("list", { name: "Failure reasons" })).getByRole("button"));
    await screen.findByDisplayValue("Wrong OTP");
    const last = (global.fetch as jest.Mock).mock.calls.at(-1)[0] as string;
    expect(last).toContain("status=failed");
  });

  it("deletes a transaction from the table when confirmed in the delete dialog", async () => {
    render(<SuperAdminTransactions />);
    const deleteBtn = await screen.findByRole("button", { name: "Delete transaction record pay_fail" });
    fireEvent.click(deleteBtn);
    expect(await screen.findByText(/are you sure you want to permanently delete transaction/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: "Delete Transaction" });
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(screen.queryByText("pay_fail")).not.toBeInTheDocument();
    });
  });
});
