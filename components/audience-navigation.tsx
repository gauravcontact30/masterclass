"use client";
import Link from "@/components/site-link";
import { useIndiaAccess } from "./audience-provider";
export function AudienceNavigation() {
  const india = useIndiaAccess();
  return <nav aria-label="Learning paths" style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", fontSize: 12, padding: "12px 0" }}>
    <Link href="/learning">Learning Dashboard</Link><Link href="/tech-buzz">Tech Buzz</Link><Link href="/ielts-preparation">IELTS preparation</Link>
    {india && <><Link href="/board-exams" prefetch={false}>Class 10 &amp; 12 Board Exams</Link><Link href="/competitive-exams" prefetch={false}>Competitive Exams</Link><Link href="/tet-exam" prefetch={false}>TET Exams</Link></>}
  </nav>;
}
