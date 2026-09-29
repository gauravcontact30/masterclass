// Streams the dashboard frame while the page resolves the signed-in user, so
// the browser paints immediately instead of waiting on the auth round trip.
// It reuses the real shell classes, so nothing moves when the page swaps in.
export default function DashboardLoading() {
  return <div className="app-shell compact-workspace" aria-busy="true">
    <aside className="sidebar" aria-hidden="true" />
    <div className="main-shell"><header className="topbar" aria-hidden="true" />
      <main className="workspace" role="status" aria-label="Loading your dashboard"><span className="sr-only">Loading…</span></main>
    </div>
  </div>;
}
