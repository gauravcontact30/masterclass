import { AccordionSummary } from "@/components/ui/accordion-chevron";
import Link from "next/link";
import { SiteContactLinks } from "@/components/site-contact-links";
import { ADDRESS_LINE, SUPPORT } from "@/lib/site-contact";
import { faqSchema, pageMetadata } from "@/lib/seo";
import { HINDI_ENABLED } from "@/lib/i18n";
import { PageIntro } from "../page-intro";
import styles from "../site.module.css";

export const metadata = pageMetadata("/contact");

const FAQ = [
  { question: "How do I start learning?", answer: "Create an account, choose the exams, school classes or courses you are preparing for, and your dashboard opens with those paths ready." },
  // Only while Hindi is switched on: the site is English-only otherwise.
  ...(HINDI_ENABLED ? [{ question: "Is the content available in Hindi?", answer: "Yes. Study notes and most of the interface are available in English and Hindi, and you can switch language at any time." }] : []),
  { question: "How does the membership work?", answer: "Membership is billed monthly or yearly. Access starts after your payment is verified. You can cancel renewal from the Membership page and keep access until the end of the paid period." },
  { question: "Where are my notes and bookmarks saved?", answer: "Revision notes and bookmarks are saved in your browser on the device you use. Clearing browser data removes them." },
  { question: "What if a topic I need is not covered yet?", answer: "Guide coverage varies by path. Check the courses page before subscribing, and use the Study Buddy assistant for questions outside the published guides." },
] as const;

export default function ContactPage() {
  return <>
    <PageIntro path="/contact" eyebrow="Help & support" extraSchema={faqSchema(FAQ)} />
    <div className={styles.prose}>
      <h2>Get in touch</h2>
      <p>Reach our support team by email or phone. When you write about your account, include the email address you signed up with so we can find it quickly.</p>
      <ul>
        <li><strong>Email:</strong> <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a></li>
        <li><strong>Phone:</strong> <a href={SUPPORT.phoneHref}>{SUPPORT.phone}</a></li>
        <li><strong>Address:</strong> <address style={{ display: "inline", fontStyle: "normal" }}>{ADDRESS_LINE}</address></li>
      </ul>
      <p>Signed-in members can also ask the Study Buddy assistant from any dashboard page, and manage billing from the Membership page.</p>
      <ul>
        <li><strong>Account and sign-in:</strong> <Link href="/sign-in">sign in</Link> or <Link href="/sign-up">create an account</Link>.</li>
        <li><strong>Membership and billing:</strong> open <Link href="/learning/plans">plans in your dashboard</Link>.</li>
        <li><strong>What each path covers:</strong> see <Link href="/courses">courses</Link>.</li>
      </ul>
      <h2>Follow us</h2>
      <p>Find MasterClass Buddy on Instagram.</p>
      <SiteContactLinks socialOnly labelled />
      <h2>Frequently asked questions</h2>
      <div className={styles.faq}>{FAQ.map(item => <details key={item.question}><AccordionSummary>{item.question}</AccordionSummary><p>{item.answer}</p></details>)}</div>
    </div>
  </>;
}
