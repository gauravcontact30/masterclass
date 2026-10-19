# SEO and performance deployment

The public homepage is pre-rendered. The proxy redirects authenticated homepage visitors and skips remote auth for anonymous homepage requests. Reader and notes dialogs load only when opened; sample thumbnails use responsive image optimization. Reviews start paused to avoid automatic layout shifts while reading.

## Production setup

1. Set `APP_URL=https://www.masterclassbuddy.com` on production. SEO metadata now defaults to this domain if the value is absent, but authentication still needs the explicit deployment setting. It also supplies existing OAuth callback URLs, so update provider allowlists if the domain changes.
2. Set `SEO_INDEXABLE=true` only for the production deployment. Keep it false on previews and staging. Rebuild after changing either setting: metadata, robots, and sitemap are generated at build time.
3. Optionally set `GOOGLE_SITE_VERIFICATION` to your Search Console HTML verification token before building. Verify the property and submit `/sitemap.xml` in Search Console after deployment.
4. Redirect alternate domains to the canonical origin at the hosting layer. Confirm HTTPS and that the production homepage, `/robots.txt`, `/sitemap.xml`, and `/opengraph-image` are publicly accessible.

The sitemap includes public company pages and the learning library: interviews, comparisons, workflow blueprints, handbooks, API reference entries with available content, and vocabulary groups. Private dashboards and account pages remain excluded. Robots exclusion is not access control; existing authentication still protects account data. English is the initial HTML language, with Hindi available interactively. No hreflang alternatives are advertised because there are no separate localized URLs.

Metadata includes a canonical homepage URL, descriptions, social cards, and factual WebSite JSON-LD. No ratings, reviews, or course credentials are fabricated in structured data.

## Loading improvements

- Next.js Cache Components and `use cache` retain the prerendered public shell and hourly landing content cache. Personalized dashboard data is not placed in the public cache.
- Public documentation previews use the committed snapshot by default, avoiding external documentation fetches during cold page generation. Refresh it with `npm run docs:tech` before deployment. `TECH_DOCS_LIVE=true` explicitly restores live daily refresh with its existing timeout and snapshot fallback.
- The hero requests one image initially instead of rendering five image requests. The second is warmed after the first loads; later slides load as visitors navigate. Responsive AVIF/WebP optimization uses quality 75 and reserves the existing hero dimensions.
- Hero and learning carousels stop autoplay when offscreen or in a hidden tab. Reduced-motion preferences are respected.
- Expanded dashboard lessons use `next/dynamic`, keeping their module and lesson data out of the homepage's eager imports while retaining server rendering when expanded.
- Super Admin section modules load through `next/dynamic` when selected. Notepad mounts only on its first visit, then stays mounted while hidden to preserve unsaved edits and autosave behavior.
- Interview and comparison question banks wait until their carousel approaches the viewport (600px margin), then load only nearby slides. Blueprint details use the same gate. Static headings, descriptions and previews remain server-rendered.
- Carousel scroll measurements are batched into animation frames, with ResizeObserver keeping pagination accurate when containers resize. Student reviews pause offscreen and share a stable grid height across quotes.
- GA4 Web Vitals use a stable reporting callback and buffer early measurements until the deferred analytics initializer is ready. Analytics remains opt-in with `NEXT_PUBLIC_GA_MEASUREMENT_ID`; avoid installing the same GA4 property through GTM as well.

Titles and descriptions use the actual site topics: CBSE/NCERT study notes, exam preparation, coding tutorials, interview questions, system design, AI workflows, and English vocabulary with Hindi meanings. Google does not use the keywords meta tag for ranking; useful visible learning content, descriptive titles, internal links, and crawlability matter more. See https://developers.google.com/search/docs/fundamentals/seo-starter-guide.

## Removed retired UI

The generic `carousel`, old `landing-discovery` hero/marquee, and `sample-lessons` showcase had no application or script importers. Their three components, two dedicated stylesheets, three component-only tests, and unused global carousel rules were removed. The active landing slider, learning sections, and their regression tests remain. Generated learning content, dynamically named image assets, migrations, and historical documentation are retained because they still serve runtime or maintenance purposes.

## Measurement and ongoing search work

The October 2026 local mobile audit of `/` (including the first-visit welcome dialog) reduced observed DOM elements from 6,144 to 3,935 and transferred resources from 2.26 MB to 2.05 MB after viewport gating. CLS was zero in both runs. The baseline timed out and the follow-up reported a slow-CPU warning, so these runs do not establish a reliable timing or performance-score improvement. The welcome dialog image was the baseline LCP element; its delayed appearance remains a performance cost. Repeat on a stable machine and the deployed site before using timing results as a release benchmark. Local JSON reports are in ignored `artifacts/cwv-*.json`.

Run PageSpeed Insights on the deployed homepage for mobile and desktop, and use Search Console's Core Web Vitals report for real-user results. Target the 75th percentile: LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, CLS ≤ 0.1. Test cold loads, language switching, navigation, and sample-reader interactions. Local build success does not establish field performance or a Lighthouse score.

Search growth also requires useful, original, publicly accessible learning content, relevant search intent, and reputable links. Add substantive public lessons before adding their URLs to the sitemap; private generated documents should remain private. Google does not guarantee first-place ranking from technical SEO or good Core Web Vitals: https://developers.google.com/search/docs/appearance/page-experience
