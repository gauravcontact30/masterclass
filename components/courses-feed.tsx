"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Search,
  TrendingUp,
  X,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  LayoutGrid,
  List,
  BookOpen,
  ArrowRight,
  Award,
  Layers,
  Flame,
  ShieldCheck,
  Check
} from "lucide-react";
import { LanguageToggle } from "./language-toggle";
import { getTechnologyBrandIcon } from "./tech-buzz-brand-icons";
import { getDiwaliFestiveSaleInfo, type FestiveSaleInfo } from "@/lib/tech-buzz-data";
import styles from "./courses-feed.module.css";

export interface MasterCourseItem {
  id: string;
  category: "system-design" | "technology" | "languages";
  categoryLabel: string;
  technology: string;
  techBadgeColor: string;
  title: string;
  subtitle: string;
  dashboardPath: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Principal";
  durationHours: number;
  modulesCount: number;
  enrolledStudents: number;
  rating: {
    average: number;
    count: number;
  };
  likes: number;
  dislikes: number;
  claps: number;
  instructor: {
    name: string;
    role: string;
    avatar: string;
  };
  techStack: string[];
  syllabusBullets: string[];
}

export const MASTER_COURSES: MasterCourseItem[] = [
  // 1. WhatsApp-style Messaging
  {
    id: "course-whatsapp",
    category: "system-design",
    categoryLabel: "System Design",
    technology: "WebSockets & Distributed Queueing",
    techBadgeColor: "#059669",
    title: "System Design: WhatsApp-style Ultra-High Concurrency Messaging",
    subtitle: "Architecting end-to-end encrypted bidirectional messaging, offline sync queues, read receipts, and cluster federation across 2 billion users.",
    dashboardPath: "/dashboard/system-design",
    level: "Advanced",
    durationHours: 18,
    modulesCount: 14,
    enrolledStudents: 14200,
    rating: { average: 4.98, count: 2410 },
    likes: 1840,
    dislikes: 14,
    claps: 7200,
    instructor: {
      name: "Dr. Priya Sharma",
      role: "Principal Distributed Systems Architect",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["WebSockets", "Erlang/Rust", "Cassandra", "Redis", "TLS 1.3"],
    syllabusBullets: [
      "Bidirectional connection pooling & heartbeat protocols for 10M live socket connections.",
      "Signal protocol end-to-end encryption with ephemeral key ratcheting.",
      "Distributed Cassandra time-series storage for message histories with zero-tombstone compaction."
    ]
  },

  // 2. Facebook-style Social Network
  {
    id: "course-facebook",
    category: "system-design",
    categoryLabel: "System Design",
    technology: "Graph Database & Feed Fan-Out",
    techBadgeColor: "#2563eb",
    title: "System Design: Facebook-style Social Graph & Billion-User NewsFeed",
    subtitle: "Designing graph edge traversal, fan-out-on-write timelines, distributed Memcached clusters, and asynchronous notification backplanes.",
    dashboardPath: "/dashboard/system-design",
    level: "Principal",
    durationHours: 22,
    modulesCount: 16,
    enrolledStudents: 11800,
    rating: { average: 4.95, count: 1890 },
    likes: 1420,
    dislikes: 19,
    claps: 5600,
    instructor: {
      name: "Guillermo Martinez",
      role: "Staff Infrastructure Engineer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["Neo4j", "Memcached", "Sharded MySQL", "Kafka", "GraphQL"],
    syllabusBullets: [
      "Hybrid fan-out strategy (push for active followers, pull for celebrity accounts).",
      "TAO graph data store architecture: nodes, associations, and distributed read replication.",
      "Asynchronous notification indexing with Kafka partition keys and deduplication windows."
    ]
  },

  // 3. Instagram-style Photo & Video Sharing
  {
    id: "course-instagram",
    category: "system-design",
    categoryLabel: "System Design",
    technology: "Media CDN & Vector Recommendations",
    techBadgeColor: "#e11d48",
    title: "System Design: Instagram-style Global Media Pipeline & CDN Edge Caching",
    subtitle: "High-throughput photo/video ingestion, asynchronous transcoding workers, pgvector semantic search, and multi-tier edge CDN invalidation.",
    dashboardPath: "/dashboard/system-design",
    level: "Advanced",
    durationHours: 16,
    modulesCount: 12,
    enrolledStudents: 9800,
    rating: { average: 4.97, count: 1950 },
    likes: 1510,
    dislikes: 12,
    claps: 6100,
    instructor: {
      name: "Elena Rostova",
      role: "VP of Datacenter Systems",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["PostgreSQL 17", "pgvector", "AWS CloudFront", "FFmpeg", "S3"],
    syllabusBullets: [
      "Pre-signed direct S3 upload chunking with client-side SHA-256 integrity validation.",
      "Distributed asynchronous transcoding cluster with adaptive quality tiers.",
      "Vector embeddings search for explore feed personalization using HNSW index."
    ]
  },

  // 4. Food Delivery & Real-Time Logistics
  {
    id: "course-food-delivery",
    category: "system-design",
    categoryLabel: "System Design",
    technology: "Geospatial Indexing & Matching",
    techBadgeColor: "#ea580c",
    title: "System Design: Food Delivery Platform & Real-Time Geospatial Dispatch",
    subtitle: "UberEats/DoorDash architecture: QuadTree spatial partitioning, driver-order matching algorithms, live GPS streaming, and dynamic surge pricing.",
    dashboardPath: "/dashboard/system-design",
    level: "Intermediate",
    durationHours: 14,
    modulesCount: 11,
    enrolledStudents: 8900,
    rating: { average: 4.96, count: 1780 },
    likes: 1380,
    dislikes: 11,
    claps: 5400,
    instructor: {
      name: "Siddharth Nair",
      role: "Solo Founder & Systems Engineer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["Redis GeoRadius", "QuadTree", "Apache Kafka", "WebSockets", "Go"],
    syllabusBullets: [
      "Sub-millisecond driver lookup using Redis GeoRadius and hexagonal H3 indexing.",
      "Hungarian algorithm for multi-order batching and optimal driver route scheduling.",
      "Finite state machine for real-time kitchen order acceptance and pickup confirmation."
    ]
  },

  // 5. Stripe-style Payment Gateway & Ledger
  {
    id: "course-payments",
    category: "system-design",
    categoryLabel: "System Design",
    technology: "Double-Entry Ledger & Idempotency",
    techBadgeColor: "#7c3aed",
    title: "System Design: Stripe-style Payment Gateway & Immutable Financial Ledger",
    subtitle: "Zero-loss financial transactions: two-phase commits, idempotency keys, Raft distributed consensus, double-entry bookkeeping, and fraud anomaly detection.",
    dashboardPath: "/dashboard/system-design",
    level: "Principal",
    durationHours: 24,
    modulesCount: 18,
    enrolledStudents: 16800,
    rating: { average: 4.99, count: 3240 },
    likes: 2490,
    dislikes: 9,
    claps: 9100,
    instructor: {
      name: "David Crawford",
      role: "Partner & Head of Global Technology",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["Double-Entry SQL", "Raft Consensus", "Redis Locks", "KMS HSM", "Kafka"],
    syllabusBullets: [
      "Distributed idempotency key enforcement using atomic Redis leases and Postgres transactions.",
      "Double-entry bookkeeping math: assets = liabilities + equity with audit trail hash chains.",
      "Deadlock-free concurrent wallet balance mutations with optimistic locking."
    ]
  },

  // 6. AI Automation & Agentic Platform
  {
    id: "course-ai-automation",
    category: "system-design",
    categoryLabel: "System Design",
    technology: "Agentic AI & Model Context Protocol",
    techBadgeColor: "#8b5cf6",
    title: "System Design: Enterprise AI Automation Platform & Model Context Protocol",
    subtitle: "Building multi-agent autonomous systems: MCP tool server architectures, sandboxed code execution, streaming token state machines, and human-in-the-loop review.",
    dashboardPath: "/dashboard/system-design",
    level: "Advanced",
    durationHours: 20,
    modulesCount: 15,
    enrolledStudents: 15400,
    rating: { average: 4.98, count: 2850 },
    likes: 2150,
    dislikes: 15,
    claps: 8400,
    instructor: {
      name: "Dr. Priya Sharma",
      role: "Principal AI Architect",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["Anthropic MCP", "Python FastAPI", "Docker Sandboxes", "Vector DB", "Redis"],
    syllabusBullets: [
      "Standard open MCP JSON-RPC tool endpoints with authentication and permission tiers.",
      "Secure isolated Docker container pools with cgroup limits for untrusted agent code execution.",
      "Streaming SSE token pipeline with verification checkpoints and rollback compensation."
    ]
  },

  // 7. Video Streaming Platform
  {
    id: "course-video-streaming",
    category: "system-design",
    categoryLabel: "System Design",
    technology: "Adaptive Bitrate Video & HLS",
    techBadgeColor: "#ea580c",
    title: "System Design: Netflix-style Adaptive Bitrate Video Streaming & Multi-CDN",
    subtitle: "Per-title chunked video encoding, adaptive bitrate switching (HLS/DASH), multi-CDN steering algorithms, and distributed viewing session state.",
    dashboardPath: "/dashboard/system-design",
    level: "Advanced",
    durationHours: 18,
    modulesCount: 13,
    enrolledStudents: 10400,
    rating: { average: 4.97, count: 2100 },
    likes: 1670,
    dislikes: 13,
    claps: 6800,
    instructor: {
      name: "Piotr Dabkowski",
      role: "Head of Audio Research",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["HLS / DASH", "FFmpeg", "Multi-CDN Steering", "Cassandra", "Envoy"],
    syllabusBullets: [
      "Dynamic adaptive bitrate ladder generation based on video complexity metrics.",
      "Real-time client telemetry aggregation and automatic fallback between CDN providers.",
      "Cassandra write-heavy bookmarking for instant resume playback across mobile and TV apps."
    ]
  },

  // 8. BookMyShow Ticket Booking
  {
    id: "course-ticket-booking",
    category: "system-design",
    categoryLabel: "System Design",
    technology: "Distributed Locking & Concurrency",
    techBadgeColor: "#0284c7",
    title: "System Design: High-Concurrency Ticket Booking & Flash Sale Lock Engine",
    subtitle: "Zero-overselling distributed architecture: Redlock mutex algorithms, virtual waiting room queueing, seat matrix caching, and payment timeout webhooks.",
    dashboardPath: "/dashboard/system-design",
    level: "Advanced",
    durationHours: 16,
    modulesCount: 12,
    enrolledStudents: 12900,
    rating: { average: 4.98, count: 2600 },
    likes: 1980,
    dislikes: 10,
    claps: 7800,
    instructor: {
      name: "Siddharth Verma",
      role: "Lead Systems Architect",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["Redis Redlock", "Optimistic Locking", "PostgreSQL", "Kafka", "Next.js 15"],
    syllabusBullets: [
      "Virtual waiting room rate limiting using token bucket algorithms during flash concert drops.",
      "Sub-second seat reservation holds with TTL keys in Redis cluster.",
      "Optimistic version checking in PostgreSQL to prevent race conditions across parallel checkouts."
    ]
  },

  // 9. IELTS Academic & Global Tech English
  {
    id: "course-ielts",
    category: "languages",
    categoryLabel: "IELTS & Vocabulary",
    technology: "Speech AI & Technical Communication",
    techBadgeColor: "#059669",
    title: "IELTS Academic & Executive Tech English: Band 8.5+ Architecture Communication",
    subtitle: "Master senior engineering interview communication, architectural whitepaper writing, vocabulary precision, and English fluency with native voice feedback.",
    dashboardPath: "/dashboard/languages",
    level: "Intermediate",
    durationHours: 15,
    modulesCount: 10,
    enrolledStudents: 8200,
    rating: { average: 4.95, count: 1580 },
    likes: 1240,
    dislikes: 8,
    claps: 4800,
    instructor: {
      name: "Amara Vance",
      role: "Silicon Valley Tech Bureau Chief",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["ElevenLabs Audio AI", "IELTS Academic", "Vocabulary Engine", "Grammar"],
    syllabusBullets: [
      "Precision technical vocabulary and avoiding ambiguity during staff architect presentations.",
      "IELTS Academic Writing Task 1 & 2 blueprints tailored for software professionals.",
      "Real-time audio pronunciation feedback powered by neural acoustic analysis."
    ]
  },

  // 10. Technology & Modern Stacks
  {
    id: "course-technology",
    category: "technology",
    categoryLabel: "Technology & Stacks",
    technology: "React 19, Next.js 15 & Rust",
    techBadgeColor: "#3178c6",
    title: "Modern Full-Stack Engineering: React 19, Next.js 15, TypeScript & Rust",
    subtitle: "Complete hands-on curriculum: The React Compiler, async Server Components, Rust Tokio microservices, and PostgreSQL pgvector production deployment.",
    dashboardPath: "/dashboard/technology",
    level: "Intermediate",
    durationHours: 26,
    modulesCount: 20,
    enrolledStudents: 18400,
    rating: { average: 4.98, count: 3410 },
    likes: 2650,
    dislikes: 12,
    claps: 9800,
    instructor: {
      name: "Anders Lindqvist",
      role: "Lead Compiler & Systems Engineer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
    },
    techStack: ["Next.js 15", "React 19", "Rust", "TypeScript 5.8", "Postgres 17"],
    syllabusBullets: [
      "Ahead-of-time React Compiler memoization and eliminating useMemo/useCallback.",
      "Next.js 15 asynchronous request headers, cookies, and partial prerendering (PPR).",
      "High-throughput Rust services with Tokio async channel streaming and zero-copy JSON."
    ]
  }
];

export function CoursesFeed() {
  const [courses, setCourses] = useState<MasterCourseItem[]>(() => MASTER_COURSES);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"trending" | "likes" | "claps" | "rating" | "newest">("trending");
  const [layoutDensity, setLayoutDensity] = useState<"magazine" | "compact">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("masterclass:courses-layout");
        if (saved === "compact" || saved === "magazine") return saved;
      } catch {}
    }
    return "magazine";
  });

  const [festiveSale, setFestiveSale] = useState<FestiveSaleInfo>(() => getDiwaliFestiveSaleInfo());

  useEffect(() => {
    setFestiveSale(getDiwaliFestiveSaleInfo(Date.now()));
  }, []);

  // Interaction tracking
  const [likedCourseIds, setLikedCourseIds] = useState<Record<string, boolean>>({});
  const [dislikedCourseIds, setDislikedCourseIds] = useState<Record<string, boolean>>({});
  const [clapsState, setClapsState] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem("masterclass:courses-likes");
      if (savedLikes) setLikedCourseIds(JSON.parse(savedLikes));
      const savedDislikes = localStorage.getItem("masterclass:courses-dislikes");
      if (savedDislikes) setDislikedCourseIds(JSON.parse(savedDislikes));
      const savedClaps = localStorage.getItem("masterclass:courses-claps");
      if (savedClaps) setClapsState(JSON.parse(savedClaps));
    } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 3200);
  }, []);

  const updateLayoutDensity = (val: "magazine" | "compact") => {
    setLayoutDensity(val);
    try {
      localStorage.setItem("masterclass:courses-layout", val);
    } catch {}
  };

  // Like handler
  const handleLike = (courseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentlyLiked = !!likedCourseIds[courseId];
    const currentlyDisliked = !!dislikedCourseIds[courseId];

    const nextLikes = { ...likedCourseIds, [courseId]: !currentlyLiked };
    const nextDislikes = { ...dislikedCourseIds, [courseId]: false };
    setLikedCourseIds(nextLikes);
    setDislikedCourseIds(nextDislikes);

    try {
      localStorage.setItem("masterclass:courses-likes", JSON.stringify(nextLikes));
      localStorage.setItem("masterclass:courses-dislikes", JSON.stringify(nextDislikes));
    } catch {}

    setCourses(current =>
      current.map(c => {
        if (c.id !== courseId) return c;
        const newLikes = Math.max(0, c.likes + (currentlyLiked ? -1 : 1));
        const newDislikes = currentlyDisliked ? Math.max(0, c.dislikes - 1) : c.dislikes;
        return { ...c, likes: newLikes, dislikes: newDislikes };
      })
    );

    showToast(currentlyLiked ? "Like removed" : "Liked! Course boosted in ranking 👍");
  };

  // Dislike handler
  const handleDislike = (courseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentlyLiked = !!likedCourseIds[courseId];
    const currentlyDisliked = !!dislikedCourseIds[courseId];

    const nextDislikes = { ...dislikedCourseIds, [courseId]: !currentlyDisliked };
    const nextLikes = { ...likedCourseIds, [courseId]: false };
    setDislikedCourseIds(nextDislikes);
    setLikedCourseIds(nextLikes);

    try {
      localStorage.setItem("masterclass:courses-dislikes", JSON.stringify(nextDislikes));
      localStorage.setItem("masterclass:courses-likes", JSON.stringify(nextLikes));
    } catch {}

    setCourses(current =>
      current.map(c => {
        if (c.id !== courseId) return c;
        const newDislikes = Math.max(0, c.dislikes + (currentlyDisliked ? -1 : 1));
        const newLikes = currentlyLiked ? Math.max(0, c.likes - 1) : c.likes;
        return { ...c, likes: newLikes, dislikes: newDislikes };
      })
    );

    showToast(currentlyDisliked ? "Dislike removed" : "Disliked. Feedback recorded 👎");
  };

  // Clap handler
  const handleClap = (courseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = clapsState[courseId] || 0;
    const next = current + 1;
    const nextState = { ...clapsState, [courseId]: next };
    setClapsState(nextState);

    try {
      localStorage.setItem("masterclass:courses-claps", JSON.stringify(nextState));
    } catch {}

    setCourses(current =>
      current.map(c => (c.id === courseId ? { ...c, claps: c.claps + 1 } : c))
    );

    showToast("Clapped! 👏 Thank you for supporting this course.");
  };

  // Dynamic Trending Courses (top 6 ranked by likes, claps, rating)
  const trendingCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => {
        const scoreB = (b.likes - b.dislikes) * 2 + b.claps + b.rating.average * 100;
        const scoreA = (a.likes - a.dislikes) * 2 + a.claps + a.rating.average * 100;
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [courses]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    let result = courses.filter(c => {
      const matchesCat =
        selectedCategory === "All" ||
        (selectedCategory === "system-design" && c.category === "system-design") ||
        (selectedCategory === "technology" && c.category === "technology") ||
        (selectedCategory === "languages" && c.category === "languages");

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.technology.toLowerCase().includes(q) ||
        c.techStack.some(t => t.toLowerCase().includes(q)) ||
        c.instructor.name.toLowerCase().includes(q);

      return matchesCat && matchesQuery;
    });

    return result.sort((a, b) => {
      if (sortBy === "likes") return b.likes - a.likes;
      if (sortBy === "claps") return b.claps - a.claps;
      if (sortBy === "rating") return b.rating.average - a.rating.average;
      if (sortBy === "newest") return b.durationHours - a.durationHours;
      const scoreB = (b.likes - b.dislikes) * 2 + b.claps + b.rating.average * 100;
      const scoreA = (a.likes - a.dislikes) * 2 + a.claps + a.rating.average * 100;
      return scoreB - scoreA;
    });
  }, [courses, selectedCategory, searchQuery, sortBy]);

  return (
    <div className={styles.coursesRoot}>
      {/* 1. Top Brand & Festive Sale Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link href="/courses" className={styles.brandBadge}>
            <span className={styles.brandDot} />
            <span>MasterClass Buddy · Learning Paths</span>
          </Link>
          <Link href="/pricing" className={styles.festiveBannerPill}>
            <span>🪔</span>
            <span>{festiveSale.title}: <strong>{festiveSale.discountPercent}% OFF (₹{festiveSale.discountedMonthly}/mo)</strong></span>
          </Link>
        </div>

        <div className={styles.topBarRight}>
          <LanguageToggle />
        </div>
      </div>

      {/* 2. Hero Section */}
      <section className={styles.heroSection} aria-label="Learning paths introduction">
        <div className={styles.heroEyebrow}>
          <Sparkles size={14} />
          <span>Curated Architectural Masterclasses &amp; Learning Paths</span>
        </div>
        <h1 className={styles.heroTitle}>
          Production-Grade System Design Blueprints &amp; Tech Stacks
        </h1>
        <p className={styles.heroSubtitle}>
          Designed for senior engineers, tech leads, and aspiring architects. Zero fluff, real-world distributed architectures, and interactive interview case studies built to stand up in production.
        </p>

        <div className={styles.heroMetricsStrip}>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>34,000+</span>
            <span className={styles.metricLabel}>Enrolled Learners</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>4.96 ★</span>
            <span className={styles.metricLabel}>Average Course Rating</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>100%</span>
            <span className={styles.metricLabel}>Zero-Noise Curriculum</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricValue}>12+</span>
            <span className={styles.metricLabel}>System Design Architectures</span>
          </div>
        </div>
      </section>

      {/* 3. Trending on Courses Section (mirroring /tech-buzz with circular icons) */}
      <section className={styles.trendingSection} aria-label="Trending learning paths">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <TrendingUp size={18} color="#ea580c" />
            <span>Trending on MasterClass Courses</span>
          </div>
          <div className={styles.sectionHeaderRight}>
            Updated dynamically based on developer upvotes, claps &amp; enrollments
          </div>
        </div>

        <div className={styles.trendingGrid}>
          {trendingCourses.map((course, idx) => (
            <article key={course.id} className={styles.trendingCard}>
              <span className={styles.trendingRank}>
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className={styles.trendingBody}>
                <div className={styles.trendingHeaderRow}>
                  <div className={styles.trendingMeta}>
                    <span className={styles.authorAvatarSmallWrapper}>
                      <Image
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        width={22}
                        height={22}
                        className={styles.authorAvatarSmall}
                        unoptimized
                      />
                    </span>
                    <span className={styles.authorNameSmall}>{course.instructor.name}</span>
                    <span>•</span>
                    <span>{course.durationHours}h course</span>
                  </div>

                  <span
                    className={styles.trendingCircularIcon}
                    title={`${course.technology} • ${course.categoryLabel}`}
                    style={{
                      backgroundColor: `${course.techBadgeColor}15`,
                      borderColor: `${course.techBadgeColor}40`,
                      color: course.techBadgeColor
                    }}
                  >
                    {getTechnologyBrandIcon(course.technology, 16)}
                  </span>
                </div>

                <h3 className={styles.trendingTitle} title={course.title}>
                  <Link href={course.dashboardPath} style={{ color: "inherit", textDecoration: "none" }}>
                    {course.title}
                  </Link>
                </h3>

                <div className={styles.trendingFooter}>
                  <span className={styles.starRatingBadge} title={`Rated ${course.rating.average} / 5`}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span>{course.rating.average}</span>
                    <span style={{ opacity: 0.7 }}>({course.rating.count})</span>
                  </span>

                  <button
                    type="button"
                    className={`${styles.trendingActionBtn} ${likedCourseIds[course.id] ? styles.trendingActionLikeActive : ""}`}
                    onClick={e => handleLike(course.id, e)}
                    title="Like course (boosts in trending rank)"
                  >
                    <ThumbsUp size={11} />
                    <span>{course.likes}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.trendingActionBtn} ${dislikedCourseIds[course.id] ? styles.trendingActionDislikeActive : ""}`}
                    onClick={e => handleDislike(course.id, e)}
                    title="Dislike course"
                  >
                    <ThumbsDown size={11} />
                    <span>{course.dislikes}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.trendingActionBtn} ${styles.trendingClapBtn} ${(clapsState[course.id] || 0) > 0 ? styles.trendingActionLikeActive : ""}`}
                    onClick={e => handleClap(course.id, e)}
                    title="Clap for this course"
                  >
                    <span>👏</span>
                    <span>{course.claps}</span>
                  </button>

                  <span className={styles.zeroNoiseBadge}>
                    {course.level}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Controls, Layout Switch & Categories Bar */}
      <section className={styles.controlsSection} aria-label="Search and filter controls">
        <div className={styles.controlsTopRow}>
          {/* Format Density Toggle (Magazine vs Compact Zero-Noise) */}
          <div className={styles.layoutToggleWrapper} role="group" aria-label="Course view layout density">
            <button
              type="button"
              className={`${styles.layoutToggleBtn} ${layoutDensity === "magazine" ? styles.layoutToggleActive : ""}`}
              onClick={() => updateLayoutDensity("magazine")}
              aria-label="Magazine card view"
            >
              <LayoutGrid size={14} />
              <span>⊞ Magazine</span>
            </button>
            <button
              type="button"
              className={`${styles.layoutToggleBtn} ${layoutDensity === "compact" ? styles.layoutToggleActive : ""}`}
              onClick={() => updateLayoutDensity("compact")}
              aria-label="Compact zero-noise list view"
            >
              <List size={14} />
              <span>≡ Zero-Noise</span>
            </button>
          </div>

          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              aria-label="Search courses"
              placeholder="Search by architecture, tech stack, instructor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={styles.searchClearBtn}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className={styles.categoryPillsRow}>
          {[
            { id: "All", label: "All Learning Paths" },
            { id: "system-design", label: "System Design & Architecture (12+)" },
            { id: "technology", label: "Technology & Modern Stacks" },
            { id: "languages", label: "IELTS & Career Communication" }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.categoryPill} ${selectedCategory === cat.id ? styles.categoryPillActive : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Main Course Feed */}
      <section className={styles.feedSection} aria-label="Course catalogue">
        {layoutDensity === "magazine" ? (
          <div className={styles.magazineGrid}>
            {filteredCourses.map(course => (
              <article key={course.id} className={styles.magazineCard}>
                <div className={styles.magazineCardTop}>
                  <div className={styles.magazineHeaderMeta}>
                    <span className={styles.magazineCategoryBadge}>
                      <Flame size={12} color="#ea580c" />
                      <span>{course.categoryLabel}</span>
                    </span>

                    <span
                      className={styles.trendingCircularIcon}
                      title={`${course.technology} • ${course.categoryLabel}`}
                      style={{
                        backgroundColor: `${course.techBadgeColor}15`,
                        borderColor: `${course.techBadgeColor}40`,
                        color: course.techBadgeColor
                      }}
                    >
                      {getTechnologyBrandIcon(course.technology, 16)}
                    </span>
                  </div>

                  <h2 className={styles.magazineTitle}>
                    <Link href={course.dashboardPath} style={{ color: "inherit", textDecoration: "none" }}>
                      {course.title}
                    </Link>
                  </h2>
                  <p className={styles.magazineSubtitle}>{course.subtitle}</p>

                  <ul className={styles.syllabusBullets}>
                    {course.syllabusBullets.map((bullet, bIdx) => (
                      <li key={bIdx} className={styles.syllabusBulletItem}>
                        <span>✓</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.techStackChips}>
                    {course.techStack.map(stack => (
                      <span key={stack} className={styles.techChip}>{stack}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.magazineCardFooter}>
                  <div className={styles.cardFooterLeft}>
                    <span className={styles.starRatingBadge} title={`Rated ${course.rating.average} / 5`}>
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span>{course.rating.average}</span>
                      <span style={{ opacity: 0.7 }}>({course.rating.count})</span>
                    </span>

                    <button
                      type="button"
                      className={`${styles.trendingActionBtn} ${likedCourseIds[course.id] ? styles.trendingActionLikeActive : ""}`}
                      onClick={e => handleLike(course.id, e)}
                      title="Like this course"
                    >
                      <ThumbsUp size={11} />
                      <span>{course.likes}</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.trendingActionBtn} ${dislikedCourseIds[course.id] ? styles.trendingActionDislikeActive : ""}`}
                      onClick={e => handleDislike(course.id, e)}
                      title="Dislike this course"
                    >
                      <ThumbsDown size={11} />
                      <span>{course.dislikes}</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.trendingActionBtn} ${styles.trendingClapBtn} ${(clapsState[course.id] || 0) > 0 ? styles.trendingActionLikeActive : ""}`}
                      onClick={e => handleClap(course.id, e)}
                      title="Clap for this course"
                    >
                      <span>👏</span>
                      <span>{course.claps}</span>
                    </button>
                  </div>

                  <Link href={course.dashboardPath} className={styles.ctaPathBtn}>
                    <span>Open in Dashboard</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.compactList}>
            {filteredCourses.map(course => (
              <div key={course.id} className={styles.compactCard}>
                <div className={styles.compactLeft}>
                  <span
                    className={styles.trendingCircularIcon}
                    style={{
                      backgroundColor: `${course.techBadgeColor}15`,
                      borderColor: `${course.techBadgeColor}40`,
                      color: course.techBadgeColor
                    }}
                  >
                    {getTechnologyBrandIcon(course.technology, 16)}
                  </span>
                  <div>
                    <h3 className={styles.compactTitle}>
                      <Link href={course.dashboardPath} style={{ color: "inherit", textDecoration: "none" }}>
                        {course.title}
                      </Link>
                    </h3>
                    <div className={styles.compactMeta}>
                      <span>{course.categoryLabel}</span>
                      <span>•</span>
                      <span>{course.level}</span>
                      <span>•</span>
                      <span>{course.durationHours}h</span>
                      <span>•</span>
                      <span>{course.instructor.name}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.compactRight}>
                  <button
                    type="button"
                    className={`${styles.trendingActionBtn} ${likedCourseIds[course.id] ? styles.trendingActionLikeActive : ""}`}
                    onClick={e => handleLike(course.id, e)}
                  >
                    <ThumbsUp size={11} />
                    <span>{course.likes}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.trendingActionBtn} ${styles.trendingClapBtn} ${(clapsState[course.id] || 0) > 0 ? styles.trendingActionLikeActive : ""}`}
                    onClick={e => handleClap(course.id, e)}
                  >
                    <span>👏</span>
                    <span>{course.claps}</span>
                  </button>

                  <Link href={course.dashboardPath} className={styles.ctaPathBtn}>
                    <span>Open →</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Pro Access & Membership Banner */}
      <section className={styles.proBanner} aria-label="Membership pass">
        <div className={styles.proBannerLeft}>
          <h3 className={styles.proBannerTitle}>Unlock All 12+ System Design Architectures</h3>
          <p className={styles.proBannerDesc}>
            Join 34,000+ senior engineers with MasterClass Pro. Get instant access to interactive HLD/LLD diagrams, sandbox coding labs, video walkthroughs, and lifetime certification updates.
          </p>
        </div>
        <div className={styles.proBannerRight}>
          <Link href="/pricing" className={styles.proBannerBtn}>
            <span>Get All-Access Pro (25% OFF)</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* 7. Toast Notification */}
      {toastMessage && (
        <aside className={styles.toastNotification} role="status">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </aside>
      )}
    </div>
  );
}
