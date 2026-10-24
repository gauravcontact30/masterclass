/** @jest-environment node */
import { PREPARATIONS } from "@/lib/study/preparations";
import { createHmac } from "node:crypto";
import { POST as billing } from "@/app/api/billing/route";
import { POST as webhook } from "@/app/api/webhooks/razorpay/route";
import { GET as invoices } from "@/app/api/billing/invoices/route";
import { db } from "@/lib/server/db";
import { entitlementTier } from "@/lib/domain";
import { validateSubscriptionPlan } from "@/lib/server/billing";

import { saleOffer } from "@/lib/server/festive-sale";
jest.mock("@/lib/server/festive-sale", () => ({ saleOffer: jest.fn().mockResolvedValue(null) }));
jest.mock("@/lib/server/http",()=>({...jest.requireActual("@/lib/server/http"),userId:jest.fn().mockResolvedValue("student")}));
jest.mock("@/lib/server/repository",()=>({profile:jest.fn()}));
jest.mock("@/lib/server/rate-limit",()=>({rateLimit:jest.fn()}));
jest.mock("@/lib/server/preparations",()=>({savePreparations:jest.fn()}));
jest.mock("@/lib/server/db",()=>({db:jest.fn(),check:({data,error}:{data:unknown;error:unknown})=>{if(error)throw error;return data;}}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stateful provider/query-builder fixtures cross several unrelated boundary shapes.
type Row=Record<string,any>;
let local:Row|null;
let remote:Row;
let events:Set<string>;
let ledger:Row[];
let invoiceRows:Row[];
let remoteCalls:string[];
let createdBodies:Row[];
const post=(body:unknown,origin="http://localhost")=>billing(new Request("http://localhost/api/billing",{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(body)}));
const sign=(text:string,secret="checkout-secret")=>createHmac("sha256",secret).update(text).digest("hex");
test.each(["monthly", "yearly"] as const)("Diwali %s retains discounted recurring plan after campaign expiry", async tier => {
  const amountInr = tier === "monthly" ? 225 : 2250;
  jest.mocked(saleOffer).mockResolvedValue({ slug:"diwali-2026", planId:`plan_sale_${tier}`, amountInr });
  const response = await post({ action:"checkout", tier, expectedSale:"diwali-2026" });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ amount:Math.round(amountInr * 100), discounted:true });
  expect(createdBodies[0].plan_id).toBe(`plan_sale_${tier}`);
  expect(local).toMatchObject({ festive_sale:"diwali-2026", recurring_amount_inr:amountInr, razorpay_plan_id:`plan_sale_${tier}` });
  jest.mocked(saleOffer).mockResolvedValue(null);
  remote = { ...remote, status:"active", paid_count:2, current_end:Math.floor(Date.now()/1000)+86400*60 };
  expect((await sendEvent("subscription.charged")).status).toBe(200);
  expect(entitlementTier(local as never)).toBe(tier);
  expect(local?.recurring_amount_inr).toBe(amountInr);
});

