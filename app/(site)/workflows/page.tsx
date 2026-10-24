import Link from "next/link";
import { workflows } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import styles from "@/components/public-learning/library.module.css";

export const metadata = learningMetadata({
  path: "/workflows",
  title: "System design and AI agent workflow blueprints",
  description: "Step-by-step blueprints of real systems and AI agents: URL shortener, rate limiter, payments, chat, video streaming, LangChain RAG, LangGraph human-in-the-loop and supervisors, with tech stacks, design decisions and interview questions.",
  keywords: [
    "system design blueprints", "system design interview questions", "LangGraph workflow examples", "LangChain RAG architecture",
    "AI agent architecture", "distributed systems blueprints", "rate limiting architecture", "MCP agent workflows",
    "human in the loop AI", "microservices architecture", "URL shortener system design", "payments system design"
  ],
});

const GROUP_INTRO: Record<string, string> = {
  "System Design": "Classic designs asked in system design interviews, from a URL shortener to ride matching.",
  LangChain: "Retrieval, tool-calling agents and extraction pipelines built with LangChain.",
  LangGraph: "Stateful agent graphs: human approval, supervisors and long-running workflows.",
  LangFlow: "Visual flows for chatbots, helpdesks and lead qualification.",
  LangSmith: "Tracing, evaluation and feedback loops that keep AI features improving.",
};

export default function WorkflowsIndex() {
  const all = workflows();
  const groups = [...new Set(all.map(item => item.group))];
  const origin = siteUrl();
  const list = { "@context": "https://schema.org", "@type": "ItemList", name: "Workflow blueprints", itemListElement: all.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: new URL(`/workflows/${item.id}`, origin).href })) };
  return <>
    <LibraryIntro trail={[["Workflow blueprints", "/workflows"]]} eyebrow="System design & AI agents" title="Workflow blueprints" schema={list}
      lead="How real systems and AI agents get work done, one blueprint at a time: the diagram, the steps in order, the tech stack, the design decisions that make it work, the mistakes teams make, what to measure and the interview questions most asked about it."
      facts={[["Blueprints", all.length], ["Groups", groups.length], ["Interview questions each", "60+"]]} />
    {groups.map(group => <section key={group} className={styles.section} aria-labelledby={`group-${group}`}>
      <h2 id={`group-${group}`}>{group}</h2>
      <p className={styles.meta}>{GROUP_INTRO[group]}</p>
      <ul className={styles.grid}>{all.filter(item => item.group === group).map(item => <li key={item.id}><Link href={`/workflows/${item.id}`}><b>{item.title}</b><span>{item.summary}</span><small>{item.industry}</small></Link></li>)}</ul>
    </section>)}
    <div className={styles.cta}><p>Study every blueprint with progress tracking in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
