"use client";

import learningCard from "./learning-card.module.css";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { BookMarked, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Copy, FileCode2, ListOrdered, Loader2, Pencil, RotateCcw, Search, SlidersHorizontal, Sparkles, Terminal, Trash2, X } from "lucide-react";
import { useAiMode } from "@/lib/ai-mode";
import { highlightLines } from "@/lib/code-highlight";
import { inferLanguage } from "@/lib/code-run";
import { codeLineNotes, fileLanguage } from "@/lib/code-line-notes";
import { CodeLineComment } from "./code-line-comment";
import { STEP_GUIDES } from "@/lib/step-by-step/guides";
import { guideMatchesTechnology } from "@/lib/step-by-step/technologies";
import { interviewForGuide } from "@/lib/step-by-step/interview";
import type { ObjectiveQuestion } from "@/lib/step-by-step/types";
import { STEP_CATEGORIES, STEP_DEPTHS, STEP_LEVELS, stepGuideSchema, type Comparison, type GuideStep, type GuideUseCase, type StepCommand, type StepGuide, type StepSearchOptions } from "@/lib/step-by-step/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupTextarea } from "./ui/input-group";
import { Label } from "./ui/label";
import { NativeSelect, NativeSelectOption } from "./ui/native-select";
import { Switch } from "./ui/switch";
import { Tabs, TabsList, TabsTab } from "./ui/tabs";
import { SearchSectionIcon } from "./search-section-icon";
import { CodeFiles } from "./code-files";
import { pageWindow } from "./pager";
import { stripCitationsDeep } from "@/lib/strip-citations";
import styles from "./step-by-step.module.css";
import { LearningPicture } from "./learning-picture";
import { learningImageUrl } from "@/lib/learning-image";

export const CARDS_PER_PAGE = 2;
/** Technology pills per page of the strip, as on the Search page's "Explore topics". */
export const TECHNOLOGIES_PER_PAGE = 3;
const STORE_KEY = "masterclass:step-by-step:cards";
const MAX_ASKED = 30;

/**
 * Light card tints that sit on the Claude cream ground. A card's tint comes
 * from its position in the filtered list, so neighbours — and therefore the
 * three cards on any page — never share a colour.
 */
export const CARD_TONES = [
  { bg: "#fbeee6", ink: "#9a4a2c" }, { bg: "#eaf1e6", ink: "#5f6f45" }, { bg: "#e6f0f7", ink: "#2f5f82" },
  { bg: "#efeaf7", ink: "#5e4a8f" }, { bg: "#fbf3dc", ink: "#7a5d10" }, { bg: "#f8e8ec", ink: "#8f3a55" },
  { bg: "#e3f3ef", ink: "#26695a" }, { bg: "#f3ede3", ink: "#6b5536" }, { bg: "#e8ebf8", ink: "#3f4c93" },
  { bg: "#e2f1f4", ink: "#1f6474" }, { bg: "#f5e9f5", ink: "#7b3f7b" }, { bg: "#eff1e0", ink: "#5b6320" },
] as const;
const toneStyle = (tone: number) => ({ "--tone": CARD_TONES[tone % CARD_TONES.length].bg, "--tone-ink": CARD_TONES[tone % CARD_TONES.length].ink }) as CSSProperties;

type Origin = "asked" | "built-in";
export type StepCard = {
  id: string; question: string; at: number; origin: Origin;
  status: "loading" | "ready" | "error";
  guide?: StepGuide; source?: "ai" | "library"; error?: string;
};
/** `technology` is a Search-page catalogue title, or "" for every technology. */
export type Filters = { text: string; technology: string; level: string; origin: Origin | "all"; sort: "recent" | "az" | "steps" };
const NO_FILTERS: Filters = { text: "", technology: "", level: "all", origin: "all", sort: "recent" };

/** Only the built-in guides have generated pictures; asked and AI answers do not. */
const guideImage = (card: StepCard) => card.origin === "built-in" ? learningImageUrl("guides", ["step-by-step", card.id.replace(/^guide:/, "")]) : null;
const BUILT_IN: StepCard[] = STEP_GUIDES.map(({ id, ...guide }, index) => ({ id: `guide:${id}`, question: guide.question, at: -index, origin: "built-in", status: "ready", guide, source: "library" }));

const ERRORS: Record<string, string> = {
  network_error: "You appear to be offline. Check the connection and retry.",
  rate_limited: "Too many questions in a minute. Wait a moment and retry.",
  ai_mode_off: "AI Mode is off and no built-in guide matches this question. Turn AI Mode on to generate one.",
  ai_unavailable: "No AI provider is configured and no built-in guide matches this question.",
  ai_rate_limited: "The AI provider is rate limiting requests. Retry in a minute.",
  ai_provider_unavailable: "The AI provider is unavailable right now. Retry shortly.",
  generation_failed: "The answer could not be generated. Retry, or rephrase the question.",
};
const errorText = (code?: string) => ERRORS[code ?? ""] ?? "Something went wrong. Retry the question.";
const capitalise = (word: string) => word[0].toUpperCase() + word.slice(1);

function loadAsked(): StepCard[] {
  try {
    const raw = stripCitationsDeep(JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]"));
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item): StepCard[] => {
      if (!item || typeof item.id !== "string" || typeof item.question !== "string") return [];
      const guide = stepGuideSchema.safeParse(item.guide);
      // A card that was still loading when the tab closed can never finish.
      return guide.success
        ? [{ id: item.id, question: item.question, at: Number(item.at) || 0, origin: "asked", status: "ready", guide: guide.data, source: item.source === "ai" ? "ai" : "library" }]
        : [{ id: item.id, question: item.question, at: Number(item.at) || 0, origin: "asked", status: "error", error: typeof item.error === "string" ? item.error : "generation_failed" }];
    }).slice(0, MAX_ASKED);
  } catch { return []; }
}
function saveAsked(cards: StepCard[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(cards.filter(card => card.status !== "loading").slice(0, MAX_ASKED))); }
  catch { /* History is a convenience; the page still works without it. */ }
}

