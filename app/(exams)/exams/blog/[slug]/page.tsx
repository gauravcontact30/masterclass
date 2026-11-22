import { notFound, permanentRedirect } from "next/navigation";
import { examPost } from "@/lib/exams-blog";
import { PORTALS } from "@/lib/portal";

/** A pre-split Exams blog post: it now lives in the blog of the portal it was written for (the first, for shared posts). */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const post = examPost((await params).slug);
  if (!post) notFound();
  permanentRedirect(`${PORTALS[post.portals[0]].blog}/${post.slug}`);
}
