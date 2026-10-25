import { getPublishedTechBuzzArticle, listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { getTopPlatformsComparison } from "@/lib/tech-buzz-data";
import { isTechnologyStory, toCard, toPreview } from "@/lib/tech-buzz-public";

/** Public and cacheable, so it returns cards and free previews only; members read bodies from ./[slug]/member. */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const article = await getPublishedTechBuzzArticle(slug);
      if (!article) {
        return Response.json({ error: "Article not found" }, { status: 404 });
      }
      return Response.json({ article: toPreview(article) });
    }

    let articles = (await listPublishedTechBuzzArticles()).filter(isTechnologyStory);
    const allArticles = [...articles];

    const category = searchParams.get("category");
    if (category && category !== "All") {
      articles = articles.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }

    const source = searchParams.get("source");
    if (source && source !== "all") {
      const s = source.toLowerCase();
      articles = articles.filter(a =>
        a.source.platformKey?.toLowerCase() === s ||
        a.source.name.toLowerCase().includes(s) ||
        a.source.domain.toLowerCase().includes(s)
      );
    }

    const search = searchParams.get("search");
    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle?.toLowerCase().includes(q) ||
        a.technology.toLowerCase().includes(q) ||
        a.author.name.toLowerCase().includes(q) ||
        a.source.name.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q)) ||
        a.summaryBullets.some(b => b.toLowerCase().includes(q))
      );
    }

    const sort = searchParams.get("sort") || "trending";
    if (sort === "likes" || sort === "upvotes") {
      articles.sort((a, b) => ((b.likes - b.dislikes) || b.upvotes) - ((a.likes - a.dislikes) || a.upvotes));
    } else if (sort === "claps") {
      articles.sort((a, b) => b.claps - a.claps);
    } else if (sort === "popular") {
      articles.sort((a, b) => (((b.likes - b.dislikes) * 2 + b.claps) - ((a.likes - a.dislikes) * 2 + a.claps)));
    } else if (sort === "rating") {
      articles.sort((a, b) => b.rating.average - a.rating.average);
    } else if (sort === "latest") {
      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else {
      // trending
      articles.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        const bScore = (b.likes - b.dislikes) + b.claps * 0.1;
        const aScore = (a.likes - a.dislikes) + a.claps * 0.1;
        return bScore - aScore;
      });
    }

    const categories = ["All", ...new Set(allArticles.map(a => a.category))];
    const technologies = ["All", ...new Set(allArticles.map(a => a.technology))];
    const platformsComparison = getTopPlatformsComparison();

    return Response.json(
      {
        articles,
        total: articles.length,
        categories,
        technologies,
        platformsComparison,
        stats: {
          totalArticles: allArticles.length,
          totalCategories: categories.length,
          totalTechnologies: technologies.length
        }
      },
      {
        headers: {
          "Cache-Control": "public, max-age=10, s-maxage=60, stale-while-revalidate=300"
        }
      }
    );
  } catch (error) {
    console.error("Tech Buzz GET error:", error);
    return Response.json({ error: "Failed to fetch tech buzz articles" }, { status: 500 });
  }
}
