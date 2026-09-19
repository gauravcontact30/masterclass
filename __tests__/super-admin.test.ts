/** @jest-environment node */
import { GET } from "@/app/api/super-admin/route";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
jest.mock("@/lib/server/auth", () => ({ currentUser: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({data,error}: {data: unknown; error: unknown}) => { if(error) throw error; return data; } }));
const request = () => new Request("http://localhost/api/super-admin?days=999");
test.each([
  [null,401],
  [{id:"attacker",email:"other@gmail.com",email_confirmed_at:"2026-01-01",user_metadata:{role:"super_admin"}},403],
  [{id:"unverified",email:"garvcontact30@gmail.com"},403],
])("denies unauthorized access before database reads",async(user,status)=>{
  (currentUser as jest.Mock).mockResolvedValue(user);
  const result=await GET(request());
  expect(result.status).toBe(status); expect(db).not.toHaveBeenCalled();
  expect(result.headers.get("cache-control")).toContain("no-store");
});
test("verified owner can read the snapshot and invalid windows are bounded",async()=>{
  (currentUser as jest.Mock).mockResolvedValue({id:"owner",email:"GARVCONTACT30@gmail.com",email_confirmed_at:"2026-01-01"});
  const rpc=jest.fn().mockResolvedValue({data:{counts:{users:12}},error:null});
  (db as jest.Mock).mockReturnValue({rpc});
  const response=await GET(request());
  expect(response.status).toBe(200);expect(rpc).toHaveBeenCalledWith("super_admin_snapshot",{p_days:30});
  expect((await response.json()).counts.users).toBe(12);
  expect(response.headers.get("cache-control")).toContain("no-store");
});
