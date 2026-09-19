"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExpandedText } from "@/components/expanded-text";

import { useState } from "react";
import { PREPARATIONS, PREPARATION_GROUPS, CATEGORY_LABELS } from "@/lib/study/preparations";
import { useLanguage } from "./language-provider";
import styles from "./study.module.css";

export function PreparationPicker({ value, onChange, disabled = false }: { value: string[]; onChange: (ids: string[]) => void; disabled?: boolean }) {
  const { language } = useLanguage(); const hi = language === "hi";
  const [search, setSearch] = useState("");
  return <section className={styles.picker} aria-label={hi ? "तैयारी चुनें" : "Choose your preparation"}>
    <h3><ExpandedText text={hi ? "आप किस परीक्षा या कोर्स की तैयारी कर रहे हैं?" : "What are you preparing for?"} /></h3>
    <p><ExpandedText text={hi ? "केवल आपकी चुनी हुई तैयारी डैशबोर्ड पर दिखेगी। बाद में इसे बदल सकते हैं।" : "Your dashboard will show only your selections. You can update them later."} /></p>
    <Label className={styles.search}><ExpandedText text={hi ? "परीक्षा, बोर्ड, कक्षा या कोर्स खोजें" : "Find an exam, board, class or course"} /><Input type="search" value={search} onChange={event => setSearch(event.target.value)} /></Label>
    <div className={styles.pickerScroll}>{PREPARATION_GROUPS.map(group => {
      const options = PREPARATIONS.filter(option => (group.categories as readonly string[]).includes(option.category) && `${option.label.en} ${option.label.hi} ${CATEGORY_LABELS[option.category]?.[language]}`.toLowerCase().includes(search.toLowerCase()));
      return options.length ? <fieldset key={group.id} disabled={disabled}><legend><ExpandedText text={group.label[language]} /></legend><div className={styles.choices}>{options.map(option => <Label key={option.id} className={value.includes(option.id) ? styles.chosen : ""}><Checkbox disabled={disabled} checked={value.includes(option.id)} onCheckedChange={checked => onChange(checked ? [...value, option.id] : value.filter(id => id !== option.id))} /><span><ExpandedText text={option.label[language]} /></span></Label>)}</div></fieldset> : null;
    })}</div><p role="status">{value.length} <ExpandedText text={hi ? "चयनित" : "selected"} /></p>
  </section>;
}
