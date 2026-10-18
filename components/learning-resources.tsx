"use client";

import learningCard from "./learning-card.module.css";
import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Images, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Pager } from "./pager";
import { learningResourcesFor, type LearningResource } from "@/lib/media/learning-resources";
import { learningLinksFor } from "@/lib/media/learning-links";
import styles from "./learning-resources.module.css";

export function LearningResources({ technology }: { technology: string }) {
  return <LearningResourceShelf key={technology} technology={technology} />;
}

function LearningResourceShelf({ technology }: { technology: string }) {
  const resources = learningResourcesFor(technology);
  const links = learningLinksFor(technology);
  const [selected, setSelected] = useState<LearningResource | null>(null);
  const [page, setPage] = useState(0);
  const total = resources.length + links.length;
  const pages = Math.ceil(total / 2);
  const start = page * 2;
  const end = start + 2;
  const visibleLinks = links.slice(start, end);
  const visibleResources = resources.slice(Math.max(0, start - links.length), Math.max(0, end - links.length));
  if (!resources.length && !links.length) return null;
  return <section className={styles.resources} aria-label={`Visual resources for ${technology}`}>
    <header className={styles.header}><h3><Images size={16} aria-hidden="true" />Visual learning shelf</h3><span>{resources.length + links.length} resources</span></header>
    <div className={styles.grid}>{visibleLinks.map((resource, index) => <article key={`${resource.page}-${start + index}`} className={`${styles.card} ${learningCard.card}`}>
      <a className={`${styles.preview} ${styles.brandPreview}`} href={resource.page} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${resource.title} (opens in a new tab)`}>
        <Image src={resource.src} alt="" width={240} height={160} sizes="112px" />
        <span><ExternalLink size={12} aria-hidden="true" />Visit</span>
      </a>
      <div className={styles.caption}><small>{resource.kind}</small><h4>{resource.title}</h4>
        <a href={resource.page} target="_blank" rel="noopener noreferrer">{resource.credit}<ExternalLink size={12} aria-hidden="true" /></a>
      </div>
    </article>)}{visibleResources.map(resource => <article key={resource.page} className={`${styles.card} ${learningCard.card}`}>
      <a className={styles.preview} href={resource.page} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${resource.title} (opens in a new tab)`}>
        <Image src={resource.src} alt={`Screenshot of ${resource.title}`} width={1280} height={640} sizes="120px" />
        <span><ExternalLink size={12} aria-hidden="true" />Visit</span>
      </a>
      <div className={styles.caption}><small>{resource.kind}</small><h4>{resource.title}</h4>
        <a href={resource.page} target="_blank" rel="noopener noreferrer">{resource.credit}<ExternalLink size={12} aria-hidden="true" /></a>
        <button type="button" className={styles.enlarge} onClick={() => setSelected(resource)} aria-label={`Enlarge screenshot: ${resource.title}`}><Maximize2 size={12} aria-hidden="true" />Preview screenshot</button>
      </div>
    </article>)}</div>
    {pages > 1 && <Pager page={page} pages={pages} onPage={setPage} label={`Visual learning shelf for ${technology} pages`} />}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className={styles.dialog}>{selected && <>
        <DialogTitle>{selected.title}</DialogTitle>
        <DialogDescription>{selected.caption}</DialogDescription>
        <time className={styles.date} dateTime={selected.checkedAt}>Captured {selected.checkedAt}</time>
        <Image src={selected.src} alt={`Screenshot of ${selected.title}`} width={1280} height={640} unoptimized className={styles.large} />
        <a href={selected.page} target="_blank" rel="noopener noreferrer">Open {selected.credit}<ExternalLink size={13} aria-hidden="true" /></a>
      </>}</DialogContent>
    </Dialog>
  </section>;
}
