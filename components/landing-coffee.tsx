"use client";
import { Code2, Coffee, MessageCircleQuestion, Sparkles, Timer } from "lucide-react";
import type { BlogTeaser, BlogTone } from "@/lib/coffee-and-code";
import { contentKey } from "@/lib/content-overrides";
import { useContentEditing, useContentItem } from "./content-editing";
import { useLanguage } from "./language-provider";
import { CoverCarousel } from "./landing-carousel";
import { FeatureSection, type Feature } from "./landing-features";

/**
 * Coffee & Code on the landing page, in the same form as the feature sections (Featured lessons): what the articles
 * are, four details, how reading works and a way in, beside a picture painted through Vercel AI Gateway with the
 * newest articles turning in a carousel every 15 seconds. Each article opens in the dashboard after sign-in.
 * Super Admin edits apply: a hidden section shows nothing, and removed articles leave the carousel.
 */
const COVERS: Record<BlogTone, string> = {
  mint: "linear-gradient(135deg, #eff9f3, #c8e8d5)", sky: "linear-gradient(135deg, #f1f7fe, #cfe1f6)", butter: "linear-gradient(135deg, #fefaea, #f1e3a8)",
  rose: "linear-gradient(135deg, #fdf2f4, #f4d0d9)", lavender: "linear-gradient(135deg, #f5f2fd, #ddd4f5)", peach: "linear-gradient(135deg, #fef5ee, #f5dac6)",
  sage: "linear-gradient(135deg, #f1f5ee, #d3e0c9)", sand: "linear-gradient(135deg, #faf6ee, #e8dcc4)",
};

const FEATURE: Feature = {
  id: "coffee-and-code", icon: Coffee, kicker: ["Coffee & Code", "Coffee & Code"],
  title: ["One idea, real code, ", "एक विचार, असली कोड, "], emphasis: ["read over a coffee.", "एक कप कॉफ़ी के साथ।"],
  lede: ["Short engineering articles from the dashboard. Each takes one idea that trips people up, explains it with real code, and ends with the interview questions you will be asked about it. Members and trial users read every article in full.", "डैशबोर्ड के छोटे इंजीनियरिंग लेख। हर लेख एक ऐसा विचार लेता है जिसमें लोग अक्सर उलझते हैं, उसे असली कोड से समझाता है, और उन इंटरव्यू प्रश्नों पर ख़त्म होता है जो इसके बारे में पूछे जाएँगे। सदस्य और ट्रायल उपयोगकर्ता हर लेख पूरा पढ़ते हैं।"],
  details: [
    { icon: Sparkles, title: ["One idea per article", "हर लेख में एक विचार"], body: ["A single concept, explained until it clicks, without the padding.", "एक ही अवधारणा, बिना भराव के, तब तक समझाई जाती है जब तक समझ न आ जाए।"] },
    { icon: Code2, title: ["Real, runnable code", "असली, चलने वाला कोड"], body: ["Examples you can copy into a project, with the mistake and the fix side by side.", "ऐसे उदाहरण जिन्हें आप प्रोजेक्ट में कॉपी कर सकें, ग़लती और सुधार साथ-साथ।"] },
    { icon: MessageCircleQuestion, title: ["Interview questions", "इंटरव्यू प्रश्न"], body: ["Every article ends with the questions interviewers ask, and their answers.", "हर लेख इंटरव्यू में पूछे जाने वाले प्रश्नों और उनके उत्तरों पर ख़त्म होता है।"] },
    { icon: Timer, title: ["Short reads", "छोटे लेख"], body: ["Most take under ten minutes: one coffee, one idea you keep.", "ज़्यादातर दस मिनट से कम: एक कॉफ़ी, एक विचार जो याद रहे।"] },
  ],
  steps: [["Pick an article", "एक लेख चुनें"], ["Read the code", "कोड पढ़ें"], ["Answer the questions", "प्रश्नों के उत्तर दें"]],
  image: { src: "/images/landing/feature-coffee.webp", focus: "55% 50%" }, badge: { icon: Coffee, label: ["New articles every week", "हर हफ़्ते नए लेख"] },
  cta: { href: "/sign-up", label: ["Read the articles", "लेख पढ़ें"] }, note: ["Full articles for members and trial users", "सदस्यों और ट्रायल उपयोगकर्ताओं के लिए पूरे लेख"],
};

export function LandingCoffee({ posts }: Readonly<{ posts: BlogTeaser[] }>) {
  const { language } = useLanguage(); const hi = language === "hi";
  const { overrides } = useContentEditing();
  const section = useContentItem("section:coffee-and-code", "section");
  const shown = posts.filter(post => !overrides[contentKey("blog", post.slug)]?.deleted).map(post => {
    // An edited title or dek from Super Admin replaces the published one.
    const edit = overrides[contentKey("blog", post.slug)]?.fields;
    return { ...post, title: edit?.title ?? post.title, dek: edit?.dek ?? post.dek };
  });
  if (section.hidden || !shown.length) return null;
  const slides = shown.map(post => ({
    id: post.slug, tone: COVERS[post.tone], kicker: post.topic, title: post.title, text: post.dek,
    meta: hi ? `${post.minutes} मिनट पढ़ें` : `${post.minutes} min read`,
    href: `/sign-in?redirect=${encodeURIComponent(`/dashboard/coffee-and-code/${post.slug}`)}`, cta: hi ? "पूरा पढ़ें" : "Read article",
  }));
  return <FeatureSection feature={FEATURE} index={1} total={1} section={section} float={<CoverCarousel slides={slides} label={hi ? "Coffee & Code लेख" : "Coffee & Code articles"} />} />;
}
