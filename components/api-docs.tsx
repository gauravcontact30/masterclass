"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { vocabularyIcon } from "@/lib/vocabulary-icons";
import { BrandMark, BrandOrGlyph } from "./topic-media";
import { LearningResources } from "./learning-resources";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, BriefcaseBusiness, Quote, ArrowLeft, ArrowUpRight, Check, ChevronDown, Copy, FileCode2, GraduationCap, MessageCircle, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { API_PACKAGES, API_STATUSES, API_TYPES, filterApiPackages, javascriptGroup, type ApiEntry, type ApiPackage } from "@/lib/api-docs";
import { API_DETAILS } from "@/lib/api-docs-details";
import { apiDetailSchema, type ContentSource, type GeneratedApiDetail } from "@/lib/pro-learn/types";
import { highlightLines, type CodeLanguage } from "@/lib/code-highlight";
import { codeLineNotes } from "@/lib/code-line-notes";
import { CodeLineComment } from "./code-line-comment";
import styles from "./api-docs.module.css";
import projectStyles from "./api-project.module.css";
import { apiCodeLanguage, enrichApiLearning } from "@/lib/api-learning";
import { ApiProjectWorkspace } from "./api-project-workspace";
import { ApiInterviewPractice } from "./api-interview-practice";
import { referenceErrorMessage } from "@/lib/api-reference-errors";
import { DashboardPageHeader } from "./dashboard-page-header";
import { AiProvenance, AiProviderPicker, useAiProvider } from "./ai-provider-picker";
import { KeyText } from "./key-text";
import { shortDefinition } from "@/lib/notes-study";

function Badge({ kind }: { kind: string }) {
  const definition = API_TYPES.find(type => type.k === kind);
  return <span className={styles.badge} style={{ background: definition?.c || "#64748b" }} aria-hidden="true">{kind}</span>;
}

function ApiCode({ code, language }: { code: string; language: CodeLanguage }) {
  const [copied, setCopied] = useState("");
  const notes = useMemo(() => codeLineNotes(code, "", language), [code, language]);
  async function copy() { try { await navigator.clipboard.writeText(code); setCopied("Copied"); } catch { setCopied("Select the code to copy manually."); } }
  return <div className={styles.ide}><div className={styles.ideBar}><span className={styles.dots} aria-hidden="true"><i/><i/><i/></span><span>{language}</span><button onClick={() => void copy()} aria-label="Copy code">{copied === "Copied" ? <Check size={14}/> : <Copy size={14}/>} {copied === "Copied" ? "Copied" : "Copy"}</button></div><pre tabIndex={0}><code>{highlightLines(code, language).map((line, index) => <span key={index}><span className={styles.gutter} aria-hidden="true">{index + 1}</span>{line.map((token, part) => <span key={part} className={styles[token.tone]}>{token.text}</span>)}{"\n"}<CodeLineComment note={notes[index]} /></span>)}</code></pre><span className={styles.copyStatus} role="status">{copied}</span></div>;
}