test("expired advertised campaign rejects checkout before creating a mandate", async () => {
  const response = await post({ action:"checkout", tier:"monthly", expectedSale:"diwali-2026" });
  expect(response.status).toBe(409);
  expect(createdBodies).toHaveLength(0);
});
async function sendEvent(event:string,extra:Row={}) {
  const raw=JSON.stringify({event,payload:{subscription:{entity:remote},...extra}});
  return webhook(new Request("http://localhost/api/webhooks/razorpay",{method:"POST",headers:{"x-razorpay-signature":sign(raw,"webhook-secret")},body:raw}));
}
beforeEach(()=>{
  jest.mocked(saleOffer).mockResolvedValue(null);
  Object.assign(process.env,{RAZORPAY_KEY_ID:"rzp_test_key",RAZORPAY_KEY_SECRET:"checkout-secret",RAZORPAY_WEBHOOK_SECRET:"webhook-secret",RAZORPAY_MONTHLY_PLAN_ID:"plan_monthly",RAZORPAY_YEARLY_PLAN_ID:"plan_yearly",BILLING_ENABLED:"true",ALLOW_LIVE_BILLING:"false",PRO_MONTHLY_PRICE_INR:"299",PRO_YEARLY_PRICE_INR:"2999"});
  local=null;events=new Set();ledger=[];invoiceRows=[];remoteCalls=[];createdBodies=[];
  remote={id:"sub_flow",plan_id:"plan_monthly",status:"created",current_end:null,notes:{user_id:"student"}};
  jest.mocked(db).mockReturnValue({from:(table:string)=>{
    let operation="read";let value:Row={};const filters:Row={};
    const run=()=>{
      if(table==="profiles")return {data:{id:"student"}};
      if(table==="billing_ledger"){ledger.push(value);return {data:null};}
      if(table==="webhook_events")return {data:events.has(filters.event_id)?{event_id:filters.event_id}:null};
      if(operation==="insert"){if(local)return {data:null,error:new Error("duplicate")};local={...value};}
      if(local&&Object.entries(filters).some(([k,v])=>local?.[k]!==v))return {data:null};
      if(operation==="update"&&local)local={...local,...value};
      return {data:local?{...local}:null};
    };
    const q:Row={select:()=>q,eq:(k:string,v:unknown)=>{filters[k]=v;return q;},insert:(v:Row)=>{operation="insert";value=v;return q;},update:(v:Row)=>{operation="update";value=v;return q;},upsert:(v:Row)=>{value=v;return q;},single:async()=>run(),maybeSingle:async()=>run(),then:(resolve:(v:unknown)=>void)=>Promise.resolve(run()).then(resolve)};
    return q;
  },rpc:async(name:string,p:Row)=>{
    if(name!=="apply_subscription")throw new Error("Unexpected RPC");
    if(events.has(p.p_event))return {data:false};
    events.add(p.p_event);
    if(local?.provider_ref!==p.p_ref)return {data:false};
    local={...local,status:p.p_status,current_period_end:p.p_end,cancel_at_cycle_end:p.p_cancel,synced_at:p.p_synced};
    return {data:true};
  }} as never);
  global.fetch=jest.fn(async(url,init)=>{
    const path=String(url).replace("https://api.razorpay.com/v1/","");remoteCalls.push(path);
    let result:unknown;
    if(path.startsWith("plans/")){const yearly=path.endsWith("yearly"), sale=path.includes("sale_");result={id:path.slice(6),period:yearly?"yearly":"monthly",interval:1,item:{amount:sale?(yearly?225000:22500):(yearly?299900:29900),currency:"INR"}};}
    else if(path==="subscriptions"){const body=JSON.parse(String(init?.body));createdBodies.push(body);remote={...remote,plan_id:body.plan_id,...(body.start_at?{id:"sub_renewal",status:"created",paid_count:0,current_end:null}:{})};result=remote;}
    else if(path.endsWith("/cancel")){const body=JSON.parse(String(init?.body));if(!body.cancel_at_cycle_end)remote={...remote,status:"cancelled"};result=remote;}
    else if(path.startsWith("invoices?"))result={items:invoiceRows};
    else if(path===`subscriptions/${remote.id}`)result=remote;
    else throw new Error(`Unexpected provider path: ${path}`);
    return {ok:true,json:async()=>result} as Response;
  });
});

