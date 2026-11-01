import { RouteH1 } from "@/components/route-heading";
import type { ReactNode } from "react";
import styles from "./dashboard-design.module.css";

/** Shared page hierarchy for the learning tools and application monitoring. */
export function DashboardPageHeader({ eyebrow, title, description, icon, actions }: {
  eyebrow: string; title: ReactNode; description?: ReactNode; icon?: ReactNode; actions?: ReactNode;
}) {
  return <header className={styles.header}>
    <div className={styles.heading}>
      <p className={styles.eyebrow}>{icon && <span aria-hidden="true">{icon}</span>}{eyebrow}</p>
      <RouteH1>{title}</RouteH1>
      {description && <p className={styles.description}>{description}</p>}
    </div>
    {actions && <div className={styles.actions}>{actions}</div>}
  </header>;
}
