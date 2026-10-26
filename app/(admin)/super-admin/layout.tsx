// The Super Admin console lives in its own route group, (admin), at /super-admin (it was
// /dashboard/super-admin until 2026-10-25). It shares the Learning Dashboard's private metadata and announcement banner.
export { default, metadata } from "../../(learning)/learning/layout";
// Segment config must be declared here, not re-exported: the console renders once its data is ready, with no loading screen.
export const instant = false;