test.each(["monthly","yearly"] as const)("%s checkout, signed verification, renewals, duplicates, cancellation and expiry",async tier=>{
  const response=await post({action:"checkout",tier,selections:[PREPARATIONS[0].id]});
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({subscriptionId:"sub_flow",keyId:"rzp_test_key",amount:tier==="monthly"?29900:299900});
  expect(entitlementTier(local as never)).toBe("free");
  remote={...remote,status:"active",current_end:Math.floor(Date.now()/1000)+86400*30};
  const verified=await post({action:"verify",razorpay_payment_id:"pay_flow",razorpay_subscription_id:"sub_flow",razorpay_signature:sign("pay_flow|sub_flow")});
  expect(await verified.json()).toEqual({verified:true,active:true});
  expect(entitlementTier(local as never)).toBe(tier);
  const event=await sendEvent("subscription.charged");expect(event.status).toBe(200);
  expect(await (await sendEvent("subscription.charged")).json()).toEqual({duplicate:true});
  remote={...remote,current_end:remote.current_end+86400*30};
  await sendEvent("subscription.charged");
  expect(local?.current_period_end).toBe(new Date(remote.current_end*1000).toISOString());
  expect((await post({action:"checkout",tier,selections:[PREPARATIONS[0].id]})).status).toBe(409);
  expect((await post({action:"cancel"})).status).toBe(200);
  expect(local?.cancel_at_cycle_end).toBe(true);expect(entitlementTier(local as never)).toBe(tier);
  const end=local?.current_period_end;remote={...remote,status:"cancelled",current_end:null};
  await sendEvent("subscription.cancelled");expect(local?.current_period_end).toBe(end);
  expect(entitlementTier(local as never,Date.parse(end)+1)).toBe("free");
});

test("a member whose UPI mandate was revoked sets up a renewal that starts when the paid period ends",async()=>{
  await post({action:"checkout",tier:"monthly"});
  remote={...remote,status:"active",paid_count:1,current_end:Math.floor(Date.now()/1000)+86400*20};
  await post({action:"verify",razorpay_payment_id:"pay_flow",razorpay_subscription_id:"sub_flow",razorpay_signature:sign("pay_flow|sub_flow")});
  const end=local?.current_period_end;
  // Revoked from the customer's UPI app: Razorpay cancels at once, keeping the paid period.
  remote={...remote,status:"cancelled"};await sendEvent("subscription.cancelled");
  expect(local).toMatchObject({status:"cancelled",current_period_end:end});
  const response=await post({action:"checkout",tier:"monthly"});
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({subscriptionId:"sub_renewal"});
  expect(createdBodies.at(-1)).toMatchObject({start_at:Math.ceil(Date.parse(end)/1000)});
  expect(local).toMatchObject({provider_ref:"sub_renewal",status:"created",current_period_end:end,cancel_at_cycle_end:false});
  expect(entitlementTier(local as never)).toBe("monthly");
  // The renewal mandate is authorised but not yet charged: the paid period carries over.
  remote={...remote,status:"authenticated"};
  expect(await (await post({action:"verify",razorpay_payment_id:"pay_renew",razorpay_subscription_id:"sub_renewal",razorpay_signature:sign("pay_renew|sub_renewal")})).json()).toEqual({verified:true,active:true});
  expect(local?.current_period_end).toBe(end);
  // A late event for the revoked subscription does not touch its replacement.
  const renewal=remote;remote={...remote,id:"sub_flow",status:"cancelled"};await sendEvent("subscription.cancelled");remote=renewal;
  expect(local?.provider_ref).toBe("sub_renewal");
  // First charge at the old period's end.
  remote={...remote,status:"active",paid_count:1,current_end:Math.floor(Date.parse(end)/1000)+86400*30};
  await sendEvent("subscription.charged");
  expect(local?.current_period_end).toBe(new Date(remote.current_end*1000).toISOString());
  expect(entitlementTier(local as never,Date.parse(end)+1)).toBe("monthly");
});

test("an abandoned renewal keeps the paid period and nothing after it",async()=>{
  local={user_id:"student",provider_ref:"sub_renewal",tier:"monthly",status:"created",current_period_end:new Date(Date.now()+86400e3).toISOString(),synced_at:new Date(0).toISOString(),cancel_at_cycle_end:false};
  remote={id:"sub_renewal",plan_id:"plan_monthly",status:"created",paid_count:0,current_end:null,notes:{user_id:"student"}};
  expect(entitlementTier(local as never)).toBe("monthly");
  expect(entitlementTier(local as never,Date.now()+2*86400e3)).toBe("free");
  expect(entitlementTier({...local,current_period_end:null} as never)).toBe("free");
});

