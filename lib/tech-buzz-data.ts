import { TECHNOLOGY_ARTICLES } from "./tech-buzz-technology-articles";

export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
  handle: string;
  verified?: boolean;
}

export interface BlogRating {
  average: number; // e.g. 4.96
  count: number;   // e.g. 1420
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ArticleComment {
  id: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    handle: string;
    badge?: string;
  };
  text: string;
  createdAt: string;
  likes: number;
}

export interface DevReactions {
  heart: number;      // ❤️ Dev.to
  unicorn: number;    // 🦄 Dev.to
  rocket: number;     // 🚀 Dev.to
  mindblown: number;  // 🤯 Dev.to
}

export interface DailyDevSource {
  name: string;
  domain: string;
  trustScore: string; // e.g. "98.4"
  url?: string;
  /** Official documentation pages a daily story was researched from, named as plain text (never linked). */
  basedOn?: { title: string; site: string }[];
  /** The editor's score out of 5 from the pre-publish review; daily stories are published only at 4 or above. */
  editorScore?: number;
  platformKey?: "medium" | "daily-dev" | "indianexpress" | "elevenlabs" | "technologymagazine" | "theinformation" | "bain" | "indiehackers" | "dev-to" | "hashnode" | "substack" | "ghost";
  verifiedBadge?: string;
  /** The star review of an imported story (lib/server/tech-buzz-imports.ts); built-in stories use lib/tech-buzz-reviews.ts. */
  review?: { stars: number; verdict: string };
  /** The community post an imported story was written from, credited as plain text (never linked). */
  credit?: { title: string; author: string; platform: string };
}

export interface HashnodeSeries {
  title: string;
  part: number;
  totalParts: number;
}

export interface SubstackAudio {
  durationMinutes: number;
  narrator: string;
  waveformSeed: number[];
}

export interface IndieBuilderMetrics {
  metricLabel: string;
  metricValue: string;
  starsCount?: number;
  sla?: string;
}

export interface ContentPlatformComparison {
  name: string;
  type: string;
  focus: string;
  trustRating: number;
  coreStrength: string;
  badge: string;
  url: string;
}

export interface TechBuzzArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  technology: string;
  /** The Learning Dashboard technology this story belongs to (public/images/tech/<techId>.png), when there is one. */
  techId?: string;
  techBadgeColor: string;
  publishedAt: string;
  readTimeMinutes: number;
  featured?: boolean;
  trendingRank?: number; // 1 to 10
  likes: number;
  dislikes: number;
  upvotes: number; // synced with likes for backward compatibility
  claps: number;
  /** The starting count before readers' claps (tech_buzz_claps) were added to `claps`; set on published lists only. */
  baseClaps?: number;
  rating: BlogRating;
  author: BlogAuthor;
  coverImage: string;
  tags: string[];

  // Source platform integration
  rankingScore: number;
  source: DailyDevSource;
  summaryBullets: string[];

  // Social interactions
  reactions: DevReactions;
  commentsCount: number;
  comments: ArticleComment[];

  // Series & stacks
  series?: HashnodeSeries;
  techStack: string[];

  // Audio voiceover
  audioVoiceover: SubstackAudio;
  newsletterEdition?: string;

  // Membership & Preview
  membershipTier: "Free Preview" | "Pro Member" | "All-Access";

  // Production Builder Metrics
  builderMetrics: IndieBuilderMetrics;
  founderTakeaway: string;

  contentSections: {
    heading: string;
    paragraphs: string[];
    codeSnippet?: {
      language: string;
      code: string;
      filename?: string;
      /** A runnable example split across files (shown as editor tabs); `code`/`filename` mirror the first one. */
      files?: { filename: string; language: string; code: string }[];
    };
    callout?: {
      type: "tip" | "insight" | "warning";
      text: string;
    };
    quote?: {
      text: string;
      attribution: string;
    };
    bulletPoints?: string[];
    /** Numbered, do-this-next steps (rendered as an ordered list). */
    steps?: string[];
    /** An illustration shown under the section heading (the daily edition's blog image). */
    image?: { src: string; alt: string };
  }[];
}