type GeneratedResult = { detail: GeneratedApiDetail; source: ContentSource; reason?: string; provider?: string; sources?: string[] };
const DETAIL_CACHE = "masterclass:api-detail:v2";
function readCache(key: string): GeneratedResult | null { try { const value = JSON.parse(localStorage.getItem(DETAIL_CACHE) || "{}")[key]; return value?.source === "ai" ? {source:"ai",detail:apiDetailSchema.parse(value.detail)} : null; } catch { return null; } }
function writeCache(key: string, value: GeneratedResult) {
  try {
    const all = JSON.parse(localStorage.getItem(DETAIL_CACHE) || "{}"); all[key] = value;
    const keys = Object.keys(all); while (keys.length > 120) delete all[keys.shift()!];
    localStorage.setItem(DETAIL_CACHE, JSON.stringify(all));
  } catch { /* Browser storage is an optional speed-up. */ }
}
/** Loads the in-app reference for identifiers that have no hand-authored page. */
function useGeneratedDetail(pkg: ApiPackage, entry: ApiEntry, curated: boolean, provider?: string) {
  // The provider is part of the key: two models produce two different pages.
  const key = `${pkg.id}:${entry.name}:${provider ?? "default"}`;
  const [state, setState] = useState<{ key: string; status: "loading" | "ready" | "error"; data?: GeneratedResult; error?:string }>({ key, status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (curated) return;
    const controller = new AbortController();
    // Deferred so no state update runs synchronously inside the effect body.
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      const cached = attempt === 0 ? readCache(key) : null;
      if (cached) { setState({ key, status: "ready", data: cached }); return; }
      setState({ key, status: "loading" });
      try {
        const response = await fetch("/api/pro-learn/api-detail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId: pkg.id, name: entry.name, ...(provider ? { provider } : {}) }), signal: controller.signal });
        if (!response.ok) {
          const failure=await response.json().catch(()=>({}));
          throw new Error(failure.error ?? (response.status===401?'signin_required':response.status===429?'rate_limited':response.status===504?'reference_timeout':'reference_unavailable'));
        }
        const payload = await response.json();
        if (controller.signal.aborted) return;
        const data: GeneratedResult = {detail:apiDetailSchema.parse(payload.detail),source:payload.source==="ai"?"ai":"library",reason:typeof payload.reason==="string"?payload.reason:undefined,provider:typeof payload.provider==="string"?payload.provider:undefined,sources:Array.isArray(payload.sources)?payload.sources.filter((item:unknown)=>typeof item==="string").slice(0,8):undefined};
        if (data.source === "ai") writeCache(key, data);
        setState({ key, status: "ready", data });
      } catch (error) { if (!controller.signal.aborted) setState({ key, status: "error",error:error instanceof TypeError?'network_error':error instanceof Error?error.message:'reference_unavailable' }); }
    });
    return () => controller.abort();
  }, [key, curated, attempt, pkg.id, entry.name, provider]);
  return { ...(state.key === key ? state : { status: "loading" as const, data: undefined }), retry: () => setAttempt(value => value + 1) };
}

