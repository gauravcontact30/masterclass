import { indiaAccess } from "@/lib/server/audience";
import { redirect } from "next/navigation";
import Link from "@/components/site-link";
import { currentUser } from "@/lib/server/auth";
import { portalsOf } from "@/lib/server/portal";
import { PortalJoin } from "@/components/portal-join";
import { PORTALS, isExamPortal, isPortal, type Portal } from "@/lib/portal";
import { privateMetadata } from "@/lib/seo";
import styles from "@/components/exams-shell.module.css";
export const instant = false;
export const metadata = { ...privateMetadata, title: "Create your account in this portal" };

/**
 * Shown when a signed-in login opens a portal it has no account in (a Tech dashboard page with only exam accounts,
 * or one exam portal with only the other). The portals are separate accounts, so nothing is created until the reader
 * asks for it here.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ portal?: string }> }) {
  const requested = (await searchParams).portal;
  const portal: Portal = requested === "exams" ? "boards" : isPortal(requested) ? requested : "tech";
  const india = await indiaAccess();
  if (isExamPortal(portal) && !india) redirect("/");
  const user = await currentUser();
  if (!user) redirect(PORTALS[portal].signIn);
  const held = await portalsOf(user.id);
  if (held === null || held.includes(portal)) redirect(PORTALS[portal].home);
  const info = PORTALS[portal];
  const back = held.find(other => other !== portal && (india || other === "tech"));
  return <div className={styles.shell}><main className={styles.main} id="main-content">
    <div className={styles.stack} style={{ maxWidth: 620, margin: "8vh auto 0" }}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{info.name}</p>
        <h1>You do not have a <em>{info.name} account</em> yet.</h1>
        <p>You are signed in as {user.email}{back ? `, which has a ${PORTALS[back].name} account` : ""}. Tech Pro, Board Scholars and Exam Aspirants are separate accounts, each with its own dashboard, trial and membership. Create your {info.name} account for {info.audience.charAt(0).toLowerCase() + info.audience.slice(1)}.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
          <PortalJoin portal={portal} className={styles.primary} />
          {back && <Link className={styles.ghost} href={PORTALS[back].home}>Back to {PORTALS[back].name}</Link>}
        </div>
      </header>
    </div>
  </main></div>;
}