export const TOP_PLATFORMS_COMPARISON: ContentPlatformComparison[] = [
  {
    name: "daily.dev",
    type: "Aggregator Feed",
    focus: "Curated daily tech news",
    trustRating: 4.9,
    coreStrength: "Zero-noise ranked news feed",
    badge: "Aggregator",
    url: "https://daily.dev"
  },
  {
    name: "Medium",
    type: "General Publishing",
    focus: "Broad audience & tech careers",
    trustRating: 4.8,
    coreStrength: "Built-in monetization program",
    badge: "Editorial",
    url: "https://medium.com"
  },
  {
    name: "The Indian Express",
    type: "Technology Journalism",
    focus: "Tech policy, hardware fabs & sovereign AI",
    trustRating: 4.8,
    coreStrength: "Rigorous investigative reporting & policy analysis",
    badge: "National Press",
    url: "https://indianexpress.com/section/technology/"
  },
  {
    name: "ElevenLabs.io",
    type: "Audio AI Research",
    focus: "Real-time speech synthesis & conversational agents",
    trustRating: 4.9,
    coreStrength: "Ultra-low latency streaming voice architecture",
    badge: "Audio AI",
    url: "https://elevenlabs.io/blog"
  },
  {
    name: "Technology Magazine",
    type: "Enterprise Media",
    focus: "Hyperscalers, cloud infrastructure & datacenters",
    trustRating: 4.7,
    coreStrength: "Executive C-suite insights & datacenter scale",
    badge: "Enterprise",
    url: "https://technologymagazine.com"
  },
  {
    name: "The Information",
    type: "Silicon Valley Intelligence",
    focus: "Frontier AI labs, scaling laws & tech investments",
    trustRating: 4.9,
    coreStrength: "Unrivaled insider reporting on tech giants & compute",
    badge: "Frontier AI",
    url: "https://www.theinformation.com"
  },
  {
    name: "Bain & Company",
    type: "Global Strategy",
    focus: "Enterprise AI economics & engineering ROI benchmarks",
    trustRating: 4.9,
    coreStrength: "Rigorous empirical research & productivity metrics",
    badge: "Research",
    url: "https://www.bain.com/insights/topics/technology-report/"
  },
  {
    name: "Indie Hackers",
    type: "Builder Community",
    focus: "Verified revenue & growth transparency",
    trustRating: 4.7,
    coreStrength: "Metrics transparency & tech blueprints",
    badge: "Builders",
    url: "https://www.indiehackers.com"
  },
  {
    name: "Dev.to",
    type: "Social Blogging",
    focus: "Active developer community",
    trustRating: 4.5,
    coreStrength: "Immediate reach & high interaction",
    badge: "Community",
    url: "https://dev.to"
  },
  {
    name: "Hashnode",
    type: "Independent Blogs",
    focus: "Developer-focused ownership",
    trustRating: 4.9,
    coreStrength: "Custom domains with built-in traffic",
    badge: "Dev Blogs",
    url: "https://hashnode.com"
  },
  {
    name: "Substack",
    type: "Newsletter-First",
    focus: "Building a paid/direct subscriber list",
    trustRating: 4.4,
    coreStrength: "Total control over email audience",
    badge: "Newsletter",
    url: "https://substack.com"
  },
  {
    name: "Ghost.org",
    type: "Modern CMS",
    focus: "Independent subscription & media",
    trustRating: 4.8,
    coreStrength: "Clean typography & creator revenue",
    badge: "Open Source",
    url: "https://ghost.org"
  }
];

