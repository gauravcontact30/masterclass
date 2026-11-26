import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { StreamsDashboard } from "@/components/streams-dashboard";
import { findStep, isTech, STREAM_COURSES, STREAM_GROUPS, type StreamGroup } from "@/lib/streams";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "Streams" };

/** Streams (2026-11-26): Master Class Buddy playlists (lib/streams.ts). ?group= lists one category, ?tech= opens a playlist, &lesson= one of its steps; the
 *  older ?course= links still work. The dashboard is keyed by playlist so a sidebar link to another playlist starts fresh. */
export default async function StreamsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const authEnabled = authConfigured();
  const { tech, course, lesson, group } = await searchParams;
  const playlistGroup = STREAM_GROUPS.find(g => g.id === group)?.id as StreamGroup | undefined;
  const step = findStep(typeof lesson === "string" ? lesson : undefined);
  const playlistTech = step?.tech ?? (isTech(tech) ? tech : STREAM_COURSES.find(c => c.id === course)?.tech);
  const back = `/learning/streams${playlistTech ? `?tech=${playlistTech}${step ? `&lesson=${step.id}` : ""}` : playlistGroup ? `?group=${playlistGroup}` : ""}`;
  const user = (authEnabled || process.env.NODE_ENV === "production") ? await currentUser(back) : null;
  if (authEnabled && !user) redirect(signInFor(back));
  return <Workspace initialCategory="streams" authEnabled={authEnabled}
    configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} initialSuperAdmin={isSuperAdminUser(user)}
    notesContent={<StreamsDashboard key={playlistTech ?? playlistGroup ?? "all"} initialTech={playlistTech} initialLesson={step?.id} initialGroup={playlistGroup} />} />;
}
