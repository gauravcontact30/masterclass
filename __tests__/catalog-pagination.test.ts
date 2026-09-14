/** @jest-environment node */
import { catalogRows } from "@/lib/server/catalog";
import { db } from "@/lib/server/db";
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({data,error}:{data:unknown;error:unknown}) => {if(error)throw error;return data;} }));
test("retrieves all server-capped pages and scopes every request", async () => {
  const ranges: number[][] = [];
  const eq = jest.fn();
  const records = [{id:"a"},{id:"b"},{id:"c"}];
  const query = {select:()=>query,order:()=>query,range:(from:number,to:number)=>{ranges.push([from,to]);return query;},eq:(...args:unknown[])=>{eq(...args);return query;},then:(resolve:(value:unknown)=>void)=>resolve({data:records.slice(ranges.at(-1)![0],ranges.at(-1)![0]+2),error:null})};
  (db as jest.Mock).mockReturnValue({from:()=>query});
  expect(await catalogRows("topics","react")).toEqual(records);
  expect(ranges.map(range=>range[0])).toEqual([0,2,3]);
  expect(eq).toHaveBeenCalledTimes(3);
  expect(eq).toHaveBeenCalledWith("technology_id","react");
});
