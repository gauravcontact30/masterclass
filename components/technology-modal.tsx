"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "@/components/responsive-image";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Copy, HelpCircle, Sparkles, Terminal, X } from "lucide-react";
import type { TechnologyInfo } from "@/lib/technology-catalog";
import { useLanguage } from "./language-provider";
import { ListenButton } from "./listen-button";
import styles from "./technology-modal.module.css";

export function TechnologyModal({
  tech,
  onClose,
}: {
  tech: TechnologyInfo;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock background scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleCopy = useCallback(() => {
    if (!tech.command) return;
    navigator.clipboard.writeText(tech.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [tech.command]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tech-modal-title"
        aria-describedby="tech-modal-summary"
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              <Image
                src={`/images/tech/${tech.icon}.png`}
                alt=""
                width={26}
                height={26}
                priority
              />
            </div>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 id="tech-modal-title" className={styles.title}>
                  {tech.name}
                </h2>
                <span className={styles.categoryBadge}>
                  {hi ? tech.category.hi : tech.category.en}
                </span>
                <ListenButton
                  id={`technology:${tech.name}:${language}`}
                  title={tech.name}
                  compact
                  text={() => [tech.name, hi ? tech.summary.hi : tech.summary.en, ...tech.keyFeatures.map(feature => hi ? feature.hi : feature.en)].join(". ")}
                />
              </div>
              <div className={styles.subMeta}>
                <span>
                  {hi
                    ? `${tech.topicsCount}+ अध्ययन विषय`
                    : `${tech.topicsCount}+ topics covered`}
                </span>
                <span className={styles.subMetaDot}>•</span>
                <span>{hi ? "द्विभाषी (EN / HI)" : "Bilingual (EN / HI)"}</span>
              </div>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={hi ? "खिड़की बंद करें" : "Close modal"}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {/* Body */}
        <div className={styles.body}>
          {/* Tagline */}
          <blockquote className={styles.tagline}>
            &ldquo;{hi ? tech.tagline.hi : tech.tagline.en}&rdquo;
          </blockquote>

          {/* Summary */}
          <p id="tech-modal-summary" className={styles.summary}>
            {hi ? tech.summary.hi : tech.summary.en}
          </p>

          {/* Quick Start / CLI Command */}
          {tech.command && (
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionHeading}>
                <Terminal size={14} aria-hidden="true" />
                <span>{hi ? "त्वरित शुरुआत कमांड" : "Quick Start Command"}</span>
              </h3>
              <div className={styles.commandCard}>
                <div className={styles.commandLeft}>
                  <span className={styles.commandPrompt}>$</span>
                  <span className={styles.commandText}>{tech.command}</span>
                </div>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={handleCopy}
                  aria-label={
                    copied
                      ? hi
                        ? "कमांड कॉपी हो गया"
                        : "Copied command"
                      : hi
                        ? "कमांड कॉपी करें"
                        : "Copy command"
                  }
                >
                  {copied ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      <span>{hi ? "कॉपी हुआ" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" />
                      <span>{hi ? "कॉपी" : "Copy"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Key Learning Highlights */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>
              <Sparkles size={14} aria-hidden="true" />
              <span>{hi ? "मुख्य अवधारणाएँ और विशेषताएँ" : "Key Concepts & Features"}</span>
            </h3>
            <div className={styles.featuresGrid}>
              {tech.keyFeatures.map((feature, i) => (
                <div key={i} className={styles.featureCard}>
                  <CheckCircle2 size={16} className={styles.featureIcon} aria-hidden="true" />
                  <span>{hi ? feature.hi : feature.en}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Topics */}
          {tech.interviewTopics && tech.interviewTopics.length > 0 && (
            <div className={styles.interviewBox}>
              <div className={styles.interviewHeader}>
                <HelpCircle size={15} aria-hidden="true" />
                <span>{hi ? "शीर्ष इंटरव्यू प्रश्न और विषय" : "Top Interview Focus Areas"}</span>
              </div>
              <ul className={styles.interviewList}>
                {tech.interviewTopics.map((topic, i) => (
                  <li key={i} className={styles.interviewItem}>
                    <span>{hi ? topic.hi : topic.en}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerInfo}>
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
            >
              {hi ? "बंद करें" : "Close"}
            </button>
            <Link
              href="/courses#technology"
              className={styles.primaryButton}
              onClick={onClose}
            >
              <span>{hi ? "कोर्स गाइड देखें" : "Explore Guides & Labs"}</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
