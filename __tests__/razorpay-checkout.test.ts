import { openRazorpayCheckout } from "@/lib/razorpay-checkout";

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

test("loads the Razorpay Checkout script when it is not already present", () => {
  void openRazorpayCheckout({ key: "rzp_test", amount: 4900, currency: "INR", order_id: "order_1" }).catch(() => {});

  expect(document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')).not.toBeNull();
});
