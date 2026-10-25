"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Layers,
  Flame
} from "lucide-react";
import {
  type TechBuzzArticle,
  getTechBuzzArticles
} from "@/lib/tech-buzz-data";
import styles from "./tech-buzz-article.module.css";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  article: TechBuzzArticle;
}

export function TechBuzzArticleView({ article }: Props) {
  // Subscription status
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [claps, setClaps] = useState<number>(article.claps);
  const [userReactions, setUserReactions] = useState<{ heart: number; unicorn: number; rocket: number; mindblown: number }>(article.reactions);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
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
  const [comments, setComments] = useState(article.comments || []);
  const [newCommentText, setNewCommentText] = useState<string>("");

  // Check saved subscription status from localStorage
  useEffect(() => {
    try {
      const status = localStorage.getItem("mcb_member_status");
      if (status === "subscribed") {
        setIsSubscribed(true);
      }
      const savedClaps = localStorage.getItem(`masterclass:claps:${article.id}`);
      if (savedClaps) {
        setClaps(Number(savedClaps));
      }
      const savedBookmarks = localStorage.getItem("masterclass:tech-buzz-bookmarks");
      if (savedBookmarks) {
        const parsed = JSON.parse(savedBookmarks);
        if (parsed[article.id]) setBookmarked(true);
      }
    } catch {}

    // Also check account tier if user happens to be logged in
    if (typeof fetch !== "undefined") {
      fetch("/api/account?view=summary")
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (
            data?.account?.subscription?.status === "active" ||
            ["monthly", "yearly", "trial"].includes(data?.account?.tier)
          ) {
            setIsSubscribed(true);
          }
        })
        .catch(() => {});
    }
  }, [article.id]);

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

  // Direct platform subscription without signin/signup
  const handleSubscribePlatform = () => {
    setIsSubscribed(true);
    try {
      localStorage.setItem("mcb_member_status", "subscribed");
    } catch {}
    showToast("Subscribed! Full Medium-style deep dive content unlocked.");

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe_newsletter", email: "subscriber@masterclass.dev" })
      }).catch(() => {});
    }
  };

  const handleClap = () => {
    const next = claps + 1;
    setClaps(next);
    try {
      localStorage.setItem(`masterclass:claps:${article.id}`, String(next));
    } catch {}
    showToast("Clapped! 👏 Thank you for supporting the author.");

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clap", articleId: article.id, count: 1 })
      }).catch(() => {});
    }
  };

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

  const copyCode = (code: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      showToast("Code copied to clipboard!");
      setTimeout(() => setCopiedCodeId(null), 2500);
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
  const allParagraphs = useMemo(() => {
    const list: string[] = [];
    article.contentSections.forEach(sec => {
      sec.paragraphs.forEach(p => {
        list.push(p);
      });
    });
    return list;
  }, [article.contentSections]);

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

  // Story Navigation & More Blogs Pagination
  const allArticles = getTechBuzzArticles();
  const currentIndex = allArticles.findIndex(a => a.id === article.id);
  const prevStory = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextStory = currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  const MORE_PER_PAGE = 3;
  const otherArticles = allArticles.filter(a => a.id !== article.id);
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
          <Link href="/tech-buzz" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to Master Class Buddy - Blogs</span>
          </Link>

          <div className={styles.stickyNavRight}>
            {isSubscribed ? (
              <span className={styles.subscribedPill}>
                <CheckCircle2 size={13} />
                <span>Subscribed Member</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSubscribePlatform}
                className={styles.subscribeTopBtn}
              >
                <Sparkles size={13} />
                <span>Subscribe to Platform</span>
              </button>
            )}

            <button
              type="button"
              className={styles.clapBtnBig}
              onClick={handleClap}
              title="Clap for this story"
              style={{ padding: "0.35rem 0.85rem", fontSize: "0.8125rem" }}
            >
              <span>👏</span>
              <span>{claps}</span>
            </button>

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
            <span style={{ color: "#0f172a", fontWeight: 600 }}>{article.technology}</span>
          </nav>

          <div className={styles.categoryBadge}>
            <Flame size={12} />
            <span>{article.category}</span>
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
                unoptimized
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

              <div className={styles.starBadge} title={`Rated ${article.rating.average}/5`}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <span>{article.rating.average}</span>
                <span style={{ opacity: 0.7 }}>({article.rating.count})</span>
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
            priority
            unoptimized
          />
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

          {/* Builder Metrics Row (Indie Hackers) */}
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

          {/* Hashnode Series Banner */}
          {article.series && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.4rem 0.85rem", borderRadius: "9999px", color: "#1d4ed8", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "2rem" }}>
              <Layers size={14} />
              <span>Series: {article.series.title} (Part {article.series.part} of {article.series.totalParts})</span>
            </div>
          )}

          {/* Section 0: Free Teaser Section */}
          {article.contentSections[0] && (
            <section>
              {article.contentSections[0].heading && (
                <h2 className={styles.proseHeading}>{article.contentSections[0].heading}</h2>
              )}
              {article.contentSections[0].paragraphs.map((para, i) => {
                const isReading = isPlayingAudio && activeParagraphIndex === i;
                return (
                  <p
                    key={i}
                    className={`${styles.proseParagraph} ${isReading ? styles.activeReadingHighlight : ""}`}
                    onClick={() => playFromParagraph(i)}
                    title="Click to listen from here"
                    style={{ cursor: "pointer" }}
                  >
                    {para}
                  </p>
                );
              })}
              {article.contentSections[0].quote && (
                <blockquote className={styles.proseQuote}>
                  "{article.contentSections[0].quote.text}"
                  <cite>— {article.contentSections[0].quote.attribution}</cite>
                </blockquote>
              )}
            </section>
          )}

          {/* Medium Paywall or Unlocked Sections */}
          {!isSubscribed ? (
            <div className={styles.paywallCurtain}>
              <div className={styles.paywallFade} />

              {/* Blurred preview of upcoming sections */}
              {article.contentSections.length > 1 && (
                <div className={styles.paywallBlurredPreview} aria-hidden="true">
                  {article.contentSections.slice(1).map((sec, i) => (
                    <div key={i}>
                      {sec.heading && <h3 className={styles.proseHeading}>{sec.heading}</h3>}
                      <p className={styles.proseParagraph}>{sec.paragraphs.join(" ")}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Medium-style Paywall Card */}
              <div className={styles.paywallCard}>
                <div className={styles.paywallStarBadge}>
                  <Star size={14} fill="#fcd34d" color="#d97706" />
                  <span>Member-Only Story • Master Class Buddy Blogs</span>
                </div>

                <h2 className={styles.paywallHeading}>
                  Read the full story with a Master Class Buddy subscription
                </h2>

                <p className={styles.paywallText}>
                  This story is exclusive to subscribers of this platform. Subscribe to unlock unlimited access to all production architectures, benchmark code labs, system blueprints, and audio voiceovers.
                </p>

                <div className={styles.paywallActions}>
                  <button
                    type="button"
                    onClick={handleSubscribePlatform}
                    className={styles.paywallSubscribeBtn}
                  >
                    <Sparkles size={16} />
                    <span>Subscribe to Platform — Instant Access</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Subscribed: Render all full deep-dive sections */
            <div>
              <div className={styles.unlockedBanner}>
                <CheckCircle2 size={16} color="#059669" />
                <span>You have full subscriber access to this story and all code labs.</span>
              </div>

              {article.contentSections.slice(1).map((section, idx) => {
                const prevParasCount = article.contentSections
                  .slice(0, idx + 1)
                  .reduce((acc, s) => acc + s.paragraphs.length, 0);

                return (
                  <section key={idx + 1} style={{ marginBottom: "2.5rem" }}>
                    {section.heading && (
                      <h2 className={styles.proseHeading}>{section.heading}</h2>
                    )}

                    {section.paragraphs.map((p, pIdx) => {
                      const globalIdx = prevParasCount + pIdx;
                      const isReading = isPlayingAudio && activeParagraphIndex === globalIdx;

                      return (
                        <p
                          key={pIdx}
                          className={`${styles.proseParagraph} ${isReading ? styles.activeReadingHighlight : ""}`}
                          onClick={() => playFromParagraph(globalIdx)}
                          title="Click to listen from here"
                          style={{ cursor: "pointer" }}
                        >
                          {p}
                        </p>
                      );
                    })}

                  {/* Syntax Highlighted Code Snippet */}
                  {section.codeSnippet && (
                    <div className={styles.codeCard}>
                      <div className={styles.codeHeader}>
                        <span>{section.codeSnippet.filename ?? section.codeSnippet.language}</span>
                        <button
                          type="button"
                          onClick={() => copyCode(section.codeSnippet!.code, `code-${idx + 1}`)}
                          className={styles.codeCopyBtn}
                        >
                          {copiedCodeId === `code-${idx + 1}` ? (
                            <>
                              <Check size={14} color="#22c55e" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className={styles.codePre}>
                        <code>{section.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {section.bulletPoints && (
                    <ul style={{ paddingLeft: "1.5rem", margin: "1rem 0 1.5rem", lineHeight: 1.8, fontSize: "1.0625rem" }}>
                      {section.bulletPoints.map((pt, ptIdx) => (
                        <li key={ptIdx} style={{ marginBottom: "0.5rem" }}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}

              {/* Founder Architectural Takeaway */}
              {article.founderTakeaway && (
                <div style={{ background: "#f8fafc", borderLeft: "4px solid #ea580c", padding: "1.5rem", borderRadius: "0 12px 12px 0", margin: "2.5rem 0" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#ea580c", marginBottom: "0.5rem", letterSpacing: "0.06em" }}>
                    💡 Architectural Takeaway
                  </div>
                  <p style={{ margin: 0, fontStyle: "italic", color: "#334155", fontSize: "1.0625rem", lineHeight: 1.6 }}>
                    "{article.founderTakeaway}"
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
            <button
              type="button"
              className={styles.clapBtnBig}
              onClick={handleClap}
              title="Clap for this blog"
            >
              <span>👏</span>
              <span>{claps} Claps</span>
            </button>

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
              unoptimized
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
                    unoptimized
                  />
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
