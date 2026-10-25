"use client";

import { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Flame,
  Star,
  Search,
  Bookmark,
  Share2,
  TrendingUp,
  X,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown,
  Play,
  Pause,
  Volume2,
  MessageSquare,
  Radio,
  Layers,
  Award,
  ChevronUp,
  ChevronDown,
  Globe,
  ExternalLink,
  User,
  LayoutGrid,
  List,
  Brain,
  Cloud,
  Cpu,
  RotateCcw,
  RotateCw,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  type TechBuzzArticle,
  type ContentPlatformComparison,
  getTechBuzzArticles,
  getTrendingTechBuzzArticles,
  getStaffPicks,
  getAllCategories,
  getTopPlatformsComparison,
  getDiwaliFestiveSaleInfo,
  type FestiveSaleInfo
} from "@/lib/tech-buzz-data";
import { LanguageToggle } from "./language-toggle";
import {
  RadarFormatIcon,
  FirehoseFormatIcon,
  EditorialFormatIcon,
  CodeLabsFormatIcon,
  SeriesStacksFormatIcon,
  AudioDispatchFormatIcon,
  BlueprintsFormatIcon,
  PressFormatIcon,
  MatrixFormatIcon,
  getTechnologyBrandIcon
} from "./tech-buzz-brand-icons";
import { useLanguage } from "./language-provider";
import { type TranslationKey } from "@/lib/i18n";
import styles from "./tech-buzz.module.css";

type PlatformPerspective =
  | "all"
  | "daily-dev"
  | "medium"
  | "dev-to"
  | "hashnode"
  | "substack"
  | "ghost"
  | "indiehackers"
  | "matrix";

interface FormatInspirationItem {
  id: PlatformPerspective;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  badge: string;
  icon: (props: { size?: number }) => ReactNode;
  pillClass: string;
  activeClass: string;
}

const FORMAT_INSPIRATIONS: FormatInspirationItem[] = [
  { id: "all", titleKey: "formatRadarTitle", descKey: "formatRadarDesc", badge: "Real-Time", icon: RadarFormatIcon, pillClass: styles.pillRadar, activeClass: styles.pillRadarActive },
  { id: "daily-dev", titleKey: "formatFirehoseTitle", descKey: "formatFirehoseDesc", badge: "4.9★", icon: FirehoseFormatIcon, pillClass: styles.pillDailyDev, activeClass: styles.pillDailyDevActive },
  { id: "medium", titleKey: "formatEditorialTitle", descKey: "formatEditorialDesc", badge: "Editorial", icon: EditorialFormatIcon, pillClass: styles.pillMedium, activeClass: styles.pillMediumActive },
  { id: "dev-to", titleKey: "formatCodeLabsTitle", descKey: "formatCodeLabsDesc", badge: "❤️ 🦄 🚀", icon: CodeLabsFormatIcon, pillClass: styles.pillDevTo, activeClass: styles.pillDevToActive },
  { id: "hashnode", titleKey: "formatSeriesTitle", descKey: "formatSeriesDesc", badge: "Series", icon: SeriesStacksFormatIcon, pillClass: styles.pillHashnode, activeClass: styles.pillHashnodeActive },
  { id: "substack", titleKey: "formatAudioTitle", descKey: "formatAudioDesc", badge: "Voiceover", icon: AudioDispatchFormatIcon, pillClass: styles.pillSubstack, activeClass: styles.pillSubstackActive },
  { id: "indiehackers", titleKey: "formatBlueprintsTitle", descKey: "formatBlueprintsDesc", badge: "SLAs & Metrics", icon: BlueprintsFormatIcon, pillClass: styles.pillIndieHackers, activeClass: styles.pillIndieHackersActive },
  { id: "ghost", titleKey: "formatPressTitle", descKey: "formatPressDesc", badge: "Special Edition", icon: PressFormatIcon, pillClass: styles.pillGhost, activeClass: styles.pillGhostActive },
  { id: "matrix", titleKey: "formatMatrixTitle", descKey: "formatMatrixDesc", badge: "Taxonomy", icon: MatrixFormatIcon, pillClass: styles.pillMatrix, activeClass: styles.pillMatrixActive },
];

const SORT_OPTIONS: { value: "trending" | "upvotes" | "rating" | "claps" | "reactions" | "latest"; label: string }[] = [
  { value: "trending", label: "Trending (AI Ranked)" },
  { value: "upvotes", label: "Most Upvoted (daily.dev)" },
  { value: "rating", label: "Top Rated (Star Reviews)" },
  { value: "reactions", label: "Most Dev Reactions (dev.to)" },
  { value: "claps", label: "Most Clapped (Medium)" },
  { value: "latest", label: "Latest Published" },
];

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: (props: { size?: number; className?: string }) => ReactNode;
    pillClass: string;
    activeClass: string;
  }
> = {
  All: {
    icon: props => <Sparkles {...props} />,
    pillClass: styles.categoryPillAll,
    activeClass: styles.categoryPillAllActive,
  },
  "Artificial Intelligence": {
    icon: props => <Brain {...props} />,
    pillClass: styles.categoryPillAI,
    activeClass: styles.categoryPillAIActive,
  },
  "Full-Stack Development": {
    icon: props => <Layers {...props} />,
    pillClass: styles.categoryPillFullStack,
    activeClass: styles.categoryPillFullStackActive,
  },
  "Cloud & DevOps": {
    icon: props => <Cloud {...props} />,
    pillClass: styles.categoryPillCloud,
    activeClass: styles.categoryPillCloudActive,
  },
  "System Architecture": {
    icon: props => <Cpu {...props} />,
    pillClass: styles.categoryPillSystem,
    activeClass: styles.categoryPillSystemActive,
  },
  "Career & Growth": {
    icon: props => <TrendingUp {...props} />,
    pillClass: styles.categoryPillCareer,
    activeClass: styles.categoryPillCareerActive,
  },
};

