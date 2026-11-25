import { ExamContent } from "./exam-locale";
import type { ReactNode } from "react";
import { ExamsFrame, type ExamsTab } from "./exams-frame";
import type { ScopedPortal } from "@/lib/portal";

/*
 * The frame of a portal with its own account: Board Scholars (/exams/board-exams), Exam Aspirants
 * (/exams/competitive-exams) or IELTS Achievers (/ielts/dashboard, 2026-11-24).
 * Since 2026-11-22 it has the Tech Learning Dashboard's look (components/exams-frame.tsx): dark sidebar, top bar and
 * workspace. Each portal keeps its own navigation, blog and plans, separate from the other and from Tech Pro.
 * `email` is the signed-in account; without it (the public blogs) the top bar offers that portal's sign-in and sign-up.
 * `portal` null is the shared /exams chooser, which belongs to neither.
 */
export type { ExamsTab };

export function ExamsShell({ portal, active, email, children }: { portal: ScopedPortal | null; active: ExamsTab; email?: string | null; children: ReactNode }) {
  return <ExamContent><ExamsFrame portal={portal} active={active} email={email}>{children}</ExamsFrame></ExamContent>;
}
