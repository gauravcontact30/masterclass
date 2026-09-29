"use client";
export type SubscriptionPayment = { razorpay_payment_id:string; razorpay_subscription_id:string; razorpay_signature:string };
type CheckoutInstance = { open:() => void; on?:(event:string, handler:() => void) => void };
declare global { interface Window { Razorpay?: new (options:Record<string, unknown>) => CheckoutInstance } }
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<void> | undefined;
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve,reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    const fresh = !script;
    if (!script) { script=document.createElement("script"); script.src=CHECKOUT_SRC; script.async=true; }
    const element = script;
    const cleanup = () => { clearTimeout(timer); element.removeEventListener("load",loaded); element.removeEventListener("error",failed); };
    const loaded = () => { cleanup(); if (window.Razorpay) resolve(); else { element.remove(); reject(new Error("payment_unavailable")); } };
    const failed = () => { cleanup(); element.remove(); reject(new Error("payment_unavailable")); };
    const timer = setTimeout(failed,20000);
    element.addEventListener("load",loaded,{ once:true });
    element.addEventListener("error",failed,{ once:true });
    if (fresh) document.body.appendChild(element);
  }).catch(error => { loading=undefined; throw error; });
  return loading;
}
export async function openRazorpayCheckout(options: { key:string; amount:number; currency:string; order_id:string; name?:string; description?:string }) {
  await loadCheckout();
  if (!window.Razorpay) throw new Error("payment_unavailable");
  new window.Razorpay(options).open();
}
/** Resolves only after Checkout completes or is dismissed, keeping duplicate clicks disabled. */
export async function openSubscriptionCheckout(options: { key:string; subscription_id:string; name:string; description:string }): Promise<SubscriptionPayment | null> {
  await loadCheckout();
  return new Promise((resolve,reject) => {
    if (!window.Razorpay) { reject(new Error("payment_unavailable")); return; }
    let failed=false;
    const checkout = new window.Razorpay({ ...options, theme:{ color:"#9a4a2c" },
      handler:(payment:SubscriptionPayment) => resolve(payment),
      modal:{ ondismiss:() => { if (failed) reject(new Error("payment_failed")); else resolve(null); } },
    });
    // Let Razorpay offer retries inside Checkout; report failure if the user leaves.
    checkout.on?.("payment.failed", () => { failed=true; });
    checkout.open();
  });
}
