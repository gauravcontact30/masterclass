"use client";
import { AccordionChevron } from "@/components/ui/accordion-chevron";

import { useState } from "react";
import { ExternalLink, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { OFFICIAL_DOCS, OFFICIAL_DOCS_CATEGORIES } from "@/lib/official-docs-data";
import { Button } from "./ui/button";
import { OfficialDocsLearning } from "./official-docs-learning";
import { OfficialDocsDirectory } from "./official-docs-directory";
import styles from "./official-docs-reader.module.css";

// Publisher response headers checked 2026-09-27. Keep a manual retry because
// policies can change. Cross-origin iframe load events cannot detect a denial.
const RESTRICTED_SITES = new Set([
  "nextjs", "tanstack", "prisma", "supabase", "javascript-info", "golang",
  "langchain", "langsmith", "docker", "aws", "cicd",
]);

const REFERENCE_CATEGORIES = OFFICIAL_DOCS_CATEGORIES.filter(category => category !== "All");
const TABS_PER_PAGE = 3;

export function OfficialDocsReader({ selectedId, onSelect }: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const doc = OFFICIAL_DOCS.find((item) => item.id === selectedId) ?? OFFICIAL_DOCS[0];
  const selectedCategoryIndex = Math.max(0, REFERENCE_CATEGORIES.findIndex(category => category === doc.category));
  const categoryPage = Math.floor(selectedCategoryIndex / TABS_PER_PAGE);
  const pageCount = Math.ceil(REFERENCE_CATEGORIES.length / TABS_PER_PAGE);
  const categories = REFERENCE_CATEGORIES.slice(categoryPage * TABS_PER_PAGE, (categoryPage + 1) * TABS_PER_PAGE);
  function selectCategory(index: number) {
    const firstDoc = OFFICIAL_DOCS.find(item => item.category === REFERENCE_CATEGORIES[index]);
    if (firstDoc) onSelect(firstDoc.id);
  }

  return (
    <section id="official-website-reader" className={styles.reader} aria-labelledby="website-reader-heading" tabIndex={-1}>
      <div className={styles.toolbar}>
        <div>
          <h2 id="website-reader-heading">Official website reader</h2>
          <p>Choose a technology to study its essentials and practice questions.</p>
        </div>
        <label className={styles.selector}>
          <span>Technology</span>
          <select value={doc.id} onChange={(event) => onSelect(event.target.value)}>
            {OFFICIAL_DOCS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
      </div>
      <div className={styles.referenceNavigation}>
        <div className={styles.categoryTabs} role="tablist" aria-label="Reference categories">
          {categories.map((category, index) => <button
            key={category} type="button" role="tab" id={`reference-tab-${categoryPage * TABS_PER_PAGE + index}`}
            aria-selected={category === doc.category} aria-controls="reference-technologies"
            tabIndex={category === doc.category ? 0 : -1}
            className={styles.categoryTab} data-tone={(categoryPage * TABS_PER_PAGE + index) % 6}
            onClick={() => selectCategory(categoryPage * TABS_PER_PAGE + index)}
            onKeyDown={event => {
              const start = categoryPage * TABS_PER_PAGE;
              const next = event.key === "ArrowRight" ? (index + 1) % categories.length : event.key === "ArrowLeft" ? (index + categories.length - 1) % categories.length : event.key === "Home" ? 0 : event.key === "End" ? categories.length - 1 : null;
              if (next === null) return;
              event.preventDefault();
              selectCategory(start + next);
              document.getElementById(`reference-tab-${start + next}`)?.focus();
            }}
          ><span>{category}</span><small>{OFFICIAL_DOCS.filter(item => item.category === category).length} technologies</small></button>)}
        </div>
        <nav className={styles.tabPagination} aria-label="Reference category pages">
          <Button type="button" variant="outline" size="icon-sm" aria-label="Previous reference categories" disabled={categoryPage === 0} onClick={() => selectCategory((categoryPage - 1) * TABS_PER_PAGE)}><ChevronLeft size={15} aria-hidden="true" /></Button>
          <span aria-live="polite">{categoryPage + 1} / {pageCount}</span>
          <Button type="button" variant="outline" size="icon-sm" aria-label="Next reference categories" disabled={categoryPage === pageCount - 1} onClick={() => selectCategory((categoryPage + 1) * TABS_PER_PAGE)}><ChevronRight size={15} aria-hidden="true" /></Button>
        </nav>
        <div id="reference-technologies" className={styles.technologyChoices} role="tabpanel" aria-labelledby={`reference-tab-${selectedCategoryIndex}`}>
          {OFFICIAL_DOCS.filter(item => item.category === doc.category).map(item => <button type="button" className={styles.technologyTab} key={item.id} aria-pressed={item.id === doc.id} onClick={() => onSelect(item.id)}>{item.title}</button>)}
        </div>
      </div>
      <div className={styles.referenceLayout}>
        <div className={styles.articleColumn}>
          <div className={styles.contextLine}><span>{doc.category}</span><span>Reference</span></div>
          <OfficialDocsLearning key={`learning-${doc.id}`} doc={doc} />
          {doc.id === "aws" && <OfficialDocsDirectory key="aws-services" docId="aws" />}
        </div>
      </div>
      <OptionalWebsite key={doc.id} title={doc.title} url={doc.officialUrl} restricted={RESTRICTED_SITES.has(doc.id)} />
    </section>
  );
}

function OptionalWebsite({ title, url, restricted }: { title: string; url: string; restricted: boolean }) {
  const [open, setOpen] = useState(false);
  return <section id="official-website-content" className={styles.websiteSection}>
    <button type="button" className={styles.websiteToggle} aria-expanded={open} aria-controls="publisher-frame" onClick={() => setOpen(value => !value)}>
      <span>{open ? "Hide official website" : "Browse official website"}</span><AccordionChevron />
    </button>
    <p className={styles.notice}>Need the full API reference? Open the publisher’s documentation here.</p>
    {open && <div id="publisher-frame"><WebsiteFrame title={title} url={url} restricted={restricted} /></div>}
  </section>;
}

function WebsiteFrame({ title, url, restricted }: { title: string; url: string; restricted: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [tryEmbedding, setTryEmbedding] = useState(false);

  return (
    <>
      <div className={styles.addressBar}>
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.address}>{url}</a>
        <Button type="button" variant="outline" size="sm" onClick={() => {
          setFailed(false);
          setTryEmbedding(true);
          setAttempt((value) => value + 1);
        }} aria-label={`Reload ${title} website`}>
          <RotateCcw size={14} aria-hidden="true" /> Reload
        </Button>
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.external}>
          Open in new tab <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
      <p className={styles.notice} id="official-website-help">
        Some publishers block viewing inside other websites. If the page is blank or refuses to connect, use Open in new tab.
        {(!restricted || tryEmbedding) && !failed && (
          <> <button type="button" className={styles.helpButton} onClick={() => setFailed(true)}>Website not loading?</button></>
        )}
      </p>
      {restricted && !tryEmbedding ? (
        <div className={styles.failure} role="status">
          <p>{title} restricts embedded viewing. Open its official website in a new tab to read the full documentation.</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setTryEmbedding(true)}>Try embedded view</Button>
        </div>
      ) : failed ? (
        <div className={styles.failure} role="status">
          <p>This website could not be displayed here.</p>
          <a href={url} target="_blank" rel="noopener noreferrer">Continue on {title}’s official website <ExternalLink size={14} aria-hidden="true" /></a>
        </div>
      ) : (
        <iframe
          key={attempt}
          src={url}
          title={`${title} official website`}
          className={styles.frame}
          aria-describedby="official-website-help"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}
