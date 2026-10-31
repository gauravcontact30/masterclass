import Image from "@/components/responsive-image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ListenButton } from "./listen-button";
import { CarouselShell } from "./carousel-shell";
import styles from "./landing-carousel.module.css";

/*
 * A card carousel for the landing feature sections (Featured lessons, Certifications, Coffee & Code): one card at a
 * time with its cover, kicker, title, a line of description, when or how long, Read more and Listen. Slides fade
 * unless the visitor prefers reduced motion.
 *
 * No hooks here, so it renders on the server where a server component uses it (the feature sections): the cards are
 * plain HTML the browser never re-renders, and only CarouselShell (autoplay, arrows, dots) and each Listen button
 * hydrate. Client components (Coffee & Code) use it unchanged.
 */
export type CarouselSlide = {
  id: string; image?: string | null; tone?: string; kicker: string; title: string; text: string; meta?: string;
  href: string; cta: string; listen?: string;
};

export function CoverCarousel({ slides, label, interval = 15_000, hi = false }: Readonly<{ slides: CarouselSlide[]; label: string; interval?: number; hi?: boolean }>) {
  const count = slides.length;
  if (!count) return null;
  // Stable across server and client renders (useId cannot be used in a component that may run on the server).
  const idBase = `carousel-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <CarouselShell count={count} titles={slides.map(slide => slide.title)} label={label} idBase={idBase} hi={hi} interval={interval}>
    {slides.map((item, at) => <article key={item.id} id={`${idBase}-${at}`} className={styles.slide} data-active={at === 0 || undefined} inert={at !== 0} aria-roledescription="slide" aria-label={`${at + 1} / ${count}: ${item.title}`}>
      <div className={styles.cover} style={item.tone ? { background: item.tone } : undefined}>
        {item.image && <Image src={item.image} alt={`${hi ? "चित्र" : "Illustration"}: ${item.title}`} fill sizes="(max-width: 560px) 90vw, 360px" loading={at === 0 ? undefined : "lazy"} />}
        <span className={styles.kicker}>{item.kicker}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.text}>{item.text}</p>
        <div className={styles.foot}>
          {item.meta && <span className={styles.meta}>{item.meta}</span>}
          <div className={styles.actions}>
            <ListenButton id={`carousel:${item.id}`} title={item.title} text={item.listen ?? `${item.title}. ${item.text}`} compact />
            <Link className={styles.readMore} href={item.href}><b aria-hidden="true">✻</b>{item.cta}<ArrowRight size={13} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </article>)}
  </CarouselShell>;
}
