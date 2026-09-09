/** @jest-environment node */
import { GET } from "@/app/api/documents/[id]/route";
import { POST } from "@/app/api/documents/route";
import { supabaseServer } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
jest.mock("@/lib/server/auth",()=>({supabaseServer:jest.fn()}));
jest.mock("@/lib/server/db",()=>({db:jest.fn(),check:({data,error}:{data:unknown;error:unknown})=>{if(error)throw error;return data;}}));
function session(user:{id:string}|null){(supabaseServer as jest.Mock).mockResolvedValue({auth:{getUser:async()=>({data:{user},error:null})}});}
beforeEach(()=>{process.env.NEXT_PUBLIC_SUPABASE_URL="https://x.supabase.co";process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY="anon";});
test("rejects a generation request without an authenticated Supabase session",async()=>{session(null);const response=await POST(new Request("http://localhost/api/documents",{method:"POST",body:"{}"}));expect(response.status).toBe(401);expect(db).not.toHaveBeenCalled();});
test("filters document access by both ID and authenticated owner before signing anything",async()=>{session({id:"bob"});const query={select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),maybeSingle:jest.fn().mockResolvedValue({data:null,error:null})};const storage=jest.fn();(db as jest.Mock).mockReturnValue({from:()=>query,storage:{from:storage}});const response=await GET(new Request("http://localhost/api/documents/private"),{params:Promise.resolve({id:"private"})});expect(query.eq).toHaveBeenCalledWith("user_id","bob");expect(response.status).toBe(404);expect(storage).not.toHaveBeenCalled();});
