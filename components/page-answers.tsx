import type { ReactNode } from "react";
import Image from "@/components/responsive-image";
import { JsonLd } from "@/components/json-ld";
import { faqSchema, howToSchema } from "@/lib/seo";
import type { PageAnswers as Answers } from "@/lib/page-answers";
import styles from "./page-answers.module.css";

/** The how-to steps and question-and-answer cards, with the FAQPage and HowTo data for exactly this visible text. */
export function AnswerList({ answers, closing }: Readonly<{ answers: Answers; closing?: ReactNode }>) {
  return <>
    <JsonLd data={[faqSchema(answers.faqs), ...(answers.howTo ? [howToSchema(answers.howTo.name, answers.howTo.steps)] : [])]} />
    {answers.howTo && <div className={styles.how}>
      <h3>{answers.howTo.name}</h3>
      <ol>{answers.howTo.steps.map((step, at) => { const icon = answers.howTo?.icons?.[at]; return <li key={step}>{icon && <Image className={styles.icon} src={icon} alt="" width={96} height={96} loading="lazy" />}<span>{step}</span></li>; })}</ol>
    </div>}
    <div className={styles.list}>{answers.faqs.map(item => <article key={item.question} className={styles.item}>{item.icon && <Image className={styles.icon} src={item.icon} alt="" width={96} height={96} loading="lazy" />}<h3>{item.question}</h3><p>{item.answer}</p></article>)}{closing}</div>
  </>;
}

/** Answers at the end of a public page, under their own h2. */
export function PageAnswers({ answers }: Readonly<{ answers: Answers }>) {
  return <section className={styles.answers} aria-labelledby="page-answers-title">
    <h2 id="page-answers-title">Questions and answers</h2>
    <AnswerList answers={answers} />
  </section>;
}
