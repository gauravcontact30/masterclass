"use client";

import { TECH_BUZZ_TRACKED } from "@/lib/tech-buzz-sections";
import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Star,
  Bookmark,
  Share2,
  Volume2,
  Play,
  Pause,
  CheckCircle2,
  Check,
  MessageSquare,
  Sparkles,
  Layers,
  Heart,
  Rocket,
  Brain,
  Lightbulb,
  Gauge
} from "lucide-react";
import { logoOf, type TechBuzzCard, type TechBuzzMemberContent, type TechBuzzPreview } from "@/lib/tech-buzz-public";
import { isUnsplash, unoptimizedRemote, unsplashLoader } from "@/lib/image-loaders";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "./language-provider";
import styles from "./tech-buzz-article.module.css";
import { ReviewPanel, ReviewStars } from "./tech-buzz-review-stars";
import { ClapButton, useClaps } from "./clap-button";
import dynamic from "next/dynamic";
import { KeyTakeaways, ProseText, SectionLists } from "./tech-buzz-prose";
import { plainProse } from "@/lib/prose-markup";
import { parseStoredRecord, useStoredValue, writeStoredValue } from "@/lib/local-store";
import type { TechBuzzMemberContent as MemberContent } from "@/lib/tech-buzz-public";

/** The light, Apple-style code editor (file tree + tabs): loaded with the member body, not with the page. */
const CodeFiles = dynamic(() => import("./code-files").then(module => module.CodeFiles), { loading: () => <div className={styles.codeLoading} aria-hidden="true" /> });

type Snippet = NonNullable<MemberContent["sections"][number]["codeSnippet"]>;
const EXTENSIONS: Record<string, string> = { typescript: "ts", ts: "ts", tsx: "tsx", javascript: "js", js: "js", jsx: "jsx", python: "py", py: "py", go: "go", rust: "rs", java: "java", sql: "sql", bash: "sh", shell: "sh", sh: "sh", json: "json", yaml: "yml", yml: "yml", css: "css", html: "html", dockerfile: "Dockerfile" };
/** A snippet's files for the editor: its own tabs when it has several, otherwise one file named after it. */
const snippetFiles = (snippet: Snippet) => (snippet.files?.length ? snippet.files : [{ filename: snippet.filename || `example.${EXTENSIONS[snippet.language.toLowerCase()] ?? "txt"}`, language: snippet.language, code: snippet.code }])
  .map(file => ({ path: file.filename, code: file.code, note: "" }));
const LIST_CLASSES = { ordered: styles.proseOrdered, list: styles.proseList, label: styles.proseListLabel, callout: styles.proseCallout };

interface Props {
  /** The free preview only; the member body is fetched from /api/tech-buzz/[slug]/member after a server-side check. */
  article: TechBuzzPreview;
  related: TechBuzzCard[];
  prevStory: TechBuzzCard | null;
  nextStory: TechBuzzCard | null;
}

/** Local images go through the optimizer, Unsplash through its own CDN (unsplashLoader); any other remote host as is. */
const remote = unoptimizedRemote;
const loaderFor = (src: string) => (isUnsplash(src) ? unsplashLoader : undefined);
/** Whether this browser holds a Supabase session cookie; null during the server render. */
const hasSessionCookie = () => /(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
const noSubscription = () => () => {};
/** Medium's byline date, "Oct 27, 2026", in IST so the server and browser agree. */
const storyDate = (iso: string) => {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? iso : new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" });
};

const REACTIONS = [
  { type: "heart", label: "Love this", icon: Heart },
  { type: "unicorn", label: "Unicorn", icon: Sparkles },
  { type: "rocket", label: "Rocket", icon: Rocket },
  { type: "mindblown", label: "Mind blown", icon: Brain }
] as const;

/** The reading progress bar, written straight to the DOM once per frame so scrolling never re-renders the story. */
function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);
  return <div className={styles.readingProgressBarContainer} aria-hidden="true"><div ref={bar} className={styles.readingProgressBar} /></div>;
}

const BOOKMARKS_KEY = "masterclass:tech-buzz-bookmarks";

