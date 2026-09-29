// Read-only readiness check. Never print credentials or create charges/subscriptions.
const names=["RAZORPAY_KEY_ID","RAZORPAY_KEY_SECRET","RAZORPAY_WEBHOOK_SECRET","RAZORPAY_MONTHLY_PLAN_ID","RAZORPAY_YEARLY_PLAN_ID"];
let failed=false;
for(const name of names){const ok=Boolean(process.env[name]);console.log(`${ok?"OK":"MISSING"}: ${name}`);if(!ok)failed=true;}
const live=process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_");
console.log(`Mode: ${live?"LIVE":"TEST"}`);
if(live&&process.env.ALLOW_LIVE_BILLING!=="true"){console.log("BLOCKED: live billing permission is disabled");failed=true;}
if(process.env.BILLING_ENABLED!=="true")console.log("NOTICE: new checkouts are disabled (BILLING_ENABLED is not true)");
if(!failed){
 for(const tier of ["monthly","yearly"]){
  const id=process.env[tier==="monthly"?"RAZORPAY_MONTHLY_PLAN_ID":"RAZORPAY_YEARLY_PLAN_ID"];
  const price=Number(process.env[tier==="monthly"?"PRO_MONTHLY_PRICE_INR":"PRO_YEARLY_PRICE_INR"]??(tier==="monthly"?299:2999));
  try{
   const response=await fetch(`https://api.razorpay.com/v1/plans/${encodeURIComponent(id)}`,{headers:{Authorization:`Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`},signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new Error(`Provider returned HTTP ${response.status}`);
   const plan=await response.json();
   if(plan.id!==id||plan.period!==tier||plan.interval!==1||plan.item?.currency!=="INR"||plan.item?.amount!==Math.round(price*100))throw new Error("Plan price, currency or period does not match");
   console.log(`OK: ${tier} plan, INR ${price}`);
  }catch(error){console.log(`FAILED: ${tier} plan (${error instanceof Error?error.message:"request failed"})`);failed=true;}
 }
}
console.log(failed?"NOT READY: configure the missing or mismatched settings before provider testing.":"Plan checks passed. Still verify public webhook delivery and a Test Mode checkout.");
process.exitCode=failed?1:0;