const FEATURE_ARTICLES: TechBuzzArticle[] = [
  // 11. Technology Magazine - eBPF & Cilium Service Mesh
  {
    id: "tb-11",
    slug: "ebpf-kernel-telemetry-cilium-service-mesh",
    title: "eBPF in Production 2026: Zero-Overhead Kernel Telemetry, Distributed Tracing, and Cilium Service Mesh Internals",
    subtitle: "How kernel-space bytecode eliminated the sidecar proxy tax, replaced iptables with O(1) eBPF maps, and unlocked real-time distributed tracing without touching application code.",
    category: "System Architecture",
    technology: "eBPF & Cilium",
    techBadgeColor: "#059669",
    publishedAt: "2026-10-24",
    readTimeMinutes: 10,
    featured: true,
    trendingRank: 4,
    likes: 1140,
    dislikes: 8,
    upvotes: 1140,
    claps: 4720,
    rating: {
      average: 4.98,
      count: 1890,
      breakdown: { 5: 1850, 4: 35, 3: 5, 2: 0, 1: 0 }
    },
    author: {
      name: "Elena Rostova",
      role: "Staff Systems Engineer at KernelFlow",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80",
      handle: "@elena_ebpf",
      verified: true
    },
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80",
    tags: ["eBPF", "Cilium", "Linux Kernel", "Kubernetes", "Observability", "Service Mesh"],
    rankingScore: 99.3,
    source: {
      name: "Technology Magazine Enterprise Radar",
      domain: "technologymagazine.com",
      trustScore: "99.1%",
      url: "https://technologymagazine.com",
      platformKey: "technologymagazine",
      verifiedBadge: "Verified Systems Architecture"
    },
    summaryBullets: [
      "eBPF runs sandboxed JIT-compiled bytecode directly in the Linux kernel at socket and XDP hook points.",
      "Cilium replaces the 40,000-rule iptables bottleneck with O(1) BPF hash tables, eliminating 68% of network latency.",
      "Captures L7 HTTP/gRPC traces and TLS payloads transparently via uprobes without requiring application code changes."
    ],
    reactions: { heart: 610, unicorn: 380, rocket: 540, mindblown: 320 },
    commentsCount: 36,
    comments: [
      {
        id: "c-11-1",
        author: {
          name: "Lucas Meyer",
          role: "SRE Lead",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
          handle: "@lucas_sre",
          badge: "Staff SRE"
        },
        text: "Migrating from Istio sidecars to Cilium eBPF saved our cluster over 800 cores in CPU overhead alone and cut cross-service p99 latency from 14ms to 1.8ms.",
        createdAt: "2 hours ago",
        likes: 38
      }
    ],
    series: { title: "Next-Gen Cloud Infrastructure 2026", part: 2, totalParts: 4 },
    techStack: ["Linux Kernel 6.8", "eBPF", "Cilium 1.16", "Golang", "Kubernetes 1.32"],
    audioVoiceover: {
      durationMinutes: 10,
      narrator: "Elena Rostova (ElevenLabs Voice Clone)",
      waveformSeed: [50, 72, 85, 60, 92, 78, 55, 88, 65, 80]
    },
    membershipTier: "Pro Member",
    builderMetrics: {
      metricLabel: "Packet Forwarding Latency",
      metricValue: "2.1μs vs 48μs (iptables)",
      starsCount: 22400,
      sla: "Zero-sidecar CPU overhead"
    },
    founderTakeaway: "Stop paying the Envoy sidecar tax in high-density Kubernetes clusters. eBPF socket-layer redirection routes traffic directly between kernel sockets, cutting p99 latency by 68%.",
    contentSections: [
      {
        heading: "1. The Demise of the Sidecar Proxy Architecture",
        paragraphs: [
          "For the past decade, service meshes followed a monolithic pattern: inject an Envoy sidecar proxy container next to every pod, hijack localhost traffic with iptables PREROUTING rules, and pay a double user-to-kernel context switch penalty on every single hop.",
          "In high-throughput environments, this sidecar tax consumes up to 25% of total cluster CPU and adds 4ms to 12ms of tail latency. eBPF transforms this paradigm by moving traffic routing and security enforcement directly into the Linux kernel socket layer."
        ],
        codeSnippet: {
          language: "c",
          filename: "sock_ops_redir.c",
          code: "SEC(\"sockops\")\nint bpf_sockmap_redirect(struct bpf_sock_ops *skops) {\n    if (skops->op == BPF_SOCK_OPS_PASSIVE_ESTABLISHED_CB ||\n        skops->op == BPF_SOCK_OPS_ACTIVE_ESTABLISHED_CB) {\n        bpf_sock_hash_update(skops, &sock_ops_map, &skops->remote_port, BPF_NOEXIST);\n    }\n    return 0;\n}"
        },
        callout: {
          type: "insight",
          text: "When source and destination pods sit on the same node, eBPF redirects socket buffers directly between socket queues without ever traversing the TCP/IP network stack."
        }
      },
      {
        heading: "2. Transparent L7 Distributed Tracing Without SDKs",
        paragraphs: [
          "By attaching eBPF uprobes to OpenSSL and GnuTLS function symbols (SSL_read and SSL_write), observability engines capture unencrypted HTTP/2 and gRPC request headers and payloads with zero code modifications.",
          "This guarantees 100% trace coverage across legacy microservices, third-party vendor binaries, and proprietary binaries without requiring developer teams to instrument SDKs."
        ]
      }
    ]
  },

  // 14. The Information - DeepSeek-V3 MoE Architecture
  {
    id: "tb-14",
    slug: "deepseek-v3-moe-architecture-mla-training",
    title: "DeepSeek-V3 & MoE Architecture Deep Dive: Multi-Head Latent Attention (MLA), FP8 Mixed Precision, and $6M Training Economics",
    subtitle: "How architectural innovation beat brute-force compute: low-rank KV cache compression, dynamic auxiliary-loss-free expert routing, and DualPipe parallel execution.",
    category: "Artificial Intelligence",
    technology: "DeepSeek & MoE Architectures",
    techBadgeColor: "#ea580c",
    publishedAt: "2026-10-24",
    readTimeMinutes: 11,
    featured: true,
    trendingRank: 3,
    likes: 1850,
    dislikes: 16,
    upvotes: 1850,
    claps: 7420,
    rating: {
      average: 4.99,
      count: 3120,
      breakdown: { 5: 3080, 4: 35, 3: 5, 2: 0, 1: 0 }
    },
    author: {
      name: "Dr. Priya Sharma",
      role: "Principal AI Architect at Hyperscale Labs",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
      handle: "@priyasharma_ai",
      verified: true
    },
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80",
    tags: ["DeepSeek", "MoE", "Multi-Head Latent Attention", "LLM Training", "FP8", "AI Architecture"],
    rankingScore: 99.8,
    source: {
      name: "The Information AI Enterprise Hub",
      domain: "theinformation.com",
      trustScore: "99.7%",
      url: "https://theinformation.com",
      platformKey: "theinformation",
      verifiedBadge: "Exclusive Technical Investigation"
    },
    summaryBullets: [
      "Multi-Head Latent Attention compresses Key-Value (KV) cache sizes by 93.3% via low-rank latent projections.",
      "DeepSeek-V3 activates only 37B parameters per token out of 671B total weights, running 256 fine-grained routed experts.",
      "Trained 14.8 trillion tokens for only $5.57M in GPU compute—shattering traditional frontier model training costs."
    ],
    reactions: { heart: 980, unicorn: 650, rocket: 890, mindblown: 540 },
    commentsCount: 64,
    comments: [],
    series: { title: "Frontier Foundation Model Architectures", part: 2, totalParts: 4 },
    techStack: ["PyTorch 2.6", "Triton", "FP8 GEMM", "DualPipe", "CUDA 12.8"],
    audioVoiceover: {
      durationMinutes: 11,
      narrator: "Priya Sharma (ElevenLabs Neural Voice)",
      waveformSeed: [60, 82, 96, 70, 98, 86, 64, 94, 72, 88]
    },
    membershipTier: "Pro Member",
    builderMetrics: {
      metricLabel: "Total Training Compute Cost",
      metricValue: "$5.57M for 671B Params (14.8T tokens)",
      starsCount: 38200,
      sla: "KV-cache memory reduced by 93.3%"
    },
    founderTakeaway: "Multi-Head Latent Attention (MLA) is the single most important inference optimization of the decade. By compressing KV caches into a 512-dim latent vector, 600B+ models can serve 5x larger batch sizes on standard 8-GPU nodes.",
    contentSections: [
      {
        heading: "1. The Architectural Anatomy of Multi-Head Latent Attention",
        paragraphs: [
          "Standard Multi-Head Attention (MHA) and Grouped-Query Attention (GQA) store full key-value tensors for every token across layers. In 64k+ context windows, KV cache memory easily eclipses model weights, choking GPU VRAM.",
          "DeepSeek-V3 introduces MLA: instead of caching separate keys and values for each head, it projects the hidden state down into a single compact latent vector c_t of dimension 512, saving 93.3% memory."
        ],
        codeSnippet: {
          language: "python",
          filename: "deepseek_mla.py",
          code: "class MultiHeadLatentAttention(nn.Module):\n    def __init__(self, d_model, d_latent=512, num_heads=128):\n        super().__init__()\n        self.w_dkv = nn.Linear(d_model, d_latent, bias=False)\n        self.w_uk = nn.Linear(d_latent, d_model, bias=False)\n        self.w_uv = nn.Linear(d_latent, d_model, bias=False)\n\n    def forward(self, x):\n        return self.w_dkv(x)"
        }
      }
    ]
  },

  // 19. Dev.to - System Design: Distributed Event-Driven Microservices
  {
    id: "tb-19",
    slug: "system-design-distributed-event-driven-microservices",
    title: "System Design for Senior Engineers: Event-Driven Microservices, Kafka Partitions, and Redis Cache Topologies",
    subtitle: "Battle-tested blueprints for designing idempotent distributed transactions with Outbox pattern, distributed locks, and p99 latency guarantees.",
    category: "System Architecture",
    technology: "System Design",
    techId: "system-design",
    techBadgeColor: "#ea580c",
    publishedAt: "2026-10-23",
    readTimeMinutes: 10,
    featured: true,
    trendingRank: 7,
    likes: 1290,
    dislikes: 10,
    upvotes: 1290,
    claps: 5120,
    rating: {
      average: 4.97,
      count: 1960,
      breakdown: { 5: 1910, 4: 45, 3: 5, 2: 0, 1: 0 }
    },
    author: {
      name: "Marcus Vance",
      role: "Staff Distributed Systems Architect",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80",
      handle: "@marcus_vance",
      verified: true
    },
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    tags: ["System Design", "Microservices", "Apache Kafka", "Redis", "Distributed Systems"],
    rankingScore: 99.4,
    source: {
      name: "Dev.to Engineering Community",
      domain: "dev.to",
      trustScore: "99.1%",
      url: "https://dev.to",
      platformKey: "dev-to",
      verifiedBadge: "Dev.to Top Author"
    },
    summaryBullets: [
      "Transactional Outbox pattern guarantees at-least-once message delivery without two-phase commit overhead.",
      "Consistent hashing and virtual node distribution prevent Redis cluster hotkey hotspotting.",
      "Idempotency keys backed by atomic Redis SETNX eliminate double billing in payment event streams."
    ],
    reactions: { heart: 840, unicorn: 390, rocket: 710, mindblown: 490 },
    commentsCount: 38,
    comments: [],
    series: { title: "High-Scale Distributed Systems", part: 3, totalParts: 6 },
    techStack: ["Apache Kafka", "Redis Cluster", "Go", "PostgreSQL", "Docker"],
    audioVoiceover: {
      durationMinutes: 10,
      narrator: "Marcus Vance (Engineering Voiceover)",
      waveformSeed: [52, 78, 92, 66, 98, 84, 60, 94, 72, 86]
    },
    newsletterEdition: "MasterClass Tech Dispatch #113",
    membershipTier: "All-Access",
    builderMetrics: {
      metricLabel: "Throughput Capacity",
      metricValue: "180,000 msgs/sec",
      starsCount: 26000,
      sla: "p99 < 8ms"
    },
    founderTakeaway: "Design for partial failure from day one. Use transactional outbox tables and idempotent consumer reducers to make distributed microservices bulletproof.",
    contentSections: [
      {
        heading: "1. The Transactional Outbox Pattern in Production",
        paragraphs: [
          "Directly writing to a database and then publishing to an event bus like Kafka in two separate steps inevitably leads to split-brain states when the network glitches in between.",
          "The Transactional Outbox pattern writes both the business entity mutation and the outgoing event into the same database transaction. A separate lightweight tailing worker safely publishes events without data loss."
        ],
        codeSnippet: {
          language: "sql",
          filename: "outbox_schema.sql",
          code: `CREATE TABLE outbox_events (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  aggregate_type VARCHAR(64) NOT NULL,\n  aggregate_id VARCHAR(64) NOT NULL,\n  event_type VARCHAR(64) NOT NULL,\n  payload JSONB NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  processed_at TIMESTAMPTZ\n);\n\nCREATE INDEX idx_outbox_unprocessed ON outbox_events(created_at) WHERE processed_at IS NULL;`
        }
      }
    ]
  },

];

