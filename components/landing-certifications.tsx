import { Award, BadgeCheck, CalendarCheck, ListOrdered, Route } from "lucide-react";
import { CoverCarousel } from "./landing-carousel";
import { FeatureSection, type Copy, type Feature } from "./landing-features";

/**
 * Certifications on the landing page, in the same form as the AI Search section: what the dashboard's Certifications
 * page gives you, four details, how it works and a way in, beside a picture painted through Vercel AI Gateway
 * (scripts/generate-feature-images.ts) with one card per certification track turning every 15 seconds (covers from
 * scripts/generate-lesson-covers.ts, cert:<id>). Each card opens that track's step-by-step path after sign-in.
 * The full paths live in lib/certifications.ts, which only the dashboard imports. A server component, like
 * components/landing-features.tsx: the landing page passes it in already rendered.
 */
const FEATURE: Feature = {
  id: "certifications", icon: Award, kicker: ["Certifications", "सर्टिफ़िकेशन"],
  title: ["Earn the certificate, ", "सर्टिफ़िकेट पाइए, "], emphasis: ["one step at a time.", "एक-एक कदम करके।"],
  lede: ["Step-by-step paths to the certifications employers ask for: System Design, Claude Code, the popular AWS exams, DevOps, Cloud Architecture & Infrastructure, n8n, Agentic AI, Python agents and AI automation with LangChain, LangGraph, LangSmith and LangFlow. Each path goes from the first lesson to exam day, with a hands-on task and a checkpoint at every step.", "उन सर्टिफ़िकेशन के चरण-दर-चरण रास्ते जिन्हें कंपनियाँ माँगती हैं: सिस्टम डिज़ाइन, Claude Code, लोकप्रिय AWS परीक्षाएँ, DevOps, क्लाउड आर्किटेक्चर व इन्फ्रास्ट्रक्चर, n8n, एजेंटिक AI, और LangChain, LangGraph, LangSmith व LangFlow के साथ Python एजेंट और AI ऑटोमेशन। हर रास्ता पहले पाठ से परीक्षा के दिन तक जाता है, हर कदम पर एक प्रैक्टिकल काम और एक जाँच बिंदु के साथ।"],
  details: [
    { icon: ListOrdered, title: ["Start to finish", "शुरू से अंत तक"], body: ["Every path is broken into weekly steps: what to learn, what to build, how you know you are done.", "हर रास्ता साप्ताहिक कदमों में बँटा है: क्या सीखें, क्या बनाएँ, और कैसे पता चले कि हो गया।"] },
    { icon: BadgeCheck, title: ["The right certificates", "सही सर्टिफ़िकेट"], body: ["Exam codes, question counts, time, fee and passing score for each certificate.", "हर सर्टिफ़िकेट के लिए परीक्षा कोड, प्रश्नों की संख्या, समय, शुल्क और पासिंग स्कोर।"] },
    { icon: Route, title: ["Hands-on at every step", "हर कदम पर प्रैक्टिकल"], body: ["A small project per step, so you finish with a portfolio and not only a badge.", "हर कदम पर एक छोटा प्रोजेक्ट, ताकि अंत में सिर्फ़ बैज नहीं, एक पोर्टफ़ोलियो भी हो।"] },
    { icon: CalendarCheck, title: ["Track your progress", "अपनी प्रगति देखें"], body: ["Tick off steps as you go and pick up exactly where you left off.", "चलते-चलते कदमों पर निशान लगाएँ और ठीक वहीं से शुरू करें जहाँ छोड़ा था।"] },
  ],
  steps: [["Pick a certification", "सर्टिफ़िकेशन चुनें"], ["Follow the weekly steps", "साप्ताहिक कदम अपनाएँ"], ["Book the exam", "परीक्षा बुक करें"]],
  image: { src: "/images/landing/feature-certifications.webp", focus: "30% 50%" }, badge: { icon: Award, label: ["9 certification paths", "9 सर्टिफ़िकेशन रास्ते"] },
  cta: { href: "/sign-in?redirect=%2Fdashboard%2Fcertifications", label: ["Start a certification path", "सर्टिफ़िकेशन रास्ता शुरू करें"] }, note: ["Included in every membership", "हर सदस्यता में शामिल"],
};

