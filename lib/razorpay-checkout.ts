"use client";
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } } }
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("service_error"));
    document.body.appendChild(script);
  });
}
export async function openRazorpayCheckout(options: { key: string; amount: number; currency: string; order_id: string; name?: string; description?: string }) {
  if (!window.Razorpay) await loadScript(CHECKOUT_SRC);
  if (!window.Razorpay) throw new Error("service_error");
  new window.Razorpay(options).open();
}
