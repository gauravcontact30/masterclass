import { JsonLd } from "@/components/json-ld";
import { faqSchema, howToSchema } from "@/lib/seo";
import type { PageAnswers as Answers } from "@/lib/page-answers";
import styles from "./page-answers.module.css";

/** The how-to steps and question-and-answer cards, with the FAQPage and HowTo data for exactly this visible text. */
export function AnswerList({ answers }: Readonly<{ answers: Answers }>) {
  return <>
    <JsonLd data={[faqSchema(answers.faqs), ...(answers.howTo ? [howToSchema(answers.howTo.name, answers.howTo.steps)] : [])]} />
    {answers.howTo && <div className={styles.how}>
      <h3>{answers.howTo.name}</h3>
      <ol>{answers.howTo.steps.map(step => <li key={step}>{step}</li>)}</ol>
    </div>}
    <div className={styles.list}>{answers.faqs.map(item => <article key={item.question} className={styles.item}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</div>
  </>;
}

/** Answers at the end of a public page, under their own h2. */
export function PageAnswers({ answers }: Readonly<{ answers: Answers }>) {
  return <section className={styles.answers} aria-labelledby="page-answers-title">
    <h2 id="page-answers-title">Questions and answers</h2>
    <AnswerList answers={answers} />
  </section>;
}
