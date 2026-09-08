/** @jest-environment node */
import { GET } from "@/app/api/documents/[id]/route";
import { POST } from "@/app/api/documents/route";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/server/db";
jest.mock("@clerk/nextjs/server",()=>({auth:jest.fn()}));
jest.mock("@/lib/server/db",()=>({db:jest.fn(),check:({data,error}:{data:unknown;error:unknown})=>{if(error)throw error;return data;}}));
beforeEach(()=>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="test";process.env.CLERK_SECRET_KEY="test";});
test("rejects a generation request without an authenticated Clerk session",async()=>{(auth as unknown as jest.Mock).mockResolvedValue({userId:null});const response=await POST(new Request("http://localhost/api/documents",{method:"POST",body:"{}"}));expect(response.status).toBe(401);expect(db).not.toHaveBeenCalled();});
test("filters document access by both ID and authenticated owner before signing anything",async()=>{(auth as unknown as jest.Mock).mockResolvedValue({userId:"bob"});const query={select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),maybeSingle:jest.fn().mockResolvedValue({data:null,error:null})};const storage=jest.fn();(db as jest.Mock).mockReturnValue({from:()=>query,storage:{from:storage}});const response=await GET(new Request("http://localhost/api/documents/private"),{params:Promise.resolve({id:"private"})});expect(query.eq).toHaveBeenCalledWith("user_id","bob");expect(response.status).toBe(404);expect(storage).not.toHaveBeenCalled();});
