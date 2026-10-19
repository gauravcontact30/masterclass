import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { PageIntro } from "../page-intro";
import styles from "../site.module.css";

export const metadata = pageMetadata("/refund-policy");
const UPDATED = "2026-10-12";

export default function RefundPolicyPage() {
  return <>
    <PageIntro path="/refund-policy" eyebrow="Legal" />
    <p className={styles.updated}>Last updated <time dateTime={UPDATED}>12 October 2026</time></p>
    <div className={styles.prose}>
      <h2>Cancelling your membership</h2>
      <ul>
        <li>You can cancel renewal at any time from <Link href="/dashboard/plans">plans in your dashboard</Link>. No cancellation fee applies.</li>
        <li>Cancelling stops future charges. Your access continues until the end of the monthly or yearly period you have already paid for, and then ends.</li>
        <li>Memberships are billed through Razorpay. Cancelling in MasterClass also cancels the payment mandate, so no further amount is debited.</li>
      </ul>
      <h2>When we refund a payment</h2>
      <p>Because access starts as soon as a payment is verified, we do not refund the unused part of a period you cancel partway through. We do refund the full amount when:</p>
      <ul>
        <li><strong>You were charged twice</strong> for the same period, for example by buying a second membership while one was already active.</li>
        <li><strong>Money left your account but membership was not activated</strong>, and we cannot activate it for you.</li>
        <li><strong>A renewal was charged after you cancelled</strong> before the renewal date.</li>
      </ul>
      <h2>How to request a refund</h2>
      <p>Write to us through <Link href="/contact">contact &amp; support</Link> within 30 days of the charge. Include the email address on your account and the Razorpay payment ID from your receipt or bank statement.</p>
      <h2>Refund timeline</h2>
      <p>Approved refunds are issued within 5–7 working days to the original payment method (card, UPI, net banking or wallet). Your bank may take a few more days to show the amount. We will tell you by email when a refund is issued, or why it was declined.</p>
      <h2>Related policies</h2>
      <p>For membership and payment terms, see our <Link href="/terms">terms &amp; conditions</Link>. How we handle payment data is set out in the <Link href="/privacy">privacy policy</Link>.</p>
    </div>
  </>;
}
