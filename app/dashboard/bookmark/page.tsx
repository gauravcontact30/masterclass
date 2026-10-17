import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { BookmarkPage } from "@/components/bookmark-page";
import { NOTES_TECHNOLOGIES } from "@/lib/server/notes-study-catalog";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";

export const metadata = { title: "Bookmark" };
export default async function Page() {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  return <Workspace initialCategory="bookmark" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} notesContent={<BookmarkPage technologies={NOTES_TECHNOLOGIES.map(({ id, title }) => ({ id, title }))} />} />;
}
