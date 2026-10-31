"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "@/components/responsive-image";
import Link from "next/link";
import {
  Flame,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Code2,
  Layers,
  Database,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";
import type { TechBuzzArticle } from "@/lib/tech-buzz-data";
import styles from "./super-admin-tech-buzz.module.css";

const CATEGORY_PRESETS = [
  "System Architecture",
  "DevOps & Cloud",
  "Frontend Architecture",
  "Artificial Intelligence",
  "Distributed Systems",
  "Database Internals",
  "Mobile Engineering",
  "Security & Auth",
  "Infrastructure & SRE",
];

const TECH_PRESETS = [
  { name: "React 19", color: "#06b6d4" },
  { name: "Next.js 15", color: "#0f172a" },
  { name: "Rust", color: "#ea580c" },
  { name: "Docker", color: "#0284c7" },
  { name: "Kubernetes", color: "#2563eb" },
  { name: "AWS Lambda", color: "#d97706" },
  { name: "PostgreSQL 17", color: "#0284c7" },
  { name: "Python 3.13", color: "#16a34a" },
  { name: "eBPF", color: "#7c3aed" },
  { name: "TypeScript 5.6", color: "#3b82f6" },
];

const COVER_IMAGE_PRESETS = [
  { label: "Modern Architecture", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80" },
  { label: "Cloud & Networks", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80" },
  { label: "Databases & Code", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80" },
  { label: "AI & Neural Networks", url: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80" },
  { label: "Kubernetes & Infrastructure", url: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200&auto=format&fit=crop&q=80" },
];

interface SuperAdminTechBuzzProps {
  onChanged?: (msg: string) => void;
}

const loadPublicArticles = () => fetch("/api/tech-buzz").then(res => res.json());

function requestArticles(): Promise<TechBuzzArticle[]> {
  return fetch("/api/super-admin/tech-buzz")
    // Fallback to the public endpoint when the admin one refuses or fails.
    .then(res => (res.ok ? res.json() : loadPublicArticles()))
    .catch(err => { console.warn("Error fetching articles:", err); return loadPublicArticles(); })
    .then(data => data.articles || []);
}

export function SuperAdminTechBuzz({ onChanged }: SuperAdminTechBuzzProps) {
  const [articles, setArticles] = useState<TechBuzzArticle[]>([]);
  // True on mount: the list is requested straight away.
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Composer Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("System Architecture");
  const [technology, setTechnology] = useState("Next.js 15");
  const [techBadgeColor, setTechBadgeColor] = useState("#0f172a");
  const [readTimeMinutes, setReadTimeMinutes] = useState(6);
  const [membershipTier, setMembershipTier] = useState<"Free Preview" | "Pro Member" | "All-Access">("Pro Member");
  const [featured, setFeatured] = useState(false);
  const [trendingRank, setTrendingRank] = useState<number | null>(null);

  const [authorName, setAuthorName] = useState("Study Buddy Architect");
  const [authorRole, setAuthorRole] = useState("Principal Distributed Systems Engineer");
  const [authorHandle, setAuthorHandle] = useState("@studybuddy");
  const [authorAvatar, setAuthorAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");

  const [coverImage, setCoverImage] = useState(COVER_IMAGE_PRESETS[0].url);
  const [tagsInput, setTagsInput] = useState("nextjs15, server-actions, system-design");
  const [summaryBulletsInput, setSummaryBulletsInput] = useState("Zero-latency streaming with React 19 Server Components\nSub-50ms cold starts on serverless edge runtimes\nProduction resilience blueprints for high-throughput apps");
  const [techStackInput, setTechStackInput] = useState("Next.js 15, React 19, TypeScript, PostgreSQL, Tailwind CSS");
  const [founderTakeaway, setFounderTakeaway] = useState("Optimize for simplicity in day-one architectures before introducing microservices.");

  // Content Sections
  const [sections, setSections] = useState<Array<{
    heading: string;
    paragraphsText: string;
    codeSnippetLanguage: string;
    codeSnippetFilename: string;
    codeSnippetCode: string;
    calloutType: "tip" | "insight" | "warning";
    calloutText: string;
  }>>([
    {
      heading: "Architectural Foundations & System Decisions",
      paragraphsText: "Designing robust systems requires isolating core failure domains and optimizing data access patterns before reaching scale.\n\nBy leveraging asynchronous background execution and connection pooling, we achieve ultra-low p99 latency guarantees.",
      codeSnippetLanguage: "tsx",
      codeSnippetFilename: "app/actions/compute.ts",
      codeSnippetCode: 'export async function streamData() {\n  "use server";\n  const client = await pool.connect();\n  return client.query("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 50");\n}',
      calloutType: "insight",
      calloutText: "Always configure resilient retry mechanisms with exponential jitter for upstream microservice dependencies.",
    },
  ]);

  // Load articles from API. State is only set once a response arrives, so the mount effect can start it.
  const loadArticles = useCallback(() => requestArticles().then(setArticles).finally(() => setLoading(false)), []);

  const fetchArticles = () => {
    setLoading(true);
    setError(null);
    return loadArticles();
  };

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  // Auto-slugify when typing title in new mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      const autoSlug = val
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
      setSlug(autoSlug);
    }
  };

  // Quick seed / sync default articles to Supabase
  const handleSyncDefaults = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/tech-buzz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncDefaults: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync articles");
      setNotice(`Successfully synced ${data.count || 8} curated technical blogs to Supabase database!`);
      await fetchArticles();
      if (onChanged) onChanged("Tech Buzz articles synced to Supabase database");
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to sync articles to Supabase");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Section
  const handleAddSection = () => {
    setSections(prev => [
      ...prev,
      {
        heading: `Deep Dive Section ${prev.length + 1}`,
        paragraphsText: "Detail your architectural insights, trade-offs, and production considerations here.",
        codeSnippetLanguage: "typescript",
        codeSnippetFilename: "src/worker.ts",
        codeSnippetCode: "",
        calloutType: "tip",
        calloutText: "",
      },
    ]);
  };

  // Remove Section
  const handleRemoveSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  // Reset form
  const handleResetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setSlug("");
    setCategory("System Architecture");
    setTechnology("Next.js 15");
    setTechBadgeColor("#0f172a");
    setReadTimeMinutes(6);
    setFeatured(false);
    setTrendingRank(null);
    setSections([
      {
        heading: "Architectural Foundations & System Decisions",
        paragraphsText: "Designing robust systems requires isolating core failure domains and optimizing data access patterns.",
        codeSnippetLanguage: "tsx",
        codeSnippetFilename: "app/actions/compute.ts",
        codeSnippetCode: "",
        calloutType: "insight",
        calloutText: "",
      },
    ]);
  };

  // Load article into composer for editing
  const handleEditArticle = (art: TechBuzzArticle) => {
    setIsEditing(true);
    setEditingId(art.id);
    setTitle(art.title);
    setSubtitle(art.subtitle);
    setSlug(art.slug);
    setCategory(art.category);
    setTechnology(art.technology);
    setTechBadgeColor(art.techBadgeColor || "#ea580c");
    setReadTimeMinutes(art.readTimeMinutes);
    setMembershipTier(art.membershipTier);
    setFeatured(Boolean(art.featured));
    setTrendingRank(art.trendingRank || null);
    setAuthorName(art.author.name);
    setAuthorRole(art.author.role);
    setAuthorHandle(art.author.handle);
    setAuthorAvatar(art.author.avatar);
    setCoverImage(art.coverImage);
    setTagsInput((art.tags || []).join(", "));
    setSummaryBulletsInput((art.summaryBullets || []).join("\n"));
    setTechStackInput((art.techStack || []).join(", "));
    setFounderTakeaway(art.founderTakeaway || "");

    if (art.contentSections && art.contentSections.length > 0) {
      setSections(
        art.contentSections.map(sec => ({
          heading: sec.heading || "",
          paragraphsText: (sec.paragraphs || []).join("\n\n"),
          codeSnippetLanguage: sec.codeSnippet?.language || "typescript",
          codeSnippetFilename: sec.codeSnippet?.filename || "",
          codeSnippetCode: sec.codeSnippet?.code || "",
          calloutType: sec.callout?.type || "insight",
          calloutText: sec.callout?.text || "",
        }))
      );
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  // Delete article
  const handleDeleteArticle = async (id: string, artTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${artTitle}" from Supabase?`)) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/super-admin/tech-buzz?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete article");
      }
      setNotice(`Deleted "${artTitle}" successfully.`);
      await fetchArticles();
      if (onChanged) onChanged(`Deleted blog "${artTitle}"`);
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to delete article");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Article (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError("Title and slug are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    const payload = {
      id: editingId || undefined,
      title: title.trim(),
      subtitle: subtitle.trim(),
      slug: slug.trim(),
      category: category.trim(),
      technology: technology.trim(),
      techBadgeColor,
      readTimeMinutes: Number(readTimeMinutes) || 5,
      featured,
      trendingRank: trendingRank ? Number(trendingRank) : null,
      membershipTier,
      coverImage: coverImage.trim(),
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      summaryBullets: summaryBulletsInput.split("\n").map(s => s.trim()).filter(Boolean),
      techStack: techStackInput.split(",").map(t => t.trim()).filter(Boolean),
      founderTakeaway: founderTakeaway.trim(),
      author: {
        name: authorName.trim(),
        role: authorRole.trim(),
        handle: authorHandle.trim(),
        avatar: authorAvatar.trim(),
        verified: true,
      },
      contentSections: sections.map(sec => ({
        heading: sec.heading.trim(),
        paragraphs: sec.paragraphsText.split("\n\n").map(p => p.trim()).filter(Boolean),
        ...(sec.codeSnippetCode.trim()
          ? {
              codeSnippet: {
                language: sec.codeSnippetLanguage,
                filename: sec.codeSnippetFilename || undefined,
                code: sec.codeSnippetCode,
              },
            }
          : {}),
        ...(sec.calloutText.trim()
          ? {
              callout: {
                type: sec.calloutType,
                text: sec.calloutText.trim(),
              },
            }
          : {}),
      })),
      status: "published",
    };

    try {
      const url = "/api/super-admin/tech-buzz";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save blog to Supabase");
      }

      setNotice(
        isEditing
          ? `Updated "${payload.title}" successfully in Supabase!`
          : `Published new blog "${payload.title}" to /tech-buzz & Supabase!`
      );
      handleResetForm();
      await fetchArticles();
      if (onChanged) onChanged(`Saved blog "${payload.title}"`);
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to save blog to Supabase");
    } finally {
      setSubmitting(false);
    }
  };

  // Stats computation
  const stats = useMemo(() => {
    return {
      total: articles.length,
      featured: articles.filter(a => a.featured).length,
      upvotes: articles.reduce((acc, a) => acc + (a.upvotes || 0), 0),
      claps: articles.reduce((acc, a) => acc + (a.claps || 0), 0),
    };
  }, [articles]);

  return (
    <div className={styles.container}>
      {/* 1. Hero Action Banner */}
      <div className={styles.heroBar}>
        <div className={styles.heroText}>
          <h3>
            <Flame size={24} color="#ea580c" />
            <span>Tech Buzz Blogs Management & Supabase Studio</span>
          </h3>
          <p>
            Create, publish, and manage full-width developer deep-dive blogs on <strong>/tech-buzz</strong> and all subsequent story pages. Seamlessly backed by your Supabase database with instant live updates.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleSyncDefaults}
            disabled={submitting}
            title="Populate Supabase with default curated engineering blogs"
          >
            <Database size={15} />
            <span>Sync Demo Blogs to Supabase</span>
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              handleResetForm();
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 400, behavior: "smooth" });
              }
            }}
          >
            <Plus size={16} />
            <span>+ Add New Tech Buzz Blog</span>
          </button>
        </div>
      </div>

      {/* 2. Live Telemetry & Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <BookOpen size={14} />
            Published Tech Blogs
          </span>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statSub}>Live on /tech-buzz</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <Star size={14} color="#f59e0b" />
            Featured Stories
          </span>
          <span className={styles.statValue}>{stats.featured}</span>
          <span className={styles.statSub}>Hero & Trending slots</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <ThumbsUp size={14} color="#059669" />
            Developer Upvotes
          </span>
          <span className={styles.statValue}>{stats.upvotes.toLocaleString()}</span>
          <span className={styles.statSub}>daily.dev radar rank</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <Sparkles size={14} color="#7c3aed" />
            Total Claps & Love
          </span>
          <span className={styles.statValue}>{stats.claps.toLocaleString()}</span>
          <span className={styles.statSub}>Medium-style engagement</span>
        </div>
      </div>

      {/* Notifications & Errors */}
      {notice && (
        <div style={{ background: "#eff9f3", border: "1px solid #a7f3d0", color: "#065f46", padding: "0.85rem 1.25rem", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} color="#059669" />
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#065f46" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "0.85rem 1.25rem", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={16} color="#dc2626" />
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#991b1b" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. Comprehensive Blog Composer Form */}
      <form onSubmit={handleSubmit} className={styles.composerCard}>
        <div className={styles.composerHeading}>
          <h4>
            <Edit3 size={18} color="#ea580c" />
            <span>{isEditing ? `Edit Blog: "${title}"` : "Compose & Publish New Tech Buzz Blog"}</span>
          </h4>
          {isEditing && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleResetForm}
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className={styles.formGrid}>
          {/* Title */}
          <div className={`${styles.formGroup} ${styles.fullCol}`}>
            <label>
              <span>Blog Title *</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Max 250 characters</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. Scaling to 10M WebSockets on Kubernetes & Rust"
              className={styles.formInput}
            />
          </div>

          {/* Subtitle */}
          <div className={`${styles.formGroup} ${styles.fullCol}`}>
            <label>
              <span>Catchy Subtitle / Pitch *</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Shown on feed card & header</span>
            </label>
            <input
              type="text"
              required
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. High-throughput distributed WebSocket gateway architecture with zero-copy eBPF filters"
              className={styles.formInput}
            />
          </div>

          {/* URL Slug */}
          <div className={styles.formGroup}>
            <label>
              <span>URL Slug (/tech-buzz/[slug]) *</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="e.g. scaling-websockets-kubernetes-rust"
              className={styles.formInput}
            />
          </div>

          {/* Category */}
          <div className={styles.formGroup}>
            <label>
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={styles.formSelect}
            >
              {CATEGORY_PRESETS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Technology */}
          <div className={styles.formGroup}>
            <label>
              <span>Primary Technology</span>
            </label>
            <select
              value={technology}
              onChange={e => {
                setTechnology(e.target.value);
                const match = TECH_PRESETS.find(p => p.name === e.target.value);
                if (match) setTechBadgeColor(match.color);
              }}
              className={styles.formSelect}
            >
              {TECH_PRESETS.map(t => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Read Time & Tier */}
          <div className={styles.formGroup}>
            <label>
              <span>Read Time (Minutes) & Membership Tier</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "0.5rem" }}>
              <input
                type="number"
                min={1}
                max={120}
                value={readTimeMinutes}
                onChange={e => setReadTimeMinutes(Number(e.target.value) || 5)}
                className={styles.formInput}
              />
              <select
                value={membershipTier}
                onChange={e => setMembershipTier(e.target.value as typeof membershipTier)}
                className={styles.formSelect}
              >
                <option value="Free Preview">Free Preview (Paywall after section 1)</option>
                <option value="Pro Member">Pro Member (Member-only deep dive)</option>
                <option value="All-Access">All-Access</option>
              </select>
            </div>
          </div>

          {/* Featured & Trending */}
          <div className={styles.formGroup}>
            <label>
              <span>Showcase Flags</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", height: "42px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.875rem" }}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={e => setFeatured(e.target.checked)}
                />
                <span>Featured Blog (Hero)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.875rem" }}>
                <span>Trending Rank:</span>
                <select
                  value={trendingRank || ""}
                  onChange={e => setTrendingRank(e.target.value ? Number(e.target.value) : null)}
                  className={styles.formSelect}
                  style={{ width: "80px", padding: "0.25rem 0.5rem" }}
                >
                  <option value="">None</option>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>#{n}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Author Details */}
          <div className={styles.formGroup}>
            <label>
              <span>Author Name & Role</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Author Name"
                className={styles.formInput}
              />
              <input
                type="text"
                value={authorRole}
                onChange={e => setAuthorRole(e.target.value)}
                placeholder="Role / Title"
                className={styles.formInput}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className={`${styles.formGroup} ${styles.fullCol}`}>
            <label>
              <span>Cover Image URL</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Pick preset or enter custom image</span>
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              {COVER_IMAGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCoverImage(preset.url)}
                  style={{
                    background: coverImage === preset.url ? "#ea580c" : "#f1f5f9",
                    color: coverImage === preset.url ? "#ffffff" : "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9999px",
                    padding: "0.25rem 0.65rem",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="url"
              required
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              className={styles.formInput}
            />
          </div>

          {/* Tags & Tech Stack */}
          <div className={styles.formGroup}>
            <label>
              <span>Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. nextjs15, rust, kubernetes"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <span>Tech Stack Badges</span>
            </label>
            <input
              type="text"
              value={techStackInput}
              onChange={e => setTechStackInput(e.target.value)}
              placeholder="e.g. Next.js 15, React 19, TypeScript, Rust"
              className={styles.formInput}
            />
          </div>

          {/* Summary Bullets (daily.dev style) */}
          <div className={`${styles.formGroup} ${styles.fullCol}`}>
            <label>
              <span>Key Summary Takeaways (1 per line)</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>3 concise daily.dev bullet points</span>
            </label>
            <textarea
              rows={3}
              value={summaryBulletsInput}
              onChange={e => setSummaryBulletsInput(e.target.value)}
              className={styles.formTextarea}
            />
          </div>

          {/* Founder / Builder Takeaway */}
          <div className={`${styles.formGroup} ${styles.fullCol}`}>
            <label>
              <span>Architectural Takeaway (Indie Hacker quote)</span>
            </label>
            <input
              type="text"
              value={founderTakeaway}
              onChange={e => setFounderTakeaway(e.target.value)}
              placeholder="e.g. Keep failure domains isolated and rely on proven primitives before optimizing."
              className={styles.formInput}
            />
          </div>
        </div>

        {/* 4. Content Sections Editor */}
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h5 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "#0f172a" }}>
              Blog Content Sections & Code Snippets ({sections.length})
            </h5>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleAddSection}
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
            >
              + Add Another Section
            </button>
          </div>

          <div className={styles.sectionsList}>
            {sections.map((sec, idx) => (
              <div key={idx} className={styles.sectionBox}>
                <div className={styles.sectionHeader}>
                  <strong style={{ fontSize: "0.875rem", color: "#334155" }}>
                    Section #{idx + 1} {idx === 0 ? "(Free Preview Portion)" : "(Member-Unlocked Deep Dive)"}
                  </strong>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => handleRemoveSection(idx)}
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Section Heading</label>
                  <input
                    type="text"
                    value={sec.heading}
                    onChange={e => {
                      const updated = [...sections];
                      updated[idx].heading = e.target.value;
                      setSections(updated);
                    }}
                    placeholder="e.g. Profiling Memory Bottlenecks & Asynchronous Workflows"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Section Paragraphs (Separate paragraphs with double newlines)</label>
                  <textarea
                    rows={4}
                    value={sec.paragraphsText}
                    onChange={e => {
                      const updated = [...sections];
                      updated[idx].paragraphsText = e.target.value;
                      setSections(updated);
                    }}
                    className={styles.formTextarea}
                  />
                </div>

                {/* Code Snippet */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Code2 size={14} color="#ea580c" />
                      Optional Code Snippet
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="filename (e.g. server.rs)"
                        value={sec.codeSnippetFilename}
                        onChange={e => {
                          const updated = [...sections];
                          updated[idx].codeSnippetFilename = e.target.value;
                          setSections(updated);
                        }}
                        style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                      <select
                        value={sec.codeSnippetLanguage}
                        onChange={e => {
                          const updated = [...sections];
                          updated[idx].codeSnippetLanguage = e.target.value;
                          setSections(updated);
                        }}
                        style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      >
                        <option value="tsx">TSX / React</option>
                        <option value="typescript">TypeScript</option>
                        <option value="rust">Rust</option>
                        <option value="python">Python</option>
                        <option value="sql">SQL / Postgres</option>
                        <option value="yaml">YAML / K8s</option>
                        <option value="bash">Bash / Shell</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={sec.codeSnippetCode}
                    onChange={e => {
                      const updated = [...sections];
                      updated[idx].codeSnippetCode = e.target.value;
                      setSections(updated);
                    }}
                    placeholder="// Paste production code sample here..."
                    className={styles.formTextarea}
                    style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}
                  />
                </div>

                {/* Callout */}
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "0.5rem", alignItems: "center" }}>
                  <select
                    value={sec.calloutType}
                    onChange={e => {
                      const updated = [...sections];
                      updated[idx].calloutType = e.target.value as (typeof sections)[number]["calloutType"];
                      setSections(updated);
                    }}
                    className={styles.formSelect}
                    style={{ fontSize: "0.75rem" }}
                  >
                    <option value="insight">Insight</option>
                    <option value="tip">Pro Tip</option>
                    <option value="warning">Warning</option>
                  </select>
                  <input
                    type="text"
                    value={sec.calloutText}
                    onChange={e => {
                      const updated = [...sections];
                      updated[idx].calloutText = e.target.value;
                      setSections(updated);
                    }}
                    placeholder="Optional architecture callout text..."
                    className={styles.formInput}
                    style={{ fontSize: "0.8125rem" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleResetForm}
            disabled={submitting}
          >
            Reset
          </button>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={submitting}
            style={{ minWidth: "220px", justifyContent: "center" }}
          >
            {submitting ? (
              <RefreshCw size={16} className="spin" />
            ) : (
              <Sparkles size={16} />
            )}
            <span>
              {submitting
                ? "Publishing to Supabase..."
                : isEditing
                ? "Update Blog in Supabase"
                : "Publish Blog to /tech-buzz"}
            </span>
          </button>
        </div>
      </form>

      {/* 5. Existing Tech Buzz Blogs Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h4 className={styles.tableTitle}>
            <Layers size={18} color="#ea580c" />
            <span>All Published Technical Blogs ({articles.length})</span>
          </h4>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              className={styles.actionIconBtn}
              onClick={fetchArticles}
              disabled={loading}
              title="Refresh list from database"
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
              <span>Refresh</span>
            </button>
            <Link
              href="/tech-buzz"
              target="_blank"
              className={styles.actionIconBtn}
              title="View public /tech-buzz page"
            >
              <ExternalLink size={13} />
              <span>Visit /tech-buzz ↗</span>
            </Link>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.blogTable}>
            <thead>
              <tr>
                <th>Blog Details</th>
                <th>Category & Tech</th>
                <th>Author</th>
                <th>Tier & Read</th>
                <th>Engagement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(art => (
                <tr key={art.id}>
                  <td>
                    <div className={styles.blogTitleCell}>
                      <Image
                        src={art.coverImage}
                        alt={art.title}
                        width={50}
                        height={50}
                        className={styles.blogThumb}
                        unoptimized
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                          {art.featured && (
                            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                              FEATURED
                            </span>
                          )}
                          {art.trendingRank && (
                            <span style={{ background: "#fff7ed", color: "#ea580c", fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                              #{art.trendingRank} TRENDING
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem", lineHeight: 1.3 }}>
                          {art.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          /tech-buzz/{art.slug}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                      <span className={styles.badgeCategory}>{art.category}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: art.techBadgeColor || "#ea580c" }}>
                        {art.technology}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1e293b" }}>
                      {art.author.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {art.author.handle}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: art.membershipTier === "Free Preview" ? "#059669" : "#7c3aed" }}>
                      {art.membershipTier}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {art.readTimeMinutes} min read
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", fontSize: "0.75rem", color: "#475569" }}>
                      <span title="Rating" style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        <strong>{art.rating.average}</strong>
                      </span>
                      <span title="Upvotes">
                        👍 {art.upvotes}
                      </span>
                      <span title="Claps">
                        👏 {art.claps}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        onClick={() => handleEditArticle(art)}
                        title="Edit blog in composer"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <Link
                        href={`/tech-buzz/${art.slug}`}
                        target="_blank"
                        className={styles.actionIconBtn}
                        title="Open full blog story page"
                      >
                        <ExternalLink size={13} />
                        <span>View</span>
                      </Link>

                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => handleDeleteArticle(art.id, art.title)}
                        title="Delete from database"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
