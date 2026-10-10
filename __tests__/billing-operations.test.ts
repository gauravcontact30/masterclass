/** @jest-environment node */
import { GET, POST } from "@/app/api/super-admin/billing/route";
import { POST as reconcile } from "@/app/api/internal/billing-reconcile/route";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { validateSubscriptionPlan, reconcileSubscription } from "@/lib/server/billing";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
jest.mock("@/lib/server/super-admin",()=>({requireSuperAdmin:jest.fn()}));
jest.mock("@/lib/server/rate-limit",()=>({rateLimit:jest.fn()}));
jest.mock("@/lib/server/billing",()=>({validateSubscriptionPlan:jest.fn(),reconcileSubscription:jest.fn()}));
jest.mock("@/lib/server/guest-billing",()=>({sweepGuestCheckouts:jest.fn().mockResolvedValue({fulfilled:0,failed:0})}));
jest.mock("@/lib/server/db",()=>({db:jest.fn(),check:({data}:{data:unknown})=>data}));
beforeEach(()=>{
  jest.mocked(requireSuperAdmin).mockResolvedValue({id:"admin"} as never);
  process.env.RAZORPAY_KEY_SECRET="private-secret-never-return";
  process.env.WORKER_SECRET="private-worker-secret";
});
test("only super admins may inspect or verify gateway setup",async()=>{
  jest.mocked(requireSuperAdmin).mockRejectedValue(new HttpError(403,"forbidden"));
  expect((await GET(new Request("http://localhost/api/super-admin/billing"))).status).toBe(403);
  expect((await POST(new Request("http://localhost/api/super-admin/billing",{method:"POST"}))).status).toBe(403);
  expect(validateSubscriptionPlan).not.toHaveBeenCalled();
});
test("setup exposes presence flags but no credential values",async()=>{
  const response=await GET(new Request("http://localhost/api/super-admin/billing"));
  const body=await response.text();
  expect(body).toContain('"name":"RAZORPAY_KEY_SECRET","configured":true');
  expect(body).not.toContain("private-secret-never-return");
});
test("plan check validates both configured plans without creating charges",async()=>{
  expect((await POST(new Request("http://localhost/api/super-admin/billing",{method:"POST"}))).status).toBe(200);
  expect(validateSubscriptionPlan).toHaveBeenCalledWith("monthly");
  expect(validateSubscriptionPlan).toHaveBeenCalledWith("yearly");
});
test("reconciliation job rejects unauthorized callers before reading subscriptions",async()=>{
  expect((await reconcile(new Request("http://localhost/api/internal/billing-reconcile",{method:"POST"}))).status).toBe(401);
  expect(db).not.toHaveBeenCalled();
});
test("scheduled reconciliation reports partial failures so the scheduler retries",async()=>{
  const query={select:jest.fn().mockReturnThis(),in:jest.fn().mockReturnThis(),order:jest.fn().mockReturnThis(),limit:jest.fn().mockResolvedValue({data:[{provider_ref:"sub_ok"},{provider_ref:"sub_fail"}]})};
  jest.mocked(db).mockReturnValue({from:()=>query} as never);
  jest.mocked(reconcileSubscription).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("provider unavailable"));
  const response=await reconcile(new Request("http://localhost/api/internal/billing-reconcile",{method:"POST",headers:{authorization:"Bearer private-worker-secret"}}));
  expect(response.status).toBe(503);expect(await response.json()).toEqual({reconciled:1,failed:1,guestsFulfilled:0});
  expect(query.limit).toHaveBeenCalledWith(10);
});
