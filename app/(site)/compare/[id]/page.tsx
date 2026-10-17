import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { COMPARISONS, comparison, loadComparisonBank } from "@/lib/comparisons";
import { learningMetadata } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import { QuestionList, faqData } from "@/components/public-learning/question-list";
import { LearningLoader } from "@/components/learning-loader";
import styles from "@/components/public-learning/library.module.css";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return COMPARISONS.map(item => ({ id: item.id }));
}

/** A comparison's question bank, cached and tagged so a content release can refresh it with revalidateTag("comparisons"). */
async function bank(id: string) {
  "use cache";
  cacheLife("max");
  cacheTag("comparisons", `comparisons:${id}`);
  return loadComparisonBank(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = comparison((await params).id);
  if (!item) return { title: "Comparison not found", robots: { index: false } };
  const names = item.techs.map(tech => tech.name);
  return learningMetadata({
    path: `/compare/${item.id}`,
    title: item.question.replace(/\?$/, ""),
    description: `${item.summary} Definitions, a comparison table and 40+ difference questions with answers.`,
    keywords: [names.join(" vs "), `${names[0]} vs ${names[1]}`, `difference between ${names.join(" and ")}`, ...names],
  });
}

export default function Page({ params }: Props) {
  return <Suspense fallback={<LearningLoader size="inline" label="Loading the comparison…" />}><ComparisonPage params={params} /></Suspense>;
}

async function ComparisonPage({ params }: Props) {
  const item = comparison((await params).id);
  if (!item) notFound();
  const set = await bank(item.id);
  const index = COMPARISONS.indexOf(item);
  const [previous, next] = [COMPARISONS[index - 1], COMPARISONS[index + 1]];
  return <>
    <LibraryIntro trail={[["Comparisons", "/compare"], [item.techs.map(tech => tech.name).join(" vs "), `/compare/${item.id}`]]} eyebrow={item.group}
      title={item.question} lead={item.summary} facts={[["Technologies", item.techs.length], ["Difference questions", set.subjective.length]]}
      schema={set.subjective.length ? faqData(set) : undefined} />
    <section className={styles.section} aria-labelledby="defs">
      <h2 id="defs">What each one is</h2>
      <div className={styles.cards}>{item.techs.map(tech => <article key={tech.name}><h3>{tech.name}</h3><p><strong>{tech.definition}</strong></p><p>{tech.description}</p></article>)}</div>
      {item.source && <p className={styles.meta}>{item.source}</p>}
    </section>
    <section className={styles.section} aria-labelledby="glance">
      <h2 id="glance">At a glance</h2>
      <div className={styles.table}><table>
        <thead><tr><th scope="col">Aspect</th>{item.techs.map(tech => <th key={tech.name} scope="col">{tech.name}</th>)}</tr></thead>
        <tbody>{item.aspects.map(([aspect, ...values]) => <tr key={aspect}><th scope="row">{aspect}</th>{values.map((value, k) => <td key={k}>{value}</td>)}</tr>)}</tbody>
      </table></div>
    </section>
    {set.subjective.length > 0 && <section className={styles.section} aria-labelledby="questions"><h2 id="questions">Difference questions and answers</h2><QuestionList set={set} idPrefix="q" level={3} /></section>}
    <nav className={styles.next} aria-label="More comparisons">
      {previous ? <Link href={`/compare/${previous.id}`}>← {previous.techs.map(tech => tech.name).join(" vs ")}</Link> : <span />}
      {next && <Link href={`/compare/${next.id}`}>{next.techs.map(tech => tech.name).join(" vs ")} →</Link>}
    </nav>
    <div className={styles.cta}><p>Practise every comparison in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
