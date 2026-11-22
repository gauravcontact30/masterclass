import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { ArrowRight, Compass } from "lucide-react";
import { ExamsShell } from "@/components/exams-shell";
import { openExamPortals } from "@/lib/server/portal";
import { PORTALS, type ExamPortal } from "@/lib/portal";
import styles from "@/components/exams-shell.module.css";
// Reads the session to show which portals this login already holds.
export const instant = false;
export const metadata = { title: "Choose your exam portal" };

const CARDS: { portal: ExamPortal; image: string; heading: string; body: string; points: string[] }[] = [
  {
    portal: "boards", image: "/images/exams/board-cbse.png", heading: "Board Scholars",
    body: "For Class 10 and 12 students on UP Board, CBSE and ICSE / ISC.",
    points: ["Maths, Physics, Chemistry and English, chapter and topic wise", "Most asked questions with year asked and star ratings", "Official past papers for 20 years and upcoming exam dates"],
  },
  {
    portal: "competitive", image: "/images/exams/upsc.png", heading: "Exam Aspirants",
    body: "For government and competitive exam candidates across India.",
    points: ["NDA, Defence, Banks, Railways, SSC, UPSC, CBI, Income Tax and more", "400+ objective questions per exam with short explanations", "Exam calendar with official sites, and subjective answers"],
  },
];

/**
 * The shared door to the two exam portals. Board Scholars and Exam Aspirants are separate accounts, so
 * this page belongs to neither: it shows both, opening the ones this login already holds.
 */
export default async function Page() {
  const session = await openExamPortals();
  const held = new Set(session?.portals ?? []);
  return <ExamsShell portal={null} active="choose" email={session?.portals.length ? session.user.email : null}>
    <div className={styles.stack}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}><Compass size={13} aria-hidden="true" />Exam portals · Board, government, TET and IELTS-ready English</p>
        <h1>Two portals, <em>one for each kind of exam.</em></h1>
        <p>Choose the portal you are preparing in. Board Scholars and Exam Aspirants are separate accounts, each with its own dashboard, blog, free trial and membership. You can join both with the same email.</p>
      </header>
      <ul className={styles.cards}>
        {CARDS.map(card => { const info = PORTALS[card.portal]; const open = held.has(card.portal); return <li key={card.portal}>
          <div className={styles.card} data-portal-card={card.portal}>
            <Image src={card.image} alt="" width={48} height={48} unoptimized />
            <h2>{card.heading}</h2><p>{card.body}</p>
            <ul>{card.points.map(point => <li key={point}>{point}</li>)}</ul>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "auto" }}>
              {open ? <Link className={styles.primary} href={info.home}>Open {info.name} <ArrowRight size={15} aria-hidden="true" /></Link>
                : <><Link className={styles.primary} href={info.signUp}>Join {info.name}</Link><Link className={styles.ghost} href={info.signIn}>Sign in</Link></>}
              <Link className={styles.ghost} href={info.blog}>{info.blogName}</Link>
            </div>
          </div>
        </li>; })}
      </ul>
    </div>
  </ExamsShell>;
}
