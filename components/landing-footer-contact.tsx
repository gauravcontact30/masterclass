"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarSync, Check, Copy, CreditCard, Mail, MapPin, MessageCircleHeart, Phone, ReceiptText, ShieldCheck, Undo2 } from "lucide-react";
import { ADDRESS, ADDRESS_LINE, SOCIAL_PROFILES, SUPPORT } from "@/lib/site-contact";
import { EmailLink } from "./email-link";
import { SocialMark } from "./site-contact-links";
import styles from "./landing-footer-contact.module.css";

/** A small copy button: "Copied" for two seconds, silent where the clipboard is unavailable. */
function CopyValue({ value, label }: Readonly<{ value: string; label: string }>) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(timer); }, [copied]);
  return <button type="button" className={styles.copy} aria-label={copied ? `${label} copied` : `Copy ${label}`} title={`Copy ${label}`} onClick={() => { void navigator.clipboard?.writeText(value).then(() => setCopied(true), () => undefined); }}>
    {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}<span className={styles.copied} aria-live="polite">{copied ? "Copied" : ""}</span>
  </button>;
}

/**
 * The landing footer's contact details as one light panel on the dark footer (user request 2026-11-01): a heading,
 * then email, phone, Instagram and the postal address in a ruled grid (each with its own tinted icon and action), and
 * the plans as the panel's closing strip. Details come from lib/site-contact.ts, shared with the Contact page and the
 * structured data, so they never disagree. Compact (2026-11-01): the plans link sits in the header, details in one row.
 */
export function LandingFooterContact() {
  const instagram = SOCIAL_PROFILES.find(item => item.platform === "Instagram");
  const handle = instagram ? `@${instagram.href.replace(/\/+$/, "").split("/").at(-1)}` : null;
  return <section className={styles.panel} aria-labelledby="footer-contact-title">
    <header className={styles.head}>
      <span className={styles.badge} aria-hidden="true"><MessageCircleHeart size={16} /></span>
      <div>
        <h3 data-h2="" id="footer-contact-title">Get in touch</h3>
        <p>Questions about a course, billing or your account? Write, call or message us.</p>
      </div>
      <Link className={styles.cta} href="/learning/plans">See plans<ArrowRight size={14} aria-hidden="true" /></Link>
    </header>
    <ul className={styles.grid}>
      <li data-tone="mint">
        <span className={styles.icon} aria-hidden="true"><Mail size={15} /></span>
        <div className={styles.info}><small>Email</small><EmailLink /></div>
        <CopyValue value={SUPPORT.email} label="email address" />
      </li>
      <li data-tone="sky">
        <span className={styles.icon} aria-hidden="true"><Phone size={15} /></span>
        <div className={styles.info}><small>Phone</small><a href={SUPPORT.phoneHref}>{SUPPORT.phone}</a></div>
        <CopyValue value={SUPPORT.phone} label="phone number" />
      </li>
      {instagram && <li data-tone="rose">
        <span className={styles.icon} aria-hidden="true"><SocialMark platform="Instagram" size={15} /></span>
        <div className={styles.info}><small>Instagram</small><a href={instagram.href} target="_blank" rel="noopener noreferrer me" aria-label={`MasterClass Buddy on Instagram, ${handle} (opens in a new tab)`}>{handle}</a></div>
        <ArrowUpRight size={15} className={styles.out} aria-hidden="true" />
      </li>}
      <li data-tone="butter">
        <span className={styles.icon} aria-hidden="true"><MapPin size={15} /></span>
        <div className={styles.info}><small>Postal address</small><address>{ADDRESS.streetAddress}, {ADDRESS.addressLocality}, {ADDRESS.addressRegion} {ADDRESS.postalCode}, India</address></div>
        <CopyValue value={ADDRESS_LINE} label="address" />
      </li>
    </ul>
  </section>;
}

/**
 * The footer's right-hand card, in the same style as "Get in touch" (user request 2026-11-01): what to know about the
 * membership before paying, none of it repeated from the contact card or the link columns. Every line restates
 * app/(site)/refund-policy and the billing setup (Razorpay, charged in INR, prices shown in the visitor's currency) and
 * the weekly turnover (lib/ist-week.ts); change them together.
 */
export function LandingFooterFacts() {
  return <section className={styles.panel} aria-labelledby="footer-facts-title">
    <header className={styles.head}>
      <span className={styles.badge} aria-hidden="true"><ShieldCheck size={16} /></span>
      <div>
        <h3 data-h2="" id="footer-facts-title">Plans and payments</h3>
        <p>What to know before you join, in four lines.</p>
      </div>
      <Link className={styles.cta} href="/sign-up">Sign up free<ArrowRight size={14} aria-hidden="true" /></Link>
    </header>
    <ul className={styles.grid}>
      <li data-tone="mint">
        <span className={styles.icon} aria-hidden="true"><CalendarSync size={15} /></span>
        <div className={styles.info}><small>Fresh every week</small><p>New content every Monday at 00:00 IST, across every category in one membership.</p></div>
      </li>
      <li data-tone="sky">
        <span className={styles.icon} aria-hidden="true"><CreditCard size={15} /></span>
        <div className={styles.info}><small>Secure payments</small><p>Billed through Razorpay by card, UPI, net banking or wallet. Charged in INR, shown in your currency.</p></div>
      </li>
      <li data-tone="rose">
        <span className={styles.icon} aria-hidden="true"><Undo2 size={15} /></span>
        <div className={styles.info}><small>Cancel any time</small><p>No fee. Renewal stops, and access lasts to the end of the period you paid for.</p></div>
      </li>
      <li data-tone="butter">
        <span className={styles.icon} aria-hidden="true"><ReceiptText size={15} /></span>
        <div className={styles.info}><small>Refunds</small><p>Charged in error? Write within 30 days; approved refunds arrive in 5–7 working days.</p></div>
        <Link className={styles.copy} href="/refund-policy" aria-label="Read the refund policy" title="Refund policy"><ArrowUpRight size={14} aria-hidden="true" /></Link>
      </li>
    </ul>
  </section>;
}
