// The page awaits the signed-in user (a Supabase round trip). The dashboard folder's loading screen sits one segment
// up, so it does not cover navigations that re-render only this page; this boundary does, keeping them instant.
export { default } from "../../../(learning)/dashboard/loading";
