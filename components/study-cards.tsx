"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import styles from "./study-cards.module.css";

export type StudyCard = {
  id: string;
  /** Small label above the prompt, such as the track or category. */
  eyebrow?: string;
  /** The recall prompt shown on the front of the card. */
  front: string;
  /** Optional guidance under the prompt, replacing the deck default. */
  prompt?: string;
  /** The answer shown once the card is turned over. */
  back: ReactNode;
  /** Short pills shown along the bottom of both faces. */
  meta?: string[];
};

type Labels = {
  frontLabel: string; backLabel: string; revealLabel: string;
  againLabel: string; knownLabel: string;
  countLabel: (known: number, total: number) => string;
};

const DEFAULTS: Labels = {
  frontLabel: "RECALL PROMPT", backLabel: "THE ANSWER", revealLabel: "Reveal answer",
  againLabel: "Keep practising", knownLabel: "Got it",
  countLabel: (known, total) => `${known} of ${total} recalled this session`,
};

/** Progress ring for the share of the deck already recalled without help. */
function Ring({ known, total }: { known: number; total: number }) {
  const radius = 25, circumference = 2 * Math.PI * radius;
  const share = total ? known / total : 0;
  return <svg className={styles.ring} viewBox="0 0 58 58" role="img" aria-label={`${known} of ${total} cards recalled`}>
    <circle className={styles.ringTrack} cx="29" cy="29" r={radius}/>
    <circle className={styles.ringValue} cx="29" cy="29" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - share)} transform="rotate(-90 29 29)"/>
    <text className={styles.ringLabel} x="29" y="29" textAnchor="middle" dominantBaseline="central">{known}</text>
  </svg>;
}

/**
 * A study deck that turns one card at a time. Cards the learner recalls leave
 * the deck; cards they want to practise again return to the back of the queue,
 * so a session ends only when every card has been recalled at least once.
 */