/** Cards that pass the filters, in the chosen order. Exported for tests. */
export function filterCards(cards: StepCard[], filters: Filters) {
  const words = filters.text.toLowerCase().split(/\s+/).filter(Boolean);
  const matched = cards.filter(card => {
    if (filters.origin !== "all" && card.origin !== filters.origin) return false;
    if (filters.technology && !guideMatchesTechnology(card.question, card.guide, filters.technology)) return false;
    if (filters.level !== "all" && card.guide?.level !== filters.level) return false;
    if (!words.length) return true;
    const haystack = [card.question, card.guide?.definition, card.guide?.answer, card.guide?.category, ...(card.guide?.tags ?? []), ...(card.guide?.steps.map(step => step.title) ?? [])].join(" ").toLowerCase();
    return words.every(word => haystack.includes(word));
  });
  if (filters.sort === "az") return [...matched].sort((a, b) => a.question.localeCompare(b.question));
  if (filters.sort === "steps") return [...matched].sort((a, b) => (b.guide?.steps.length ?? 0) - (a.guide?.steps.length ?? 0));
  return [...matched].sort((a, b) => b.at - a.at);
}

function useCopy() {
  const [copied, setCopied] = useState("");
  const copy = useCallback(async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(current => (current === key ? "" : current)), 1800); }
    catch { /* The text is on screen either way. */ }
  }, []);
  return { copied, copy };
}

/**
 * Prose with `backticked` identifiers, as guides and model answers write
 * them: the backticked runs become inline code instead of showing the marks.
 */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/g);
  if (parts.length === 1) return <>{text}</>;
  return <>{parts.map((part, index) => index % 2 ? <code key={index} className={styles.inlineCode}>{part}</code> : part)}</>;
}

function Snippet({ code, file }: { code: string; file?: string }) {
  const lang = useMemo(() => fileLanguage(code, file ?? ""), [code, file]);
  const notes = useMemo(() => codeLineNotes(code, file, lang), [code, file, lang]);
  const lines = useMemo(() => highlightLines(code, lang), [code, lang]);
  return <pre className={styles.snippet} tabIndex={0}><code>{lines.map((line, index) => <span key={index} className={styles.snippetLine}>
    {line.map((token, position) => <span key={position} data-token={token.tone || undefined}>{token.text}</span>)}{"\n"}<CodeLineComment note={notes[index]} />
  </span>)}</code></pre>;
}

