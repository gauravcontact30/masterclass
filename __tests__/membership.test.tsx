import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Membership } from "@/components/membership";
import { requestJson } from "@/lib/client";
import { openSubscriptionCheckout } from "@/lib/razorpay-checkout";
jest.mock("@/lib/razorpay-checkout",()=>({openSubscriptionCheckout:jest.fn()}));
jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: jest.requireActual("@/lib/client").errorKey }));
beforeEach(() => { jest.clearAllMocks(); jest.mocked(requestJson).mockImplementation(async (url) => url.includes("invoices") ? {invoices:[]} : { monthly:299, yearly:2999, enabled:true }); });
test("only a paid plan is offered and yearly checkout needs no course selection", async () => {
  const user = userEvent.setup(); const refresh = jest.fn().mockResolvedValue(undefined);
  render(<Membership enabled data={{ tier: "free", used: 0, limit: 0, subscription: null, creditBalance: 2 }} onRefresh={refresh}/>);
  await screen.findByText("₹299"); expect(screen.queryByText(/free|download credit|per download/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /yearly/i })); await user.click(screen.getByRole("button", { name: "Choose plan" }));
  await waitFor(() => expect(requestJson).toHaveBeenCalledWith("/api/billing", expect.objectContaining({ body: JSON.stringify({ action: "checkout", tier: "yearly", currency: "INR", expectedSale: null }) })));
});
test("active members manage renewal without opening a duplicate checkout", async () => {
  const user = userEvent.setup(); render(<Membership enabled selections={["nda"]} data={{ tier: "monthly", used: 0, limit: 50, creditBalance: 0, subscription: { status: "active", current_period_end: "2030-01-01", cancel_at_cycle_end: false } }} onRefresh={jest.fn()}/>);
  expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Cancel at period end" })); await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
  await waitFor(() => expect(requestJson).toHaveBeenCalledWith("/api/billing", expect.objectContaining({ body: JSON.stringify({ action: "cancel" }) })));
});

test.each([true,false])("checkout verifies on the server before reporting active=%s",async active=>{
  const user=userEvent.setup();const refresh=jest.fn().mockResolvedValue(undefined);
  const payment={razorpay_payment_id:"pay_test",razorpay_subscription_id:"sub_test",razorpay_signature:"a".repeat(64)};
  jest.mocked(openSubscriptionCheckout).mockResolvedValue(payment);
  jest.mocked(requestJson).mockImplementation(async(_url,init)=>{
    const action=init?.body?JSON.parse(String(init.body)).action:null;
    if(action==="checkout")return {subscriptionId:"sub_test",keyId:"rzp_test_key"};
    if(action==="verify")return {verified:true,active};
    return {monthly:299,yearly:2999,enabled:true};
  });
  render(<Membership enabled selections={["nda"]} data={{tier:"free",used:0,limit:0,subscription:null,creditBalance:0}} onRefresh={refresh}/>);
  await waitFor(()=>expect(screen.getByRole("button",{name:"Choose plan"})).toBeEnabled());
  await user.click(screen.getByRole("button",{name:"Choose plan"}));
  expect(await screen.findByText(active?"Payment verified. Your membership is active.":"Payment verified. Activation is processing; refresh your membership shortly. Do not pay again.")).toBeVisible();
  expect(requestJson).toHaveBeenCalledWith("/api/billing",expect.objectContaining({body:JSON.stringify({action:"verify",...payment})}));
  expect(refresh).toHaveBeenCalled();
});
