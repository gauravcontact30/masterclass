import { NextResponse } from "next/server";
import { TECH_BUZZ_ARTICLES, type TechBuzzArticle } from "@/lib/tech-buzz-data";
import { bumpTechBuzzCounter, type TechBuzzCounter } from "@/lib/server/tech-buzz-storage";
import { rateLimit } from "@/lib/server/rate-limit";
import { clientIp, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";

// Newsletter subscribers memory list. Anyone can post here, so it is capped: an unbounded Set was a memory leak.
const newsletterSubscribers: Set<string> = new Set();
const MAX_SUBSCRIBERS = 5000;
// Comments live in shared module memory and are shown to every reader served by this instance: cap them per story.
const MAX_COMMENTS = 50;
const limited = (key: string, max: number) => rateLimit(key, max, 60).then(() => false, error => (error as { status?: number }).status === 429);

// In-memory state mutation helper
export function updateArticleState(
  articleId: string,
  mutate: (article: TechBuzzArticle) => void
): TechBuzzArticle | null {
  const article = TECH_BUZZ_ARTICLES.find(a => a.id === articleId || a.slug === articleId);
  if (!article) return null;
  mutate(article);
  return article;
}

/**
 * POST /api/tech-buzz/action
 * Handles user interactions across platforms:
 * - daily.dev: upvotes
 * - dev.to: reactions (heart, unicorn, rocket, mindblown), comments
 * - medium: ratings (claps: /api/tech-buzz/[slug]/claps)
 * - substack: newsletter subscriptions
 */
export async function POST(request: Request) {
  try {
    // Same-origin only (a cross-site form could otherwise post reactions and comments as the visitor), and a capped body.
    sameOrigin(request);
    const body = await jsonBody(request, 4000).catch(error => { if (error instanceof HttpError && error.status === 413) throw error; return {}; });
    const { action, articleId } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    // Every action below writes shared state; likes and dislikes keep their own budget further down.
    if (!["like", "upvote", "dislike"].includes(action) && await limited(`tech-buzz:action:${clientIp(request)}`, 20)) {
      return NextResponse.json({ error: "Too many requests, slow down a little." }, { status: 429 });
    }

    // 1. Newsletter subscription action (Substack / Ghost style)
    if (action === "subscribe_newsletter") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
      }
      if (newsletterSubscribers.size < MAX_SUBSCRIBERS) newsletterSubscribers.add(email);
      return NextResponse.json({
        success: true,
        message: "Welcome to MasterClass Tech Dispatch! Check your inbox for this week's deep-dive.",
        totalSubscribers: 34200 + newsletterSubscribers.size,
      });
    }

    if (!articleId) {
      return NextResponse.json({ error: "Missing articleId" }, { status: 400 });
    }

    // Claps are per reader (signed in, at most 50 a story) and live at /api/tech-buzz/[slug]/claps since migration 0042.
    if (action === "clap") return NextResponse.json({ error: "Claps moved to /api/tech-buzz/[slug]/claps" }, { status: 410 });

    // Likes and dislikes on a stored story (the daily edition, admin posts) persist in the database; built-in stories
    // have no row and fall through to the in-memory handlers below.
    if (action === "like" || action === "upvote" || action === "dislike") {
      const field: TechBuzzCounter = action === "dislike" ? "dislikes" : "likes";
      const delta = body.delta === -1 ? -1 : 1;
      if (await limited(`tech-buzz:${field}:${clientIp(request)}`, 60)) return NextResponse.json({ error: "Too many reactions, slow down a little." }, { status: 429 });
      const stored = await bumpTechBuzzCounter(String(articleId), field, delta).catch(() => null);
      if (stored) return NextResponse.json({ success: true, ...stored, upvotes: stored.likes, netLikes: stored.likes - stored.dislikes });
    }

    // 2. Like (Upvote) action
    if (action === "like" || action === "upvote") {
      const delta = body.delta === -1 ? -1 : 1;
      const updated = updateArticleState(articleId, (article: TechBuzzArticle) => {
        article.likes = Math.max(0, (article.likes || article.upvotes || 0) + delta);
        article.upvotes = article.likes;
      });
      if (!updated) return NextResponse.json({ error: "Article not found" }, { status: 404 });
      return NextResponse.json({
        success: true,
        likes: updated.likes,
        dislikes: updated.dislikes || 0,
        netLikes: updated.likes - (updated.dislikes || 0),
        upvotes: updated.upvotes,
        rankingScore: updated.rankingScore,
      });
    }

    // 2b. Dislike action
    if (action === "dislike") {
      const delta = body.delta === -1 ? -1 : 1;
      const updated = updateArticleState(articleId, (article: TechBuzzArticle) => {
        article.dislikes = Math.max(0, (article.dislikes || 0) + delta);
      });
      if (!updated) return NextResponse.json({ error: "Article not found" }, { status: 404 });
      return NextResponse.json({
        success: true,
        likes: updated.likes || updated.upvotes || 0,
        dislikes: updated.dislikes,
        netLikes: (updated.likes || updated.upvotes || 0) - updated.dislikes,
        upvotes: updated.upvotes,
        rankingScore: updated.rankingScore,
      });
    }

    // 3. Multi-reactions action (dev.to style)
    if (action === "react") {
      const reactionType = body.reaction as "heart" | "unicorn" | "rocket" | "mindblown";
      if (!["heart", "unicorn", "rocket", "mindblown"].includes(reactionType)) {
        return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
      }
      const updated = updateArticleState(articleId, (article: TechBuzzArticle) => {
        if (!article.reactions) {
          article.reactions = { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 };
        }
        article.reactions[reactionType] = (article.reactions[reactionType] || 0) + 1;
      });
      if (!updated) return NextResponse.json({ error: "Article not found" }, { status: 404 });
      return NextResponse.json({
        success: true,
        reactions: updated.reactions,
      });
    }

    // 5. Star Rating action
    if (action === "rate") {
      const rating = typeof body.rating === "number" ? Math.min(5, Math.max(1, Math.round(body.rating))) : 5;
      const updated = updateArticleState(articleId, (article: TechBuzzArticle) => {
        const currentCount = article.rating.count;
        const currentAvg = article.rating.average;
        const newCount = currentCount + 1;
        const newAvg = Number(((currentAvg * currentCount + rating) / newCount).toFixed(2));
        const breakdownKey = rating as 1 | 2 | 3 | 4 | 5;
        article.rating = {
          average: newAvg,
          count: newCount,
          breakdown: {
            ...article.rating.breakdown,
            [breakdownKey]: (article.rating.breakdown[breakdownKey] || 0) + 1,
          },
        };
      });
      if (!updated) return NextResponse.json({ error: "Article not found" }, { status: 404 });
      return NextResponse.json({
        success: true,
        rating: updated.rating,
      });
    }

    // 6. Community Comment action (dev.to / indiehackers style)
    if (action === "comment") {
      const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";
      if (!text) {
        return NextResponse.json({ error: "Comment text cannot be empty" }, { status: 400 });
      }
      // Anonymous comments carry no identity, so the author name is fixed: a caller-chosen one let anyone post as anyone.
      const authorName = "Community Developer";
      const newComment = {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        author: {
          name: authorName,
          role: "Developer",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
          handle: `@${authorName.toLowerCase().replace(/\s+/g, "_")}`,
          badge: "Contributor",
        },
        text,
        createdAt: "Just now",
        likes: 1,
      };
      const updated = updateArticleState(articleId, (article: TechBuzzArticle) => {
        if (!article.comments) article.comments = [];
        article.comments.unshift(newComment);
        article.comments.length = Math.min(article.comments.length, MAX_COMMENTS);
        article.commentsCount = article.comments.length;
      });
      if (!updated) return NextResponse.json({ error: "Article not found" }, { status: 404 });
      return NextResponse.json({
        success: true,
        comment: newComment,
        commentsCount: updated.commentsCount,
      });
    }

    return NextResponse.json({ error: "Unrecognized action" }, { status: 400 });
  } catch (error) {
    if (error instanceof HttpError) return NextResponse.json({ error: error.code }, { status: error.status });
    // Never echo internal error messages to an anonymous caller.
    console.error(JSON.stringify({ event: "tech_buzz_action_failed", message: error instanceof Error ? error.message.slice(0, 200) : "unknown" }));
    return NextResponse.json({ error: "Internal action error" }, { status: 500 });
  }
}
