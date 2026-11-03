import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { ArrowUpRight, Compass, Lock, Sparkles, TriangleAlert } from "lucide-react";
import { BrandMark } from "./topic-media";
import { API_TYPES, type ApiEntry, type ApiPackage } from "@/lib/api-docs";
import { CHECKED_AT, type FieldGuide } from "@/lib/api-field-guides";
import { readableDate } from "@/lib/seo";
import type { ApiMapRow, ApiPreview } from "@/lib/server/api-previews";
import { ApiGuideMap } from "./api-guide-map";
import { ApiMemberNotice } from "./api-member-notice";
import { DashboardPageHeader } from "./dashboard-page-header";
import styles from "./api-tech-guide.module.css";

const entryHref = (pkg: ApiPackage, name: string) => `/learning/api-docs/${encodeURIComponent(pkg.id)}/${encodeURIComponent(name)}`;
const kindOf = (kind: string) => API_TYPES.find(type => type.k === kind);

/** A technology's page: the idea, the mental model, the five APIs to learn first, then the rest of its APIs. Technologies with no field guide yet start from the catalogue's description. */
export function ApiTechGuide({ pkg, guide, free, rows, member }: Readonly<{ pkg: ApiPackage; guide?: FieldGuide; free: ApiPreview[]; rows: ApiMapRow[]; member: boolean }>) {
  const about = pkg.description.charAt(0).toUpperCase() + pkg.description.slice(1);
  return <div className={styles.page}>
    <DashboardPageHeader eyebrow={guide ? "API Docs / Field guide" : "API Docs / Technology"} title={pkg.name} description={guide?.tagline ?? about}
      icon={guide ? <Image src={guide.logo} alt="" width={16} height={16} unoptimized={guide.logo.endsWith(".svg")} /> : <BrandMark label={pkg.name} size={16} />} />
    <section className={styles.hero} aria-label={`${pkg.name} at a glance`}>
      <p className={styles.idea}>{guide?.idea ?? about}</p>
      <dl className={styles.heroFacts}>
        {guide?.version && <div><dt>Current version</dt><dd>{guide.version}</dd></div>}
        <div><dt>APIs covered</dt><dd>{pkg.entries.length}</dd></div>
        {guide && <div className={styles.install}><dt>Install</dt><dd><code>{guide.install}</code></dd></div>}
      </dl>
    </section>

    {!member && <ApiMemberNotice />}

    {guide && <section className={styles.block} aria-labelledby="guide-model">
      <h2 id="guide-model"><Compass size={19} aria-hidden="true" />How to think about it</h2>
      <ol className={styles.model}>{guide.mentalModel.map((point, index) => <li key={point}><span aria-hidden="true">{index + 1}</span><p>{point}</p></li>)}</ol>
    </section>}

    {free.length > 0 && <section className={styles.block} aria-labelledby="guide-start">
      <h2 id="guide-start"><Sparkles size={19} aria-hidden="true" />Start with these {free.length}</h2>
      <ul className={styles.essentials}>{free.map(item => {
        const type = kindOf(item.kind);
        return <li key={item.name}>
          <Link href={entryHref(pkg, item.name)}>
            <span className={styles.essentialHead}><code>{item.name}</code><small style={{ color: type?.c }}>{type?.label}</small></span>
            <span className={styles.essentialText}>{item.summary}</span>
            {item.signature && <code className={styles.signature}>{item.signature}</code>}
            {member && <span className={styles.open}>Open full page<ArrowUpRight size={14} aria-hidden="true" /></span>}
          </Link>
        </li>;
      })}</ul>
    </section>}

    {guide && <section className={styles.block} aria-labelledby="guide-pitfalls">
      <h2 id="guide-pitfalls"><TriangleAlert size={19} aria-hidden="true" />Watch out for</h2>
      <ul className={styles.pitfalls}>{guide.pitfalls.map(point => <li key={point}>{point}</li>)}</ul>
    </section>}

    <section className={styles.block} aria-labelledby="guide-map">
      <h2 id="guide-map">{member ? <>All {pkg.name} APIs</> : <><Lock size={18} aria-hidden="true" />{rows.length} more {pkg.name} APIs for subscribers</>}</h2>
      <ApiGuideMap packageId={pkg.id} rows={rows} member={member} />
    </section>

    <p className={styles.source}>{guide ? `${guide.source}. Checked ${readableDate(CHECKED_AT)}.` : "Written from the official documentation."} Behaviour can change between versions, so confirm against the version you have installed.</p>
  </div>;
}

/** What a non-member sees on an API's own page. Its stored content is never read for them. */
export function ApiEntryLocked({ pkg, entry, preview }: Readonly<{ pkg: ApiPackage; entry: ApiEntry; preview?: ApiPreview }>) {
  const type = kindOf(entry.kind);
  return <div className={styles.page}>
    <DashboardPageHeader eyebrow={`API Docs / ${pkg.name}${type ? ` / ${type.label}` : ""}`} title={<code className={styles.lockedTitle}>{entry.name}</code>}
      description={preview?.summary ?? `The full page for ${entry.name} is open to subscribers.`} />
    {preview?.signature && <pre className={styles.lockedSignature}><code>{preview.signature}</code></pre>}
    <ApiMemberNotice />
    <p className={styles.source}><Link href={`/learning/api-docs/${encodeURIComponent(pkg.id)}`}>See the APIs you can read for {pkg.name}</Link></p>
  </div>;
}
