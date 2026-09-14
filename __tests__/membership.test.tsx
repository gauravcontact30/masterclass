import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Membership } from "@/components/membership";
import { requestJson } from "@/lib/client";
jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: jest.requireActual("@/lib/client").errorKey }));
beforeEach(() => { jest.clearAllMocks(); jest.mocked(requestJson).mockResolvedValue({ monthly: 299, yearly: 2999 }); });
test("only a paid plan is offered and yearly checkout carries the selected preparation", async () => {
  const user = userEvent.setup(); const refresh = jest.fn().mockResolvedValue(undefined);
  render(<Membership enabled data={{ tier: "free", used: 0, limit: 0, subscription: null, creditBalance: 2 }} selections={["nda"]} onRefresh={refresh}/>);
  await screen.findByText("₹299"); expect(screen.queryByText(/free|download credit|per download/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /yearly/i })); await user.click(screen.getByRole("button", { name: "Choose plan" }));
  await waitFor(() => expect(requestJson).toHaveBeenCalledWith("/api/billing", expect.objectContaining({ body: JSON.stringify({ action: "checkout", tier: "yearly", selections: ["nda"] }) })));
});
test("active members manage renewal without opening a duplicate checkout", async () => {
  const user = userEvent.setup(); render(<Membership enabled selections={["nda"]} data={{ tier: "monthly", used: 0, limit: 50, creditBalance: 0, subscription: { status: "active", current_period_end: "2030-01-01", cancel_at_cycle_end: false } }} onRefresh={jest.fn()}/>);
  expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Cancel at period end" })); await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
  await waitFor(() => expect(requestJson).toHaveBeenCalledWith("/api/billing", expect.objectContaining({ body: JSON.stringify({ action: "cancel" }) })));
});
