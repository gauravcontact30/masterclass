import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";
import { dailySocial } from "@/lib/daily-social";
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
jest.mock("next/dynamic", () => ({ __esModule: true, default: (loader: () => Promise<ComponentType>) => {
  const React = jest.requireActual("react");
  const Lazy = React.lazy(async () => ({ default: await loader() }));
  return function Loaded(props: object) { return <React.Suspense fallback={null}><Lazy {...props} /></React.Suspense>; };
} }));
const snapshot = {
  generatedAt:"2026-09-15T12:00:00Z", counts:{users:7,documents:10,activeSubscriptions:2,failedDocuments:0},
  users:[{id:"one",email:"learner@example.com",role:"viewer",created_at:"2026-09-01",email_confirmed_at:"2026-09-01",last_sign_in_at:"2026-09-15"}],
  sessions:[],logins:[],subscriptions:[],billing:[],revenue:[],events:[],documents:[],integrations:[],recurring:{monthly:1,yearly:1},prices:{monthly:299,yearly:2999},requests:{count:0,errors:0,p95:null},
  health:{databaseMs:10,processUptime:60,processMemory:1024,hostMemory:2048,hostUsedMemory:1024,cpuCores:2,cpuSeconds:1,billingConfigured:true}
};
const operations={generatedAt:"2026-09-15T12:00:00Z",liveCount:0,openReports:0,live:[],traffic:[],pages:[],ai:[],reports:[],alerts:[],security:[]};
const directory = {
  users: [{id:"one",email:"learner@example.com",name:"Learner",phone:null,createdAt:"2026-09-01",lastSignInAt:null,confirmedAt:"2026-09-01",bannedUntil:null,providers:["email"],role:"viewer",superAdmin:false,owner:false,access:"free",trialEndsAt:null,subscription:null,language:"en",credits:0,stats:{documents:0,completed:0,visits30d:0,lastSeen:null,location:null,device:null}}],
  total:1,page:1,pages:1,generatedAt:snapshot.generatedAt,
  counts:{all:1,super_admin:0,members:0,trial:0,free:1,banned:0,unconfirmed:0,new:0},
  summary:{total:1,confirmed:1,active7d:0,new7d:0,members:0,trial:0,superAdmins:0,banned:0},
};
test("loads real API shape, searches users and preserves labels when collapsed",async()=>{
  global.fetch=jest.fn().mockImplementation((url:string)=>Promise.resolve({ok:true,status:200,json:async()=>url.includes("/users?")?{...directory,users:url.includes("q=missing")?[]:directory.users}:url.includes("/promotions/daily")?{...dailySocial([], "2026-10-19"),generatedAt:"2026-10-19T06:00:00Z",capped:false}:url.includes("/operations")?operations:snapshot}));
  render(<SuperAdminDashboard/>);
  expect(await screen.findByText("Registered users")).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Users & access"}));
  expect(await screen.findByText("learner@example.com")).toBeVisible();
  fireEvent.change(screen.getByRole("searchbox",{name:"Search users"}),{target:{value:"missing"}});
  await waitFor(() => expect(screen.queryByText("learner@example.com")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button",{name:"Collapse sidebar"}));
  fireEvent.mouseOver(screen.getByRole("button",{name:"Security"}));
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Security");
});
test("unavailable monitoring has an actionable error instead of fabricated totals",async()=>{
  global.fetch=jest.fn().mockResolvedValue({ok:false,status:500});
  render(<SuperAdminDashboard/>);
  expect((await screen.findAllByRole("alert")).some(item=>item.textContent?.includes("apply migration 0018"))).toBe(true);
  expect(screen.queryByText("Registered users")).not.toBeInTheDocument();
});
