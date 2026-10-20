"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Clock, Coffee, Info, Lightbulb, MessageCircleQuestion } from "lucide-react";
import type { BlogBlock, BlogPost } from "@/lib/coffee-and-code";
import { contentKey } from "@/lib/content-overrides";
import { Editable, useContentItem } from "./content-editing";
import { CodeBlock } from "./pro-markdown";
import styles from "./coffee-and-code.module.css";

const date = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const CALLOUT = { tip: { icon: Lightbulb, label: "Tip" }, warning: { icon: AlertTriangle, label: "Watch out" }, note: { icon: Info, label: "Note" } } as const;

/** A post's picture, or a tinted panel with a coffee mark when the picture is missing or fails to load. */
export function BlogCover({ post, className }: Readonly<{ post: BlogPost; className?: string }>) {
  const [failed, setFailed] = useState(false);
  const src = post.blocks.find((block): block is Extract<BlogBlock, { kind: "image" }> => block.kind === "image")?.src ?? null;
  return <div className={`${styles.cover} ${className ?? ""}`} data-empty={!src || failed}>
    {src && !failed
      /* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the learning-images bucket, as on the other learning cards. */
      ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      : <Coffee size={40} strokeWidth={1.4} aria-hidden="true" />}
  </div>;
}

/**
 * One Coffee & Code article: header, then every block in order (paragraphs, headings, code with a caption,
 * questions with answers to reveal, images, callouts, lists and quotes). Every text is editable by the Super Admin
 * in edit mode, under the key "blog:<slug>" and the block's index.
 */
export function CoffeeArticle({ post, related }: Readonly<{ post: BlogPost; related: BlogPost[] }>) {
  const k = contentKey("blog", post.slug);
  const item = useContentItem(k, "article");
  if (item.hidden) return <section className={styles.article}>
    <p className={styles.removed}>This article has been removed.</p>
    <Link className={styles.back} href="/dashboard/coffee-and-code"><ArrowLeft size={15} aria-hidden="true" />All articles</Link>
  </section>;
  return <article className={styles.article} data-tone={post.tone} aria-labelledby="article-title" {...item.props}>
    {item.toolbar}
    <Link className={styles.back} href="/dashboard/coffee-and-code"><ArrowLeft size={15} aria-hidden="true" />All articles</Link>
    <header className={styles.articleHead}>
      <p className={styles.topic}>{post.topic}</p>
      <h1 id="article-title"><Editable k={k} f="title">{post.title}</Editable></h1>
      <p className={styles.lead}><Editable k={k} f="dek" multiline>{post.dek}</Editable></p>
      <p className={styles.byline}><span>{post.author}</span><time dateTime={post.published}>{date(post.published)}</time><span><Clock size={13} aria-hidden="true" />{post.minutes} min read</span></p>
    </header>
    <div className={styles.blocks}>{post.blocks.map((block, index) => <Block key={index} block={block} k={k} f={`blocks.${index}`} />)}</div>
    {related.length > 0 && <aside className={styles.related} aria-labelledby="related-title">
      <h2 id="related-title">Keep reading</h2>
      <ul>{related.map(next => <li key={next.slug} className={styles.relatedItem} data-tone={next.tone}><Link href={`/dashboard/coffee-and-code/${next.slug}`} prefetch={false}><span>{next.topic}</span>{next.title}</Link></li>)}</ul>
    </aside>}
  </article>;
}

function Block({ block, k, f }: Readonly<{ block: BlogBlock; k: string; f: string }>) {
  switch (block.kind) {
    case "paragraph": return <p className={styles.paragraph}><Editable k={k} f={`${f}.text`} multiline>{block.text}</Editable></p>;
    case "heading": return <h2 className={styles.heading}><Editable k={k} f={`${f}.text`}>{block.text}</Editable></h2>;
    case "code": return <figure className={styles.codeFigure}>
      <Editable k={k} f={`${f}.code`} multiline render={code => <CodeBlock code={code} language={block.language} />}>{block.code}</Editable>
      {block.caption && <figcaption><Editable k={k} f={`${f}.caption`}>{block.caption}</Editable></figcaption>}
    </figure>;
    case "qa": return <details className={styles.qa}>
      <summary><MessageCircleQuestion size={17} aria-hidden="true" /><span><Editable k={k} f={`${f}.question`}>{block.question}</Editable></span></summary>
      <p><Editable k={k} f={`${f}.answer`} multiline>{block.answer}</Editable></p>
    </details>;
    case "image": return <figure className={styles.imageFigure}>
      <ArticleImage src={block.src} alt={block.alt} />
      <figcaption><Editable k={k} f={`${f}.caption`}>{block.caption}</Editable></figcaption>
    </figure>;
    case "callout": { const { icon: Icon, label } = CALLOUT[block.tone]; return <aside className={styles.callout} data-tone={block.tone}>
      <Icon size={17} aria-hidden="true" /><p><b>{label}</b> <Editable k={k} f={`${f}.text`} multiline>{block.text}</Editable></p>
    </aside>; }
    case "list": return <ul className={styles.list}>{block.items.map((text, n) => <li key={n}><Editable k={k} f={`${f}.items.${n}`} multiline>{text}</Editable></li>)}</ul>;
    case "quote": return <blockquote className={styles.quote}><p><Editable k={k} f={`${f}.text`} multiline>{block.text}</Editable></p>{block.cite && <cite>{block.cite}</cite>}</blockquote>;
  }
}

function ArticleImage({ src, alt }: Readonly<{ src: string | null; alt: string }>) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={styles.imageEmpty} role="img" aria-label={alt}><Coffee size={36} strokeWidth={1.4} aria-hidden="true" /></div>;
  /* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the learning-images bucket. */
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
