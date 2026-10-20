import { notFound, redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { CoffeeArticle } from "@/components/coffee-article";
import { ContentProvider } from "@/components/content-editing";
import { BLOG_POSTS, blogPost } from "@/lib/coffee-and-code";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { contentOverrides } from "@/lib/server/content-overrides";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const post = blogPost((await params).slug);
  return post ? { title: `${post.title} · Coffee & Code`, description: post.dek } : { title: "Coffee & Code" };
}

export default async function CoffeeArticlePage({ params }: { params: Params }) {
  const post = blogPost((await params).slug);
  if (!post) notFound();
  const authEnabled = authConfigured();
  const user = (authEnabled || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authEnabled && !user) redirect("/sign-in");
  const overrides = await contentOverrides();
  // Two more articles: same topic first, then the newest others.
  const related = [...BLOG_POSTS.filter(p => p.slug !== post.slug && p.topic === post.topic), ...BLOG_POSTS.filter(p => p.slug !== post.slug && p.topic !== post.topic)]
    .filter(p => !overrides[`blog:${p.slug}`]?.deleted).slice(0, 2);
  return <Workspace initialCategory="coffee-and-code" authEnabled={authEnabled}
    configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<ContentProvider overrides={overrides} canEdit={isSuperAdminUser(user)}><CoffeeArticle post={post} related={related} /></ContentProvider>} />;
}