/**
 * Reader counters start at zero (reset 2026-10-27): the sample likes, dislikes, claps, ratings and comments written
 * into the stories above are dropped here, so every page and the Super Admin analytics count real readers only.
 */
const withoutSampleCounters = (article: TechBuzzArticle): TechBuzzArticle => ({
  ...article,
  likes: 0, dislikes: 0, upvotes: 0, claps: 0,
  rating: { average: article.rating.average, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  reactions: { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 },
  commentsCount: 0, comments: [],
});

/** The built-in stories: the original features, then one guide per Learning Dashboard technology. */
export const TECH_BUZZ_ARTICLES: TechBuzzArticle[] = [...FEATURE_ARTICLES, ...TECHNOLOGY_ARTICLES].map(withoutSampleCounters);

export function getTechBuzzArticles(): TechBuzzArticle[] {
  return TECH_BUZZ_ARTICLES;
}

export function getTechBuzzArticleBySlug(slug: string): TechBuzzArticle | null {
  return TECH_BUZZ_ARTICLES.find(a => a.slug === slug || a.id === slug) || null;
}

export function getTrendingTechBuzzArticles(): TechBuzzArticle[] {
  return [...TECH_BUZZ_ARTICLES].sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99)).slice(0, 6);
}

export function getFeaturedArticle(): TechBuzzArticle {
  return TECH_BUZZ_ARTICLES.find(a => a.featured) || TECH_BUZZ_ARTICLES[0];
}

