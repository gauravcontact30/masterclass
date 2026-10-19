import { LearningLoader } from "@/components/learning-loader";
import styles from "./loading.module.css";

// Shown the moment a dashboard page is opened, while the page resolves the signed-in user and its content on the
// server. It reuses the real shell classes, so nothing moves when the page swaps in: the sidebar shows shimmering
// rows where its links will be, and the main area shows the learning loader instead of an empty screen.
export default function DashboardLoading() {
  return <div className="app-shell compact-workspace" aria-busy="true">
    <aside className="sidebar" aria-hidden="true">
      <div className={styles.rail}>{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 90}ms` }} />)}</div>
    </aside>
    <div className="main-shell"><header className="topbar" aria-hidden="true" />
      <main className="workspace"><LearningLoader label="Loading your learning space…" /></main>
    </div>
  </div>;
}