export function ApiDetail({ pkg, entry, pathname }: { pkg: ApiPackage; entry: ApiEntry; pathname: string }) {
  const curated = API_DETAILS[`${pkg.id}:${entry.name}`];
  const { providers, provider, choose } = useAiProvider(!curated);
  const generated = useGeneratedDetail(pkg, entry, !!curated, provider);
  const kind = API_TYPES.find(type => type.k === entry.kind)?.label || "Identifier";
  const status = API_STATUSES.find(item => item.id === entry.status)?.label || "Reference entry";
  const base = curated ?? (generated.status === "ready" ? generated.data?.detail : undefined);
  const detail = base ? enrichApiLearning(pkg,entry,base) : undefined;
  const language: CodeLanguage = curated?.language ?? apiCodeLanguage(pkg.id);
  const fromLibrary = !curated && generated.status === "ready" && generated.data?.source === "library";
  const related = (detail?.related ?? []).map(name => pkg.entries.find(item => item.name === name)).filter((item): item is ApiEntry => !!item);
  const seeAlso = related.length ? related : pkg.entries.filter(item => item.name !== entry.name && item.kind === entry.kind).slice(0, 6);
  const mentorHref = `/dashboard/mentors?q=${encodeURIComponent(`Explain ${entry.name} from ${pkg.name} with a practical example`)}`;
  const quizHref = `/dashboard/quiz?topic=${encodeURIComponent(`${pkg.name} ${entry.name}`)}`;
  return <div>
    <div className={styles.detailTop}><Link href={pathname}><ArrowLeft size={16}/>API Reference</Link><div className={styles.learnLinks}><Link href={mentorHref}><MessageCircle size={15}/>Ask the mentor</Link><Link href={quizHref}><GraduationCap size={15}/>Quiz me on this</Link></div></div>
    <div className={styles.detailLayout}><article className={styles.detail}>
      <p className={styles.packageName}><BrandMark label={pkg.name} size={14}/>{detail?.packageName || pkg.name}</p><h1>{entry.name}<span className={styles.kind}>{kind}</span><span className={styles.statusBadge} data-status={entry.status}>{status}</span>{detail?.since && <span className={styles.kind}>{detail.since}</span>}</h1>
      {!curated && <AiProviderPicker providers={providers} provider={provider} onChoose={choose}/>}
      {!detail && generated.status === "loading" && <div className={styles.generating} role="status"><Sparkles size={16}/><span>Preparing the {entry.name} reference…</span><i/><i/><i/></div>}
      {!detail && generated.status === "error" && <div className={styles.referenceCard} role="alert"><p>{referenceErrorMessage(generated.error)}</p>{generated.error==='signin_required'?<Link href="/sign-in">Sign in again<ArrowUpRight size={14}/></Link>:<button className={styles.retry} onClick={generated.retry}><RefreshCw size={14}/>Try again</button>}</div>}
      {detail && <>
        <section id="api-definition" className={styles.definitionBlock}>
          <h2 className={styles.coloredTitle} data-tone="clay"><BookOpen size={20} aria-hidden="true"/>Definition</h2>
          <p className={styles.lead}><KeyText text={shortDefinition(detail.description)}/></p>{detail.description.length > shortDefinition(detail.description).length && <p><KeyText text={detail.description}/></p>}{detail.descriptionLong && detail.descriptionLong.split(/\n\n+/).map(paragraph=><p key={paragraph}><KeyText text={paragraph}/></p>)}
          <AiProvenance provider={generated.data?.provider} sources={generated.data?.sources} providers={providers}/>
          {fromLibrary && <p className={styles.small}>Showing the in-app catalog summary for {entry.name}: the facts the catalog holds, with no invented signature or example.{generated.data?.reason ? ` ${referenceErrorMessage(generated.data.reason)}` : " Prepare the full learning page for signatures, a worked example and a runnable project."}</p>}
          <section id="api-signature" className={styles.syntaxBlock}><h3 className={styles.coloredSubtitle} data-tone="blue"><FileCode2 size={18} aria-hidden="true"/>Syntax</h3>{detail.signature ? <ApiCode code={detail.signature} language={language}/>:<p>{fromLibrary ? `The catalog summary does not carry a signature for ${entry.name}. Prepare the full learning page below, or read the official documentation linked in the key features.` : "This concept has no standalone syntax."}</p>}<div className={styles.memberBody}>{detail.parameters.map(parameter=><div className={styles.parameter} key={parameter.name}><p><b>{parameter.name}</b> <code>{parameter.type}</code></p><p><KeyText text={parameter.description}/></p></div>)}{detail.returns&&<p><strong>Returns:</strong> <KeyText text={detail.returns}/></p>}</div></section>
          <section id="api-example" className={styles.exampleBlock}><h3 className={styles.coloredSubtitle} data-tone="sage"><FileCode2 size={18} aria-hidden="true"/>Example</h3>{detail.code ? <ApiCode code={detail.code} language={language}/>:<p>{fromLibrary ? "No example is invented for a catalog summary. Prepare the full learning page below to generate a runnable one." : "Explore the complete code workspace below for a practical example."}</p>}</section>
        </section>
        <section id="api-key-points"><h2 className={styles.coloredTitle} data-tone="violet"><Sparkles size={20} aria-hidden="true"/>Key features</h2><ol className={styles.pointList} data-tone="violet">{detail.notes.map((note,index) => <li key={note}><span className={styles.pointNumber} aria-hidden="true">{String(index+1).padStart(2,"0")}</span><span><KeyText text={note}/></span></li>)}</ol></section>
        <section id="api-use-cases"><h2 className={styles.coloredTitle} data-tone="sage"><BriefcaseBusiness size={20} aria-hidden="true"/>Real use cases</h2><ol className={styles.pointList} data-tone="sage">{detail.useCases.map((note,index) => <li key={note}><span className={styles.pointNumber} aria-hidden="true">{String(index+1).padStart(2,"0")}</span><span><KeyText text={note}/></span></li>)}</ol></section>
        <section id="api-project"><h2>Complete code workspace</h2>{detail.project?<ApiProjectWorkspace key={entry.name} project={detail.project}/>:<div className={styles.referenceCard}><p>A runnable project is not available in this catalog summary.</p><button className={styles.retry} onClick={generated.retry}>Prepare full learning page</button></div>}</section>
        <section id="api-vocabulary"><div className={projectStyles.vocabularyHeading}><h2 className={styles.coloredTitle} data-tone="sage"><BookOpen size={20} aria-hidden="true"/>Corporate English vocabulary</h2><span className={projectStyles.wordTotal}>{detail.vocabulary.length} words</span></div><p className={projectStyles.sectionIntro}>Build the language for clear technical discussions and confident workplace communication.</p><div className={projectStyles.vocabulary}>{detail.vocabulary.map((item,index)=>{const icon=vocabularyIcon(item.word,item.meaning);return <article key={item.word}><header className={projectStyles.wordHeading}><span className={projectStyles.sectionIcon}><Image src={icon.src} alt={icon.alt} width={26} height={26}/></span><div><span className={projectStyles.wordEyebrow}>WORKPLACE VOCABULARY</span><h3>{item.word}</h3></div><span className={projectStyles.wordIndex} aria-label={`Word ${index+1} of ${detail.vocabulary.length}`}>{String(index+1).padStart(2,"0")}</span></header><dl><dt>Meaning</dt><dd>{item.meaning}</dd><dt>Sentence</dt><dd className={projectStyles.sentence}><Quote size={16} aria-hidden="true"/>{item.sentence}</dd><dt>Synonyms</dt><dd className={projectStyles.wordChips}>{item.synonyms.map(word=><span key={word}>{word}</span>)}</dd><dt>Antonyms</dt><dd className={projectStyles.wordChips} data-tone="rose">{item.antonyms.map(word=><span key={word}>{word}</span>)}</dd></dl></article>;})}</div></section>
        <section id="api-interview"><h2>Interview questions &amp; answers</h2><p>Practice common interview concepts and related follow-up questions. These are study questions, not a measured frequency ranking.</p><ApiInterviewPractice key={entry.name} detail={detail}/></section>
        <section id="api-topics"><h2>Learn {pkg.name} in the app</h2><div className={styles.topicChips}>{pkg.topics.map(topic => <Link key={topic} href={`/dashboard/lessons?track=${encodeURIComponent(pkg.id)}&topic=${encodeURIComponent(topic)}`}><BookOpen size={15} aria-hidden="true"/><span>{topic}</span><ArrowUpRight size={13} aria-hidden="true"/></Link>)}</div></section>
      </>}
      {!!seeAlso.length && <section id="api-related"><h2>See also</h2><ul className={styles.related}>{seeAlso.map(item => <li key={item.name}><Link href={apiTopicHref(pathname,pkg.id,item.name)}><FileCode2 size={15} aria-hidden="true"/><span>{item.name}</span><ArrowUpRight size={13} aria-hidden="true"/></Link></li>)}</ul></section>}
      <LearningResources key={pkg.id} technology={pkg.name} />
      <p className={styles.provenance}>{curated ? "Hand-authored reference prepared for study in MasterClass." : "Prepared inside MasterClass for study."} Behaviour can differ between versions; verify against the version installed in your project.</p>
    </article></div>
  </div>;
}