type Card = { id: string; title: string; text: Copy; meta: Copy };
// One card per track in lib/certifications.ts (same ids); a short description only, the steps are in the dashboard.
const CARDS: Card[] = [
  { id: "system-design", title: "System Design", text: ["Scaling, caching, databases, queues and the interview framework, ending with AWS Solutions Architect – Associate.", "स्केलिंग, कैशिंग, डेटाबेस, क्यू और इंटरव्यू फ़्रेमवर्क, अंत में AWS Solutions Architect – Associate।"], meta: ["9 steps · 12 weeks", "9 कदम · 12 सप्ताह"] },
  { id: "claude-code", title: "Claude Code", text: ["From your first session to CLAUDE.md, hooks, MCP servers, subagents and CI, with Anthropic Academy certificates.", "पहले सेशन से CLAUDE.md, हुक, MCP सर्वर, सबएजेंट और CI तक, Anthropic Academy सर्टिफ़िकेट के साथ।"], meta: ["8 steps · 4 weeks", "8 कदम · 4 सप्ताह"] },
  { id: "aws", title: "AWS certifications", text: ["Cloud Practitioner, AI Practitioner, the Associates and Professional exams, in the order most people take them.", "Cloud Practitioner, AI Practitioner, Associate और Professional परीक्षाएँ, उसी क्रम में जिसमें ज़्यादातर लोग देते हैं।"], meta: ["8 certificates · 7 steps", "8 सर्टिफ़िकेट · 7 कदम"] },
  { id: "n8n", title: "n8n automation", text: ["Triggers, expressions, error handling and AI agent workflows, with n8n's Level 1 and Level 2 course badges.", "ट्रिगर, एक्सप्रेशन, एरर हैंडलिंग और AI एजेंट वर्कफ़्लो, n8n के लेवल 1 और लेवल 2 कोर्स बैज के साथ।"], meta: ["7 steps · 5 weeks", "7 कदम · 5 सप्ताह"] },
  { id: "agentic-ai", title: "Agentic AI", text: ["Tool calling, planning, memory, multi-agent systems and evaluation, toward Hugging Face, DeepLearning.AI and NVIDIA certificates.", "टूल कॉलिंग, योजना, मेमोरी, मल्टी-एजेंट सिस्टम और मूल्यांकन, Hugging Face, DeepLearning.AI और NVIDIA सर्टिफ़िकेट की ओर।"], meta: ["7 steps · 10 weeks", "7 कदम · 10 सप्ताह"] },
  { id: "langchain-python", title: "Python agents: LangChain, LangGraph, LangSmith, LangFlow", text: ["Build agents with create_agent, control them with LangGraph, trace and evaluate in LangSmith, prototype in LangFlow.", "create_agent से एजेंट बनाएँ, LangGraph से नियंत्रित करें, LangSmith में ट्रेस व मूल्यांकन करें, LangFlow में प्रोटोटाइप बनाएँ।"], meta: ["9 steps · 10 weeks", "9 कदम · 10 सप्ताह"] },
  { id: "devops", title: "DevOps engineering", text: ["Linux, Git, GitHub Actions, Docker, Kubernetes, Terraform, GitOps and observability, toward CKA, CKAD, Terraform Associate and AWS or Azure DevOps exams.", "Linux, Git, GitHub Actions, Docker, Kubernetes, Terraform, GitOps और ऑब्ज़र्वेबिलिटी, CKA, CKAD, Terraform Associate और AWS या Azure DevOps परीक्षाओं की ओर।"], meta: ["11 steps · 14 weeks", "11 कदम · 14 सप्ताह"] },
  { id: "cloud-architecture", title: "Cloud Architecture & Infrastructure", text: ["Landing zones, network design, disaster recovery, security and FinOps across AWS, Azure and Google Cloud, up to the Professional architect exams.", "AWS, Azure और Google Cloud पर लैंडिंग ज़ोन, नेटवर्क डिज़ाइन, डिज़ास्टर रिकवरी, सुरक्षा और FinOps, Professional आर्किटेक्ट परीक्षाओं तक।"], meta: ["6 certificates · 12 steps", "6 सर्टिफ़िकेट · 12 कदम"] },
  { id: "ai-automation-langchain", title: "AI Automation: LangChain, LangGraph, LangSmith, LangFlow", text: ["Document pipelines, human approvals, scheduled and event-driven agents, monitored in LangSmith and prototyped in LangFlow.", "डॉक्यूमेंट पाइपलाइन, मानवीय मंज़ूरी, शेड्यूल और इवेंट से चलने वाले एजेंट, LangSmith में मॉनिटर और LangFlow में प्रोटोटाइप।"], meta: ["9 steps · 10 weeks", "9 कदम · 10 सप्ताह"] },
];

export function LandingCertifications({ hi = false }: Readonly<{ hi?: boolean }>) {
  const pick = ([en, hindi]: Copy) => hi ? hindi : en;
  const slides = CARDS.map(card => ({
    id: card.id, image: `/images/landing/certifications/${card.id}.webp`, kicker: hi ? "सर्टिफ़िकेशन" : "Certification",
    title: card.title, text: pick(card.text), meta: pick(card.meta),
    href: `/sign-in?redirect=${encodeURIComponent(`/learning/certifications?track=${card.id}`)}`, cta: hi ? "रास्ता देखें" : "See the path",
  }));
  return <FeatureSection feature={FEATURE} index={0} total={1} hi={hi} float={<CoverCarousel slides={slides} label={hi ? "सर्टिफ़िकेशन रास्ते" : "Certification paths"} hi={hi} />} />;
}