function Commands({ commands, stepIndex }: { commands: StepCommand[]; stepIndex: number }) {
  const { copied, copy } = useCopy();
  return <div className={styles.terminal} aria-label="Commands">
    <div className={styles.terminalBar}><span className={styles.dots} aria-hidden="true"><i /><i /><i /></span><Terminal size={12} aria-hidden="true" />Terminal</div>
    <ul className={styles.commandList}>{commands.map((item, index) => {
      const key = `${stepIndex}:${index}`;
      return <li key={key} className={styles.command}>
        <div className={styles.commandRow}>
          <code><span className={styles.prompt} aria-hidden="true">$</span>{item.command}</code>
          <Button type="button" variant="outline" size="xs" onClick={() => void copy(key, item.command)} aria-label={`Copy command ${item.command}`}>
            {copied === key ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied === key ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className={styles.commandNote}><InlineText text={item.description} /></p>
      </li>;
    })}</ul>
  </div>;
}

function Step({ step, index }: { step: GuideStep; index: number }) {
  return <li className={styles.step}>
    <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
    <div className={styles.stepBody}>
      <h4><InlineText text={step.title} /></h4>
      <p className={styles.prose}><InlineText text={step.detail} /></p>
      {step.file && <span className={styles.fileChip}><FileCode2 size={12} aria-hidden="true" />{step.file}</span>}
      {!!step.commands.length && <Commands commands={step.commands} stepIndex={index} />}
      {step.code && <Snippet code={step.code} file={step.file} />}
    </div>
  </li>;
}

/**
 * How two technologies differ: first each one on its own card, so either can
 * be read without the other, then every point of difference on a card of its
 * own with both sides next to each other.
 */
function Differences({ comparison, tone, number }: { comparison: Comparison; tone: number; number: number }) {
  const title = comparison.items.map(item => item.name).join(" vs ");
  return <section className={styles.section} aria-labelledby="sec-differences">
    <h3 id="sec-differences"><span className={styles.sectionNo}>{number}</span>Differences: {title}</h3>
    <h4 className={styles.subhead}>Each technology on its own</h4>
    <div className={styles.compareGrid}>
      {comparison.items.map((item, index) => <Card key={item.name} role="article" aria-label={item.name} size="sm"
        className={`${styles.compareCard} ${learningCard.card}`} style={toneStyle(tone + 1 + index)}>
        <CardHeader className={styles.compareHead}>
          <Badge className={styles.toneBadge}>{index === 0 ? "Option A" : index === 1 ? "Option B" : "Option C"}</Badge>
          <h5>{item.name}</h5>
          <p><InlineText text={item.summary} /></p>
        </CardHeader>
        <CardContent>
          <ul className={styles.bullets}>{item.points.map((point, position) => <li key={position}><InlineText text={point} /></li>)}</ul>
        </CardContent>
        <CardFooter className={styles.compareFoot}><span>Choose it when</span><InlineText text={item.bestFor} /></CardFooter>
      </Card>)}
    </div>
    <h4 className={styles.subhead}>Point by point</h4>
    <div className={styles.differenceGrid}>
      {comparison.differences.map(difference => <Card key={difference.aspect} role="article" aria-label={`Difference: ${difference.aspect}`} size="sm" className={`${styles.differenceCard} ${learningCard.card}`}>
        <CardHeader className={styles.differenceHead}><h5>{difference.aspect}</h5></CardHeader>
        <CardContent>
          <dl className={styles.differenceRows}>{comparison.items.map((item, index) => <div key={item.name} style={toneStyle(tone + 1 + index)}>
            <dt>{item.name}</dt><dd><InlineText text={difference.values[index]} /></dd>
          </div>)}</dl>
        </CardContent>
      </Card>)}
    </div>
  </section>;
}

/** A pointwise breakdown under a paragraph; renders nothing for answers saved without one. */
function Points({ points, label }: { points: string[]; label: string }) {
  if (!points.length) return null;
  return <ul className={styles.points} aria-label={label}>{points.map((point, index) => <li key={index}><InlineText text={point} /></li>)}</ul>;
}

function FeatureText({ text, highlights = [] }: { text: string; highlights?: string[] }) {
  const phrases = [...highlights, ...Array.from(text.matchAll(/`([^`]+)`/g), match => match[0])]
    .filter(phrase => text.includes(phrase)).sort((a, b) => b.length - a.length);
  // Highlight the opening takeaway for older guides without marked identifiers.
  if (!phrases.length) phrases.push(text.split(/(?<=[.!?])\s/)[0]);
  const escaped = phrases.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
  return <>{parts.map((part, index) => index % 2
    ? <mark className={styles.featureHighlight} key={index}><InlineText text={part} /></mark>
    : <InlineText key={index} text={part} />)}</>;
}

function AskRating({ rating }: { rating: number }) {
  return <span className={styles.askRating} aria-label={`Ask rating: ${rating} out of 5, editorial estimate`}>
    <span aria-hidden="true">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span> Ask rating {rating}/5
  </span>;
}

function ObjectivePractice({ item, index }: { item: ObjectiveQuestion; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answerOpen, setAnswerOpen] = useState(false);
  const groupId = useId();
  return <details className={styles.interviewCard}>
    <summary><span>{index + 1}. <InlineText text={item.question} /></span><AskRating rating={item.askRating} /></summary>
    <fieldset className={styles.objectiveOptions}>
      <legend>Choose one option to reveal the answer</legend>
      {item.options.map((option, optionIndex) => <label key={optionIndex} data-selected={selected === optionIndex}>
        <input type="radio" name={groupId} checked={selected === optionIndex} onChange={() => { setSelected(optionIndex); setAnswerOpen(true); }} />
        <span><strong>{String.fromCharCode(65 + optionIndex)}.</strong> <InlineText text={option} /></span>
      </label>)}
    </fieldset>
    {selected !== null && <div className={styles.interviewFeedback}>
      <p role="status">{selected === item.correctIndex ? 'Correct.' : 'Not quite.'} Correct answer: {String.fromCharCode(65 + item.correctIndex)}.</p>
      <details open={answerOpen} onToggle={event => setAnswerOpen(event.currentTarget.open)}>
        <summary>Answer &amp; key points</summary>
        <p><strong><InlineText text={item.options[item.correctIndex]} /></strong></p>
        <p><InlineText text={item.answer} /></p>
        <Points points={item.keyPoints} label="Objective answer key points" />
      </details>
    </div>}
  </details>;
}

function InterviewPractice({ guide, startNumber }: { guide: StepGuide; startNumber: number }) {
  const interview = interviewForGuide(guide);
  return <>
    <section className={styles.section} aria-labelledby="sec-subjective">
      <h3 id="sec-subjective"><span className={styles.sectionNo}>{startNumber}</span>Most asked in interviews: Subjective questions</h3>
      <p className={styles.interviewNote}>Ask ratings are editorial preparation estimates, not measured interview frequency.</p>
      {interview.subjective.map((item, index) => <details className={styles.interviewCard} key={index}>
        <summary><span>{index + 1}. <InlineText text={item.question} /></span><AskRating rating={item.askRating} /></summary>
        <div className={styles.interviewAnswer}><p><InlineText text={item.answer} /></p><Points points={item.keyPoints} label="Subjective answer key points" /></div>
      </details>)}
    </section>
    <section className={styles.section} aria-labelledby="sec-objective">
      <h3 id="sec-objective"><span className={styles.sectionNo}>{startNumber + 1}</span>Most asked in interviews: Objective questions</h3>
      <p className={styles.interviewNote}>Choose an option to see the correct answer and its key points. Ask ratings are editorial estimates.</p>
      {interview.objective.map((item, index) => <ObjectivePractice key={index} item={item} index={index} />)}
    </section>
  </>;
}

/** One real situation: what it is, what matters in it, then its complete implementation. */
function UseCaseCard({ useCase, index, tone }: { useCase: GuideUseCase; index: number; tone: number }) {
  return <Card role="article" aria-label={`Use case: ${useCase.title}`} size="sm" className={`${styles.useCase} ${learningCard.card}`} style={toneStyle(tone + 1 + index)}>
    <CardHeader className={styles.useCaseHead}>
      <Badge className={styles.toneBadge}>Use case {index + 1}</Badge>
      <h4><InlineText text={useCase.title} /></h4>
      <p className={styles.prose}><InlineText text={useCase.scenario} /></p>
    </CardHeader>
    <CardContent className={styles.useCaseBody}>
      <ul className={styles.keyPoints}>{useCase.points.map((point, position) => <li key={position}><CheckCircle2 size={14} aria-hidden="true" /><span className={styles.prose}><InlineText text={point} /></span></li>)}</ul>
      <CodeFiles files={useCase.files} label={`Full implementation: ${useCase.title}`} className={styles.ide} />
    </CardContent>
  </Card>;
}

function GuideDetail({ card, tone, onClose, onRegenerate, onEditAndRegenerate }: { card: StepCard; tone: number; onClose: () => void; onRegenerate: () => void; onEditAndRegenerate: (newQuestion: string) => void }) {
  const guide = card.guide!;
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(guide.question);

  // Sections are numbered by what this answer actually contains.
  const order = ["definition", ...(guide.features.length ? ["features"] : []), "steps", ...(guide.files.length ? ["code"] : []), ...(guide.useCases.length ? ["cases"] : []), ...(guide.comparison ? ["differences"] : []), "key"];
  const number = (section: string) => order.indexOf(section) + 1;
  return <Card role="article" className={styles.detail} style={toneStyle(tone)} aria-label={`Step by step answer: ${guide.question}`}>
    <CardHeader className={styles.detailHead}>
      <LearningPicture src={guideImage(card)} alt={`Illustration of ${guide.question}`} />
      <div className={styles.badges}>
        <Badge className={styles.toneBadge}>{guide.category}</Badge>
        <Badge variant="outline" className={styles.softBadge}>{capitalise(guide.level)}</Badge>
        <Badge variant="outline" className={styles.softBadge}>{card.origin === "built-in" ? "Built-in guide" : card.source === "ai" ? "AI answer" : "From library"}</Badge>
      </div>
      <h2>{guide.question}</h2>
      {isEditing ? (
        <div className={styles.detailEditBox}>
          <Label htmlFor={`detail-edit-${card.id}`} className={styles.cardEditLabel}>Edit question</Label>
          <InputGroup className={styles.cardEditGroup}>
            <InputGroupTextarea
              id={`detail-edit-${card.id}`}
              rows={2}
              value={editedQuestion}
              onChange={event => setEditedQuestion(event.target.value)}
              className={styles.cardEditTextarea}
              placeholder="Edit your question requirements..."
              aria-label="Edit question in guide"
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  if (editedQuestion.trim().length >= 3) {
                    setIsEditing(false);
                    onEditAndRegenerate(editedQuestion.trim());
                  }
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setIsEditing(false);
                  setEditedQuestion(guide.question);
                }
              }}
            />
          </InputGroup>
          <div className={styles.cardEditActions}>
            <Button
              type="button"
              size="sm"
              className={styles.cardSaveBtn}
              disabled={editedQuestion.trim().length < 3}
              onClick={() => {
                setIsEditing(false);
                onEditAndRegenerate(editedQuestion.trim());
              }}
            >
              <Sparkles size={12} aria-hidden="true" />
              Regenerate answer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setEditedQuestion(guide.question);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.detailActions}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={styles.cardActionBtn}
            onClick={() => {
              setEditedQuestion(guide.question);
              setIsEditing(true);
            }}
          >
            <Pencil size={12} aria-hidden="true" />
            Edit question
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={styles.cardActionBtn}
            disabled={card.status === "loading"}
            onClick={onRegenerate}
          >
            <RotateCcw size={12} className={card.status === "loading" ? styles.spin : undefined} aria-hidden="true" />
            Regenerate answer
          </Button>
        </div>
      )}
      <Button type="button" variant="ghost" size="icon" className={styles.close} onClick={onClose} aria-label="Close answer"><X aria-hidden="true" /></Button>
    </CardHeader>
    <CardContent className={styles.detailBody}>
      <section className={styles.section} aria-labelledby="sec-definition">
        <h3 id="sec-definition"><span className={styles.sectionNo}>{number("definition")}</span>Definition &amp; answer</h3>
        <dl className={styles.definition}>
          <div><dt>Definition</dt><dd><p className={styles.prose}><InlineText text={guide.definition} /></p><Points points={guide.definitionPoints} label="Definition, point by point" /></dd></div>
          <div><dt>Answer</dt><dd><p className={styles.prose}><InlineText text={guide.answer} /></p><Points points={guide.answerPoints} label="Answer, point by point" /></dd></div>
        </dl>
      </section>

      {!!guide.features.length && <section className={styles.section} aria-labelledby="sec-features">
        <h3 id="sec-features"><span className={styles.sectionNo}>{number("features")}</span>Key features</h3>
        <ul className={styles.featureGrid}>{guide.features.map((feature, index) => <li key={feature.name} className={styles.feature} style={toneStyle(tone + index + 1)}>
          <h4><InlineText text={feature.name} /></h4>
          <p className={styles.prose}><FeatureText text={feature.detail} highlights={feature.highlights} /></p>
        </li>)}</ul>
      </section>}

      <section className={styles.section} aria-labelledby="sec-steps">
        <h3 id="sec-steps"><span className={styles.sectionNo}>{number("steps")}</span>How to implement it, step by step</h3>
        <ol className={styles.steps}>{guide.steps.map((step, index) => <Step key={index} step={step} index={index} />)}</ol>
      </section>

      {!!guide.files.length && <section className={styles.section} aria-labelledby="sec-code">
        <h3 id="sec-code"><span className={styles.sectionNo}>{number("code")}</span>Complete codebase</h3>
        <CodeFiles files={guide.files} label="Complete codebase" className={styles.ide} />
      </section>}

      {!!guide.useCases.length && <section className={styles.section} aria-labelledby="sec-cases">
        <h3 id="sec-cases"><span className={styles.sectionNo}>{number("cases")}</span>Real use cases with full code</h3>
        {guide.useCases.map((useCase, index) => <UseCaseCard key={useCase.title} useCase={useCase} index={index} tone={tone} />)}
      </section>}

      {guide.comparison && <Differences comparison={guide.comparison} tone={tone} number={number("differences")} />}

      <section className={styles.section} aria-labelledby="sec-key">
        <h3 id="sec-key"><span className={styles.sectionNo}>{number("key")}</span>Key information</h3>
        <div className={styles.keyGrid}>
          <div className={styles.keyBox}>
            <h4>Remember</h4>
            <ul className={styles.keyPoints}>{guide.keyPoints.map((point, index) => <li key={index}><CheckCircle2 size={14} aria-hidden="true" /><span className={styles.prose}><InlineText text={point} /></span></li>)}</ul>
          </div>
          <div className={styles.keyBox}>
            <h4 id="glance-title">Steps at a glance</h4>
            {/* A bulleted list, one step per point, each on its own row. */}
            <ul className={styles.glance} aria-labelledby="glance-title">{guide.steps.map((step, index) => <li key={index}><InlineText text={step.title} /></li>)}</ul>
          </div>
        </div>
      </section>
      <InterviewPractice key={card.id} guide={guide} startNumber={order.length + 1} />
    </CardContent>
  </Card>;
}

function ResultCard({
  card,
  tone,
  selected,
  onOpen,
  onRetry,
  onForget,
  onRegenerate,
  onEditAndRegenerate,
}: {
  card: StepCard;
  tone: number;
  selected: boolean;
  onOpen: () => void;
  onRetry: () => void;
  onForget: () => void;
  onRegenerate: () => void;
  onEditAndRegenerate: (newQuestion: string) => void;
}) {
  const guide = card.guide;
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(card.question);

  return <Card role="article" className={`${styles.card} ${learningCard.card}`} style={toneStyle(tone)} data-status={card.status} aria-current={selected || undefined} aria-label={card.question}>
    <LearningPicture variant="card" className={styles.cardPicture} src={guideImage(card)} alt="" />
    <CardHeader className={styles.cardHead}>
      <div className={styles.cardTop}>
        <Badge className={styles.toneBadge}>{guide?.category ?? (card.status === "loading" ? "Preparing" : "Unanswered")}</Badge>
        {guide && <Badge variant="outline" className={styles.softBadge}>{capitalise(guide.level)}</Badge>}
        <span className={styles.origin}>{card.origin === "asked" ? <><Sparkles size={11} aria-hidden="true" />Asked</> : <><BookMarked size={11} aria-hidden="true" />Built-in</>}</span>
      </div>
      {isEditing ? (
        <div className={styles.cardEditContainer}>
          <Label htmlFor={`edit-${card.id}`} className={styles.cardEditLabel}>Edit question</Label>
          <InputGroup className={styles.cardEditGroup}>
            <InputGroupTextarea
              id={`edit-${card.id}`}
              rows={2}
              value={editedQuestion}
              onChange={event => setEditedQuestion(event.target.value)}
              className={styles.cardEditTextarea}
              placeholder="Edit your question requirements..."
              aria-label="Edit question"
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  if (editedQuestion.trim().length >= 3) {
                    setIsEditing(false);
                    onEditAndRegenerate(editedQuestion.trim());
                  }
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setIsEditing(false);
                  setEditedQuestion(card.question);
                }
              }}
            />
          </InputGroup>
          <div className={styles.cardEditActions}>
            <Button
              type="button"
              size="sm"
              className={styles.cardSaveBtn}
              disabled={editedQuestion.trim().length < 3}
              onClick={() => {
                setIsEditing(false);
                onEditAndRegenerate(editedQuestion.trim());
              }}
            >
              <Sparkles size={12} aria-hidden="true" />
              Regenerate answer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setEditedQuestion(card.question);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <h3 className={styles.cardTitle}>{card.question}</h3>
      )}
    </CardHeader>
    <CardContent className={styles.cardBody}>
      {card.status === "loading" && <p className={styles.cardStatus} role="status"><Loader2 size={14} className={styles.spin} aria-hidden="true" />Preparing the step-by-step answer…</p>}
      {card.status === "error" && <p className={styles.cardError} role="alert">{errorText(card.error)}</p>}
      {guide && <>
        <p className={styles.cardText}><InlineText text={guide.definition} /></p>
        <p className={styles.cardMeta}><ListOrdered size={13} aria-hidden="true" />{guide.steps.length} steps · {guide.files.length} file{guide.files.length === 1 ? "" : "s"}{guide.features.length ? ` · ${guide.features.length} features` : ""}{guide.useCases.length ? ` · ${guide.useCases.length} use case${guide.useCases.length === 1 ? "" : "s"}` : ""} · {guide.keyPoints.length} key points</p>
      </>}
    </CardContent>
    <CardFooter className={styles.cardFoot}>
      {guide && <Button type="button" size="sm" variant={selected ? "default" : "outline"} className={styles.viewButton} aria-pressed={selected} onClick={onOpen}>{selected ? "Viewing steps" : "View steps"}</Button>}
      {!isEditing && (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={styles.cardActionBtn}
            onClick={() => {
              setEditedQuestion(card.question);
              setIsEditing(true);
            }}
          >
            <Pencil size={12} aria-hidden="true" />
            Edit question
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={styles.cardActionBtn}
            disabled={card.status === "loading"}
            onClick={onRegenerate}
          >
            <RotateCcw size={12} className={card.status === "loading" ? styles.spin : undefined} aria-hidden="true" />
            Regenerate answer
          </Button>
        </>
      )}
      {card.status === "error" && <Button type="button" size="sm" variant="outline" onClick={onRetry}><RotateCcw aria-hidden="true" />Retry</Button>}
      {card.origin === "asked" && <Button type="button" size="icon-sm" variant="ghost" className={styles.forget} onClick={onForget} aria-label={`Remove ${card.question}`}><Trash2 aria-hidden="true" /></Button>}
    </CardFooter>
  </Card>;
}

/** shadcn Buttons laid out as pagination; the window logic is shared with every other pager. */
function CardPagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  return <nav className={styles.pagination} aria-label="Step by step result pages">
    <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft aria-hidden="true" />Previous</Button>
    <div className={styles.pageNumbers}>
      {pageWindow(page, pages).map((index, position) => index === "gap"
        ? <span key={`gap-${position}`} className={styles.pageGap} aria-hidden="true">…</span>
        : <Button key={index} type="button" size="icon-sm" variant={index === page ? "default" : "ghost"} aria-label={`Page ${index + 1}`} aria-current={index === page ? "page" : undefined} onClick={() => onPage(index)}>{index + 1}</Button>)}
    </div>
    <Button type="button" variant="outline" size="sm" disabled={page === pages - 1} onClick={() => onPage(page + 1)} aria-label="Next page">Next<ChevronRight aria-hidden="true" /></Button>
  </nav>;
}

/**
 * Every technology the Search page's "Explore topics" strip lists, paged three
 * at a time in the same way, as tabs that narrow the cards. "All" sits
 * outside the pages: the tabs filter a list here, so there has to be a way
 * back to the whole of it from any page of the strip.
 */
function TechnologyTabs({ technologies, value, onChange }: { technologies: string[]; value: string; onChange: (technology: string) => void }) {
  const [tabPage, setTabPage] = useState(() => Math.max(0, Math.floor(technologies.indexOf(value) / TECHNOLOGIES_PER_PAGE)));
  if (!technologies.length) return null;
  const pages = Math.ceil(technologies.length / TECHNOLOGIES_PER_PAGE);
  const current = Math.min(tabPage, pages - 1);
  const shown = technologies.slice(current * TECHNOLOGIES_PER_PAGE, current * TECHNOLOGIES_PER_PAGE + TECHNOLOGIES_PER_PAGE);
  return <Tabs className={styles.techTabs} value={value || null} onValueChange={next => onChange(String(next ?? ""))}>
    <div className={styles.techToolbar}>
      <span className={styles.techLabel}><SearchSectionIcon title="" size={14} />Explore technologies</span>
      <div className={styles.techNav}>
        <Button type="button" size="xs" variant={value ? "outline" : "default"} aria-pressed={!value} onClick={() => onChange("")}>All</Button>
        {pages > 1 && <>
          <Button type="button" variant="outline" size="icon-sm" aria-label="Previous technologies" disabled={current === 0} onClick={() => setTabPage(current - 1)}><ChevronLeft aria-hidden="true" /></Button>
          <span className={styles.techOf}>{current + 1}/{pages}</span>
          <Button type="button" variant="outline" size="icon-sm" aria-label="More technologies" disabled={current === pages - 1} onClick={() => setTabPage(current + 1)}><ChevronRight aria-hidden="true" /></Button>
        </>}
      </div>
    </div>
    <TabsList className={styles.techList} aria-label="Filter cards by technology">
      {shown.map(technology => <TabsTab key={technology} value={technology} className={styles.techTab} title={technology}>
        <SearchSectionIcon title={technology} />
        <span className={styles.techName}>{technology}</span>
      </TabsTab>)}
    </TabsList>
  </Tabs>;
}

export function StepByStep({ initialQuestion = "", technologies = [] }: { initialQuestion?: string; technologies?: string[] }) {
  const ids = useId();
  const [aiMode, setAiMode] = useAiMode();
  const [query, setQuery] = useState(initialQuestion);
  const [advanced, setAdvanced] = useState(false);
  const [options, setOptions] = useState<StepSearchOptions>({});
  const [asked, setAsked] = useState<StepCard[]>([]);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<{ id: string; tone: number } | null>(null);
  const pending = useRef(new Map<string, AbortController>());
  const detailRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setAsked(previous => (previous.length ? previous : loadAsked())); }, []);
  useEffect(() => () => pending.current.forEach(controller => controller.abort()), []);

  const update = useCallback((change: (cards: StepCard[]) => StepCard[]) => {
    setAsked(previous => { const next = change(previous); saveAsked(next); return next; });
  }, []);

  const ask = useCallback(async (raw: string, searchOptions: StepSearchOptions) => {
    const question = raw.trim();
    if (question.length < 3) return;
    const id = `asked:${question.toLowerCase()}`;
    pending.current.get(id)?.abort();
    const controller = new AbortController();
    pending.current.set(id, controller);
    update(cards => [{ id, question, at: Date.now(), origin: "asked", status: "loading" } as StepCard, ...cards.filter(card => card.id !== id)]);
    // The new card leads the unfiltered list, so it takes the first tint.
    setSelected({ id, tone: 0 });
    setFilters(NO_FILTERS);
    setPage(0);
    try {
      const response = await fetch("/api/pro-learn/step-by-step", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ question, options: searchOptions, aiMode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "generation_failed");
      const guide = stepGuideSchema.safeParse(payload.guide);
      if (controller.signal.aborted) return;
      update(cards => cards.map(card => card.id !== id ? card : guide.success
        ? { ...card, status: "ready", guide: guide.data, source: payload.source === "ai" ? "ai" : "library" }
        : { ...card, status: "error", error: typeof payload.reason === "string" ? payload.reason : "generation_failed" }));
    } catch (failure) {
      if (controller.signal.aborted) return;
      update(cards => cards.map(card => card.id === id ? { ...card, status: "error", error: failure instanceof TypeError ? "network_error" : failure instanceof Error ? failure.message : "generation_failed" } : card));
    } finally {
      if (pending.current.get(id) === controller) pending.current.delete(id);
    }
  }, [aiMode, update]);

  useEffect(() => {
    if (initialQuestion.trim().length >= 3) void Promise.resolve().then(() => ask(initialQuestion, {}));
  }, [initialQuestion, ask]);

  const all = useMemo(() => [...asked, ...BUILT_IN], [asked]);
  const visible = useMemo(() => filterCards(all, filters), [all, filters]);
  const pages = Math.max(1, Math.ceil(visible.length / CARDS_PER_PAGE));
  const current = Math.min(page, pages - 1);
  const first = current * CARDS_PER_PAGE;
  const shown = visible.slice(first, first + CARDS_PER_PAGE);
  const open = all.find(card => card.id === selected?.id && card.status === "ready");
  const filtered = filters.text || filters.technology || filters.level !== "all" || filters.origin !== "all" || filters.sort !== "recent";
  // A question asked while a technology tab is open is asked about that technology.
  const askOptions = useMemo(() => ({ ...options, ...(filters.technology ? { technology: filters.technology } : {}) }), [options, filters.technology]);
  const shortName = (technology: string) => technology.split(/\s[—–-]\s/)[0];

  useEffect(() => {
    if (open) detailRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [open?.id, open?.status]); // eslint-disable-line react-hooks/exhaustive-deps -- Scroll only when a different answer opens.

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) { setFilters(previous => ({ ...previous, [key]: value })); setPage(0); }
  function resetFilters() { setFilters(NO_FILTERS); setPage(0); }
  function clearSearch() { setQuery(""); setOptions({}); inputRef.current?.focus(); }
  function startAbout(technology: string) {
    setQuery(`How do I get started with ${shortName(technology)}, step by step?`);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }
  function forget(id: string) {
    pending.current.get(id)?.abort();
    update(cards => cards.filter(card => card.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const handleRegenerate = useCallback((card: StepCard) => {
    void ask(card.question, askOptions);
  }, [ask, askOptions]);

  const handleEditAndRegenerate = useCallback((card: StepCard, newQuestion: string) => {
    const trimmed = newQuestion.trim();
    if (trimmed.length < 3) return;
    if (card.origin === "asked" && card.id !== `asked:${trimmed.toLowerCase()}`) {
      pending.current.get(card.id)?.abort();
      pending.current.delete(card.id);
      update(cards => cards.filter(c => c.id !== card.id));
    }
    void ask(trimmed, askOptions);
  }, [ask, askOptions, update]);

  return <div className={styles.page}>
    {/* Cards first: what has been learned leads, the question box follows. */}
    <section className={styles.cardsPanel} aria-labelledby={`${ids}-title`}>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}><span aria-hidden="true">✳</span>On The Go</p>
          <h1 id={`${ids}-title`}>Your step-by-step cards</h1>
        </div>
        <span className={styles.count} aria-live="polite">{visible.length ? `Showing ${first + 1}–${first + shown.length} of ${visible.length}` : "No cards"}</span>
      </header>

      <TechnologyTabs technologies={technologies} value={filters.technology} onChange={technology => setFilter("technology", technology)} />

      <div className={styles.toolbar}>
        <InputGroup className={styles.cardSearch}>
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput value={filters.text} onChange={event => setFilter("text", event.target.value)} placeholder="Search cards" aria-label="Search cards" />
          {filters.text && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear card search" onClick={() => setFilter("text", "")}><X aria-hidden="true" /></InputGroupButton></InputGroupAddon>}
        </InputGroup>
        <NativeSelect className={styles.select} aria-label="Filter by level" value={filters.level} onChange={event => setFilter("level", event.target.value)}>
          <NativeSelectOption value="all">All levels</NativeSelectOption>{STEP_LEVELS.map(level => <NativeSelectOption key={level} value={level}>{capitalise(level)}</NativeSelectOption>)}
        </NativeSelect>
        <NativeSelect className={styles.select} aria-label="Filter by card type" value={filters.origin} onChange={event => setFilter("origin", event.target.value as Filters["origin"])}>
          <NativeSelectOption value="all">All cards</NativeSelectOption><NativeSelectOption value="asked">My questions</NativeSelectOption><NativeSelectOption value="built-in">Built-in guides</NativeSelectOption>
        </NativeSelect>
        <NativeSelect className={styles.select} aria-label="Sort cards" value={filters.sort} onChange={event => setFilter("sort", event.target.value as Filters["sort"])}>
          <NativeSelectOption value="recent">Most recent</NativeSelectOption><NativeSelectOption value="az">A–Z</NativeSelectOption><NativeSelectOption value="steps">Most steps</NativeSelectOption>
        </NativeSelect>
        {filtered && <Button type="button" variant="ghost" size="sm" onClick={resetFilters}><RotateCcw aria-hidden="true" />Reset filters</Button>}
      </div>

      {shown.length
        ? <div className={styles.grid}>{shown.map((card, index) => <ResultCard key={card.id} card={card} tone={first + index} selected={card.id === open?.id}
            onOpen={() => setSelected(card.id === open?.id ? null : { id: card.id, tone: first + index })}
            onRetry={() => void ask(card.question, askOptions)}
            onForget={() => forget(card.id)}
            onRegenerate={() => handleRegenerate(card)}
            onEditAndRegenerate={newQ => handleEditAndRegenerate(card, newQ)} />)}</div>
        : <div className={styles.empty}>
            <p>{filters.technology && !filters.text && filters.level === "all" && filters.origin === "all"
              ? <>No step-by-step cards for <strong>{shortName(filters.technology)}</strong> yet.</>
              : "No cards match these filters."}</p>
            <div className={styles.emptyActions}>
              {filters.technology && <Button type="button" size="sm" onClick={() => startAbout(filters.technology)}><Sparkles aria-hidden="true" />Ask about {shortName(filters.technology)}</Button>}
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>Reset filters</Button>
            </div>
          </div>}
      {pages > 1 && <CardPagination page={current} pages={pages} onPage={setPage} />}
    </section>

    {/* The question form as a Claude-style composer: one rounded box holding
        the prompt, with its controls docked along the bottom edge. */}
    <section className={styles.searchPanel} aria-labelledby={`${ids}-ask`}>
      <div className={styles.hero}>
        <h2 id={`${ids}-ask`}>Ask anything. Build it step by step.</h2>
        <p>Every answer comes as a definition, ordered implementation steps with commands, a complete multi-file codebase and the key points to remember.</p>
      </div>
      <form role="search" aria-label="Step by step search" className={styles.form} onSubmit={event => { event.preventDefault(); void ask(query, askOptions); }}>
        <Label htmlFor={`${ids}-question`} className={styles.fieldLabel}>Your question</Label>
        <InputGroup className={styles.composer}>
          <InputGroupTextarea id={`${ids}-question`} ref={inputRef} rows={3} value={query} className={styles.composerInput}
            placeholder="e.g. How do I add JWT authentication to an Express API?" aria-describedby={`${ids}-hint`}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              // Enter sends, Shift+Enter adds a line: the convention of every chat composer.
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
            }} />
          <InputGroupAddon align="block-end" className={styles.composerBar}>
            <Button type="button" variant="ghost" size="sm" aria-expanded={advanced} aria-controls={`${ids}-advanced`} onClick={() => setAdvanced(value => !value)}>
              <SlidersHorizontal aria-hidden="true" />Advanced search<ChevronDown aria-hidden="true" className={advanced ? styles.flipped : undefined} />
            </Button>
            <span className={styles.aiMode}>
              <Switch id={`${ids}-ai`} checked={aiMode} onCheckedChange={checked => setAiMode(checked)} />
              <Label htmlFor={`${ids}-ai`} className={styles.inlineLabel}>AI Mode {aiMode ? "on" : "off"}</Label>
            </span>
            {filters.technology && <Badge variant="outline" className={styles.contextBadge} title={filters.technology}>About {shortName(filters.technology)}</Badge>}
            <span className={styles.composerActions}>
              <Button type="button" variant="outline" size="sm" onClick={clearSearch}><X aria-hidden="true" />Clear search</Button>
              <Button type="submit" size="sm" className={styles.submit} disabled={query.trim().length < 3}><Sparkles aria-hidden="true" />Get steps</Button>
            </span>
          </InputGroupAddon>
        </InputGroup>
        <p id={`${ids}-hint`} className={styles.hint}>Press Enter to get steps, Shift + Enter for a new line.{query.length > 0 ? ` (${query.length} characters)` : ""}</p>
        {advanced && <fieldset id={`${ids}-advanced`} className={styles.advanced}>
          <legend className={styles.legend}>Advanced search</legend>
          <div className={styles.field}>
            <Label htmlFor={`${ids}-category`} className={styles.fieldLabel}>Technology</Label>
            <NativeSelect id={`${ids}-category`} className={styles.select} value={options.category ?? ""} onChange={event => setOptions(previous => ({ ...previous, category: (event.target.value || undefined) as StepSearchOptions["category"] }))}>
              <NativeSelectOption value="">Any technology</NativeSelectOption>{STEP_CATEGORIES.map(category => <NativeSelectOption key={category} value={category}>{category}</NativeSelectOption>)}
            </NativeSelect>
            <p className={styles.fieldHint}>Steers the generated answer.</p>
          </div>
          <div className={styles.field}>
            <Label htmlFor={`${ids}-level`} className={styles.fieldLabel}>Level</Label>
            <NativeSelect id={`${ids}-level`} className={styles.select} value={options.level ?? ""} onChange={event => setOptions(previous => ({ ...previous, level: (event.target.value || undefined) as StepSearchOptions["level"] }))}>
              <NativeSelectOption value="">Any level</NativeSelectOption>{STEP_LEVELS.map(level => <NativeSelectOption key={level} value={level}>{capitalise(level)}</NativeSelectOption>)}
            </NativeSelect>
            <p className={styles.fieldHint}>How much the steps assume you know.</p>
          </div>
          <div className={styles.field}>
            <Label htmlFor={`${ids}-depth`} className={styles.fieldLabel}>Answer depth</Label>
            <NativeSelect id={`${ids}-depth`} className={styles.select} value={options.depth ?? ""} onChange={event => setOptions(previous => ({ ...previous, depth: (event.target.value || undefined) as StepSearchOptions["depth"] }))}>
              <NativeSelectOption value="">Standard</NativeSelectOption>{STEP_DEPTHS.map(depth => <NativeSelectOption key={depth} value={depth}>{depth === "concise" ? "Concise (4-6 steps)" : "Detailed (6-9 steps)"}</NativeSelectOption>)}
            </NativeSelect>
            <p className={styles.fieldHint}>Concise or detailed walkthrough.</p>
          </div>
          <div className={styles.suggestions}>
            <span>Try</span>
            {STEP_GUIDES.slice(0, 3).map(guide => <Button type="button" key={guide.id} variant="outline" size="sm" className={styles.suggestion} onClick={() => { setQuery(guide.question); void ask(guide.question, askOptions); }}>{guide.question}</Button>)}
          </div>
        </fieldset>}
      </form>
    </section>

    <div ref={detailRef} className={styles.detailAnchor}>
      {open && (
        <GuideDetail
          key={open.id}
          card={open}
          tone={selected?.tone ?? 0}
          onClose={() => setSelected(null)}
          onRegenerate={() => handleRegenerate(open)}
          onEditAndRegenerate={newQ => handleEditAndRegenerate(open, newQ)}
        />
      )}
    </div>
  </div>;
}
