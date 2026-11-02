import Image from "@/components/responsive-image";
import Link from "next/link";
import { COMPARISONS } from "@/lib/comparisons";
import { apiPackages, handbookName, handbookSlug, handbooks, interviewTechs, vocabularyGroups, workflows } from "@/lib/public-learning";
import { listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { PUBLIC_PAGES, pageMetadata } from "@/lib/seo";
import { technologyLogo } from "@/lib/technology-logo";
import { PageIntro } from "../page-intro";
import styles from "./site-map.module.css";

export const metadata = pageMetadata("/site-map");

const LATEST_STORIES = 12;
/** Brand marks white or nearly so, which need a dark plate on these white cards. */
const PALE_LOGOS = /\/(betterauth|tanstack|drizzle)\.svg$/;
/** Interview sets whose API reference is filed under another id. */
const API_IDS: Record<string, string> = { nodejs: "node", "system-design": "systemdesign", "js-puzzles": "jspuzzles", "redux-toolkit": "redux", git: "git" };
/** "React 19+" and "JavaScript (ECMAScript 2026)" name the same technology as "React" and "JavaScript". */
const baseName = (name: string) => name.split(" (")[0].split(/ (?=\d)/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");

type Technology = { key: string; name: string; logo: string | null; interview?: string; handbook?: string; api?: string };

/** One entry per technology across the interview sets, API reference and handbooks, with whichever of the three it has. */
function technologies(): Technology[] {
  const packages = apiPackages();
  const guides = handbooks();
  const handbookFor = (name: string) => {
    const found = guides.find(guide => baseName(handbookName(guide)) === baseName(name));
    return found && `/learn/${handbookSlug(found)}`;
  };
  const sets = interviewTechs().map(tech => {
    const pkg = packages.find(item => item.id === (API_IDS[tech.id] ?? tech.id));
    const name = pkg?.name ?? tech.title;
    return { key: tech.id, name: tech.id === "redux" ? tech.title : name, logo: technologyLogo(tech.id, name), interview: `/interview-questions/${tech.id}`, handbook: handbookFor(tech.title), api: pkg && tech.id !== "redux" ? `/api-reference/${pkg.id}` : undefined };
  });
  const listed = new Set(sets.map(item => item.api));
  const others = packages.filter(pkg => !listed.has(`/api-reference/${pkg.id}`)).map(pkg => ({ key: pkg.id, name: pkg.name, logo: technologyLogo(pkg.id, pkg.name), handbook: handbookFor(pkg.name), api: `/api-reference/${pkg.id}` }));
  return [...sets, ...others].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function Logo({ src, name, size = 32 }: Readonly<{ src: string | null; name: string; size?: number }>) {
  if (!src) return <span className={styles.initial} aria-hidden="true">{name[0]}</span>;
  return <Image src={src} alt="" width={size} height={size} unoptimized={src.endsWith(".svg")} className={PALE_LOGOS.test(src) ? `${styles.logo} ${styles.plate}` : styles.logo} />;
}

function LinkList({ links }: Readonly<{ links: { href: string; label: string }[] }>) {
  return <ul className={styles.links}>{links.map(link => <li key={link.href}><Link href={link.href} prefetch={false}>{link.label}</Link></li>)}</ul>;
}

/**
 * The readable site map: every technology with its real logo and name, linked to the pages it has, then the rest of the
 * public library. Read from the same catalogues as app/sitemap.ts. Blueprints marked dashboardOnly stay out, as in /llms.txt.
 */
export default async function SiteMapPage() {
  const blueprints = workflows().filter(item => !item.dashboardOnly);
  const groups = [...new Set(blueprints.map(item => item.group))];
  const stories = (await listPublishedTechBuzzArticles()).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, LATEST_STORIES);

  return <>
    <PageIntro path="/site-map" eyebrow="Find anything" />

    <section className={styles.section} aria-labelledby="technologies">
      <h2 id="technologies">Technologies</h2>
      <ul className={styles.technologies}>{technologies().map(tech => <li key={tech.key} className={styles.technology}>
        <Logo src={tech.logo} name={tech.name} />
        <div>
          <b>{tech.name}</b>
          <span className={styles.pages}>
            {tech.interview && <Link href={tech.interview} prefetch={false} aria-label={`${tech.name} interview questions`}>Interview</Link>}
            {tech.handbook && <Link href={tech.handbook} prefetch={false} aria-label={`${tech.name} handbook`}>Handbook</Link>}
            {tech.api && <Link href={tech.api} prefetch={false} aria-label={`${tech.name} API reference`}>API</Link>}
          </span>
        </div>
      </li>)}</ul>
    </section>

    <section className={styles.section} aria-labelledby="handbooks">
      <h2 id="handbooks">Technology handbooks</h2>
      <ul className={styles.handbooks}>{handbooks().map(item => {
        const name = handbookName(item);
        return <li key={item.title}><Link href={`/learn/${handbookSlug(item)}`} prefetch={false}><Logo src={technologyLogo("", name)} name={name} size={20} />{name}</Link></li>;
      })}</ul>
    </section>

    <section className={styles.section} aria-labelledby="blueprints">
      <h2 id="blueprints">System design and AI agent blueprints</h2>
      {groups.map(group => <div key={group} className={styles.group}>
        <h3>{group}</h3>
        <LinkList links={blueprints.filter(item => item.group === group).map(item => ({ href: `/workflows/${item.id}`, label: item.title }))} />
      </div>)}
    </section>

    <section className={styles.section} aria-labelledby="comparisons">
      <h2 id="comparisons">Technology comparisons</h2>
      <LinkList links={COMPARISONS.map(item => ({ href: `/compare/${item.id}`, label: item.question }))} />
    </section>

    <section className={styles.section} aria-labelledby="stories">
      <h2 id="stories">Latest Tech Buzz stories</h2>
      <LinkList links={[...stories.map(story => ({ href: `/tech-buzz/${story.slug}`, label: story.title })), { href: "/tech-buzz", label: "All Tech Buzz stories" }]} />
    </section>

    <section className={styles.section} aria-labelledby="vocabulary">
      <h2 id="vocabulary">English vocabulary</h2>
      <LinkList links={vocabularyGroups().map(group => ({ href: `/vocabulary/${group.slug}`, label: group.name }))} />
    </section>

    <section className={styles.section} aria-labelledby="main-pages">
      <h2 id="main-pages">Main pages</h2>
      <LinkList links={PUBLIC_PAGES.filter(page => page.path !== "/site-map").map(page => ({ href: page.path, label: page.label }))} />
    </section>
  </>;
}
