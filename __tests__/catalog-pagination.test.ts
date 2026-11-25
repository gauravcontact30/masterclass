/** @jest-environment node */
import { catalogRows } from "@/lib/server/catalog";
import { db } from "@/lib/server/db";
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({data,error}:{data:unknown;error:unknown}) => {if(error)throw error;return data;} }));
// Pages of 500 (lib/server/catalog.ts): a full page asks for the next one, a short page is the last, so small tables
// take one round trip. Supabase caps a response at 1,000 rows by default, above the page size.
test("reads every page until a short one and scopes every request", async () => {
  const ranges: number[][] = [];
  const eq = jest.fn();
  const records = Array.from({ length: 1003 }, (_, i) => ({ id: `r${i}` }));
  const query = {select:()=>query,order:()=>query,range:(from:number,to:number)=>{ranges.push([from,to]);return query;},eq:(...args:unknown[])=>{eq(...args);return query;},then:(resolve:(value:unknown)=>void)=>{ const [from,to]=ranges.at(-1)!; resolve({data:records.slice(from,to+1),error:null}); }};
  (db as jest.Mock).mockReturnValue({from:()=>query});
  expect(await catalogRows("topics","react")).toEqual(records);
  expect(ranges).toEqual([[0,499],[500,999],[1000,1499]]);
  expect(eq).toHaveBeenCalledTimes(3);
  expect(eq).toHaveBeenCalledWith("technology_id","react");
});
