"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Languages, Layers, ListFilter, Search, Volume2, X } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Pager } from "./pager";
import { VocabularyWordIcon } from "./vocabulary-word-icon";
import styles from "./catalog-browser.module.css";
import type { VocabularyWord } from "@/lib/pro-learn/aws-highlights";

/** A row in a browsable catalogue: enough to draw a card and ask a question. */
export type CatalogItem = {
  name: string;
  category: string;
  summary: string;
  vocabulary?: VocabularyWord;
};
export type CatalogCategory = { name: string; count: number };

/** Two rows of three: enough of the catalogue to scan without burying the page. */
const PER_PAGE = 6;
/** Category tabs shown at once. The rest are a page turn away, not a side-scroll. */
const TABS_PER_PAGE = 5;
/** The tab that narrows nothing. Not a category name, so it cannot collide with one. */
const ALL = "*";

/**
 * The headword as a card shows it, with a capital first letter.
 *
 * Applied when drawing rather than stored: the vocabulary data is keyed on the
 * lower-case word — the respelling table, the Hindi glosses and the icon
 * resolver all look words up by it — so capitalising the data would break those
 * lookups and the search, which matches on the same lower-case text.
 */
const asHeadword = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

function pronounce(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function PronounceButton({ word, className }: { word: string; className?: string }) {
  return <button type="button" className={className ?? styles.audio} aria-label={`Pronounce ${word}`} title={`Pronounce ${word}`}
    onClick={event => { event.stopPropagation(); pronounce(word); }}>
    <Volume2 size={15} aria-hidden="true" />
  </button>;
}

/**
 * The whole of one word, opened from its card.
 *
 * A single dialog is hoisted above the grid rather than one per card: the
 * catalogue runs to thousands of entries, and a closed portal per card is
 * thousands more than the page needs. The card sets which word is showing;
 * `null` is closed.
 */
function WordDialog({ item, onClose }: { item: CatalogItem | null; onClose: () => void }) {
  const vocabulary = item?.vocabulary;
  const pairs = vocabulary
    ? ([["synonyms", "Synonyms", vocabulary.synonyms], ["antonyms", "Antonyms", vocabulary.antonyms]] as const)
    : [];

  return <Dialog open={!!item} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={styles.wordDialog}>
      {item && vocabulary && <>
        <header className={styles.wordHead}>
          <span className={styles.wordCategory}>{item.category}</span>
          <div className={styles.wordTitleRow}>
            <span className={styles.wordIcon}>
              <VocabularyWordIcon word={item.name} meaning={vocabulary.meaning} category={item.category} size={20} />
            </span>
            <DialogTitle className={styles.wordTitle}>{item.name}</DialogTitle>
            {vocabulary.pronunciation && <span className={styles.wordRespell}>{vocabulary.pronunciation}</span>}
          </div>
          {/* Labelled rather than an icon alone: this is the one control in the
              dialog whose effect is not visible on screen. */}
          <button type="button" className={styles.wordSpeak} onClick={() => pronounce(item.name)}>
            <Volume2 size={15} aria-hidden="true" />Hear it
          </button>
          <DialogDescription className={styles.wordMeaning}>{vocabulary.meaning}</DialogDescription>
        </header>

        <div className={styles.wordBody}>
          <figure className={styles.wordSentence}>
            <figcaption>In a sentence</figcaption>
            <blockquote>“{vocabulary.sentence}”</blockquote>
          </figure>
          <div className={styles.wordPairs}>
            {pairs.map(([tone, label, words]) => <section key={tone} className={styles.wordGroup} data-tone={tone}>
              <h3><span className={styles.dot} aria-hidden="true" />{label}<b>{words.length}</b></h3>
              {/* Each related word is a word in its own right: it gets the same
                  mark and the same speaker the headword gets, because hearing a
                  synonym said aloud is most of why it is listed. */}
              <ul>{words.map(word => <li key={word}>
                <VocabularyWordIcon word={word} category={item.category} size={13} className={styles.pillIcon} />
                <span className={styles.pillWord}>{word}</span>
                <PronounceButton word={word} className={styles.pillAudio} />
              </li>)}</ul>
            </section>)}
          </div>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}

/**
 * A searchable, tabbed, paged grid of cards over any catalogue of named things.
 *
 * Written once and rendered twice — the AWS service directory and the AI
 * glossary — because the two differ only in their rows, their marks and the
 * question a card asks. Everything structural is the same, and two copies of it
 * would drift apart the first time either one was fixed.
 *
 * The caller supplies the marks: this component knows nothing about what it is
 * listing, which is what keeps it reusable for the next catalogue.
 */
export function CatalogBrowser({
  id, title, description, noun, items, categories, itemIcon, categoryIcon, question, onAsk,
}: {
  id: string;
  title: string;
  description: string;
  /** Plural, for the count beside the title: "services", "terms". */
  noun: string;
  items: CatalogItem[];
  categories: CatalogCategory[];
  itemIcon: (item: CatalogItem) => ReactNode;
  categoryIcon: (category: string) => ReactNode;
  /** The question a card asks when picked. */
  question: (item: CatalogItem) => string;
  onAsk: (question: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const [tabPage, setTabPage] = useState(0);
  // Which word is open in the dialog. Non-vocabulary catalogues never set it,
  // so their cards keep asking the question directly.
  const [opened, setOpened] = useState<CatalogItem | null>(null);
  // Which cards are currently showing their Hindi meaning. Per card rather than
  // one switch for the grid: a reader checks the one word they are stuck on and
  // leaves the rest in English.
  const [hindi, setHindi] = useState<ReadonlySet<string>>(() => new Set());
  const toggleHindi = useCallback((word: string) => setHindi(shown => {
    const next = new Set(shown);
    if (!next.delete(word)) next.add(word);
    return next;
  }), []);

  // Name, category and summary all match, so "storage", "Aurora" and
  // "serverless" each find something — a reader who knows the shape of what
  // they want but not its name is the one this filter is for.
  const found = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const inTab = tab === ALL ? items : items.filter(item => item.category === tab);
    if (!needle) return inTab;
    return inTab.filter(item => `${item.name} ${item.category} ${item.summary}`.toLowerCase().includes(needle));
  }, [items, query, tab]);

  // A tab and a query both narrow, so either changing has to return to the
  // first page — page four of the old result set is page four of nothing.
  const reset = useCallback(() => setPage(0), []);
  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const visible = found.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);
  const filtering = query.trim().length > 0;
  const narrowed = filtering || tab !== ALL;

  // Categories page rather than side-scroll: a scrollbar hides how much is left
  // and cannot be driven from the keyboard. "All" is pinned outside the paging,
  // so the way back to the whole catalogue never scrolls away.
  const tabPages = Math.max(1, Math.ceil(categories.length / TABS_PER_PAGE));
  const currentTabPage = Math.min(tabPage, tabPages - 1);
  const visibleCategories = categories.slice(currentTabPage * TABS_PER_PAGE, currentTabPage * TABS_PER_PAGE + TABS_PER_PAGE);

  return <section className={styles.catalog} aria-labelledby={id}>
    <div className={styles.head}>
      <div className={styles.titleRow}>
        <h2 id={id}>{title}</h2>
        <span className={styles.count}>{filtering || tab !== ALL ? `${found.length} of ${items.length}` : `${items.length} ${noun}`}</span>
      </div>
      <p>{description}</p>
    </div>

    <div className={styles.tools}>
      <InputGroup className={styles.field}>
        <InputGroupAddon><Search size={15} aria-hidden="true" /></InputGroupAddon>
        <InputGroupInput type="search" aria-label={`Search ${title}`} placeholder="Search by name, category or what it does…"
          value={query} onChange={event => { setQuery(event.target.value); reset(); }} />
        {/* Clears the text but keeps the tab: two filters, cleared separately. */}
        {filtering && <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => { setQuery(""); reset(); }}>
            <X size={13} aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>}
      </InputGroup>
      {/* Resets both, and only appears once either is actually narrowing. */}
      {narrowed && <button type="button" className={styles.clear}
        onClick={() => { setQuery(""); setTab(ALL); setTabPage(0); reset(); }}>
        <ListFilter size={13} aria-hidden="true" />Clear filters
      </button>}
    </div>

    <Tabs className={styles.tabs} value={tab} onValueChange={value => { setTab(String(value)); reset(); }}>
      <div className={styles.tabsRow}>
        <TabsList className={styles.tabsList}>
          <TabsTab className={`${styles.tab} ${styles.tabAll}`} value={ALL}>
            <Layers size={14} aria-hidden="true" />All
            <span className={styles.tabCount}>{items.length}</span>
          </TabsTab>
          {visibleCategories.map(category => <TabsTab key={category.name} className={styles.tab} value={category.name}>
            {categoryIcon(category.name)}
            <span className={styles.tabName}>{category.name}</span>
            <span className={styles.tabCount}>{category.count}</span>
          </TabsTab>)}
        </TabsList>
        {tabPages > 1 && <div className={styles.tabsNav}>
          <button type="button" className={styles.tabsStep} aria-label="Previous categories"
            disabled={currentTabPage === 0} onClick={() => setTabPage(currentTabPage - 1)}>
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <span className={styles.tabsOf}>{currentTabPage + 1}/{tabPages}</span>
          <button type="button" className={styles.tabsStep} aria-label="More categories"
            disabled={currentTabPage === tabPages - 1} onClick={() => setTabPage(currentTabPage + 1)}>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>}
      </div>

      <TabsPanel value={tab} className={styles.panel}>
        {!found.length && <p className={styles.none} role="status">
          Nothing here matches{filtering ? ` “${query.trim()}”` : ""}. Try a shorter word, or clear the filters.
        </p>}

        <ul className={styles.grid} key={`${tab}:${query}:${current}`}>
          {visible.map(item => <li key={item.name} className={styles.card}>
            {/* The speaker sits outside the card's own button: a button inside a
                button is not valid, and the browser will not deliver its click. */}
            <div className={styles.open}>
              <button type="button" className={styles.cardAction}
                onClick={() => item.vocabulary ? setOpened(item) : onAsk(question(item))}>
                <span className={styles.cardTop}>
                  <span className={styles.cardIcon}>{itemIcon(item)}</span>
                  {/* Only vocabulary words are stored lower-case; a service or
                      a glossary term already carries its own capitalisation. */}
                  <span className={styles.cardName}>{item.vocabulary ? asHeadword(item.name) : item.name}</span>
                  {item.vocabulary?.pronunciation && <span className={styles.respell}>{item.vocabulary.pronunciation}</span>}
                </span>
                <span className={styles.cardCategory}>{item.category}</span>
                <span className={styles.cardSummary}>{item.summary}</span>
                {/* The counts stand in for the lists themselves: the detail now
                    lives in the dialog, and a card that carried all of it was
                    taller than the six-up grid could hold. */}
                {item.vocabulary && <span className={styles.cardMeta}>
                  <span data-tone="synonyms">{item.vocabulary.synonyms.length} synonyms</span>
                  <span data-tone="antonyms">{item.vocabulary.antonyms.length} antonyms</span>
                </span>}
                <span className={styles.go} aria-hidden="true">
                  {item.vocabulary ? "Open word" : "Explain this"} <ArrowRight size={13} />
                </span>
              </button>
              {item.vocabulary && <PronounceButton word={item.name} className={styles.cardAudio} />}
              {/* Outside the card's own button — a button inside a button is not
                  valid — and below it, so revealing the line grows the card
                  downwards instead of shifting the word under the pointer. */}
              {item.vocabulary?.hindi && <>
                <button type="button" className={styles.hindiToggle}
                  aria-expanded={hindi.has(item.name)} aria-controls={`${id}-hindi-${item.name}`}
                  onClick={() => toggleHindi(item.name)}>
                  <Languages size={13} aria-hidden="true" />
                  {hindi.has(item.name) ? "Hide Hindi meaning" : "Hindi meaning"}
                </button>
                {/* Always rendered so the button's aria-controls points at
                    something; hidden collapses it for both eye and screen reader. */}
                <p id={`${id}-hindi-${item.name}`} className={styles.hindi} lang="hi"
                  hidden={!hindi.has(item.name)}>{item.vocabulary.hindi}</p>
              </>}
            </div>
          </li>)}
        </ul>
        {pages > 1 && <Pager page={current} pages={pages} onPage={setPage} label={`${title} pages`} />}
      </TabsPanel>
    </Tabs>

    <WordDialog item={opened} onClose={() => setOpened(null)} />
  </section>;
}