/** initialArticles comes from the server's cached list; without it the feed starts from the bundled set and fetches. */
export function TechBuzzFeed({ initialArticles }: Readonly<{ initialArticles?: TechBuzzArticle[] }> = {}) {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState<TechBuzzArticle[]>(() => initialArticles ?? getTechBuzzArticles());
  const [serverSentArticles] = useState(() => initialArticles !== undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"trending" | "upvotes" | "rating" | "claps" | "reactions" | "latest">("trending");
  const [platformFilter, setPlatformFilter] = useState<PlatformPerspective>("all");
  const [layoutDensity, setLayoutDensity] = useState<"magazine" | "compact">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("masterclass:tech-buzz-layout");
        if (saved === "compact" || saved === "magazine") return saved;
      } catch {}
    }
    return "magazine";
  });
  const [formatPage, setFormatPage] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [blogsPerPage, setBlogsPerPage] = useState<number>(10);
  const [festiveSale, setFestiveSale] = useState<FestiveSaleInfo>(() => getDiwaliFestiveSaleInfo());

  useEffect(() => {
    setFestiveSale(getDiwaliFestiveSaleInfo(Date.now()));
  }, []);

  const updateLayoutDensity = (val: "magazine" | "compact") => {
    setLayoutDensity(val);
    try {
      localStorage.setItem("masterclass:tech-buzz-layout", val);
    } catch {}
  };

  const FORMATS_PER_PAGE = 3;
  const totalFormatPages = Math.ceil(FORMAT_INSPIRATIONS.length / FORMATS_PER_PAGE);
  const currentFormats = useMemo(() => {
    const start = (formatPage - 1) * FORMATS_PER_PAGE;
    return FORMAT_INSPIRATIONS.slice(start, start + FORMATS_PER_PAGE);
  }, [formatPage]);

  // Interaction states
  const [activeArticle, setActiveArticle] = useState<TechBuzzArticle | null>(null);
  const [ratingTargetArticle, setRatingTargetArticle] = useState<TechBuzzArticle | null>(null);
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [clapsState, setClapsState] = useState<Record<string, number>>({});
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [dislikedIds, setDislikedIds] = useState<Record<string, boolean>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [expandedQuickReads, setExpandedQuickReads] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Auth & Membership status
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Audio Voiceover State (Substack-style)
  const [playingAudioArticleId, setPlayingAudioArticleId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const [audioProgressSeconds, setAudioProgressSeconds] = useState<number>(0);

  // Newsletter Email input (Substack / Ghost style)
  const [newsletterEmail, setNewsletterEmail] = useState<string>("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Comment input (Dev.to / Indie Hackers style)
  const [newCommentText, setNewCommentText] = useState<string>("");

  // Load backend data and check account/membership
  useEffect(() => {
    try {
      const savedRatings = localStorage.getItem("masterclass:tech-buzz-ratings");
      if (savedRatings) setUserRatings(JSON.parse(savedRatings));
      const savedBookmarks = localStorage.getItem("masterclass:tech-buzz-bookmarks");
      if (savedBookmarks) setBookmarkedIds(JSON.parse(savedBookmarks));
      const savedClaps = localStorage.getItem("masterclass:tech-buzz-claps");
      if (savedClaps) setClapsState(JSON.parse(savedClaps));
      const savedUpvotes = localStorage.getItem("masterclass:tech-buzz-upvotes");
      if (savedUpvotes) setUpvotedIds(JSON.parse(savedUpvotes));
      const savedLikes = localStorage.getItem("masterclass:tech-buzz-likes");
      if (savedLikes) setLikedIds(JSON.parse(savedLikes));
      const savedDislikes = localStorage.getItem("masterclass:tech-buzz-dislikes");
      if (savedDislikes) setDislikedIds(JSON.parse(savedDislikes));
      const savedReactions = localStorage.getItem("masterclass:tech-buzz-reactions");
      if (savedReactions) setUserReactions(JSON.parse(savedReactions));

      const memberStatus = localStorage.getItem("mcb_member_status");
      if (memberStatus === "subscribed") {
        setIsSubscribed(true);
      }
    } catch {
      // LocalStorage access may fail in private mode
    }

    if (typeof fetch !== "undefined") {
      let active = true;

      // 1. Fetch current user account
      fetch("/api/account?view=summary")
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (!active || !data) return;
          if (data?.account?.email) {
            setUserEmail(data.account.email);
          }
          const isPaid =
            data?.account?.subscription?.status === "active" ||
            ["monthly", "yearly", "trial"].includes(data?.account?.tier) ||
            data?.preparations?.isSuperAdmin === true;
          if (isPaid) {
            setIsSubscribed(true);
          }
        })
        .catch(() => {});

      // 2. Fetch live Tech Buzz articles from cached backend (the server already sent them when it could)
      if (!serverSentArticles) fetch("/api/tech-buzz")
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (!active || !data?.articles) return;
          setArticles(data.articles);
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    }
  }, [serverSentArticles]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 3200);
  }, []);

  const toggleMemberSimulation = () => {
    setIsSubscribed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("mcb_member_status", next ? "subscribed" : "visitor");
      } catch {}
      showToast(next ? "Member access unlocked!" : "Switched to visitor mode (Paywall active)");
      return next;
    });
  };

  const handleSubscribePlatform = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsSubscribed(true);
    try {
      localStorage.setItem("mcb_member_status", "subscribed");
    } catch {}
    showToast("Subscribed! All blog contents are now fully unlocked.");

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe_newsletter", email: "subscriber@masterclass.dev" })
      }).catch(() => {});
    }
  };

  // 1. Like Action (boosts ranking dynamically)
  const handleLike = (articleId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentlyLiked = !!likedIds[articleId];
    const currentlyDisliked = !!dislikedIds[articleId];

    const nextLikes = { ...likedIds, [articleId]: !currentlyLiked };
    const nextDislikes = { ...dislikedIds, [articleId]: false };
    setLikedIds(nextLikes);
    setDislikedIds(nextDislikes);

    try {
      localStorage.setItem("masterclass:tech-buzz-likes", JSON.stringify(nextLikes));
      localStorage.setItem("masterclass:tech-buzz-dislikes", JSON.stringify(nextDislikes));
    } catch {}

    setArticles(current =>
      current.map(a => {
        if (a.id !== articleId) return a;
        const newLikes = Math.max(0, a.likes + (currentlyLiked ? -1 : 1));
        const newDislikes = currentlyDisliked ? Math.max(0, (a.dislikes || 0) - 1) : (a.dislikes || 0);
        return { ...a, likes: newLikes, dislikes: newDislikes, upvotes: newLikes };
      })
    );

    showToast(currentlyLiked ? "Like removed" : "Liked! Article boosted in trending rank 👍");

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", articleId, delta: currentlyLiked ? -1 : 1 })
      }).catch(() => {});
    }
  };

  // 1b. Dislike Action
  const handleDislike = (articleId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentlyLiked = !!likedIds[articleId];
    const currentlyDisliked = !!dislikedIds[articleId];

    const nextDislikes = { ...dislikedIds, [articleId]: !currentlyDisliked };
    const nextLikes = { ...likedIds, [articleId]: false };
    setDislikedIds(nextDislikes);
    setLikedIds(nextLikes);

    try {
      localStorage.setItem("masterclass:tech-buzz-dislikes", JSON.stringify(nextDislikes));
      localStorage.setItem("masterclass:tech-buzz-likes", JSON.stringify(nextLikes));
    } catch {}

    setArticles(current =>
      current.map(a => {
        if (a.id !== articleId) return a;
        const newDislikes = Math.max(0, (a.dislikes || 0) + (currentlyDisliked ? -1 : 1));
        const newLikes = currentlyLiked ? Math.max(0, a.likes - 1) : a.likes;
        return { ...a, likes: newLikes, dislikes: newDislikes, upvotes: newLikes };
      })
    );

    showToast(currentlyDisliked ? "Dislike removed" : "Disliked. Feedback recorded 👎");

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dislike", articleId, delta: currentlyDisliked ? -1 : 1 })
      }).catch(() => {});
    }
  };

  // 1c. Upvote Action (daily.dev style)
  const handleUpvote = (articleId: string, e?: React.MouseEvent) => {
    handleLike(articleId, e);
  };

  // 2. Dev.to Multi-Reactions
  const handleDevReaction = (
    articleId: string,
    reaction: "heart" | "unicorn" | "rocket" | "mindblown",
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    setUserReactions(prev => {
      const next = { ...prev, [articleId]: reaction };
      try {
        localStorage.setItem("masterclass:tech-buzz-reactions", JSON.stringify(next));
      } catch {}
      return next;
    });

    setArticles(current =>
      current.map(a => {
        if (a.id !== articleId) return a;
        const reactions = { ...a.reactions, [reaction]: (a.reactions[reaction] || 0) + 1 };
        return { ...a, reactions };
      })
    );

    const labels = { heart: "Loved ❤️", unicorn: "Unicorn 🦄", rocket: "Shipped 🚀", mindblown: "Mindblown 🤯" };
    showToast(`Reacted: ${labels[reaction]}`);

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react", articleId, reaction })
      }).catch(() => {});
    }
  };

  // 3. Medium Claps
  const handleClap = (articleId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentClaps = clapsState[articleId] || 0;
    const newClaps = currentClaps + 1;
    const nextClapsState = { ...clapsState, [articleId]: newClaps };
    setClapsState(nextClapsState);
    try {
      localStorage.setItem("masterclass:tech-buzz-claps", JSON.stringify(nextClapsState));
    } catch {}

    setArticles(current =>
      current.map(a => (a.id === articleId ? { ...a, claps: a.claps + 1 } : a))
    );
    if (activeArticle?.id === articleId) {
      setActiveArticle(prev => (prev ? { ...prev, claps: prev.claps + 1 } : null));
    }
    showToast("Clapped! Thank you for supporting this author.");

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clap", articleId, count: 1 })
      }).catch(() => {});
    }
  };

  // 4. Star Rating Submission
  const handleRatingSubmit = (articleId: string, ratingValue: number) => {
    const nextRatings = { ...userRatings, [articleId]: ratingValue };
    setUserRatings(nextRatings);
    try {
      localStorage.setItem("masterclass:tech-buzz-ratings", JSON.stringify(nextRatings));
    } catch {}

    setArticles(current =>
      current.map(article => {
        if (article.id !== articleId) return article;
        const currentCount = article.rating.count;
        const currentAvg = article.rating.average;
        const newCount = currentCount + 1;
        const newAvg = Number(((currentAvg * currentCount + ratingValue) / newCount).toFixed(2));
        const breakdownKey = ratingValue as 1 | 2 | 3 | 4 | 5;
        return {
          ...article,
          rating: {
            average: newAvg,
            count: newCount,
            breakdown: {
              ...article.rating.breakdown,
              [breakdownKey]: (article.rating.breakdown[breakdownKey] || 0) + 1
            }
          }
        };
      })
    );

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rate", articleId, rating: ratingValue })
      }).catch(() => {});
    }

    showToast(`Rated ${ratingValue} stars! Thank you for rating.`);
    setRatingTargetArticle(null);
  };

  // 5. Bookmark Toggle
  const toggleBookmark = (articleId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = { ...bookmarkedIds, [articleId]: !bookmarkedIds[articleId] };
    setBookmarkedIds(next);
    try {
      localStorage.setItem("masterclass:tech-buzz-bookmarks", JSON.stringify(next));
    } catch {}
    showToast(next[articleId] ? "Article saved to reading list" : "Removed from reading list");
  };

  // 6. Share Link
  const shareArticle = (article: TechBuzzArticle, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/tech-buzz?slug=${article.slug}` : "";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!");
    }
  };

  // 7. Substack / Ghost Newsletter Signup
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      showToast("Please enter a valid email address.");
      return;
    }
    setNewsletterSubscribed(true);
    showToast("Subscribed! Welcome to MasterClass Tech Dispatch.");

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe_newsletter", email: newsletterEmail })
      }).catch(() => {});
    }
  };

  // 8. Dev.to / Indie Hackers Comment Submission
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeArticle) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: {
        name: userEmail ? userEmail.split("@")[0] : "Community Developer",
        role: "Engineer",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        handle: userEmail ? `@${userEmail.split("@")[0]}` : "@developer",
        badge: "Verified Member"
      },
      text: newCommentText.trim(),
      createdAt: "Just now",
      likes: 1
    };

    const updatedComments = [newComment, ...(activeArticle.comments || [])];
    const updatedCount = updatedComments.length;

    setActiveArticle(prev => (prev ? { ...prev, comments: updatedComments, commentsCount: updatedCount } : null));
    setArticles(current =>
      current.map(a => (a.id === activeArticle.id ? { ...a, comments: updatedComments, commentsCount: updatedCount } : a))
    );

    if (typeof fetch !== "undefined") {
      fetch("/api/tech-buzz/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          articleId: activeArticle.id,
          text: newCommentText.trim(),
          authorName: userEmail ? userEmail.split("@")[0] : "Community Developer"
        })
      }).catch(() => {});
    }

    setNewCommentText("");
    showToast("Comment posted to developer thread!");
  };

  // 9. Interactive Audio Voiceover Engine (Web Speech Synthesis + Substack Player)
  const activeAudioArticle = useMemo(
    () => (playingAudioArticleId ? articles.find(a => a.id === playingAudioArticleId) || null : null),
    [playingAudioArticleId, articles]
  );

  const formatAudioTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Audio Speech Synthesis
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!activeAudioArticle || !isPlayingAudio) {
      window.speechSynthesis.pause();
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = `${activeAudioArticle.title}. ${activeAudioArticle.subtitle}. Key highlights: ${activeAudioArticle.summaryBullets.join(". ")}. Written by ${activeAudioArticle.author.name}.`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = audioSpeed;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel"))) || voices.find(v => v.lang.startsWith("en"));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setAudioProgressSeconds(0);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [activeAudioArticle, isPlayingAudio, audioSpeed]);

  // Audio Timer Ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingAudio && activeAudioArticle) {
      interval = setInterval(() => {
        setAudioProgressSeconds(prev => {
          const maxSec = (activeAudioArticle.readTimeMinutes || 5) * 60;
          if (prev >= maxSec) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / audioSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAudio, activeAudioArticle, audioSpeed]);

  const toggleAudioPlayPause = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.pause();
        setIsPlayingAudio(false);
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        setIsPlayingAudio(true);
      }
    }
  };

  const seekAudio = (newSeconds: number) => {
    if (!activeAudioArticle) return;
    const maxSec = (activeAudioArticle.readTimeMinutes || 5) * 60;
    const clamped = Math.max(0, Math.min(newSeconds, maxSec));
    setAudioProgressSeconds(clamped);
  };

  const cycleAudioSpeed = () => {
    const nextSpeed = audioSpeed === 1 ? 1.25 : audioSpeed === 1.25 ? 1.5 : audioSpeed === 1.5 ? 2 : audioSpeed === 2 ? 0.75 : 1;
    setAudioSpeed(nextSpeed);
    showToast(`Voiceover speed: ${nextSpeed}x`);
  };

  const closeAudioPlayer = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setPlayingAudioArticleId(null);
    setAudioProgressSeconds(0);
  };

  // Audio voiceover trigger
  const playAudioForArticle = (article: TechBuzzArticle, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playingAudioArticleId === article.id) {
      toggleAudioPlayPause();
    } else {
      setPlayingAudioArticleId(article.id);
      setIsPlayingAudio(true);
      setAudioProgressSeconds(0);
      showToast(`Now playing audio voiceover: ${article.title}`);
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

  // Filter & Sort articles
  const categories = useMemo(() => getAllCategories(), []);
  const trendingArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => {
        const scoreB = (b.likes - (b.dislikes || 0)) * 2 + b.claps + (b.rating.average * 100);
        const scoreA = (a.likes - (a.dislikes || 0)) * 2 + a.claps + (a.rating.average * 100);
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [articles]);
  const staffPicks = useMemo(() => getStaffPicks(), []);
  const platformsComparison = useMemo(() => getTopPlatformsComparison(), []);

  const filteredArticles = useMemo(() => {
    let result = articles.filter(article => {
      const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.subtitle.toLowerCase().includes(q) ||
        article.technology.toLowerCase().includes(q) ||
        article.tags.some(t => t.toLowerCase().includes(q)) ||
        article.author.name.toLowerCase().includes(q);

      const matchesPlatform =
        platformFilter === "all" ||
        platformFilter === "matrix" ||
        (platformFilter === "daily-dev" && article.rankingScore >= 95) ||
        (platformFilter === "medium" && (article.featured || article.claps > 2000)) ||
        (platformFilter === "dev-to" && article.commentsCount > 20) ||
        (platformFilter === "hashnode" && !!article.series) ||
        (platformFilter === "substack" && !!article.audioVoiceover) ||
        (platformFilter === "ghost" && (article.featured || article.readTimeMinutes >= 8)) ||
        (platformFilter === "indiehackers" && !!article.builderMetrics);

      return matchesCategory && matchesSearch && matchesPlatform;
    });

    return result.sort((a, b) => {
      if (sortBy === "upvotes") return b.upvotes - a.upvotes;
      if (sortBy === "rating") return b.rating.average - a.rating.average;
      if (sortBy === "claps") return b.claps - a.claps;
      if (sortBy === "reactions") {
        const sumA = a.reactions.heart + a.reactions.unicorn + a.reactions.rocket + a.reactions.mindblown;
        const sumB = b.reactions.heart + b.reactions.unicorn + b.reactions.rocket + b.reactions.mindblown;
        return sumB - sumA;
      }
      if (sortBy === "latest") return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
      return (a.trendingRank ?? 99) - (b.trendingRank ?? 99);
    });
  }, [articles, selectedCategory, searchQuery, sortBy, platformFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / blogsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedArticles = useMemo(() => {
    const start = (safeCurrentPage - 1) * blogsPerPage;
    return filteredArticles.slice(start, start + blogsPerPage);
  }, [filteredArticles, safeCurrentPage, blogsPerPage]);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(validPage);
    if (typeof window !== "undefined") {
      const target = document.getElementById("tech-buzz-feed-start");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const currentlyPlayingArticle = useMemo(
    () => articles.find(a => a.id === playingAudioArticleId) || null,
    [articles, playingAudioArticleId]
  );

  const currentArticleIndex = useMemo(() => {
    if (!activeArticle) return -1;
    return articles.findIndex(a => a.id === activeArticle.id);
  }, [articles, activeArticle]);

  const prevArticle = useMemo(() => {
    if (currentArticleIndex <= 0) return null;
    return articles[currentArticleIndex - 1];
  }, [articles, currentArticleIndex]);

  const nextArticle = useMemo(() => {
    if (currentArticleIndex < 0 || currentArticleIndex >= articles.length - 1) return null;
    return articles[currentArticleIndex + 1];
  }, [articles, currentArticleIndex]);

  const nextRecommendedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return articles.filter(a => a.id !== activeArticle.id).slice(0, 3);
  }, [articles, activeArticle]);

  const navigateToArticle = (target: TechBuzzArticle) => {
    setActiveArticle(target);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* 1. Top Bar Navigation with Auth & App Dashboard Links */}
      <nav className={styles.buzzTopNav} aria-label="Tech Buzz navigation">
        <div className={styles.buzzTopNavInner}>
          <Link href="/tech-buzz" className={styles.buzzBrandLink}>
            <div className={styles.buzzLogoIcon}>
              <Flame size={18} />
            </div>
            <div className={styles.buzzBrandText}>
              <span className={styles.buzzBrandName}>Tech Buzz</span>
              <span className={styles.buzzBrandTagline}>Master Class Buddy</span>
            </div>
          </Link>

          <div className={styles.buzzAuthActions}>
            <LanguageToggle size="sm" persist={false} />
            {isSubscribed ? (
              <div className={styles.buzzSubscribedBadge} title="Unlimited subscriber access to all tech blogs">
                <CheckCircle2 size={14} color="#059669" />
                <span>Subscribed Member</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubscribePlatform}
                className={styles.buzzSubscribeBtn}
                title="Subscribe to unlock all blogs"
              >
                <Sparkles size={14} />
                <span>
                  {festiveSale.active
                    ? `Subscribe to Platform — ₹${festiveSale.discountedMonthly}/mo (25% Diwali OFF)`
                    : "Subscribe to Platform"}
                </span>
              </button>
            )}
            <Link href="/dashboard" className={styles.buzzDashboardLink}>
              <span>Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Diwali Festive Discount Announcement Banner */}
      {festiveSale.active && !isSubscribed && (
        <aside className={styles.diwaliSaleBanner} aria-label="Diwali festive discount announcement">
          <div className={styles.diwaliSaleLeft}>
            <span className={styles.diwaliDiyasIcon}>🪔</span>
            <span className={styles.diwaliTag}>DIWALI FESTIVE SALE · 25% OFF</span>
            <span>
              Unlock all engineering deep dives &amp; code labs for only{" "}
              <strong style={{ color: "#fef08a" }}>₹{festiveSale.discountedMonthly}/month</strong> (normally ₹{festiveSale.regularMonthly}/mo)
            </span>
          </div>
          <div className={styles.diwaliSaleRight}>
            <span className={styles.festiveDateBadge}>Active till {festiveSale.validTill}</span>
            <button
              type="button"
              onClick={handleSubscribePlatform}
              className={styles.diwaliSaleCtaBtn}
            >
              <Sparkles size={13} />
              <span>Claim 25% Diwali Discount</span>
            </button>
          </div>
        </aside>
      )}

      {/* 2. Hero Editorial Banner */}
      <header className={styles.heroBanner}>
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>
            <Flame size={15} />
            <span>Master Class Buddy • Blogs</span>
          </div>

          <h1 className={styles.heroTitle}>
            Stay curious. Discover deep technology blogs rated by developers.
          </h1>

          <p className={styles.heroSubtitle}>
            Architectural deep dives, benchmark dissections, production blueprints, and systems insights. Curated with zero-noise engineering precision, typographic clarity, interactive code sandboxes, audio voiceovers, and verified production metrics.
          </p>

          <div className={styles.heroStatsRow}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>34,200+</span>
              <span className={styles.heroStatLabel}>Active Developers</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>4.94 ★</span>
              <span className={styles.heroStatLabel}>Average Article Trust Score</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>100% Zero-Noise</span>
              <span className={styles.heroStatLabel}>Engineering-First Curation</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Substack-Style Voiceover Audio Player (Floating when active) */}
      {currentlyPlayingArticle && (
        <aside className={styles.audioPlayerBar} aria-label="Audio voiceover player">
          <div className={styles.audioPlayerInner}>
            <div className={styles.audioPlayerLeft}>
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={styles.audioPlayBtn}
                aria-label={isPlayingAudio ? "Pause Audio" : "Play Audio"}
              >
                {isPlayingAudio ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className={styles.audioMeta}>
                <h2 className={styles.audioTitle}>{currentlyPlayingArticle.title}</h2>
                <p className={styles.audioSubtitle}>
                  Read by {currentlyPlayingArticle.audioVoiceover?.narrator || currentlyPlayingArticle.author.name} • MasterClass Voiceover
                </p>
              </div>
            </div>

            <div className={styles.audioWaveform} aria-hidden="true">
              {(currentlyPlayingArticle.audioVoiceover?.waveformSeed || [35, 60, 85, 40, 95, 70, 50, 90, 65, 45, 80]).map((h, i) => (
                <div
                  key={i}
                  className={`${styles.audioWaveBar} ${isPlayingAudio ? styles.audioWaveBarActive : ""}`}
                  style={{
                    height: `${h * 0.28}px`,
                    animationDelay: `${i * 0.08}s`
                  }}
                />
              ))}
            </div>

            <div className={styles.audioPlayerRight}>
              <span className={styles.audioTimeText}>
                {Math.floor(audioProgressSeconds / 60)}:
                {String(audioProgressSeconds % 60).padStart(2, "0")} / 07:00
              </span>
              <button
                type="button"
                className={styles.audioSpeedBtn}
                onClick={() => setAudioSpeed(s => (s === 1 ? 1.25 : s === 1.25 ? 1.5 : 1))}
              >
                {audioSpeed}x
              </button>
              <button
                type="button"
                className={styles.audioCloseBtn}
                onClick={() => {
                  setIsPlayingAudio(false);
                  setPlayingAudioArticleId(null);
                }}
                aria-label="Close audio player"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 4. Format & Architectural Inspiration Wrapped Card (No Third-Party Names, No Horizontal Scrollbar & Light Color Pills) */}
      <section className={styles.platformTabsSection} aria-label="Format and architectural inspiration">
        <div className={styles.platformPerspectiveCard}>
          <div className={styles.platformTabsHeader}>
            <div className={styles.platformTabsLabel}>
              <Layers size={15} color="#ea580c" />
              <span>{t("formatInspirationTitle")}</span>
            </div>

            <div className={styles.creativeLayoutToggle}>
              <button
                type="button"
                className={`${styles.layoutOptionBtn} ${layoutDensity === "magazine" ? styles.layoutOptionActive : ""}`}
                onClick={() => updateLayoutDensity("magazine")}
                aria-label="Magazine card view"
                aria-pressed={layoutDensity === "magazine"}
              >
                <LayoutGrid size={13} />
                <span>{t("formatViewMagazine")}</span>
              </button>
              <button
                type="button"
                className={`${styles.layoutOptionBtn} ${layoutDensity === "compact" ? styles.layoutOptionActive : ""}`}
                onClick={() => updateLayoutDensity("compact")}
                aria-label="Compact zero-noise list view"
                aria-pressed={layoutDensity === "compact"}
              >
                <List size={13} />
                <span>{t("formatViewZeroNoise")}</span>
              </button>
            </div>
          </div>

          {layoutDensity === "magazine" ? (
            <div className={styles.formatGridMagazine}>
              {currentFormats.map(item => {
                const Icon = item.icon;
                const isActive = platformFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.formatCardMagazine} ${isActive ? styles.formatCardActive : ""}`}
                    onClick={() => setPlatformFilter(item.id)}
                    aria-pressed={isActive}
                  >
                    <div className={styles.formatCardTop}>
                      <div className={styles.formatCardIconWrap}>
                        <Icon size={18} />
                      </div>
                      {item.badge && <span className={styles.formatCardBadge}>{item.badge}</span>}
                    </div>
                    <div>
                      <h3 className={styles.formatCardTitle}>{t(item.titleKey)}</h3>
                      <p className={styles.formatCardDesc}>{t(item.descKey)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.platformTabsList}>
              {currentFormats.map(item => {
                const Icon = item.icon;
                const isActive = platformFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.platformTab} ${item.pillClass} ${isActive ? item.activeClass : ""}`}
                    onClick={() => setPlatformFilter(item.id)}
                    aria-pressed={isActive}
                  >
                    <Icon size={16} />
                    <span>{t(item.titleKey)}</span>
                    {item.badge && <span className={styles.platformBadgeMini}>{item.badge}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Format Inspirations Pagination Controls */}
          <div className={styles.formatPagination} role="navigation" aria-label="Format inspirations pagination">
            <span className={styles.formatPaginationInfo}>
              {t("paginationPageOf")
                .replace("{current}", String(formatPage))
                .replace("{total}", String(totalFormatPages))}
            </span>
            <div className={styles.formatPaginationActions}>
              <button
                type="button"
                className={styles.formatPageNavBtn}
                disabled={formatPage <= 1}
                onClick={() => setFormatPage(p => Math.max(1, p - 1))}
                aria-label="Previous format inspirations page"
              >
                ‹ {t("paginationPrevious")}
              </button>
              {Array.from({ length: totalFormatPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.formatPageNumBtn} ${formatPage === p ? (styles.formatPageActive || styles.formatPageNumActive) : ""}`}
                  onClick={() => setFormatPage(p)}
                  aria-current={formatPage === p ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className={styles.formatPageNavBtn}
                disabled={formatPage >= totalFormatPages}
                onClick={() => setFormatPage(p => Math.min(totalFormatPages, p + 1))}
                aria-label="Next format inspirations page"
              >
                {t("paginationNext")} ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Platform Comparison Matrix Table (Replicating User's Attached Screenshot) */}
      {platformFilter === "matrix" && (
        <section className={styles.platformsTableSection} aria-label="Platform comparison matrix">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <Award size={18} color="#ea580c" />
              <span>The Top Developer Content &amp; Blogging Platforms</span>
            </div>
          </div>

          <div className={styles.platformsTableWrapper}>
            <table className={styles.platformsTable}>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Type</th>
                  <th>Focus</th>
                  <th>Est. Trust Rating</th>
                  <th>Core Strength</th>
                  <th>Filter Format</th>
                </tr>
              </thead>
              <tbody>
                {platformsComparison.map(plat => (
                  <tr key={plat.name}>
                    <td>
                      <div className={styles.platformNameCell}>
                        <ExternalLink size={13} color="#64748b" />
                        <span>{plat.name}</span>
                      </div>
                    </td>
                    <td>{plat.type}</td>
                    <td>{plat.focus}</td>
                    <td>
                      <div className={styles.trustRatingCell}>
                        <span className={styles.starsGold}>★★★★★</span>
                        <span>{plat.trustRating} / 5</span>
                      </div>
                    </td>
                    <td>{plat.coreStrength}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.platformActionBtn}
                        onClick={() => {
                          const map: Record<string, PlatformPerspective> = {
                            "daily.dev": "daily-dev",
                            "Dev.to": "dev-to",
                            "Hashnode": "hashnode",
                            "Medium": "medium",
                            "Substack": "substack",
                            "Ghost.org": "ghost",
                            "Indie Hackers": "indiehackers"
                          };
                          setPlatformFilter(map[plat.name] || "all");
                          showToast(`Filtered feed to ${plat.name} inspired format`);
                        }}
                      >
                        Explore Format
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. Trending on Tech Buzz Strip (Medium & Daily.dev hybrid) */}
      {platformFilter !== "matrix" && trendingArticles.length > 0 && (
        <section className={styles.trendingSection} aria-label="Trending technology blogs">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <TrendingUp size={18} color="#ea580c" />
              <span>Trending on Tech Buzz</span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "none", fontWeight: 600 }}>
              Updated hourly based on developer upvotes &amp; star ratings
            </span>
          </div>

          <div className={styles.trendingGrid}>
            {trendingArticles.map((article, idx) => (
              <article
                key={article.id}
                className={styles.trendingCard}
                onClick={() => setActiveArticle(article)}
              >
                <span className={styles.trendingRank}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className={styles.trendingBody}>
                  <div className={styles.trendingHeaderRow}>
                    <div className={styles.trendingMeta}>
                      <span className={styles.authorAvatarSmallWrapper}>
                        <Image
                          src={article.author.avatar}
                          alt={article.author.name}
                          width={22}
                          height={22}
                          className={styles.authorAvatarSmall}
                          unoptimized
                        />
                      </span>
                      <span className={styles.authorNameSmall}>{article.author.name}</span>
                      <span>•</span>
                      <span>{article.readTimeMinutes} min read</span>
                    </div>

                    <span
                      className={styles.trendingCircularIcon}
                      title={`${article.technology} • ${article.source.name}`}
                      style={{
                        backgroundColor: `${article.techBadgeColor}15`,
                        borderColor: `${article.techBadgeColor}40`,
                        color: article.techBadgeColor
                      }}
                    >
                      {getTechnologyBrandIcon(article.technology, 16)}
                    </span>
                  </div>

                  <h3 className={styles.trendingTitle} title={article.title}>{article.title}</h3>

                  <div className={styles.trendingFooter}>
                    <button
                      type="button"
                      className={styles.starRatingBadge}
                      onClick={e => {
                        e.stopPropagation();
                        setRatingTargetArticle(article);
                      }}
                      title={`Rated ${article.rating.average} / 5 (${article.rating.count} ratings)`}
                    >
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span>{article.rating.average}</span>
                      <span style={{ opacity: 0.7 }}>({article.rating.count})</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.trendingActionBtn} ${likedIds[article.id] ? styles.trendingActionLikeActive : ""}`}
                      onClick={e => handleLike(article.id, e)}
                      title="Like article (boosts in trending rank)"
                    >
                      <ThumbsUp size={11} />
                      <span>{article.likes}</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.trendingActionBtn} ${dislikedIds[article.id] ? styles.trendingActionDislikeActive : ""}`}
                      onClick={e => handleDislike(article.id, e)}
                      title="Dislike article"
                    >
                      <ThumbsDown size={11} />
                      <span>{article.dislikes || 0}</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.trendingActionBtn} ${styles.trendingClapBtn} ${(clapsState[article.id] || 0) > 0 ? styles.trendingActionLikeActive : ""}`}
                      onClick={e => handleClap(article.id, e)}
                      title="Clap for this article"
                    >
                      <span>👏</span>
                      <span>{article.claps}</span>
                    </button>

                    <span className={styles.zeroNoiseBadge}>
                      {article.rankingScore} Score
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 7. Search, Categories, and Sorting Bar with shadcn UI Controls */}
      <section id="tech-buzz-feed-start" className={styles.filterBarSection} aria-label="Search and filter controls">
        <div className={styles.filterControlsRow}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <Input
              type="text"
              aria-label="Search tech blogs"
              placeholder="Search by technology, author, framework, architecture..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className={styles.searchClearBtn}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className={styles.sortWrapper}>
            <label htmlFor="techbuzz-sort" className={styles.sortLabel}>
              Sort:
            </label>
            <Select
              value={sortBy}
              onValueChange={val => {
                if (val) {
                  setSortBy(val as any);
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger id="techbuzz-sort" aria-label="Sort tech blogs" className={styles.shadcnSortTrigger}>
                <SelectValue placeholder="Sort..." />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false} className={styles.shadcnSortContent}>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className={styles.shadcnSortItem}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Pills with Distinct Light Pastel Colors & Relevant Icons */}
        <div className={styles.categoryPills} role="tablist">
          {categories.map(cat => {
            const conf = CATEGORY_CONFIG[cat] ?? {
              icon: props => <Sparkles {...props} />,
              pillClass: styles.categoryPillAll,
              activeClass: styles.categoryPillAllActive,
            };
            const Icon = conf.icon;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.categoryPill} ${conf.pillClass} ${isSelected ? conf.activeClass : ""}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
              >
                <Icon size={13} className={styles.categoryPillIcon} />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 8. Main Feed & Sidebar */}
      <main className={styles.mainLayout} role="main">
        <div className={styles.feedContainer}>
          {filteredArticles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#64748b" }}>
              <BookOpen size={48} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
              <h2 style={{ fontSize: "1.25rem", color: "#0f172a" }}>No tech blogs found</h2>
              <p>Try clearing your filters or search keyword to see all community articles.</p>
              <button
                type="button"
                className={styles.categoryPill}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setPlatformFilter("all");
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : layoutDensity === "compact" ? (
            <div className={styles.compactList}>
              {paginatedArticles.map(article => {
                const isActive = activeArticle?.id === article.id;
                return (
                  <div
                    key={article.id}
                    className={`${styles.compactRow} ${isActive ? styles.compactRowActive : ""}`}
                    onClick={() => setActiveArticle(article)}
                  >
                    {/* Left: Upvote counter button */}
                    <div className={styles.compactVoteCol}>
                      <button
                        type="button"
                        className={`${styles.dailyUpvoteBtn} ${upvotedIds[article.id] ? styles.dailyUpvoteActive : ""}`}
                        onClick={e => handleUpvote(article.id, e)}
                        aria-label={`Upvote article (${article.upvotes})`}
                      >
                        <ChevronUp size={14} />
                        <span>{article.upvotes}</span>
                      </button>
                    </div>

                    {/* Center: Title & Metadata with strict min-width: 0 to eliminate collision */}
                    <div className={styles.compactInfoCol}>
                      <h3 className={styles.compactTitle} title={article.title}>
                        {article.title}
                      </h3>
                      <div className={styles.compactMetaRow}>
                        <span className={styles.compactTechBadge}>
                          {getTechnologyBrandIcon(article.technology, 13)}
                          <span>{article.technology}</span>
                        </span>
                        <span className={styles.compactDot}>•</span>
                        <span>{article.readTimeMinutes}m read</span>
                        <span className={styles.compactDot}>•</span>
                        <span className={styles.compactRating}>★ {article.rating.average}</span>
                      </div>
                    </div>

                    {/* Right: Dedicated actions column (Audio voiceover & Bookmark) */}
                    <div className={styles.compactActionsCol}>
                      <button
                        type="button"
                        className={styles.listenBtn}
                        onClick={e => playAudioForArticle(article, e)}
                        title={`Listen to ${article.readTimeMinutes}m voiceover`}
                      >
                        <Volume2 size={13} />
                        <span>Audio</span>
                      </button>
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        onClick={e => toggleBookmark(article.id, e)}
                        aria-label="Bookmark"
                        title={bookmarkedIds[article.id] ? "Saved in reading list" : "Save to reading list"}
                      >
                        <Bookmark size={16} fill={bookmarkedIds[article.id] ? "#ea580c" : "none"} color={bookmarkedIds[article.id] ? "#ea580c" : "#475569"} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.magazineGrid}>
              {paginatedArticles.map(article => {
                const userRating = userRatings[article.id];
                const isSaved = bookmarkedIds[article.id];
                const isQuickReadOpen = expandedQuickReads[article.id];

                return (
                  <article key={article.id} className={styles.articleCard}>
                    {/* Header: Author + Tags + Platform Pills */}
                    <div className={styles.articleCardHeader}>
                      <div className={styles.authorMetaGroup}>
                        <Image
                          src={article.author.avatar}
                          alt={article.author.name}
                          width={38}
                          height={38}
                          className={styles.authorAvatarSmall}
                          unoptimized
                        />
                        <div className={styles.authorMetaInfo}>
                          <span className={styles.authorNameLink}>{article.author.name}</span>
                          <span className={styles.authorRoleText}>{article.author.role}</span>
                        </div>
                      </div>

                      <div className={styles.platformPillsGroup}>
                        {article.series && (
                          <span className={styles.hashnodeSeriesPill}>
                            {getTechnologyBrandIcon(article.technology, 12)}
                            <span>{article.series.title} #{article.series.part}</span>
                          </span>
                        )}

                        {isSubscribed ? (
                          <span className={`${styles.memberBadge} ${styles.memberAccessUnlocked}`}>
                            <CheckCircle2 size={11} />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className={styles.memberBadge}>
                            <Star size={11} fill="#d97706" color="#d97706" />
                            <span>Member-only</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body: Title, Subtitle & Cover Image */}
                    <div
                      className={styles.cardBodyGrid}
                      onClick={() => setActiveArticle(article)}
                    >
                      <div>
                        <h2 className={styles.cardTitle}>{article.title}</h2>
                        <p className={styles.cardSubtitle}>{article.subtitle}</p>

                        {/* Indie Hackers Builder Metrics */}
                        {article.builderMetrics && (
                          <div className={styles.builderMetricsRow}>
                            <Award size={13} className={styles.builderMetricsIcon} />
                            <span>{article.builderMetrics.metricLabel}:</span>
                            <span className={styles.builderMetricsValue}>{article.builderMetrics.metricValue}</span>
                          </div>
                        )}

                        {/* Hashnode Tech Stack chips */}
                        {article.techStack && (
                          <div className={styles.techStackRow}>
                            {article.techStack.map(stack => (
                              <span key={stack} className={styles.techStackChip}>{stack}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={styles.cardCoverWrapper}>
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          className={styles.cardCoverImage}
                          unoptimized
                        />
                      </div>
                    </div>

                    {/* Quick Read / TL;DR Drawer (daily.dev style) */}
                    {isQuickReadOpen && article.summaryBullets && (
                      <div className={styles.quickReadDrawer}>
                        <div className={styles.quickReadHeading}>⚡ Zero-Noise Quick Read Takeaways</div>
                        <ul className={styles.quickReadList}>
                          {article.summaryBullets.map((bullet, bIdx) => (
                            <li key={bIdx}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer Actions: Upvote, Reactions, Claps, Rating, Audio, Share */}
                    <div className={styles.cardFooter}>
                      <div className={styles.cardFooterLeft}>
                        {/* Like Button */}
                        <button
                          type="button"
                          className={`${styles.trendingActionBtn} ${likedIds[article.id] ? styles.trendingActionLikeActive : ""}`}
                          onClick={e => handleLike(article.id, e)}
                          title="Like article (boosts in trending rank)"
                        >
                          <ThumbsUp size={12} />
                          <span>{article.likes}</span>
                        </button>

                        {/* Dislike Button */}
                        <button
                          type="button"
                          className={`${styles.trendingActionBtn} ${dislikedIds[article.id] ? styles.trendingActionDislikeActive : ""}`}
                          onClick={e => handleDislike(article.id, e)}
                          title="Dislike article"
                        >
                          <ThumbsDown size={12} />
                          <span>{article.dislikes || 0}</span>
                        </button>

                        {/* dev.to Multi-Reactions Strip */}
                        <div className={styles.devReactionsStrip}>
                          <button
                            type="button"
                            className={styles.devReactionBtn}
                            onClick={e => handleDevReaction(article.id, "heart", e)}
                            title="Love ❤️"
                          >
                            <span>❤️</span>
                            <span>{article.reactions.heart}</span>
                          </button>
                          <button
                            type="button"
                            className={styles.devReactionBtn}
                            onClick={e => handleDevReaction(article.id, "unicorn", e)}
                            title="Unicorn 🦄"
                          >
                            <span>🦄</span>
                            <span>{article.reactions.unicorn}</span>
                          </button>
                          <button
                            type="button"
                            className={styles.devReactionBtn}
                            onClick={e => handleDevReaction(article.id, "rocket", e)}
                            title="Ship it 🚀"
                          >
                            <span>🚀</span>
                            <span>{article.reactions.rocket}</span>
                          </button>
                          <button
                            type="button"
                            className={styles.devReactionBtn}
                            onClick={e => handleDevReaction(article.id, "mindblown", e)}
                            title="Mindblown 🤯"
                          >
                            <span>🤯</span>
                            <span>{article.reactions.mindblown}</span>
                          </button>
                        </div>

                        {/* Medium Claps */}
                        <button
                          type="button"
                          className={`${styles.trendingActionBtn} ${styles.trendingClapBtn} ${(clapsState[article.id] || 0) > 0 ? styles.trendingActionLikeActive : ""}`}
                          onClick={e => handleClap(article.id, e)}
                          title="Clap for this blog"
                        >
                          <span>👏</span>
                          <span>{article.claps}</span>
                        </button>

                        {/* Star Rating Trigger */}
                        <button
                          type="button"
                          className={styles.starRatingBadge}
                          onClick={e => {
                            e.stopPropagation();
                            setRatingTargetArticle(article);
                          }}
                          title={`Click to rate this blog (Current: ${article.rating.average} / 5 from ${article.rating.count} ratings)`}
                        >
                          <Star size={11} fill="#f59e0b" color="#f59e0b" />
                          <span>{article.rating.average}</span>
                          <span style={{ opacity: 0.7 }}>({article.rating.count})</span>
                          {userRating && <span style={{ color: "#047857" }}>✓ Rated {userRating}★</span>}
                        </button>
                      </div>

                      <div className={styles.cardFooterRight}>
                        {/* Substack Audio Trigger */}
                        <button
                          type="button"
                          className={styles.listenBtn}
                          onClick={e => playAudioForArticle(article, e)}
                        >
                          <Volume2 size={12} />
                          <span>{article.readTimeMinutes}m Audio</span>
                        </button>

                        {/* Full Article Link */}
                        <Link
                          href={`/tech-buzz/${article.slug}`}
                          className={styles.quickReadBtn}
                          onClick={e => e.stopPropagation()}
                          title="Open full page story"
                        >
                          <span>Full Story</span>
                          <ArrowRight size={12} />
                        </Link>

                        {/* daily.dev Quick Read Drawer Toggle */}
                        <button
                          type="button"
                          className={styles.quickReadBtn}
                          onClick={e => {
                            e.stopPropagation();
                            setExpandedQuickReads(prev => ({ ...prev, [article.id]: !prev[article.id] }));
                          }}
                        >
                          <span>{isQuickReadOpen ? "Hide TL;DR" : "Quick Read"}</span>
                          {isQuickReadOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {/* Dev.to Comments counter */}
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => setActiveArticle(article)}
                          title={`${article.commentsCount} comments`}
                        >
                          <MessageSquare size={16} />
                          <span style={{ fontSize: "0.75rem", marginLeft: "0.25rem", fontWeight: 700 }}>
                            {article.commentsCount}
                          </span>
                        </button>

                        {/* Bookmark */}
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={e => toggleBookmark(article.id, e)}
                          title={isSaved ? "Remove from bookmarks" : "Save story"}
                        >
                          <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
                        </button>

                        {/* Share */}
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={e => shareArticle(article, e)}
                          title="Share article link"
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Proper Blogs Feed Pagination with All Required Options */}
          {filteredArticles.length > 0 && (
            <nav className={styles.feedPaginationBar} aria-label="Blog articles pagination">
              <div className={styles.paginationSummary}>
                <span>
                  Showing <strong>{(safeCurrentPage - 1) * blogsPerPage + 1}</strong>–<strong>{Math.min(safeCurrentPage * blogsPerPage, filteredArticles.length)}</strong> of <strong>{filteredArticles.length}</strong> technology blogs
                </span>
                <span className={styles.paginationPageIndicator}>
                  Page {safeCurrentPage} of {totalPages}
                </span>
              </div>

              <div className={styles.paginationControls}>
                {/* First Page Button */}
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => handlePageChange(1)}
                  disabled={safeCurrentPage === 1}
                  aria-label="First page"
                  title="Go to first page"
                >
                  <ChevronsLeft size={16} />
                  <span className={styles.paginationBtnText}>First</span>
                </button>

                {/* Previous Page Button */}
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  aria-label="Previous page"
                  title="Go to previous page"
                >
                  <ChevronLeft size={16} />
                  <span className={styles.paginationBtnText}>Previous</span>
                </button>

                {/* Numeric Page Buttons */}
                <div className={styles.paginationPagesList}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`${styles.paginationPageNumberBtn} ${isActive ? styles.paginationPageNumberActive : ""}`}
                        onClick={() => handlePageChange(pageNum)}
                        aria-label={`Page ${pageNum}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page Button */}
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  aria-label="Next page"
                  title="Go to next page"
                >
                  <span className={styles.paginationBtnText}>Next</span>
                  <ChevronRight size={16} />
                </button>

                {/* Last Page Button */}
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => handlePageChange(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  aria-label="Last page"
                  title="Go to last page"
                >
                  <span className={styles.paginationBtnText}>Last</span>
                  <ChevronsRight size={16} />
                </button>
              </div>

              {/* Blogs Per Page Dropdown */}
              <div className={styles.perPageSelectorWrap}>
                <span className={styles.perPageLabel}>Per page:</span>
                <Select
                  value={String(blogsPerPage)}
                  onValueChange={val => {
                    setBlogsPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className={styles.perPageSelectTrigger} aria-label="Blogs per page">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className={styles.perPageSelectContent}>
                    <SelectItem value="5">5 blogs</SelectItem>
                    <SelectItem value="10">10 blogs (Default)</SelectItem>
                    <SelectItem value="15">15 blogs</SelectItem>
                    <SelectItem value="20">20 blogs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </nav>
          )}
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebarSection}>
          {/* Substack & Ghost Style Newsletter Dispatch Capture */}
          <div className={styles.newsletterCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Radio size={16} color="#c2410c" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#c2410c" }}>
                Weekly Engineering Dispatch
              </span>
            </div>
            <h3 className={styles.newsletterTitle}>MasterClass Tech Dispatch</h3>
            <p className={styles.newsletterText}>
              Join 34,000+ engineers, architects, and founders getting zero-noise breakdowns of MCP, Next.js 15, eBPF, and Rust microservices directly to their inboxes every Tuesday.
            </p>

            {newsletterSubscribed ? (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "0.75rem", borderRadius: "8px", color: "#065f46", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>You're subscribed! Welcome to the dispatch.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
                <Input
                  type="email"
                  placeholder="Your work email (e.g. dev@company.com)"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  className={styles.newsletterInput}
                  required
                />
                <Button type="submit" className={styles.newsletterSubmitBtn}>
                  Subscribe Free
                </Button>
              </form>
            )}
          </div>

          {/* Medium Staff Picks */}
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>
              <Sparkles size={16} color="#ea580c" />
              <span>Staff Picks</span>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {staffPicks.map(pick => (
                <div
                  key={pick.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveArticle(pick)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>
                    <Image
                      src={pick.author.avatar}
                      alt={pick.author.name}
                      width={18}
                      height={18}
                      className={styles.authorAvatarSmall}
                      unoptimized
                    />
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{pick.author.name}</span>
                  </div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "#0f172a", lineHeight: 1.35 }}>
                    {pick.title}
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
                    <span>★ {pick.rating.average}</span>
                    <span>•</span>
                    <span>{pick.readTimeMinutes}m read</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Topics */}
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>
              <Layers size={16} color="#2563eb" />
              <span>Recommended Topics</span>
            </h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              {["Agentic AI", "Model Context Protocol", "Next.js 15", "PostgreSQL 17", "Rust & Tokio", "eBPF", "TypeScript 5.8", "DeepSeek", "Platform Engineering"].map(topic => (
                <button
                  key={topic}
                  type="button"
                  className={styles.techStackChip}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSearchQuery(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* 9. Full Article Reader (In-Page Normal Flow — NO double scrollbars and NO modal X button) */}
      {activeArticle && (
        <section
          className={styles.inPageArticleView}
          role="dialog"
          aria-label="Full Story Reader"
        >
          <div className={styles.readerContainer}>
            {/* Story Navigation & Redirection Bar (Replaces modal X close button) */}
            <div className={styles.storyNavHeader}>
              <button
                type="button"
                onClick={() => {
                  setActiveArticle(null);
                  try {
                    window.scrollTo({ top: 380, behavior: "smooth" });
                  } catch {}
                }}
                className={styles.storyNavBackBtn}
              >
                <span>← Back to Master Class Buddy - Blogs</span>
              </button>

              {/* Story Navigator: Previous & Next Article Switchers */}
              <div className={styles.storySwitcherGroup}>
                <button
                  type="button"
                  disabled={!prevArticle}
                  onClick={() => prevArticle && navigateToArticle(prevArticle)}
                  className={styles.storySwitchBtn}
                  title={prevArticle ? `Previous blog: ${prevArticle.title}` : "First blog"}
                >
                  <span>←</span>
                  <span className={styles.storySwitchBtnTitle}>
                    {prevArticle ? prevArticle.title : "Start of Feed"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!nextArticle}
                  onClick={() => nextArticle && navigateToArticle(nextArticle)}
                  className={styles.storySwitchBtn}
                  title={nextArticle ? `Next blog: ${nextArticle.title}` : "End of feed"}
                >
                  <span className={styles.storySwitchBtnTitle}>
                    {nextArticle ? nextArticle.title : "All Blogs Read"}
                  </span>
                  <span>→</span>
                </button>

                <Link
                  href={`/tech-buzz/${activeArticle.slug}`}
                  className={styles.directPageLinkBtn}
                  title="Open permanent article page"
                >
                  <span>Open Full Page ↗</span>
                </Link>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <LanguageToggle size="sm" persist={false} />
              </div>
            </div>

            {/* Reader Header */}
            <header className={styles.readerHeader}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span className={styles.categoryPillActive} style={{ fontSize: "0.75rem", padding: "0.2rem 0.65rem" }}>
                  {activeArticle.category}
                </span>
                <span className={styles.hashnodeSeriesPill}>
                  {activeArticle.technology}
                </span>
                {isSubscribed ? (
                  <span className={`${styles.memberBadge} ${styles.memberAccessUnlocked}`}>
                    <CheckCircle2 size={11} />
                    <span>Unlocked for Member</span>
                  </span>
                ) : (
                  <span className={styles.memberBadge}>
                    <Star size={11} fill="#d97706" color="#d97706" />
                    <span>Member-only story</span>
                  </span>
                )}
              </div>

              <h1 className={styles.readerTitle}>{activeArticle.title}</h1>
              <p className={styles.readerSubtitle}>{activeArticle.subtitle}</p>

              {/* Author & Read Time Bar */}
              <div className={styles.readerAuthorBar}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Image
                    src={activeArticle.author.avatar}
                    alt={activeArticle.author.name}
                    width={48}
                    height={48}
                    className={styles.authorAvatarSmall}
                    unoptimized
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {activeArticle.author.name}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                      {activeArticle.author.role} • Published on {activeArticle.publishedAt}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    type="button"
                    className={styles.listenBtn}
                    onClick={() => playAudioForArticle(activeArticle)}
                  >
                    <Volume2 size={13} />
                    <span>Listen ({activeArticle.readTimeMinutes}m)</span>
                  </button>
                  <button
                    type="button"
                    className={styles.starRatingBadge}
                    onClick={() => setRatingTargetArticle(activeArticle)}
                  >
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span>{activeArticle.rating.average}</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Hero Cover Image */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: "12px", overflow: "hidden", marginBottom: "2rem" }}>
              <Image
                src={activeArticle.coverImage}
                alt={activeArticle.title}
                fill
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>

            {/* Section 0: Free Teaser Section */}
            {activeArticle.contentSections[0] && (
              <div style={{ lineHeight: 1.7, fontSize: "1.0625rem", color: "#1e293b", marginBottom: "1.5rem" }}>
                {activeArticle.contentSections[0].heading && (
                  <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, margin: "1.5rem 0 1rem", color: "#0f172a" }}>
                    {activeArticle.contentSections[0].heading}
                  </h2>
                )}
                {activeArticle.contentSections[0].paragraphs.map((p, idx) => (
                  <p key={idx} style={{ marginBottom: "1rem" }}>{p}</p>
                ))}
                {activeArticle.contentSections[0].quote && (
                  <blockquote style={{ borderLeft: "3px solid #ea580c", paddingLeft: "1.25rem", margin: "1.5rem 0", fontStyle: "italic", color: "#475569" }}>
                    "{activeArticle.contentSections[0].quote.text}"
                    <cite style={{ display: "block", marginTop: "0.5rem", fontStyle: "normal", fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                      — {activeArticle.contentSections[0].quote.attribution}
                    </cite>
                  </blockquote>
                )}
              </div>
            )}

            {/* Medium-Style Paywall Curtain or Unlocked Deep-Dive */}
            {!isSubscribed ? (
              <div className={styles.paywallCurtain}>
                <div className={styles.paywallFade} />

                {activeArticle.contentSections.length > 1 && (
                  <div className={styles.paywallBlurredPreview} aria-hidden="true">
                    {activeArticle.contentSections.slice(1).map((sec, i) => (
                      <div key={i}>
                        {sec.heading && <h3>{sec.heading}</h3>}
                        <p>{sec.paragraphs.join(" ")}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Paywall CTA Card */}
                <div className={styles.paywallCard}>
                  {festiveSale.active && (
                    <div className={styles.diwaliFestiveRibbon}>
                      <span>🪔</span>
                      <span>DIWALI FESTIVE SALE · 25% DISCOUNT TILL {festiveSale.validTill.toUpperCase()}</span>
                    </div>
                  )}

                  <div className={styles.paywallStarBadge}>
                    <Star size={14} fill="#fcd34d" color="#d97706" />
                    <span>Member-Only Story</span>
                  </div>

                  <h2 className={styles.paywallHeading}>
                    Read the full story with a Master Class Buddy membership
                  </h2>

                  <p className={styles.paywallText}>
                    Subscribe to unlock unlimited access to all in-depth engineering deep dives, system design architectures, interview walkthroughs, and code labs.
                  </p>

                  {festiveSale.active && (
                    <div className={styles.pricingComparisonRow}>
                      <span className={styles.regularPriceStrike}>₹{festiveSale.regularMonthly}/mo</span>
                      <span className={styles.discountedPriceHero}>₹{festiveSale.discountedMonthly}</span>
                      <span style={{ fontSize: "0.875rem", color: "#64748b" }}>/month</span>
                      <span className={styles.discountPercentPill}>25% OFF</span>
                      <span className={styles.festiveDateBadge}>Active till {festiveSale.validTill}</span>
                    </div>
                  )}

                  <div className={styles.paywallActions}>
                    <button
                      type="button"
                      onClick={handleSubscribePlatform}
                      className={styles.paywallSubscribeBtn}
                    >
                      <Sparkles size={16} />
                      <span>
                        {festiveSale.active
                          ? `Subscribe to Platform — Unlock Story (₹${festiveSale.discountedMonthly}/mo · 25% Diwali OFF)`
                          : "Subscribe to Platform — Unlock Story"}
                      </span>
                    </button>
                  </div>

                  <div className={styles.memberSimulateBar}>
                    <span>Testing platform access?</span>
                    <button
                      type="button"
                      onClick={toggleMemberSimulation}
                      className={styles.memberSimulateBtn}
                    >
                      Preview with Member Access
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Subscribed: Render all remaining deep-dive sections */
              <div>
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "0.75rem 1rem", borderRadius: "8px", color: "#065f46", fontSize: "0.875rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>You have full access to this story as a Master Class Buddy member.</span>
                </div>
                {activeArticle.contentSections.slice(1).map((section, idx) => (
                  <div key={idx + 1} style={{ lineHeight: 1.7, fontSize: "1.0625rem", color: "#1e293b", marginBottom: "1.75rem" }}>
                    {section.heading && (
                      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, margin: "2rem 0 1rem", color: "#0f172a" }}>
                        {section.heading}
                      </h2>
                    )}

                    {section.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} style={{ marginBottom: "1rem" }}>{p}</p>
                    ))}

                    {section.codeSnippet && (
                      <div className={styles.codeSnippetCard}>
                        <div className={styles.codeSnippetHeader}>
                          <span>{section.codeSnippet.filename ?? section.codeSnippet.language}</span>
                          <button
                            type="button"
                            onClick={() => copyCode(section.codeSnippet!.code, `code-${idx + 1}`)}
                            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem" }}
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
                        <pre className={styles.codeSnippetPre}>
                          <code>{section.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {section.bulletPoints && (
                      <ul style={{ paddingLeft: "1.5rem", margin: "1rem 0" }}>
                        {section.bulletPoints.map((pt, ptIdx) => (
                          <li key={ptIdx} style={{ marginBottom: "0.5rem" }}>{pt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {/* Indie Hackers Founder Takeaway */}
                {activeArticle.founderTakeaway && (
                  <div style={{ background: "#f8fafc", borderLeft: "4px solid #059669", padding: "1.25rem", borderRadius: "0 8px 8px 0", margin: "2rem 0" }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", color: "#059669", marginBottom: "0.35rem" }}>
                      💡 Builder's Architectural Takeaway
                    </div>
                    <p style={{ margin: 0, fontStyle: "italic", color: "#334155" }}>
                      "{activeArticle.founderTakeaway}"
                    </p>
                  </div>
                )}

                {/* Dev.to & Indie Hackers Discussion / Comment Stream */}
                <section className={styles.discussionSection}>
                  <div className={styles.discussionHeading}>
                    <MessageSquare size={18} color="#ea580c" />
                    <span>Developer Discussion ({activeArticle.commentsCount})</span>
                  </div>

                  <form onSubmit={handleAddComment} className={styles.commentForm}>
                    <textarea
                      placeholder="Share your architectural insight, question, or experience with this tech stack..."
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      className={styles.commentInput}
                      required
                    />
                    <div className={styles.commentFormActions}>
                      <button type="submit" className={styles.commentSubmitBtn}>
                        Post Developer Comment
                      </button>
                    </div>
                  </form>

                  <div className={styles.commentsList}>
                    {(activeArticle.comments || []).map(comment => (
                      <div key={comment.id} className={styles.commentItem}>
                        <div className={styles.commentHeader}>
                          <div className={styles.commentAuthorInfo}>
                            <Image
                              src={comment.author.avatar}
                              alt={comment.author.name}
                              width={28}
                              height={28}
                              className={styles.authorAvatarSmall}
                              unoptimized
                            />
                            <div>
                              <span className={styles.commentAuthorName}>{comment.author.name}</span>
                              <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>
                                {comment.author.handle} • {comment.createdAt}
                              </span>
                            </div>
                          </div>
                          {comment.author.badge && (
                            <span className={styles.commentAuthorBadge}>{comment.author.badge}</span>
                          )}
                        </div>
                        <p className={styles.commentText}>{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Next Articles Navigation Shelf */}
            <div className={styles.nextArticlesShelf}>
              <div className={styles.nextArticlesHeading}>
                <h3 className={styles.nextArticlesTitle}>
                  <span>Continue Reading in Tech Buzz Radar</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveArticle(null);
                  try {
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  } catch {}
                  }}
                  className={styles.storyNavBackBtn}
                >
                  <span>View All {articles.length} Stories</span>
                </button>
              </div>

              <div className={styles.nextArticlesGrid}>
                {articles
                  .filter(a => a.id !== activeArticle.id)
                  .slice(0, 3)
                  .map(nextArt => (
                    <div
                      key={nextArt.id}
                      className={styles.nextArticleCard}
                      onClick={() => navigateToArticle(nextArt)}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <span className={styles.categoryPillActive} style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>
                            {nextArt.category}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {nextArt.readTimeMinutes} min read
                          </span>
                        </div>
                        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9375rem", color: "#0f172a", fontWeight: 700, lineHeight: 1.35 }}>
                          {nextArt.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {nextArt.subtitle}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Image
                            src={nextArt.author.avatar}
                            alt={nextArt.author.name}
                            width={22}
                            height={22}
                            className={styles.authorAvatarSmall}
                            unoptimized
                          />
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                            {nextArt.author.name}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ea580c" }}>
                          Read Story →
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 10. Star Rating Modal */}
      {ratingTargetArticle && (
        <div
          className={styles.ratingModalBackdrop}
          onClick={() => setRatingTargetArticle(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{ background: "#ffffff", maxWidth: "480px", width: "100%", borderRadius: "16px", padding: "2rem", position: "relative" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.ratingCloseBtn}
              onClick={() => setRatingTargetArticle(null)}
              aria-label="Close rating dialog"
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#0f172a" }}>
              Rate this technology blog
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 1.5rem 0" }}>
              "{ratingTargetArticle.title}"
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {[1, 2, 3, 4, 5].map(star => {
                const active = (hoverStar || selectedRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} stars`}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setSelectedRating(star)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.35rem" }}
                  >
                    <Star
                      size={32}
                      fill={active ? "#f59e0b" : "none"}
                      color={active ? "#f59e0b" : "#cbd5e1"}
                    />
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              className={styles.paywallSubscribeBtn}
              style={{ width: "100%", justifyContent: "center", display: "flex" }}
              onClick={() => handleRatingSubmit(ratingTargetArticle.id, selectedRating)}
            >
              Submit Rating ({selectedRating} Stars)
            </Button>
          </div>
        </div>
      )}

      {/* 9. Floating Persistent Audio Voiceover Player */}
      {activeAudioArticle && (
        <aside className={styles.floatingAudioBar} role="region" aria-label="Audio player">
          {/* Left: Article Thumbnail, Waveform & Title */}
          <div className={styles.audioBarLeft}>
            <Image
              src={activeAudioArticle.coverImage}
              alt={activeAudioArticle.title}
              width={44}
              height={44}
              className={styles.audioCoverThumb}
              unoptimized
            />
            <div className={styles.audioMetaText}>
              <div className={styles.audioMetaTitle} title={activeAudioArticle.title}>
                {activeAudioArticle.title}
              </div>
              <div className={styles.audioMetaAuthor}>
                <span>{activeAudioArticle.technology}</span>
                <span>•</span>
                <span>{activeAudioArticle.readTimeMinutes}m voiceover</span>
              </div>
            </div>
            {/* Animated Equalizer Waveform */}
            <div className={`${styles.audioWaveform} ${isPlayingAudio ? styles.audioWavePlaying : ""}`} aria-hidden="true">
              <span className={styles.audioWaveBar} />
              <span className={styles.audioWaveBar} />
              <span className={styles.audioWaveBar} />
              <span className={styles.audioWaveBar} />
              <span className={styles.audioWaveBar} />
            </div>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className={styles.audioBarCenter}>
            <div className={styles.audioTransportControls}>
              <button
                type="button"
                className={styles.audioControlBtn}
                onClick={() => seekAudio(audioProgressSeconds - 10)}
                title="Rewind 10 seconds"
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className={styles.audioPlayPauseBtn}
                onClick={toggleAudioPlayPause}
                title={isPlayingAudio ? "Pause voiceover" : "Play voiceover"}
                aria-label={isPlayingAudio ? "Pause" : "Play"}
              >
                {isPlayingAudio ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: "2px" }} />}
              </button>
              <button
                type="button"
                className={styles.audioControlBtn}
                onClick={() => seekAudio(audioProgressSeconds + 10)}
                title="Forward 10 seconds"
                aria-label="Forward 10 seconds"
              >
                <RotateCw size={15} />
              </button>
            </div>

            <div className={styles.audioTimelineGroup}>
              <span className={styles.audioTimeText}>{formatAudioTime(audioProgressSeconds)}</span>
              <input
                type="range"
                min={0}
                max={(activeAudioArticle.readTimeMinutes || 5) * 60}
                value={audioProgressSeconds}
                onChange={e => seekAudio(Number(e.target.value))}
                className={styles.audioProgressSlider}
                aria-label="Audio scrubber timeline"
              />
              <span className={styles.audioTimeText}>{formatAudioTime((activeAudioArticle.readTimeMinutes || 5) * 60)}</span>
            </div>
          </div>

          {/* Right: Speed, Read Story Link & Close */}
          <div className={styles.audioBarRight}>
            <button
              type="button"
              className={styles.audioSpeedBtn}
              onClick={cycleAudioSpeed}
              title="Change playback speed"
              aria-label={`Playback speed ${audioSpeed}x`}
            >
              {audioSpeed}x
            </button>
            <Link
              href={`/tech-buzz/${activeAudioArticle.slug}`}
              className={styles.audioStoryLink}
              title="Read full story"
            >
              <span>Read Story</span>
              <ArrowRight size={12} />
            </Link>
            <button
              type="button"
              className={styles.audioCloseBtn}
              onClick={closeAudioPlayer}
              title="Close audio player"
              aria-label="Close audio player"
            >
              <X size={18} />
            </button>
          </div>
        </aside>
      )}
      {/* 10. Tech Buzz Footer with Move to top */}
      <footer className={styles.buzzFooter}>
        <div className={styles.buzzFooterInner}>
          <div className={styles.buzzFooterBrand}>
            <Flame size={18} color="#ea580c" />
            <span>Master Class Buddy • Blogs</span>
          </div>
          <div className={styles.buzzFooterLinks}>
            <Link href="/courses">Courses</Link>
            <Link href="/library">Library</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
          <button
            type="button"
            className={styles.moveToTopBtn}
            onClick={() => {
              const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
              window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
            }}
            aria-label="Move to top"
          >
            <span>Move to top</span>
            <ArrowUp size={15} />
          </button>
        </div>
      </footer>

      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toastNotification} role="status">
          <CheckCircle2 size={16} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