test("forged signatures, another account's reference, and cross-origin calls cannot grant access",async()=>{
  await post({action:"checkout",tier:"monthly",selections:[PREPARATIONS[0].id]});
  const payload={action:"verify",razorpay_payment_id:"pay_flow",razorpay_subscription_id:"sub_flow",razorpay_signature:"0".repeat(64)};
  expect((await post(payload)).status).toBe(400);
  expect((await post({...payload,razorpay_subscription_id:"sub_other"})).status).toBe(404);
  expect((await post(payload,"https://attacker.example")).status).toBe(403);
  expect(entitlementTier(local as never)).toBe("free");
  const raw=JSON.stringify({event:"subscription.activated",payload:{subscription:{entity:remote}}});
  const invalid=await webhook(new Request("http://localhost/api/webhooks/razorpay",{method:"POST",headers:{"x-razorpay-signature":"0".repeat(64)},body:raw}));
  expect(invalid.status).toBe(401);expect(ledger).toHaveLength(0);
});

test("an authenticated mandate still awaits activation; failed/expired mandates grant no access",async()=>{
  await post({action:"checkout",tier:"yearly",selections:[PREPARATIONS[0].id]});
  remote={...remote,status:"authenticated"};
  expect(await (await post({action:"verify",razorpay_payment_id:"pay_auth",razorpay_subscription_id:"sub_flow",razorpay_signature:sign("pay_auth|sub_flow")})).json()).toEqual({verified:true,active:false});
  for(const status of ["pending","halted","expired"]){remote={...remote,status};await sendEvent(`subscription.${status}`);expect(entitlementTier(local as never)).toBe("free");}
});

test("closing checkout resumes the same subscription without a second provider create",async()=>{
  const body={action:"checkout",tier:"monthly",selections:[PREPARATIONS[0].id]};
  await post(body);await post(body);
  expect(remoteCalls.filter(path=>path==="subscriptions")).toHaveLength(1);
  expect((await post({...body,tier:"yearly"})).status).toBe(409);
  expect((await post({action:"cancel"})).status).toBe(200);expect(local?.status).toBe("cancelled");
});

test("turning off new billing leaves existing subscriptions manageable",async()=>{
  await post({action:"checkout",tier:"monthly",selections:[PREPARATIONS[0].id]});process.env.BILLING_ENABLED="false";
  expect((await post({action:"refresh"})).status).toBe(200);
  expect((await post({action:"cancel"})).status).toBe(200);
  expect((await post({action:"checkout",tier:"monthly",selections:[PREPARATIONS[0].id]})).status).toBe(503);
});

test("configured prices must match the actual Razorpay plan before any charge",async()=>{
  process.env.PRO_MONTHLY_PRICE_INR="399";
  await expect(validateSubscriptionPlan("monthly")).rejects.toMatchObject({code:"billing_plan_mismatch"});
  expect(remoteCalls).not.toContain("subscriptions");
});

test("invoice history is owner-scoped and excludes personal provider data and unsafe links",async()=>{
  await post({action:"checkout",tier:"monthly",selections:[PREPARATIONS[0].id]});
  invoiceRows=[{id:"inv_safe",subscription_id:"sub_flow",status:"paid",amount:29900,amount_paid:29900,currency:"INR",created_at:1700000000,short_url:"https://rzp.io/i/invoice",customer_details:{email:"private@example.com"}},
    {id:"inv_badurl",subscription_id:"sub_flow",status:"paid",amount:29900,amount_paid:29900,currency:"INR",created_at:1700000000,short_url:"https://attacker.example/"},
    {id:"inv_other",subscription_id:"sub_other",status:"paid",amount:29900,amount_paid:29900,currency:"INR",created_at:1700000000}];
  const result=await (await invoices(new Request("http://localhost/api/billing/invoices"))).json();
  expect(result.invoices).toHaveLength(2);expect(result.invoices[0].url).toBe("https://rzp.io/i/invoice");
  expect(result.invoices[0]).not.toHaveProperty("customer_details");expect(result.invoices[1].url).toBeNull();
});
