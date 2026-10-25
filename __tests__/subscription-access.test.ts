/** @jest-environment node */
import { requirePaidAccess, requireLearningUser } from "@/lib/server/subscription-access";
import { currentUser } from "@/lib/server/auth";
import { account } from "@/lib/server/repository";
import { redirect } from "next/navigation";
jest.mock("@/lib/server/auth",()=>({currentUser:jest.fn()}));
jest.mock("@/lib/server/repository",()=>({account:jest.fn()}));
jest.mock("next/navigation",()=>({redirect:jest.fn((url:string)=>{throw new Error(url);})}));
beforeEach(()=>{jest.mocked(currentUser).mockResolvedValue({id:"learner",email:"student@example.com"} as never);jest.mocked(account).mockResolvedValue({tier:"free"} as never);});
test("an authenticated unpaid account cannot call learning APIs",async()=>{
  await expect(requirePaidAccess("learner")).rejects.toMatchObject({status:402,code:"subscription_required"});
});
test("paid users receive access; another account id does not",async()=>{
  jest.mocked(account).mockResolvedValue({tier:"yearly"} as never);
  await expect(requirePaidAccess("learner")).resolves.toMatchObject({id:"learner"});
  await expect(requirePaidAccess("other")).rejects.toMatchObject({status:401});
});
test("paid pages redirect unpaid accounts to membership before rendering content",async()=>{
  await expect(requireLearningUser()).rejects.toThrow("/learning/plans");
  expect(redirect).toHaveBeenCalledWith("/learning/plans");
});
test("only the verified super admin bypasses a subscription",async()=>{
  jest.mocked(currentUser).mockResolvedValue({id:"admin",email:"garvcontact30@gmail.com",email_confirmed_at:"2026-01-01"} as never);
  await expect(requirePaidAccess("admin")).resolves.toMatchObject({id:"admin"});
  expect(account).not.toHaveBeenCalled();
});
test("a signed-in Supabase account is still gated by its subscription",async()=>{
  jest.mocked(currentUser).mockResolvedValue({id:"learner",email:"student@example.com",app_metadata:{provider:"email"}} as never);
  await expect(requireLearningUser()).rejects.toThrow("/learning/plans");
});
