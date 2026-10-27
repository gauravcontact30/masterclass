"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
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
  Flame
} from "lucide-react";
import { techLogo, type TechBuzzCard, type TechBuzzMemberContent, type TechBuzzPreview } from "@/lib/tech-buzz-public";
import { isUnsplash, unoptimizedRemote, unsplashLoader } from "@/lib/image-loaders";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "./language-provider";
import styles from "./tech-buzz-article.module.css";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClapButton, useClaps } from "./clap-button";
import dynamic from "next/dynamic";
import { ProseText } from "./tech-buzz-prose";
import type { TechBuzzMemberContent as MemberContent } from "@/lib/tech-buzz-public";

/** The light, Apple-style code editor (file tree + tabs): loaded with the member body, not with the page. */
const CodeFiles = dynamic(() => import("./code-files").then(module => module.CodeFiles), { loading: () => <div className={styles.codeLoading} aria-hidden="true" /> });

type Snippet = NonNullable<MemberContent["sections"][number]["codeSnippet"]>;
const EXTENSIONS: Record<string, string> = { typescript: "ts", ts: "ts", tsx: "tsx", javascript: "js", js: "js", jsx: "jsx", python: "py", py: "py", go: "go", rust: "rs", java: "java", sql: "sql", bash: "sh", shell: "sh", sh: "sh", json: "json", yaml: "yml", yml: "yml", css: "css", html: "html", dockerfile: "Dockerfile" };
/** A snippet's files for the editor: its own tabs when it has several, otherwise one file named after it. */
const snippetFiles = (snippet: Snippet) => (snippet.files?.length ? snippet.files : [{ filename: snippet.filename || `example.${EXTENSIONS[snippet.language.toLowerCase()] ?? "txt"}`, language: snippet.language, code: snippet.code }])
  .map(file => ({ path: file.filename, code: file.code, note: "" }));

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

