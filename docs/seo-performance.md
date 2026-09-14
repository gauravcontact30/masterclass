# SEO and performance deployment

The public homepage is pre-rendered. The proxy redirects authenticated homepage visitors and skips remote auth for anonymous homepage requests. Reader and notes dialogs load only when opened; sample thumbnails use responsive image optimization. Reviews start paused to avoid automatic layout shifts while reading.

## Production setup

1. Set `APP_URL` to the single public HTTPS origin, without a path (for example, `https://your-domain.com`). It also supplies existing OAuth callback URLs, so update provider allowlists if the domain changes.
2. Set `SEO_INDEXABLE=true` only for the production deployment. Keep it false on previews and staging. Rebuild after changing either setting: metadata, robots, and sitemap are generated at build time.
3. Optionally set `GOOGLE_SITE_VERIFICATION` to your Search Console HTML verification token before building. Verify the property and submit `/sitemap.xml` in Search Console after deployment.
4. Redirect alternate domains to the canonical origin at the hosting layer. Confirm HTTPS and that the production homepage, `/robots.txt`, `/sitemap.xml`, and `/opengraph-image` are publicly accessible.

The sitemap includes the public homepage only. Account pages, dashboard, development previews, APIs, playground, and sample assets have noindex directives. Robots exclusion is not access control; existing authentication still protects account data. English is the initial HTML language, with Hindi available interactively. No hreflang alternatives are advertised because there are no separate localized URLs.

Metadata includes a canonical homepage URL, descriptions, social cards, and factual WebSite JSON-LD. No ratings, reviews, or course credentials are fabricated in structured data.

## Measurement and ongoing search work

Run PageSpeed Insights on the deployed homepage for mobile and desktop, and use Search Console's Core Web Vitals report for real-user results. Target the 75th percentile: LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, CLS ≤ 0.1. Test cold loads, language switching, navigation, and sample-reader interactions. Local build success does not establish field performance or a Lighthouse score.

Search growth also requires useful, original, publicly accessible learning content, relevant search intent, and reputable links. Add substantive public lessons before adding their URLs to the sitemap; private generated documents should remain private. Google does not guarantee first-place ranking from technical SEO or good Core Web Vitals: https://developers.google.com/search/docs/appearance/page-experience
