import { Sparkles } from "lucide-react";
import { formatPrice, salePrice, type Currency, type Cycle, type SaleInfo } from "@/lib/pricing";
import styles from "./sale-price.module.css";

type Props = { sale?: SaleInfo | null; cycle: Cycle; full: number; currency?: Currency; hi?: boolean; size?: "lg" | "sm"; per?: string };

const endDay = (iso: string, hi: boolean) => new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/**
 * A plan's price with the festive sale applied, everywhere a price is shown: the normal price struck through, the
 * recurring price, and what it renews at. Without a sale for this plan it is the plain price, so callers can use
 * it unconditionally. The sale is a discount on the every payment (lib/server/festive-sale.ts).
 */
export function SalePrice({ sale, cycle, full, currency = "INR", hi = false, size = "lg", per }: Props) {
  const money = (amount: number) => formatPrice(amount, currency, hi);
  const now = salePrice(sale, cycle);
  if (now == null || !sale) return <span className={styles.price} data-size={size}><b>{money(full)}</b>{per && <small>{per}</small>}</span>;
  return <span className={styles.price} data-size={size} data-sale>
    <span className={styles.row}>
      <del aria-label={hi ? `सामान्य मूल्य ${money(full)}` : `Normal price ${money(full)}`}>{money(full)}</del>
      <b>{money(now)}</b>
      <span className={styles.discountTag}>-{sale.percent}%</span>
      {per && <small>{per}</small>}
    </span>
    <span className={styles.note}>{hi
      ? `हर भुगतान पर ${sale.percent}% छूट · नवीनीकरण सहित`
      : `${sale.percent}% off every payment · including renewals`}</span>
  </span>;
}

/** The sale's badge: its name, the discount and when it ends (IST). */
export function SaleBadge({ sale, hi = false, className }: { sale?: SaleInfo | null; hi?: boolean; className?: string }) {
  if (!sale || (salePrice(sale, "monthly") == null && salePrice(sale, "yearly") == null)) return null;
  return <span className={`${styles.badge}${className ? ` ${className}` : ""}`}><Sparkles size={13} aria-hidden="true" />{hi
    ? `${sale.titleHi} · ${sale.percent}% छूट · ${endDay(sale.endsAt, hi)} तक`
    : `${sale.title} · ${sale.percent}% off · ends ${endDay(sale.endsAt, hi)}`}</span>;
}
