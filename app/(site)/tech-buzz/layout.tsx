import type { ReactNode } from "react";
import styles from "./tech-buzz-layout.module.css";

export default function TechBuzzLayout({ children }: { children: ReactNode }) {
  return (
    <div data-full-width="true" data-tech-buzz="true" className={styles.fullWidthWrapper}>
      {children}
    </div>
  );
}