export function TechBuzzArticleView({ article, related, prevStory, nextStory }: Props) {
  const { t, language } = useLanguage();
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
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState<number>(0);

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

  const [checkedTakeaways, setCheckedTakeaways] = useState<Record<number, boolean>>({});

  // Pagination for bottom More Blogs section
  const [moreBlogsPage, setMoreBlogsPage] = useState<number>(1);

  // Comments state
  const [comments, setComments] = useState<TechBuzzMemberContent["comments"]>([]);
  const [newCommentText, setNewCommentText] = useState<string>("");

  // Restore bookmarks saved in this browser.
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("masterclass:tech-buzz-bookmarks");
      if (savedBookmarks && JSON.parse(savedBookmarks)[article.id]) setBookmarked(true);
    } catch {}
  }, [article.id]);

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

  // Track scroll position for reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setReadingProgress(progress);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    setBookmarked(next);
    try {
      const saved = localStorage.getItem("masterclass:tech-buzz-bookmarks");
      const current = saved ? JSON.parse(saved) : {};
      current[article.id] = next;
      localStorage.setItem("masterclass:tech-buzz-bookmarks", JSON.stringify(current));
    } catch {}
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

  // Check saved takeaways from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mcb:takeaways:${article.id}`);
      if (saved) {
        setCheckedTakeaways(JSON.parse(saved));
      }
    } catch {}
  }, [article.id]);

  const toggleTakeaway = (idx: number) => {
    setCheckedTakeaways(prev => {
      const updated = { ...prev, [idx]: !prev[idx] };
      try {
        localStorage.setItem(`mcb:takeaways:${article.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
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
  const allParagraphs = useMemo(() => visibleSections.flatMap(sec => sec.paragraphs), [visibleSections]);

  const stopAudio = useCallback(() => {
    setIsPlayingAudio(false);
    setActiveParagraphIndex(null);
    setAudioProgressPercent(0);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const playFromParagraph = useCallback((pIndex: number) => {
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
          playFromParagraph(pIndex + 1);
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
    <article className={styles.articlePageRoot}>
      {/* 1. Sticky Reading Progress Bar */}
      <div className={styles.readingProgressBarContainer}>
        <div
          className={styles.readingProgressBar}
          style={{ width: `${readingProgress}%` }}
          aria-hidden="true"
        />
      </div>

      {/* 2. Top Sticky Navigation */}
      <nav className={styles.stickyArticleNav} aria-label="Article navigation">
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
              style={{ background: "transparent", border: "none", cursor: "pointer", color: bookmarked ? "#ea580c" : "#64748b", padding: "0.35rem" }}
              aria-label="Bookmark story"
            >
              <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: "0.35rem" }}
              aria-label="Share story"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* 3. Hero Header Section */}
      <header className={styles.articleHeroContainer}>
        <div className={styles.articleHeroInner}>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className={styles.breadcrumbs}>
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/tech-buzz">Tech Buzz</Link>
            <span>/</span>
            <span>{article.category}</span>
            <span>/</span>
            <span style={{ color: "#0f172a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              {techLogo(article.techId) && (
                <Image src={techLogo(article.techId)!} alt="" width={15} height={15} style={{ borderRadius: 3 }} />
              )}
              <span>{article.technology}</span>
            </span>
          </nav>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div className={styles.categoryBadge}>
              <Flame size={12} />
              <span>{article.category}</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.65rem", borderRadius: "9999px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "0.75rem", fontWeight: 700, color: "#334155" }}>
              {techLogo(article.techId) && (
                <Image src={techLogo(article.techId)!} alt="" width={15} height={15} style={{ borderRadius: 2 }} />
              )}
              <span>{article.technology}</span>
            </div>
          </div>

          <h1 className={styles.articleTitle}>{article.title}</h1>
          <p className={styles.articleSubtitle}>{article.subtitle}</p>

          {/* Author Byline */}
          <div className={styles.authorBylineBar}>
            <div className={styles.authorLeft}>
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={52}
                height={52}
                className={styles.authorAvatar}
                loader={loaderFor(article.author.avatar)} unoptimized={remote(article.author.avatar)}
              />
              <div className={styles.authorDetails}>
                <div className={styles.authorName}>
                  <span>{article.author.name}</span>
                  {article.author.verified && (
                    <span title="Verified Author" style={{ display: "inline-flex", alignItems: "center" }}>
                      <CheckCircle2 size={14} color="#059669" />
                    </span>
                  )}
                </div>
                <div className={styles.authorMetaSub}>
                  {article.author.role} • {article.publishedAt} • {article.readTimeMinutes} min read
                </div>
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
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                {article.rating.count ? <>
                  <span>{article.rating.average}</span>
                  <span style={{ opacity: 0.7 }}>({article.rating.count})</span>
                </> : <span>New story</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className={styles.coverImageWrapper}>
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className={styles.coverImage}
            preload
            sizes="(max-width: 900px) 100vw, 900px"
            loader={loaderFor(article.coverImage)} unoptimized={remote(article.coverImage)}
          />
          {article.photoCredit && <small className={styles.coverCredit}>{article.photoCredit}</small>}
        </div>
      </header>

      {/* 4. Article Body Content */}
      <main className={styles.articleBodyLayout}>
        <div className={styles.articleBodyInner}>
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
                    aria-label={isPlayingAudio ? "Pause Audio" : "Play Audio"}
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
              <h3 className={styles.takeawaysTitle}>
                <Sparkles size={18} color="#ea580c" />
                <span>Learning Objectives & Key Takeaways</span>
              </h3>
              <span className={styles.takeawaysCounter}>
                {completedTakeawaysCount} / {defaultTakeaways.length} Completed
              </span>
            </div>

            <ul className={styles.takeawaysList}>
              {defaultTakeaways.map((takeaway, idx) => {
                const isChecked = Boolean(checkedTakeaways[idx]);
                return (
                  <li
                    key={idx}
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
                    <span className={styles.takeawayCheckbox}>
                      {isChecked && <Check size={12} />}
                    </span>
                    <span>{takeaway}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Builder metrics row */}
          {article.builderMetrics && (
            <div className={styles.builderMetricsCard}>
              <div className={styles.builderMetricsTitle}>
                🚀 {article.builderMetrics.metricLabel}
              </div>
              <div className={styles.builderMetricsContent}>
                {article.builderMetrics.metricValue}
              </div>
              {article.builderMetrics.sla && (
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "auto" }}>
                  Verified: {article.builderMetrics.sla}
                </span>
              )}
            </div>
          )}

          {/* Series banner */}
          {article.series && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.4rem 0.85rem", borderRadius: "9999px", color: "#1d4ed8", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "2rem" }}>
              <Layers size={14} />
              <span>Series: {article.series.title} (Part {article.series.part} of {article.series.totalParts})</span>
            </div>
          )}

          {/* Section 0: the free preview, or the full first section for members */}
          {visibleSections[0] && (
            <section>
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
            </section>
          )}

          {/* Member paywall: the rest of the story is never sent to non-members */}
          {!isSubscribed ? (
            <div className={`${styles.paywallCurtain} paywalled-story`}>
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
                  {access === "signin_required" && <Link href={`/sign-up?redirect=${encodeURIComponent(articlePath)}`} className={styles.paywallSecondaryBtn}>Create a free account</Link>}
                </div>}
              </div>
            </div>
          ) : memberContent && (
            /* Members: the rest of the story */
            <div>
              <div className={styles.unlockedBanner}>
                <CheckCircle2 size={16} color="#059669" />
                <span>Member access: the full story, code examples and discussion.</span>
              </div>

              {memberContent.sections.slice(1).map((section, idx) => {
                const prevParasCount = memberContent.sections
                  .slice(0, idx + 1)
                  .reduce((acc, s) => acc + s.paragraphs.length, 0);

                return (
                  <section key={idx + 1} style={{ marginBottom: "2.5rem" }}>
                    {section.heading && (
                      <h2 className={styles.proseHeading}>{section.heading}</h2>
                    )}

                    {section.image && (
                      <figure style={{ margin: "0 0 1.5rem" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- generated blog images live in Supabase Storage */}
                        <img src={section.image.src} alt={section.image.alt} loading="lazy" decoding="async" style={{ width: "100%", height: "auto", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: 14, display: "block" }} />
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

                  {section.bulletPoints && (
                    <ul className={styles.proseList}>
                      {section.bulletPoints.map((pt, ptIdx) => (
                        <li key={ptIdx}>{pt}</li>
                      ))}
                    </ul>
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
                <div style={{ background: "#f8fafc", borderLeft: "4px solid #ea580c", padding: "1.5rem", borderRadius: "0 12px 12px 0", margin: "2.5rem 0" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#ea580c", marginBottom: "0.5rem", letterSpacing: "0.06em" }}>
                    💡 Architectural Takeaway
                  </div>
                  <p style={{ margin: 0, fontStyle: "italic", color: "#334155", fontSize: "1.0625rem", lineHeight: 1.6 }}>
                    &ldquo;{memberContent.founderTakeaway}&rdquo;
                  </p>
                </div>
              )}

              {/* Developer Discussion Comments Thread */}
              <section className={styles.commentsContainer}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.5rem" }}>
                  <MessageSquare size={20} color="#ea580c" />
                  <span>Discussion ({comments.length})</span>
                </div>

                <form onSubmit={handleAddComment} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem" }}>
                  <Textarea
                    placeholder="Share your architectural insight, question, or experience with this tech stack..."
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    style={{ width: "100%", minHeight: "85px", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#ffffff", fontSize: "0.9375rem", color: "#0f172a", outline: "none", resize: "vertical" }}
                    required
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                    <Button
                      type="submit"
                      style={{ background: "#0f172a", color: "#ffffff", border: "none", fontSize: "0.875rem", fontWeight: 700, padding: "0.5rem 1.25rem", borderRadius: "9999px", cursor: "pointer" }}
                    >
                      Post Comment
                    </Button>
                  </div>
                </form>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "10px", padding: "1.15rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <Image
                            src={c.author.avatar}
                            alt={c.author.name}
                            width={32}
                            height={32}
                            style={{ borderRadius: "50%", objectFit: "cover" }}
                            unoptimized
                          />
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>{c.author.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>
                              {c.author.handle} • {c.createdAt}
                            </span>
                          </div>
                        </div>
                        {c.author.badge && (
                          <span style={{ fontSize: "0.6875rem", background: "#f1f5f9", color: "#475569", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
                            {c.author.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.9375rem", lineHeight: 1.55, color: "#334155", margin: 0 }}>
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Claps & Dev Reactions Floating Strip */}
          <div className={styles.engagementStrip}>
            <ClapButton slug={article.slug} claps={claps} label="Clap for this blog" />

            <div className={styles.devReactionsBig}>
              <button
                type="button"
                className={styles.devReactionBtnBig}
                onClick={() => handleReaction("heart")}
                title="Love this"
              >
                <span>❤️</span>
                <span>{userReactions.heart}</span>
              </button>
              <button
                type="button"
                className={styles.devReactionBtnBig}
                onClick={() => handleReaction("unicorn")}
                title="Unicorn"
              >
                <span>🦄</span>
                <span>{userReactions.unicorn}</span>
              </button>
              <button
                type="button"
                className={styles.devReactionBtnBig}
                onClick={() => handleReaction("rocket")}
                title="Rocket"
              >
                <span>🚀</span>
                <span>{userReactions.rocket}</span>
              </button>
              <button
                type="button"
                className={styles.devReactionBtnBig}
                onClick={() => handleReaction("mindblown")}
                title="Mindblown"
              >
                <span>🤯</span>
                <span>{userReactions.mindblown}</span>
              </button>
            </div>
          </div>

          {/* Previous & Next Story Navigation */}
          {(prevStory || nextStory) && (
            <div className={styles.storyNavGrid}>
              {prevStory ? (
                <Link href={`/tech-buzz/${prevStory.slug}`} className={styles.storyNavCard}>
                  <div className={styles.storyNavDirection}>
                    <ArrowLeft size={13} />
                    <span>Previous Story</span>
                  </div>
                  <h4 className={styles.storyNavTitle}>{prevStory.title}</h4>
                  <div className={styles.storyNavMeta}>
                    {techLogo(prevStory.techId) && (
                      <Image src={techLogo(prevStory.techId)!} alt="" width={15} height={15} style={{ borderRadius: 2 }} />
                    )}
                    <span>{prevStory.technology}</span>
                    <span>•</span>
                    <span>{prevStory.readTimeMinutes} min read</span>
                  </div>
                </Link>
              ) : <div />}

              {nextStory && (
                <Link href={`/tech-buzz/${nextStory.slug}`} className={styles.storyNavCard} style={{ textAlign: "right" }}>
                  <div className={styles.storyNavDirection} style={{ justifyContent: "flex-end" }}>
                    <span>Next Story</span>
                    <ArrowRight size={13} />
                  </div>
                  <h4 className={styles.storyNavTitle}>{nextStory.title}</h4>
                  <div className={styles.storyNavMeta} style={{ justifyContent: "flex-end" }}>
                    {techLogo(nextStory.techId) && (
                      <Image src={techLogo(nextStory.techId)!} alt="" width={15} height={15} style={{ borderRadius: 2 }} />
                    )}
                    <span>{nextStory.technology}</span>
                    <span>•</span>
                    <span>{nextStory.readTimeMinutes} min read</span>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Author Bottom Bio Card */}
          <div className={styles.authorBottomCard}>
            <Image
              src={article.author.avatar}
              alt={article.author.name}
              width={64}
              height={64}
              style={{ borderRadius: "50%", objectFit: "cover" }}
              loader={loaderFor(article.author.avatar)} unoptimized={remote(article.author.avatar)}
            />
            <div>
              <div style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Written By
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0.25rem 0 0.5rem" }}>
                {article.author.name}
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "#475569", lineHeight: 1.5, margin: 0 }}>
                {article.author.role}. Contributing deep-dive engineering architectures, cloud paradigms, and system design insights to Master Class Buddy.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 5. More from Master Class Buddy Blogs - Full Width Section */}
      <section className={styles.moreBlogsSection} aria-label="More tech buzz articles">
        <div className={styles.moreBlogsInner}>
          <div className={styles.moreBlogsHeader}>
            <h2 className={styles.moreBlogsTitle}>More from Master Class Buddy — Blogs</h2>
            <Link
              href="/tech-buzz"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem", fontWeight: 700, color: "#ea580c", textDecoration: "none" }}
            >
              <span>Explore all blogs</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.moreBlogsGrid}>
            {paginatedMoreArticles.map(rel => (
              <Link
                key={rel.id}
                href={`/tech-buzz/${rel.slug}`}
                className={styles.moreBlogCard}
              >
                <div className={styles.moreBlogCardCover}>
                  <Image
                    src={rel.coverImage}
                    alt={rel.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    loader={loaderFor(rel.coverImage)} unoptimized={remote(rel.coverImage)}
                  />
                  {techLogo(rel.techId) && (
                    <div style={{ position: "absolute", bottom: "8px", left: "8px", width: "28px", height: "28px", borderRadius: "8px", background: "#ffffff", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", zIndex: 2 }}>
                      <Image src={techLogo(rel.techId)!} alt="" width={18} height={18} />
                    </div>
                  )}
                </div>
                <div className={styles.moreBlogCardBody}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ea580c", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                    {rel.category}
                  </div>
                  <h3 className={styles.moreBlogCardTitle}>{rel.title}</h3>
                  <p className={styles.moreBlogCardSubtitle}>{rel.subtitle}</p>
                  <div className={styles.moreBlogCardFooter}>
                    <span>{rel.readTimeMinutes} min read</span>
                    <span>★ {rel.rating.average}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination controls for related blogs */}
          {totalMorePages > 1 && (
            <div className={styles.moreBlogsPagination} aria-label="Related blogs pagination">
              <button
                type="button"
                className={styles.moreBlogsPageBtn}
                onClick={() => setMoreBlogsPage(p => Math.max(1, p - 1))}
                disabled={moreBlogsPage === 1}
                aria-label="Previous page of blogs"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalMorePages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  className={`${styles.moreBlogsPageBtn} ${pageNum === moreBlogsPage ? styles.moreBlogsPageActive : ""}`}
                  onClick={() => setMoreBlogsPage(pageNum)}
                  aria-current={pageNum === moreBlogsPage ? "page" : undefined}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className={styles.moreBlogsPageBtn}
                onClick={() => setMoreBlogsPage(p => Math.min(totalMorePages, p + 1))}
                disabled={moreBlogsPage === totalMorePages}
                aria-label="Next page of blogs"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Move to top button in article view */}
          <div className={styles.articleMoveToTopRow}>
            <button
              type="button"
              className={styles.articleMoveToTopBtn}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Move to top"
            >
              <ArrowUp size={16} />
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
    </article>
  );
}