export function TechBuzzArticleView({ article, related, prevStory, nextStory }: Props) {
  const { t } = useLanguage();
  // Membership: "checking" while the member body loads, then the body or the reason it is locked.
  // Without a session cookie the visitor cannot be a member, so no request is made and the preview stays locked.
  const signedIn = useSyncExternalStore(noSubscription, hasSessionCookie, () => null);
  const [memberAccess, setAccess] = useState<"checking" | "member" | "signin_required" | "subscription_required">("checking");
  const access = signedIn === false ? "signin_required" : memberAccess;
  const [memberContent, setMemberContent] = useState<TechBuzzMemberContent | null>(null);
  const isSubscribed = access === "member" && !!memberContent;
  // Claps are stored per reader in Supabase (components/clap-button.tsx); both buttons on the page share this state.
  const claps = useClaps(article.slug, article.claps);
  const [userReactions, setUserReactions] = useState<{ heart: number; unicorn: number; rocket: number; mindblown: number }>(article.reactions);
  // Bookmarks and ticked takeaways are kept in this browser (lib/local-store.ts).
  const savedBookmarks = useStoredValue(BOOKMARKS_KEY);
  const bookmarked = !!parseStoredRecord<boolean>(savedBookmarks)[article.id];
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio voiceover state with speech synthesis & active reading sync
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null);
  const [audioProgressPercent, setAudioProgressPercent] = useState<number>(0);

  // Takeaways checklist state
  const defaultTakeaways = useMemo(() => [
    `Understand ${article.technology} core architecture and runtime execution model`,
    `Audit real-world latency, throughput benchmarks, and memory footprint`,
    `Implement zero-downtime deployment patterns with resilience guards`,
    `Verify code snippets and architect blueprints against production SLOs`
  ], [article.technology]);

  const takeawaysKey = `mcb:takeaways:${article.id}`;
  const savedTakeaways = useStoredValue(takeawaysKey);
  const checkedTakeaways = useMemo(() => parseStoredRecord<boolean>(savedTakeaways), [savedTakeaways]);

  // Pagination for bottom More Blogs section
  const [moreBlogsPage, setMoreBlogsPage] = useState<number>(1);

  // Comments state
  const [comments, setComments] = useState<TechBuzzMemberContent["comments"]>([]);
  const [newCommentText, setNewCommentText] = useState<string>("");

  // The member body, checked on the server for signed-in readers.
  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    fetch(`/api/tech-buzz/${encodeURIComponent(article.slug)}/member`, { signal: controller.signal })
      .then(res => (res.ok ? res.json() : null))
      .then((data: { member?: boolean; reason?: "signin_required" | "subscription_required"; content?: TechBuzzMemberContent } | null) => {
        if (data?.member && data.content) {
          setMemberContent(data.content);
          setComments(data.content.comments);
          setAccess("member");
        } else setAccess(data?.reason ?? "signin_required");
      })
      .catch(() => { if (!controller.signal.aborted) setAccess("signin_required"); });
    return () => controller.abort();
  }, [article.slug, signedIn]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 3200);
  }, []);

  // Where the paywall sends a reader: sign in first, or choose a plan when already signed in.
  const articlePath = `/tech-buzz/${article.slug}`;
  const unlockHref = access === "subscription_required" ? "/learning/plans" : `/sign-in?redirect=${encodeURIComponent(articlePath)}`;
  const unlockLabel = access === "subscription_required" ? "Choose a plan to keep reading" : "Sign in to keep reading";

  const handleReaction = (type: "heart" | "unicorn" | "rocket" | "mindblown") => {
    setUserReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    const labels = { heart: "Loved ❤️", unicorn: "Unicorn 🦄", rocket: "Shipped 🚀", mindblown: "Mindblown 🤯" };
    showToast(`Reacted: ${labels[type]}`);

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react", articleId: article.id, reaction: type })
      }).catch(() => {});
    }
  };

  const toggleBookmark = () => {
    const next = !bookmarked;
    writeStoredValue(BOOKMARKS_KEY, JSON.stringify({ ...parseStoredRecord<boolean>(savedBookmarks), [article.id]: next }));
    showToast(next ? "Saved to your reading list" : "Removed from reading list");
  };

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Article link copied to clipboard!");
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `c-user-${Date.now()}`,
      author: {
        name: "Developer Community Member",
        role: "Software Architect",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        handle: "@architect",
        badge: "Subscriber"
      },
      text: newCommentText.trim(),
      createdAt: "Just now",
      likes: 1
    };

    setComments(prev => [newComment, ...prev]);
    setNewCommentText("");
    showToast("Comment posted to developer thread!");

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", articleId: article.id, text: newCommentText.trim() })
      }).catch(() => {});
    }
  };

  const toggleTakeaway = (idx: number) => {
    writeStoredValue(takeawaysKey, JSON.stringify({ ...checkedTakeaways, [idx]: !checkedTakeaways[idx] }));
  };

  const completedTakeawaysCount = defaultTakeaways.filter((_, i) => checkedTakeaways[i]).length;

  // Flatten all paragraphs for sequential voiceover reading
  // The voiceover reads what this reader may see: the whole story for members, the preview for everyone else.
  const visibleSections = useMemo(() => memberContent?.sections ?? [article.teaser], [memberContent, article.teaser]);
  // Every code file in the member body, the last version of each path winning, for the "Complete project" editor.
  const projectFiles = useMemo(() => {
    const byPath = new Map<string, { path: string; code: string; note: string }>();
    for (const section of memberContent?.sections ?? []) if (section.codeSnippet) for (const file of snippetFiles(section.codeSnippet)) byPath.set(file.path, file);
    return [...byPath.values()];
  }, [memberContent]);
  // Read aloud as plain words: no formatting marks, code blocks or picture links.
  const allParagraphs = useMemo(() => visibleSections.flatMap(sec => sec.paragraphs.map(plainProse)), [visibleSections]);

  const stopAudio = useCallback(() => {
    setIsPlayingAudio(false);
    setActiveParagraphIndex(null);
    setAudioProgressPercent(0);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Each paragraph queues the next one when it finishes, so `play` calls itself rather than the memoised callback.
  const playFromParagraph = useCallback((start: number) => {
    const play = (pIndex: number) => {
      if (pIndex < 0 || pIndex >= allParagraphs.length) return;
      setActiveParagraphIndex(pIndex);
      setIsPlayingAudio(true);
      setAudioProgressPercent(((pIndex + 1) / allParagraphs.length) * 100);

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const text = allParagraphs[pIndex];
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = audioSpeed;
        utter.onend = () => {
          if (pIndex + 1 < allParagraphs.length) {
            play(pIndex + 1);
          } else {
            stopAudio();
            showToast("Finished reading article!");
          }
        };
        utter.onerror = () => {
          setIsPlayingAudio(false);
        };
        window.speechSynthesis.speak(utter);
      }
    };
    play(start);
  }, [allParagraphs, audioSpeed, stopAudio, showToast]);

  const toggleAudio = useCallback(() => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      playFromParagraph(activeParagraphIndex ?? 0);
    }
  }, [isPlayingAudio, stopAudio, playFromParagraph, activeParagraphIndex]);

  const handleSpeedToggle = () => {
    const nextSpeed = audioSpeed === 1 ? 1.25 : audioSpeed === 1.25 ? 1.5 : audioSpeed === 1.5 ? 2 : 1;
    setAudioSpeed(nextSpeed);
    if (isPlayingAudio && activeParagraphIndex !== null) {
      playFromParagraph(activeParagraphIndex);
    }
  };

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // More Blogs pagination over the related cards the server sent.
  const MORE_PER_PAGE = 3;
  const otherArticles = related;
  const totalMorePages = Math.ceil(otherArticles.length / MORE_PER_PAGE);
  const paginatedMoreArticles = otherArticles.slice(
    (moreBlogsPage - 1) * MORE_PER_PAGE,
    moreBlogsPage * MORE_PER_PAGE
  );

  return (
    // The site chrome owns <main>; the story itself is the <article>, with the page's navigation and the related
    // stories as its siblings so assistive tech reads the article as one self-contained piece.
    <div className={styles.articlePageRoot}>
      <ReadingProgress />

      {/* Top sticky navigation */}
      <nav data-track-topic={TECH_BUZZ_TRACKED.storyNav} className={styles.stickyArticleNav} aria-label="Article navigation">
        <div className={styles.stickyNavInner}>
          <Link href="/tech-buzz" className={styles.backLink} aria-label={t("techBuzzBackToGuides")}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span className={styles.backLabel}>{t("techBuzzBackToGuides")}</span>
          </Link>

          <div className={styles.stickyNavRight}>
            <LanguageSwitcher size="sm" />
            {isSubscribed ? (
              <span className={styles.subscribedPill}>
                <CheckCircle2 size={13} />
                <span>{t("techBuzzMemberOnly")}</span>
              </span>
            ) : access !== "checking" && (
              <Link href={unlockHref} className={styles.subscribeTopBtn}>
                <Sparkles size={13} />
                <span>{access === "subscription_required" ? "Become a member" : "Sign in"}</span>
              </Link>
            )}

            <ClapButton slug={article.slug} claps={claps} size="small" />

            <button
              type="button"
              onClick={toggleBookmark}
              className={styles.navIconBtn}
              aria-pressed={bookmarked}
              aria-label="Bookmark story"
              title={bookmarked ? "Saved to your bookmarks" : "Bookmark story"}
            >
              <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className={styles.navIconBtn}
              aria-label="Share story"
              title="Share story"
            >
              <Share2 size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      <article className={styles.story} aria-labelledby="tb-story-title">
      <header data-track-topic={TECH_BUZZ_TRACKED.storyHeader} className={styles.articleHeroContainer}>
        <div className={styles.articleHeroInner}>
          {/* The trail carries the category and technology, so no separate chips repeat them above the title. */}
          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            <ol>
              <li><Link href="/" prefetch={false}>Home</Link></li>
              <li><Link href="/tech-buzz">Tech Buzz</Link></li>
              <li>{article.category}</li>
              <li className={styles.crumbTech}>
                {logoOf(article) && <Image src={logoOf(article)!} alt="" width={16} height={16} />}
                <span>{article.technology}</span>
              </li>
            </ol>
          </nav>

          <h1 id="tb-story-title" className={styles.articleTitle}>{article.title}</h1>
          <p className={styles.articleSubtitle}>{article.subtitle}</p>

          {/* Author Byline */}
          <div className={styles.authorBylineBar}>
            <div className={styles.authorLeft}>
              <Image
                src={article.author.avatar}
                alt=""
                width={52}
                height={52}
                className={styles.authorAvatar}
                loader={loaderFor(article.author.avatar)} unoptimized={remote(article.author.avatar)}
              />
              <div className={styles.authorDetails}>
                <p className={styles.authorName}>
                  <span>{article.author.name}</span>
                  {article.author.verified && (
                    <CheckCircle2 size={14} className={styles.verifiedMark} role="img" aria-label="Verified author" />
                  )}
                </p>
                <p className={styles.authorMetaSub}>
                  {article.author.role} · {article.readTimeMinutes} min read · <time dateTime={article.publishedAt}>{storyDate(article.publishedAt)}</time>
                </p>
              </div>
            </div>

            <div className={styles.authorActionsRight}>
              {article.audioVoiceover && (
                <button
                  type="button"
                  className={styles.listenActionBtn}
                  onClick={() => setIsPlayingAudio(prev => !prev)}
                >
                  <Volume2 size={14} />
                  <span>{isPlayingAudio ? "Pause Audio" : `Listen (${article.audioVoiceover.durationMinutes}m)`}</span>
                </button>
              )}

              <div className={styles.starBadge} title={article.rating.count ? `Rated ${article.rating.average}/5 by ${article.rating.count} readers` : "No reader ratings yet"}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" aria-hidden="true" />
                {article.rating.count ? <>
                  <span>{article.rating.average}</span>
                  <span className={styles.starCount}>({article.rating.count})</span>
                </> : <span>New story</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Cover: a mood picture, not information, so it has no alt text of its own (the title is right above it). */}
        <figure className={styles.coverImageWrapper}>
          <Image
            src={article.coverImage}
            alt=""
            fill
            className={styles.coverImage}
            preload
            // The cover is the page's LCP element: fetch it ahead of scripts (its request started 2.3 s late on mobile).
            fetchPriority="high"
            sizes="(max-width: 712px) 100vw, 680px"
            loader={loaderFor(article.coverImage)} unoptimized={remote(article.coverImage)}
          />
          {article.photoCredit && <figcaption className={styles.coverCredit}>{article.photoCredit}</figcaption>}
        </figure>
      </header>

      <div className={styles.articleBodyLayout}>
        <div className={styles.articleBodyInner}>
          <ReviewPanel review={article.review} />
          {/* Enhanced Audio Voiceover Player with Speech Synthesis */}
          {article.audioVoiceover && (
            <div className={styles.articleAudioPlayerHero}>
              <div className={styles.audioHeroTop}>
                <div className={styles.audioHeroNarrator}>
                  <div className={styles.audioHeroAvatar}>
                    <Volume2 size={20} />
                  </div>
                  <div>
                    <div className={styles.audioHeroNarratorName}>
                      Narrated by {article.audioVoiceover.narrator}
                    </div>
                    <div className={styles.audioHeroEngineTag}>
                      Voiceover Engine • Interactive Audio Sync
                    </div>
                  </div>
                </div>

                <div className={styles.audioHeroControls}>
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className={styles.audioHeroPlayBtn}
                  >
                    {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isPlayingAudio ? "Pause Audio" : "Play Voiceover"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSpeedToggle}
                    className={styles.audioHeroSpeedBtn}
                    title="Playback speed"
                  >
                    {audioSpeed}x
                  </button>
                </div>
              </div>

              <div className={styles.audioHeroScrubRow}>
                <span className={styles.audioHeroTime}>
                  {activeParagraphIndex !== null ? `P${activeParagraphIndex + 1}` : "0:00"}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioProgressPercent}
                  onChange={e => {
                    const pct = Number(e.target.value);
                    const targetIdx = Math.floor((pct / 100) * allParagraphs.length);
                    playFromParagraph(targetIdx);
                  }}
                  className={styles.audioHeroScrubBar}
                  aria-label="Audio scrubber"
                />
                <span className={styles.audioHeroTime}>
                  {article.audioVoiceover.durationMinutes}:00
                </span>
              </div>
            </div>
          )}

          {/* Interactive Learning Objectives & Key Takeaways Checklist */}
          <div className={styles.takeawaysContainer}>
            <div className={styles.takeawaysHeader}>
              <h2 id="tb-objectives" className={styles.takeawaysTitle}>
                <Sparkles size={18} className={styles.takeawaysIcon} aria-hidden="true" />
                <span>Learning Objectives & Key Takeaways</span>
              </h2>
              <span className={styles.takeawaysCounter}>
                {completedTakeawaysCount} / {defaultTakeaways.length} Completed
              </span>
            </div>

            <ul className={styles.takeawaysList} aria-labelledby="tb-objectives">
              {defaultTakeaways.map((takeaway, idx) => {
                const isChecked = Boolean(checkedTakeaways[idx]);
                // The checkbox role sits inside the <li>: on the <li> itself it is not allowed and broke the list.
                return (
                  <li key={idx}>
                    <div
                      className={`${styles.takeawayItem} ${isChecked ? styles.takeawayChecked : ""}`}
                      onClick={() => toggleTakeaway(idx)}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleTakeaway(idx);
                        }
                      }}
                    >
                      <span className={styles.takeawayCheckbox} aria-hidden="true">
                        {isChecked && <Check size={12} />}
                      </span>
                      <span>{takeaway}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Builder metrics row */}
          {article.builderMetrics && (
            <div className={styles.builderMetricsCard}>
              <div className={styles.builderMetricsTitle}>
                <Gauge size={15} aria-hidden="true" /> {article.builderMetrics.metricLabel}
              </div>
              <div className={styles.builderMetricsContent}>
                {article.builderMetrics.metricValue}
              </div>
              {article.builderMetrics.sla && (
                <span className={styles.builderMetricsSla}>
                  Verified: {article.builderMetrics.sla}
                </span>
              )}
            </div>
          )}

          <KeyTakeaways takeaways={article.summaryBullets} editorScore={article.source?.editorScore} basedOn={article.source?.basedOn}
            classes={{ box: styles.takeaways, heading: styles.takeawaysHeading, ordered: styles.proseOrdered, score: styles.editorScore, sources: styles.takeawaysSources }} />

          {/* Series banner */}
          {article.series && (
            <p className={styles.seriesPill}>
              <Layers size={14} aria-hidden="true" />
              <span>Series: {article.series.title} (Part {article.series.part} of {article.series.totalParts})</span>
            </p>
          )}

          {/* Section 0: the free preview, or the full first section for members */}
          {visibleSections[0] && (
            <section className={styles.storySection}>
              {visibleSections[0].heading && (
                <h2 className={styles.proseHeading}>{visibleSections[0].heading}</h2>
              )}
              {visibleSections[0].paragraphs.map((para, i) => {
                const isReading = isPlayingAudio && activeParagraphIndex === i;
                return (
                  <div
                    key={i}
                    className={`${styles.proseBlock} ${isReading ? styles.activeReadingHighlight : ""}`}
                    onClick={() => playFromParagraph(i)}
                    title="Click to listen from here"
                  >
                    <ProseText text={para} paragraphClass={styles.proseParagraph} listClass={styles.proseList} orderedClass={styles.proseOrdered} />
                  </div>
                );
              })}
              {visibleSections[0].quote && (
                <blockquote className={styles.proseQuote}>
                  &ldquo;{visibleSections[0].quote.text}&rdquo;
                  <cite>— {visibleSections[0].quote.attribution}</cite>
                </blockquote>
              )}
              {memberContent && <>
                {visibleSections[0].codeSnippet && (
                  <div className={styles.codeWindow}>
                    <CodeFiles files={snippetFiles(visibleSections[0].codeSnippet)} skin="apple" annotate={false} label={visibleSections[0].heading || "Code example"} />
                  </div>
                )}
                <SectionLists section={visibleSections[0]} classes={LIST_CLASSES} />
              </>}
            </section>
          )}

          {/* Member paywall: the rest of the story is never sent to non-members */}
          {!isSubscribed ? (
            <div data-track-topic={TECH_BUZZ_TRACKED.paywall} className={`${styles.paywallCurtain} paywalled-story`}>
              <div className={styles.paywallFade} />

              {article.outline.length > 0 && (
                <div className={styles.paywallOutline}>
                  <span className={styles.paywallOutlineLabel}>In the rest of this story</span>
                  <ol>{article.outline.map(heading => <li key={heading}>{heading}</li>)}</ol>
                  {article.lockedCodeSamples > 0 && <small>{article.lockedCodeSamples} code example{article.lockedCodeSamples === 1 ? "" : "s"} · {article.readTimeMinutes} min read in full</small>}
                </div>
              )}

              <div className={styles.paywallCard} aria-busy={access === "checking"}>
                <div className={styles.paywallStarBadge}>
                  <Star size={14} fill="#fcd34d" color="#d97706" />
                  <span>Member-only story</span>
                </div>

                <h2 className={styles.paywallHeading}>
                  {access === "checking" ? "Checking your membership…" : "Read the full story with a MasterClass Buddy membership"}
                </h2>

                <p className={styles.paywallText}>
                  Members read every Tech Buzz story in full, with code examples, audio and the discussion, plus every course, quiz and interview set in the Learning Dashboard.
                </p>

                {access !== "checking" && <div className={styles.paywallActions}>
                  <Link href={unlockHref} className={styles.paywallSubscribeBtn}>
                    <Sparkles size={16} />
                    <span>{unlockLabel}</span>
                  </Link>
                  {access === "signin_required" && <Link prefetch={false} href={`/sign-up?redirect=${encodeURIComponent(articlePath)}`} className={styles.paywallSecondaryBtn}>Create a free account</Link>}
                </div>}
              </div>
            </div>
          ) : memberContent && (
            /* Members: the rest of the story */
            <div data-track-topic={TECH_BUZZ_TRACKED.storyBody}>
              <div className={styles.unlockedBanner}>
                <CheckCircle2 size={16} color="#059669" />
                <span>Member access: the full story, code examples and discussion.</span>
              </div>

              {memberContent.sections.slice(1).map((section, idx) => {
                const prevParasCount = memberContent.sections
                  .slice(0, idx + 1)
                  .reduce((acc, s) => acc + s.paragraphs.length, 0);

                return (
                  <section key={idx + 1} className={styles.storySection}>
                    {section.heading && (
                      <h2 className={styles.proseHeading}>{section.heading}</h2>
                    )}

                    {section.image && (
                      <figure className={styles.proseFigure}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- generated blog images live in Supabase Storage */}
                        <img src={section.image.src} alt={section.image.alt} loading="lazy" decoding="async" />
                        {section.image.alt && <figcaption>{section.image.alt}</figcaption>}
                      </figure>
                    )}

                    {section.paragraphs.map((p, pIdx) => {
                      const globalIdx = prevParasCount + pIdx;
                      const isReading = isPlayingAudio && activeParagraphIndex === globalIdx;

                      return (
                        <div
                          key={pIdx}
                          className={`${styles.proseBlock} ${isReading ? styles.activeReadingHighlight : ""}`}
                          onClick={() => playFromParagraph(globalIdx)}
                          title="Click to listen from here"
                        >
                          <ProseText text={p} paragraphClass={styles.proseParagraph} listClass={styles.proseList} orderedClass={styles.proseOrdered} />
                        </div>
                      );
                    })}

                  {/* Code example: a light, Apple-style editor with a tab per file */}
                  {section.codeSnippet && (
                    <div className={styles.codeWindow}>
                      <CodeFiles files={snippetFiles(section.codeSnippet)} skin="apple" annotate={false} label={section.heading || "Code example"} />
                    </div>
                  )}

                  <SectionLists section={section} classes={LIST_CLASSES} />
                  {section.quote && (
                    <blockquote className={styles.proseQuote}>
                      &ldquo;{section.quote.text}&rdquo;
                      <cite>— {section.quote.attribution}</cite>
                    </blockquote>
                  )}
                </section>
              );
            })}

              {/* Every file from the story's examples in one editor, so the whole project can be read and copied end to end */}
              {projectFiles.length > 1 && (
                <section className={styles.codeProject} aria-label="Complete project">
                  <h2 className={styles.proseHeading}>Complete project</h2>
                  <p className={styles.proseParagraph}>All {projectFiles.length} files from this story together, ready to copy into a project and run.</p>
                  <div className={styles.codeWindow}>
                    <CodeFiles files={projectFiles} skin="apple" annotate={false} label={`${article.title} · source`} />
                  </div>
                </section>
              )}

              {/* Founder Architectural Takeaway */}
              {memberContent.founderTakeaway && (
                <aside className={styles.founderTakeaway} aria-label="Architectural takeaway">
                  <Lightbulb size={20} className={styles.founderIcon} aria-hidden="true" />
                  <div>
                    <p className={styles.founderLabel}>Architectural takeaway</p>
                    <p className={styles.founderQuote}>&ldquo;{memberContent.founderTakeaway}&rdquo;</p>
                  </div>
                </aside>
              )}

              {/* Developer Discussion Comments Thread */}
              <section data-track-topic={TECH_BUZZ_TRACKED.discussion} className={styles.commentsContainer} aria-labelledby="tb-discussion">
                <h2 id="tb-discussion" className={styles.discussionTitle}>
                  <MessageSquare size={20} className={styles.discussionIcon} aria-hidden="true" />
                  <span>Discussion</span>
                  <span className={styles.discussionCount}>{comments.length}</span>
                </h2>

                <form onSubmit={handleAddComment} className={styles.commentForm}>
                  <label htmlFor="tb-comment" className={styles.srOnly}>Your comment</label>
                  <textarea
                    id="tb-comment"
                    className={styles.commentInput}
                    placeholder="Share your architectural insight, question, or experience with this tech stack..."
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    required
                  />
                  <div className={styles.commentFormActions}>
                    <button type="submit" className={styles.commentSubmit}>Post comment</button>
                  </div>
                </form>

                {comments.length > 0 && <ol className={styles.commentList}>
                  {comments.map(c => (
                    <li key={c.id}>
                      <article className={styles.comment} aria-label={`Comment by ${c.author.name}`}>
                        <header className={styles.commentHead}>
                          <Image src={c.author.avatar} alt="" width={32} height={32} className={styles.commentAvatar} unoptimized />
                          <p className={styles.commentWho}>
                            <b>{c.author.name}</b>
                            <span>{c.author.handle} · {c.createdAt}</span>
                          </p>
                          {c.author.badge && <span className={styles.commentBadge}>{c.author.badge}</span>}
                        </header>
                        <p className={styles.commentText}>{c.text}</p>
                      </article>
                    </li>
                  ))}
                </ol>}
              </section>
            </div>
          )}

          {/* Claps and reactions */}
          <div className={styles.engagementStrip}>
            <ClapButton slug={article.slug} claps={claps} label="Clap for this blog" />

            <div className={styles.devReactionsBig} role="group" aria-label="React to this story">
              {REACTIONS.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  className={styles.devReactionBtnBig}
                  data-reaction={type}
                  onClick={() => handleReaction(type)}
                  title={label}
                  aria-label={`${label}: ${userReactions[type]}`}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span aria-hidden="true">{userReactions[type]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* The story's byline card closes the article */}
          <footer className={styles.authorBottomCard}>
            <Image
              src={article.author.avatar}
              alt=""
              width={64}
              height={64}
              className={styles.authorBioAvatar}
              loader={loaderFor(article.author.avatar)} unoptimized={remote(article.author.avatar)}
            />
            <div>
              <p className={styles.authorBioLabel}>Written by</p>
              <p className={styles.authorBioName}>{article.author.name}</p>
              <p className={styles.authorBioText}>
                {article.author.role}. Contributing deep-dive engineering architectures, cloud paradigms, and system design insights to Master Class Buddy.
              </p>
            </div>
          </footer>
        </div>
      </div>
      </article>

      {/* Previous and next stories in the feed */}
      {(prevStory || nextStory) && (
        <div className={styles.articleBodyLayout}>
          <nav className={`${styles.articleBodyInner} ${styles.storyNavGrid}`} aria-label="Previous and next stories">
            {prevStory ? (
              <Link href={`/tech-buzz/${prevStory.slug}`} rel="prev" className={styles.storyNavCard}>
                <span className={styles.storyNavDirection}>
                  <ArrowLeft size={13} aria-hidden="true" />
                  <span>Previous story</span>
                </span>
                <span className={styles.storyNavTitle}>{prevStory.title}</span>
                <span className={styles.storyNavMeta}>
                  {logoOf(prevStory) && <Image src={logoOf(prevStory)!} alt="" width={15} height={15} />}
                  <span>{prevStory.technology}</span>
                  <span aria-hidden="true">·</span>
                  <span>{prevStory.readTimeMinutes} min read</span>
                </span>
              </Link>
            ) : <span />}

            {nextStory && (
              <Link href={`/tech-buzz/${nextStory.slug}`} rel="next" className={`${styles.storyNavCard} ${styles.storyNavNext}`}>
                <span className={styles.storyNavDirection}>
                  <span>Next story</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </span>
                <span className={styles.storyNavTitle}>{nextStory.title}</span>
                <span className={styles.storyNavMeta}>
                  {logoOf(nextStory) && <Image src={logoOf(nextStory)!} alt="" width={15} height={15} />}
                  <span>{nextStory.technology}</span>
                  <span aria-hidden="true">·</span>
                  <span>{nextStory.readTimeMinutes} min read</span>
                </span>
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Related stories, full width */}
      <section data-track-topic={TECH_BUZZ_TRACKED.more} className={styles.moreBlogsSection} aria-labelledby="tb-more-heading">
        <div className={styles.moreBlogsInner}>
          <div className={styles.moreBlogsHeader}>
            <h2 id="tb-more-heading" className={styles.moreBlogsTitle}>More from Tech Buzz</h2>
            <Link href="/tech-buzz" className={styles.moreBlogsAll}>
              <span>Explore all blogs</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <ul className={styles.moreBlogsGrid}>
            {paginatedMoreArticles.map(rel => (
              <li key={rel.id}>
                <Link href={`/tech-buzz/${rel.slug}`} className={styles.moreBlogCard}>
                  <span className={styles.moreBlogCardCover}>
                    <Image
                      src={rel.coverImage}
                      alt=""
                      fill
                      className={styles.moreBlogCoverImg}
                      sizes="(max-width: 640px) 100vw, 33vw"
                      loader={loaderFor(rel.coverImage)} unoptimized={remote(rel.coverImage)}
                    />
                    {logoOf(rel) && (
                      <span className={styles.moreBlogLogo}>
                        <Image src={logoOf(rel)!} alt="" width={18} height={18} />
                      </span>
                    )}
                  </span>
                  <span className={styles.moreBlogCardBody}>
                    <span className={styles.moreBlogCategory}>{rel.category}</span>
                    <h3 className={styles.moreBlogCardTitle}>{rel.title}</h3>
                    <span className={styles.moreBlogCardSubtitle}>{rel.subtitle}</span>
                    <span className={styles.moreBlogCardFooter}>
                      <span>{rel.readTimeMinutes} min read</span>
                      {rel.review ? <ReviewStars review={rel.review} /> : rel.rating.count
                        ? <span className={styles.moreBlogRating}><Star size={12} fill="currentColor" aria-hidden="true" />{rel.rating.average}<span className={styles.srOnly}> out of 5</span></span>
                        : <span>New story</span>}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Pagination controls for related blogs */}
          {totalMorePages > 1 && (
            <nav className={styles.moreBlogsPagination} aria-label="More stories pages">
              <button
                type="button"
                className={styles.moreBlogsPageBtn}
                onClick={() => setMoreBlogsPage(p => Math.max(1, p - 1))}
                disabled={moreBlogsPage === 1}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalMorePages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  className={`${styles.moreBlogsPageBtn} ${pageNum === moreBlogsPage ? styles.moreBlogsPageActive : ""}`}
                  onClick={() => setMoreBlogsPage(pageNum)}
                  aria-current={pageNum === moreBlogsPage ? "page" : undefined}
                  aria-label={`Page ${pageNum}`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className={styles.moreBlogsPageBtn}
                onClick={() => setMoreBlogsPage(p => Math.min(totalMorePages, p + 1))}
                disabled={moreBlogsPage === totalMorePages}
              >
                <span>Next</span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          )}

          {/* Move to top button in article view */}
          <div className={styles.articleMoveToTopRow}>
            <button
              type="button"
              className={styles.articleMoveToTopBtn}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <ArrowUp size={16} aria-hidden="true" />
              <span>Move to top</span>
            </button>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toast} role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
