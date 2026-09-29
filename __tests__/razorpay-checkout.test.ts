import { openRazorpayCheckout, openSubscriptionCheckout } from "@/lib/razorpay-checkout";

afterEach(() => {
  delete (window as unknown as { Razorpay?: unknown }).Razorpay;
  document.body.innerHTML = "";
});

test("opens Razorpay Checkout directly when the script is already loaded", async () => {
  const open = jest.fn();
  const Razorpay = jest.fn().mockImplementation(() => ({ open }));
  (window as unknown as { Razorpay: unknown }).Razorpay = Razorpay;

  await openRazorpayCheckout({ key: "rzp_test", amount: 4900, currency: "INR", order_id: "order_1" });

  expect(Razorpay).toHaveBeenCalledWith(expect.objectContaining({ key: "rzp_test", amount: 4900, currency: "INR", order_id: "order_1" }));
  expect(open).toHaveBeenCalled();
});

test("loads the Razorpay Checkout script and recovers from script failure", async () => {
  const loading=openRazorpayCheckout({ key: "rzp_test", amount: 4900, currency: "INR", order_id: "order_1" });

  expect(document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')).not.toBeNull();
  document.querySelector("script")!.dispatchEvent(new Event("error"));
  await expect(loading).rejects.toThrow("payment_unavailable");
  expect(document.querySelector("script")).toBeNull();
});

test.each(["success","dismiss","failure"])("subscription checkout settles correctly on %s",async outcome=>{
  let options:Record<string,unknown>={};let failed=()=>{};
  window.Razorpay=jest.fn().mockImplementation(value=>{options=value;return {open:jest.fn(),on:(_event:string,handler:()=>void)=>{failed=handler;}};});
  const result=openSubscriptionCheckout({key:"rzp_test",subscription_id:"sub_test",name:"MasterClass",description:"Monthly"});
  await Promise.resolve();
  expect(options.subscription_id).toBe("sub_test");expect(options).not.toHaveProperty("order_id");
  if(outcome==="success"){
    const payment={razorpay_payment_id:"pay_test",razorpay_subscription_id:"sub_test",razorpay_signature:"signed"};
    (options.handler as (value:unknown)=>void)(payment);
    await expect(result).resolves.toEqual(payment);
  }else{
    if(outcome==="failure")failed();
    (options.modal as {ondismiss:()=>void}).ondismiss();
    if(outcome==="failure")await expect(result).rejects.toThrow("payment_failed");
    else await expect(result).resolves.toBeNull();
  }
});
