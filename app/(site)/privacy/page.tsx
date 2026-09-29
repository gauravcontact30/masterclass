import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { PageIntro } from "../page-intro";
import styles from "../site.module.css";

export const metadata = pageMetadata("/privacy");
const UPDATED = "2026-09-24";

export default function PrivacyPage() {
  return <>
    <PageIntro path="/privacy" eyebrow="Legal" />
    <p className={styles.updated}>Last updated <time dateTime={UPDATED}>24 September 2026</time></p>
    <div className={styles.prose}>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address and sign-in information, handled by our authentication provider (Supabase).</li>
        <li><strong>Learning choices:</strong> the exams, classes and courses you select, and the progress needed to show your dashboard.</li>
        <li><strong>Payment records:</strong> membership status and payment references. Card and UPI details are entered with our payment processor (Razorpay) and never reach our servers.</li>
        <li><strong>Questions you ask the AI assistant:</strong> the text of your question and the answer, so the assistant can respond.</li>
        <li><strong>Technical data:</strong> basic logs such as request times and errors, used to keep the service reliable and to limit abuse.</li>
      </ul>
      <h2>What stays in your browser</h2>
      <p>Revision notes, bookmarks, your language choice and similar preferences are stored in your browser&apos;s local storage on your device. We do not receive them. Clearing your browser data deletes them.</p>
      <h2>How we use your data</h2>
      <ul>
        <li>To create and secure your account and let you sign in.</li>
        <li>To show the study paths you chose and unlock content you have paid for.</li>
        <li>To process and verify membership payments and renewals.</li>
        <li>To answer questions you send to the AI assistant.</li>
        <li>To diagnose errors and protect the service from misuse.</li>
      </ul>
      <p>We do not sell your personal data, and we do not use it for third-party advertising.</p>
      <h2>Service providers</h2>
      <p>We share only what each provider needs to do its job: Supabase (authentication and database), Razorpay (payments), and AI model providers such as Anthropic and Perplexity (to generate answers to questions you ask). Each processes data under its own privacy terms.</p>
      <h2>Cookies</h2>
      <p>We use essential cookies to keep you signed in. We do not use advertising cookies.</p>
      <h2>Your choices</h2>
      <ul>
        <li>You can ask us to access, correct or delete your account data.</li>
        <li>You can cancel your membership renewal at any time from the Membership page.</li>
        <li>You can clear locally stored notes and bookmarks from your browser settings.</li>
      </ul>
      <h2>Children</h2>
      <p>Some paths are designed for school students. If you are under 18, use MasterClass with the involvement of a parent or guardian, who should review this policy with you.</p>
      <h2>Changes and contact</h2>
      <p>If we change this policy we will update the date above. For privacy requests, see <Link href="/contact">contact &amp; support</Link>.</p>
    </div>
  </>;
}