export function getStaffPicks(): TechBuzzArticle[] {
  return TECH_BUZZ_ARTICLES.slice(0, 3);
}

export function getAllCategories(): string[] {
  return ["All", ...new Set(TECH_BUZZ_ARTICLES.map(a => a.category))];
}

export function getAllTechnologies(): string[] {
  return ["All", ...new Set(TECH_BUZZ_ARTICLES.map(a => a.technology))];
}

export function getAllSources(): { key: string; name: string }[] {
  return [
    { key: "all", name: "All Sources" },
    { key: "medium", name: "Medium" },
    { key: "daily-dev", name: "daily.dev" },
    { key: "indianexpress", name: "The Indian Express" },
    { key: "elevenlabs", name: "ElevenLabs.io" },
    { key: "technologymagazine", name: "Technology Magazine" },
    { key: "theinformation", name: "The Information" },
    { key: "bain", name: "Bain & Company" },
    { key: "indiehackers", name: "Indie Hackers" }
  ];
}

export function getTopPlatformsComparison(): ContentPlatformComparison[] {
  return TOP_PLATFORMS_COMPARISON;
}

// The festive sale lives in its own small module so client pages can read it without bundling these articles.
export { getDiwaliFestiveSaleInfo, type FestiveSaleInfo } from "./festive-sale";
