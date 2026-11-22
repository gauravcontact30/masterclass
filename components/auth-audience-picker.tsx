"use client";
import Link from "@/components/site-link";
import type { ReactNode } from "react";
import { Briefcase, Check, Compass, GraduationCap, Landmark } from "lucide-react";
import { useIndiaAccess } from "./audience-provider";
import { useLanguage } from "./language-provider";
import { PORTALS, type Portal } from "@/lib/portal";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import styles from "./auth-audience-picker.module.css";

/** One option's inside: tinted icon tile, title over its note, and a check that shows on the active option. */
const Option = ({ icon, title, note, tone }: { icon: ReactNode; title: ReactNode; note: ReactNode; tone: "tech" | "boards" | "government" }) => <>
  <span className={styles.icon} data-tone={tone} aria-hidden="true">{icon}</span>
  <span className={styles.text}>{title}<small>{note}</small></span>
  <span className={styles.check} aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
</>;
/** Target exams offered at Exam Aspirants sign-up; the id is the Competitive Exams tab it opens. */
const TARGETS: [string, string][] = [
  ["nda", "NDA / NA"], ["defence", "Defence / CDS / AFCAT / Agniveer"], ["banks", "Banks / IBPS / SBI / RBI"], ["railways", "Railways / RRB"],
  ["ssc", "SSC / CGL / CHSL / MTS"], ["upsc", "IAS / UPSC Civil Services"], ["state-psc", "PCS / State PSC"], ["cbi", "CBI / Intelligence Bureau"],
  ["income-tax", "Income Tax / CBIC / GST"], ["police", "Police / CAPF"], ["insurance", "LIC / Insurance"], ["tet", "TET / Teaching"],
];

/** A labelled shadcn Select whose value lives in the destination's query string. */
function Choice({ id, label, value, items, onChange }: { id: string; label: string; value: string; items: [string, string][]; onChange: (value: string) => void }) {
  return <Field className={styles.choice}>
    <FieldLabel htmlFor={id} className={styles.choiceLabel}>{label}</FieldLabel>
    <Select items={items.map(([value, label]) => ({ value, label }))} value={value} onValueChange={next => { if (next) onChange(String(next)); }}>
      <SelectTrigger id={id} className={styles.trigger}><SelectValue /></SelectTrigger>
      <SelectContent align="start">{items.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
    </Select>
  </Field>;
}

/**
 * The three portals, each a separate account: Tech Pro (worldwide), Board Scholars and Exam Aspirants (India only).
 * The current portal is marked; the others link to their own sign-in or sign-up. Board Scholars also asks for the
 * board and class, Exam Aspirants for the target exam, so the first visit opens the right tab.
 */
export function AuthAudiencePicker({ mode, portal, destination, onDestination }: { mode: "signin" | "signup"; portal: Portal; destination: string; onDestination: (path: string) => void }) {
  const india = useIndiaAccess(); const { language } = useLanguage(); const hi = language === "hi";
  const page = mode === "signin" ? "signIn" : "signUp";
  const query = new URL(destination, "https://example.invalid").searchParams;
  const change = (key: string, value: string) => { query.set(key, value); onDestination(`${PORTALS[portal].home}?${query}`); };
  const door = (id: Portal, option: ReactNode) => id === portal
    ? <span aria-current="page" data-active="">{option}</span>
    : <Link href={PORTALS[id][page]}>{option}</Link>;
  return <div className={styles.picker}>
    <p className={styles.eyebrow}><Compass size={13} strokeWidth={2.2} aria-hidden="true" />{hi ? "अपना पोर्टल चुनें" : "Choose your portal"}</p>
    <nav aria-label="Portals">
      {door("tech", <Option tone="tech" icon={<Briefcase size={16} strokeWidth={2} />} title="Tech Pro" note={hi ? "टेक पेशेवर, कॉलेज विद्यार्थी और IT कर्मचारी · दुनिया भर" : "Tech professionals, college students & IT employees · Worldwide"} />)}
      {(india || portal !== "tech") && <>
        {door("boards", <Option tone="boards" icon={<GraduationCap size={16} strokeWidth={2} />} title="Board Scholars" note={hi ? "कक्षा 10 और 12 · UP Board / CBSE / ICSE" : "Class 10 & 12 · UP Board / CBSE / ICSE / ISC"} />)}
        {door("competitive", <Option tone="government" icon={<Landmark size={16} strokeWidth={2} />} title="Exam Aspirants" note={hi ? "सरकारी और प्रतियोगी परीक्षाएँ · NDA, बैंक, रेलवे, SSC, UPSC" : "Govt. & competitive exams · NDA, Banks, Railways, SSC, UPSC"} />)}
      </>}
    </nav>
    {portal === "boards" && <div className={styles.options}>
      <Choice id="auth-board" label={hi ? "आपका बोर्ड" : "Your board"} value={query.get("board") ?? "up"} items={[["up", "UP Board"], ["cbse", "CBSE"], ["icse", "ICSE / ISC"]]} onChange={value => change("board", value)} />
      <Choice id="auth-class" label={hi ? "आपकी कक्षा" : "Your class"} value={query.get("class") ?? "10"} items={[["10", hi ? "कक्षा 10" : "Class 10"], ["12", hi ? "कक्षा 12" : "Class 12"]]} onChange={value => change("class", value)} />
    </div>}
    {portal === "competitive" && <div className={styles.options}>
      <Choice id="auth-exam" label={hi ? "आपका लक्ष्य" : "Your target exam"} value={query.get("exam") ?? "nda"} items={TARGETS} onChange={value => change("exam", value)} />
    </div>}
    {portal !== "tech" && <FieldDescription className={styles.hint}>{hi ? "हर पोर्टल का खाता अलग है, अपने ट्रायल और सदस्यता के साथ। एक ही ईमेल से तीनों में जुड़ सकते हैं।" : "Each portal is a separate account with its own trial and membership. You can join all three with the same email."}</FieldDescription>}
  </div>;
}