export function FlashcardDeck({ cards, label, eyebrow, title, description, accent = "clay", icon, footnote, ...text }: {
  cards: StudyCard[]; label: string; eyebrow: string; title: string; description: string;
  accent?: "clay" | "olive" | "amber"; icon?: ReactNode; footnote?: string;
} & Partial<Labels>) {
  const labels = { ...DEFAULTS, ...text };
  const byId = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);
  const [queue, setQueue] = useState(() => cards.map(card => card.id));
  const [known, setKnown] = useState<string[]>([]);
  const [repeats, setRepeats] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const revealRef = useRef<HTMLButtonElement>(null);
  const resumeFocus = useRef(false);

  // Turning a card swaps the buttons, so focus is restored once the new one mounts.
  useEffect(() => { if (resumeFocus.current && revealRef.current) { resumeFocus.current = false; revealRef.current.focus(); } });

  if (!cards.length) return null;
  const card = queue.length ? byId.get(queue[0]) ?? cards[0] : null;
  const position = cards.length - queue.length + 1;

  function reveal() { setFlipped(true); }
  function advance(recalled: boolean) {
    setQueue(current => {
      const [head, ...rest] = current;
      return recalled ? rest : [...rest, head];
    });
    if (recalled) setKnown(current => [...new Set([...current, queue[0]])]);
    else setRepeats(count => count + 1);
    setFlipped(false);
    resumeFocus.current = true;
  }
  function restart(shuffle: boolean) {
    const ids = cards.map(item => item.id);
    if (shuffle) for (let index = ids.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [ids[index], ids[swap]] = [ids[swap], ids[index]]; }
    setQueue(ids); setKnown([]); setRepeats(0); setFlipped(false);
  }
  // Shortcuts speed up a drill, but never steal keys from the buttons themselves.
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLElement && event.target.closest("button, a, input, textarea, select")) return;
    if (!card) return;
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); if (flipped) advance(true); else reveal(); }
    else if (event.key === "1" && flipped) { event.preventDefault(); advance(false); }
    else if (event.key === "2" && flipped) { event.preventDefault(); advance(true); }
    else if (event.key.toLowerCase() === "s") { event.preventDefault(); restart(true); }
  }

  return <section className={styles.deck} data-accent={accent} aria-label={label} onKeyDown={onKeyDown} tabIndex={-1}>
    <div className={styles.intro}>
      <span className={styles.introEyebrow}>{icon ?? <Sparkles size={13}/>}{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className={styles.gauge}>
        <Ring known={known.length} total={cards.length}/>
        <span className={styles.gaugeText}>
          <b>{labels.countLabel(known.length, cards.length)}</b>
          <span>{repeats ? `${repeats} card${repeats === 1 ? "" : "s"} sent back for another pass.` : "Answer from memory first — checking too early is what makes it fade."}</span>
        </span>
      </div>
      <div className={styles.tally}>
        <span><i className={styles.dot} aria-hidden="true"/>Recalled <b>{known.length}</b></span>
        <span><i className={styles.dot} data-kind="left" aria-hidden="true"/>Left <b>{queue.length}</b></span>
        <span><i className={styles.dot} data-kind="review" aria-hidden="true"/>Repeated <b>{repeats}</b></span>
      </div>
      <p className={styles.keys}><span><kbd>Space</kbd>turn</span><span><kbd>1</kbd>practise</span><span><kbd>2</kbd>recalled</span><span><kbd>S</kbd>shuffle</span></p>
      {footnote && <p className={styles.keys}>{footnote}</p>}
    </div>

    <div className={styles.stage}>
      {card ? <>
        <div className={styles.cardWrap} data-stack={Math.min(2, queue.length - 1)}>
          <div className={styles.scene} aria-live="polite">
            <div className={styles.card} data-flipped={flipped}>
              <article className={styles.face} data-side="front" aria-hidden={flipped}>
                <div className={styles.faceTop}><span>{labels.frontLabel}</span><span className={styles.counter}>{position} / {cards.length}</span></div>
                {card.eyebrow && <span className={styles.cardEyebrow}>{card.eyebrow}</span>}
                <h3>{card.front}</h3>
                <div className={styles.body}><p className={styles.prompt}>{card.prompt ?? "Say the answer out loud, then turn the card to check yourself."}</p></div>
                {!!card.meta?.length && <div className={styles.metaRow}>{card.meta.map(item => <span key={item}>{item}</span>)}</div>}
              </article>
              <article className={styles.face} data-side="back" aria-hidden={!flipped}>
                <div className={styles.faceTop}><span>{labels.backLabel}</span><span className={styles.counter}>{position} / {cards.length}</span></div>
                <h3>{card.front}</h3>
                <div className={styles.body}>{card.back}</div>
                {!!card.meta?.length && <div className={styles.metaRow}>{card.meta.map(item => <span key={item}>{item}</span>)}</div>}
              </article>
            </div>
          </div>
        </div>
        <div className={styles.controls}>
          {flipped ? <>
            <button type="button" className={`${styles.btn} ${styles.quiet}`} onClick={() => advance(false)}><RotateCcw size={14}/>{labels.againLabel}</button>
            <button type="button" className={`${styles.btn} ${styles.solid}`} onClick={() => advance(true)}><Check size={14}/>{labels.knownLabel}</button>
          </> : <button type="button" ref={revealRef} className={`${styles.btn} ${styles.solid}`} onClick={reveal}>{labels.revealLabel}</button>}
          <span className={styles.spacer}/>
          <button type="button" className={`${styles.btn} ${styles.quiet} ${styles.icon}`} onClick={() => restart(true)} aria-label="Shuffle the deck and start again"><Shuffle size={14}/></button>
        </div>
      </> : <>
        <div className={styles.summary} role="status">
          <h3>Deck complete.</h3>
          <p>You worked through all {cards.length} card{cards.length === 1 ? "" : "s"}{repeats ? `, sending ${repeats} back for a second pass` : " first time"}. Come back tomorrow — spacing the review is what moves it into long-term memory.</p>
          <div className={styles.summaryActions}>
            <button type="button" className={`${styles.btn} ${styles.solid}`} onClick={() => restart(true)}><Shuffle size={14}/>Shuffle and repeat</button>
            <button type="button" className={`${styles.btn} ${styles.quiet}`} onClick={() => restart(false)}><RotateCcw size={14}/>Same order</button>
          </div>
        </div>
      </>}
    </div>
  </section>;
}
