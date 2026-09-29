"use client";

import { useState } from "react";
import { ArrowRight, Calculator, Check, FlaskConical, Lightbulb, Network, RotateCcw, X, type LucideIcon } from "lucide-react";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import { useReveal } from "./use-reveal";
import styles from "./landing-practice.module.css";

type SampleId = "maths" | "science" | "design";
const SAMPLES: SampleId[] = ["maths", "science", "design"];
const ICONS: Record<SampleId, LucideIcon> = { maths: Calculator, science: FlaskConical, design: Network };

/**
 * A one-question workbench: the idea and its rule on the left, the question on
 * the right. An answer locks the options and explains the working either way;
 * "Next topic" moves to the next sample so a visitor can keep going.
 */
export function LandingPractice() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const [sample, setSample] = useState<SampleId>("maths");
  const [answer, setAnswer] = useState<number | null>(null);
  const [ref, reveal] = useReveal<HTMLElement>();
  const sublabels: Record<SampleId, string> = { maths: text("Class 10", "कक्षा 10"), science: text("NEET Foundation", "NEET आधार"), design: text("Payments", "भुगतान") };
  const labels: Record<SampleId, string> = { maths: text("Maths", "गणित"), science: text("Science", "विज्ञान"), design: text("System Design", "सिस्टम डिज़ाइन") };
  const demo = {
    maths: { tag: text("Class 10 · Maths", "कक्षा 10 · गणित"), title: text("A little clarity. A big difference.", "थोड़ी स्पष्टता। बड़ा बदलाव।"), concept: text("An arithmetic progression has a constant difference between consecutive terms.", "समांतर श्रेणी के लगातार पदों का अंतर समान होता है।"), rule: "aₙ = a + (n − 1)d", question: text("What is the 5th term of 3, 7, 11, 15, …?", "3, 7, 11, 15, … का पाँचवाँ पद क्या है?"), options: ["17", "19", "20", "23"], correct: 1, solution: text("a = 3, d = 4. So a₅ = 3 + (5 − 1) × 4 = 19. Count the four gaps, not five.", "a = 3, d = 4। इसलिए a₅ = 3 + (5 − 1) × 4 = 19। चार अंतर गिनें, पाँच नहीं।") },
    science: { tag: text("NEET Foundation · Chemistry", "NEET आधार · रसायन विज्ञान"), title: text("Understand the idea behind the answer.", "उत्तर के पीछे का विचार समझें।"), concept: text("One mole contains the Avogadro number of specified elementary entities.", "एक मोल में निर्दिष्ट मूल इकाइयों की संख्या आवोगाद्रो संख्या होती है।"), rule: "n = mass / molar mass", question: text("How many moles are in 18 g of water? Use 18 g/mol.", "18 g पानी में कितने मोल हैं? मोलर द्रव्यमान 18 g/mol लें।"), options: ["0.5 mol", "18 mol", "1 mol", "36 mol"], correct: 2, solution: text("n = 18 g ÷ 18 g/mol = 1 mol. Check how the units cancel.", "n = 18 g ÷ 18 g/mol = 1 mol। इकाइयों का कटना जाँचें।") },
    design: { tag: text("System Design · Payments", "सिस्टम डिज़ाइन · भुगतान"), title: text("Think beyond the happy path.", "सफलता के साथ विफलता भी समझें।"), concept: text("A payment timeout can leave the outcome unknown. Retrying must preserve the identity of the original attempt.", "भुगतान timeout में परिणाम अज्ञात हो सकता है। retry में मूल प्रयास की पहचान सुरक्षित रखें।"), rule: "request + idempotency key → one recorded attempt", question: text("A payment request times out. What should happen next?", "भुगतान अनुरोध timeout हो गया। अब क्या करें?"), options: [text("Charge again with a new key", "नई key से फिर charge"), text("Delete the attempt", "प्रयास मिटाएँ"), text("Assume the payment failed", "भुगतान विफल मानें"), text("Reconcile the original attempt", "मूल प्रयास का मिलान करें")], correct: 3, solution: text("Reuse the original provider key and reconcile its status. A timeout does not prove the charge failed.", "मूल provider key से स्थिति मिलाएँ। timeout, charge विफल होने का प्रमाण नहीं है।") },
  }[sample];
  const choose = (id: SampleId) => { setSample(id); setAnswer(null); };
  const next = SAMPLES[(SAMPLES.indexOf(sample) + 1) % SAMPLES.length];
  const right = answer === demo.correct;

  return <section ref={ref} id="practice" className={styles.practice} data-reveal={reveal} aria-labelledby="practice-title"><div className={styles.inner}>
    <header className={styles.head}>
      <h2 id="practice-title"><ExpandedText text={text("Don’t just read it.", "सिर्फ़ पढ़ें नहीं।")} /> <span className={styles.accent}><ExpandedText text={text("Try it yourself.", "खुद आज़माएँ।")} /></span></h2>
      <p><ExpandedText text={text("Take one idea, see the rule and answer a question. This is original sample practice; no account is needed to try it here.", "एक विचार समझें, नियम देखें और प्रश्न हल करें। यह मौलिक नमूना अभ्यास है; यहाँ आज़माने के लिए खाते की जरूरत नहीं।")} /></p>
    </header>

    <div className={styles.bench} data-subject={sample}>
      <div className={styles.switcher} role="group" aria-label={text("Sample topic", "नमूना विषय")}>
        {SAMPLES.map(id => {
          const Icon = ICONS[id];
          return <button key={id} type="button" data-subject={id} aria-pressed={sample === id} onClick={() => choose(id)}>
            <span className={styles.subjectIcon}><Icon size={17} aria-hidden="true" /></span>
            <span className={styles.subjectText}><ExpandedText text={labels[id]} /><small>{sublabels[id]}</small></span>
          </button>;
        })}
      </div>

      <div key={sample} className={styles.panes}>
        <div className={styles.idea}>
          <p className={styles.tag}><ExpandedText text={demo.tag} /></p>
          <h3><ExpandedText text={demo.title} /></h3>
          <p className={styles.concept}><ExpandedText text={demo.concept} /></p>
          <div className={styles.rule}><small>{text("The rule", "नियम")}</small><code><ExpandedText text={demo.rule} /></code></div>
        </div>

        <div className={styles.task}>
          <h4><ExpandedText text={demo.question} /></h4>
          <div className={styles.options}>{demo.options.map((option, index) => {
            const state = answer === null ? undefined : index === demo.correct ? "correct" : index === answer ? "wrong" : "idle";
            return <button key={option} type="button" className={styles.option} aria-pressed={answer === index} data-state={state} disabled={answer !== null} onClick={() => setAnswer(index)}>
              <span className={styles.letter}>{state === "correct" ? <Check size={15} aria-hidden="true" /> : state === "wrong" ? <X size={15} aria-hidden="true" /> : String.fromCharCode(65 + index)}</span>
              <ExpandedText text={option} />
            </button>;
          })}</div>

          {answer !== null && <div className={styles.feedback} data-right={right || undefined} role="status">
            <span className={styles.feedbackIcon}>{right ? <Check size={18} aria-hidden="true" /> : <Lightbulb size={18} aria-hidden="true" />}</span>
            <div>
              <strong><ExpandedText text={right ? text("That’s right.", "सही उत्तर।") : text("Let’s work through it.", "आइए इसे समझें।")} /></strong>
              <p><ExpandedText text={demo.solution} /></p>
            </div>
          </div>}

          {answer !== null && <div className={styles.actions}>
            <button type="button" className={styles.ghost} onClick={() => setAnswer(null)}><RotateCcw size={15} aria-hidden="true" /><ExpandedText text={text("Try again", "फिर से करें")} /></button>
            <button type="button" className={styles.next} onClick={() => choose(next)}><ExpandedText text={text(`Next: ${labels[next]}`, `अगला: ${labels[next]}`)} /><ArrowRight size={15} aria-hidden="true" /></button>
          </div>}
        </div>
      </div>
    </div>
  </div></section>;
}
