import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { currentUser } from "@/lib/server/auth";
import { canWrite, getInkStory, listInkStories, writerOf } from "@/lib/server/tech-buzz-ink";
import { TechBuzzWrite } from "@/components/tech-buzz-write";
import styles from "@/components/tech-buzz-write.module.css";

// Per-reader (session, membership, own drafts): never prerendered.
export const instant = false;

export const metadata: Metadata = {
  title: "Write a story | Tech Buzz",
  description: "Write and publish your own engineering story on Tech Buzz.",
  robots: { index: false, follow: false },
};

/** Write (lib/server/tech-buzz-ink.ts): members only. `?id=` opens one of the writer's own stories. */
export default async function TechBuzzWritePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!(await canWrite(user))) {
    return <div className={styles.page}><div className={styles.gate}>
      <PenLine size={30} aria-hidden="true" />
      <h1>Write on Tech Buzz</h1>
      <p>Writing and publishing your own stories is part of MasterClass Buddy membership. Become a member to share what you build with every engineer reading Tech Buzz.</p>
      <Link href="/subscribe">Become a member</Link>
    </div></div>;
  }
  const { id } = await searchParams;
  const [stories, story] = await Promise.all([listInkStories(user.id), id ? getInkStory(user.id, id) : null]);
  if (id && !story) notFound();
  return <TechBuzzWrite key={story?.id ?? "new"} initial={story} stories={stories} authorName={writerOf(user).author.name} />;
}
