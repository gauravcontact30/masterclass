"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
export type CarouselSlide = { id: string; content: React.ReactNode };
export function Carousel({ slides, intervalMs = 5000, ariaLabel, className }: { slides: CarouselSlide[]; intervalMs?: number; ariaLabel: string; className?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (paused || reduceMotion || slides.length <= 1) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(timer);
  }, [paused, reduceMotion, intervalMs, slides.length]);
  function go(next: number) { setIndex(((next % slides.length) + slides.length) % slides.length); }
  return (
    <div className={className} role="region" aria-roledescription="carousel" aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="carousel-track">
        {slides.map((slide, i) => <div key={slide.id} data-testid={`carousel-slide-${slide.id}`} hidden={i !== index} className="carousel-slide">{slide.content}</div>)}
      </div>
      <div className="carousel-controls">
        <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)}><ChevronLeft size={18} /></button>
        <div className="carousel-dots">
          {slides.map((slide, i) => <button key={slide.id} type="button" aria-label={`Go to slide ${i + 1}`} aria-current={i === index} onClick={() => go(i)} />)}
        </div>
        <button type="button" aria-label="Next slide" onClick={() => go(index + 1)}><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
