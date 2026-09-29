"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import styles from "./super-admin-dashboard.module.css";

/** Keeps portal menus in the console theme, outside the shell's DOM ancestry. */
export function AdminSelect({ id, label, value, onValueChange, options, placeholder, disabled, required }: {
  id?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return <Select items={options} value={value || null} onValueChange={next => { if (next !== null) onValueChange(next); }} disabled={disabled} required={required}>
    <SelectTrigger id={id} aria-label={label} className={styles.selectTrigger}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent align="start" alignItemWithTrigger={false} className={styles.selectMenu}>
      {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      {!options.length && <div className={styles.selectEmpty}>No accounts available</div>}
    </SelectContent>
  </Select>;
}