export function apiTopicHref(pathname:string,packageId:string,name:string) { return `${pathname}/${encodeURIComponent(packageId)}/${encodeURIComponent(name)}`; }

/**
 * The mark beside a package name: its real logo, else the catalog's emoji.
 *
 * Roughly half the 54 packages are products with a mark in simple-icons; the
 * rest are themes ("System Design", "AI Agents") or young libraries with no
 * icon published. Those keep the emoji they already had, so this is an upgrade
 * where one is available and a no-op everywhere else.
 */
function packageMark(pkg: ApiPackage) {
  return <BrandOrGlyph label={pkg.name} glyph={pkg.icon} size={16}/>;
}

export function ApiDocs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [packageId, setPackageId] = useState("all");
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState(API_STATUSES.map(item => item.id));
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const groups = filterApiPackages(query, packageId, types, statuses);
  const total = groups.reduce((sum, pkg) => sum + pkg.entries.length, 0);
  const selectedPackage = API_PACKAGES.find(pkg => pkg.id === params.get("package"));
  const selectedEntry = selectedPackage?.entries.find(entry => entry.name === params.get("api"));
  const detailRequested = params.has("api");
  function toggleType(kind: string) { setTypes(previous => previous.includes(kind) ? previous.filter(item => item !== kind) : [...previous, kind]); }
  function reset() { setQuery(""); setPackageId("all"); setTypes([]); setStatuses(API_STATUSES.map(item => item.id)); setExpanded([]); }
  function entryLink(pkg: ApiPackage, entry: ApiEntry) { return <Link className={styles.apiItem} key={entry.name} href={apiTopicHref(pathname,pkg.id,entry.name)} title={`${entry.name} · ${API_TYPES.find(type => type.k === entry.kind)?.label || entry.kind}`}><Badge kind={entry.kind}/><span>{entry.name}</span>{entry.status !== "s" && <small data-status={entry.status}>{API_STATUSES.find(item => item.id === entry.status)?.label}</small>}</Link>; }
  return <div className={styles.root}>
    {detailRequested ? selectedPackage && selectedEntry ? <ApiDetail key={`${selectedPackage.id}:${selectedEntry.name}`} pkg={selectedPackage} entry={selectedEntry} pathname={pathname}/> : <div className={styles.empty}><h1>API entry not found</h1><p>This identifier is not in the reference catalog.</p><Link href={pathname}>Back to API Reference</Link></div> : <>
      <DashboardPageHeader eyebrow="Professional learning / API Docs" title="API Reference" icon={<FileCode2/>} description="Browse key identifiers across every technology, filter by type or status, and study each API in depth right here." actions={<span className={styles.packageCount}>{API_PACKAGES.length} technologies</span>}/>
      <section className={styles.filterPanel} aria-label="API reference filters">
      <div className={styles.toolbar}><Label className={styles.search}><Search size={17}/><Input type="search" aria-label="Filter APIs" placeholder="Filter APIs…" value={query} onChange={event => setQuery(event.target.value)}/>{query && <button aria-label="Clear API search" onClick={() => setQuery("")}><X size={15}/></button>}</Label><NativeSelect aria-label="API package" value={packageId} onChange={event => { setPackageId(event.target.value); setOpen(event.target.value); }}><NativeSelectOption value="all">All Packages</NativeSelectOption>{API_PACKAGES.map(pkg => <NativeSelectOption value={pkg.id} key={pkg.id}>{pkg.name}</NativeSelectOption>)}</NativeSelect></div>
      <div className={styles.statuses} role="group" aria-label="API status filters">{API_STATUSES.map(item => <button key={item.id} aria-pressed={statuses.includes(item.id)} onClick={() => setStatuses(previous => previous.includes(item.id) ? previous.filter(value => value !== item.id) : [...previous, item.id])}>{statuses.includes(item.id) && <Check size={13}/>} {item.label}</button>)}</div>
      <h2 className={styles.legend}>Filter by identifier type</h2><div className={styles.types} role="group" aria-label="Identifier types">{API_TYPES.map(type => <button key={type.k} aria-pressed={types.includes(type.k)} onClick={() => toggleType(type.k)}><Badge kind={type.k}/>{type.label}</button>)}</div>
      </section>
      <div className={styles.results}><span role="status">{total.toLocaleString("en-US")} identifiers · {groups.length} packages</span><button onClick={reset}>Reset filters</button></div>
      {!groups.length && <div className={styles.empty}><Search size={25}/><h2>No APIs match your filters.</h2><p>Try a different identifier, package, type or status.</p><button onClick={reset}>Clear all filters</button></div>}
      <div className={styles.groups}>{groups.map(pkg => {
        const isOpen = !!query.trim() || open === pkg.id;
        const entries = expanded.includes(pkg.id) ? pkg.entries : pkg.entries.slice(0, 60);
        const jsGroups = [...new Set(entries.map(entry => javascriptGroup(entry.name)))];
        return <section key={pkg.id} className={styles.group} style={{ "--accent": pkg.accent } as CSSProperties}><header className={styles.groupHead}><h2><button aria-label={`Toggle ${pkg.name}`} aria-expanded={isOpen} aria-controls={`api-group-${pkg.id}`} onClick={() => setOpen(isOpen ? null : pkg.id)}><ChevronDown size={16} className={isOpen ? "" : styles.closed}/><span className={styles.groupIcon} aria-hidden="true">{packageMark(pkg)}</span>{pkg.name}<small>{pkg.entries.length}</small></button></h2><span className={styles.groupMeta}>{pkg.description}</span></header><div id={`api-group-${pkg.id}`} hidden={!isOpen}>{isOpen && <>{pkg.id === "javascript" ? jsGroups.map(group => <div className={styles.subgroup} key={group}><h3>{group}</h3><div className={styles.items}>{entries.filter(entry => javascriptGroup(entry.name) === group).map(entry => entryLink(pkg, entry))}</div></div>) : <div className={styles.items}>{entries.map(entry => entryLink(pkg, entry))}</div>}{entries.length < pkg.entries.length && <button className={styles.showAll} onClick={() => setExpanded(previous => [...previous, pkg.id])}>Show all {pkg.entries.length} identifiers</button>}</>}</div></section>;
      })}</div><p className={styles.provenance}>Every reference opens inside MasterClass. Status labels describe the catalog snapshot; verify behaviour against the version installed in your project.</p>
    </>}
  </div>;
}
