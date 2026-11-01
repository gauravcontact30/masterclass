import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination for a row of pills or a table (landing page, Super Admin reports): previous, numbered pages, next and "1–6 of 25". Unstyled: the
 * caller's CSS module styles it through `className` (its buttons, `[aria-current="page"]` and `span`), so it matches
 * the section it sits in. Previous and next wrap around, so the row can be browsed in either direction. `always` keeps
 * it on screen when everything fits on one page (arrows disabled), so a table shows how many rows it holds.
 */
export function PillPager({ page, pages, total, perPage, onPage, label, noun, controls, className, always = false }: Readonly<{
  page: number; pages: number; total: number; perPage: number; onPage: (page: number) => void;
  label: string; noun: string; controls?: string; className?: string; always?: boolean;
}>) {
  if (total < 1 || (pages < 2 && !always)) return null;
  const single = pages < 2;
  const from = page * perPage + 1, to = Math.min((page + 1) * perPage, total);
  return <nav className={className} aria-label={label}>
    <button type="button" onClick={() => onPage((page - 1 + pages) % pages)} aria-label={`Previous ${noun}`} aria-controls={controls} disabled={single}><ChevronLeft size={15} aria-hidden="true" /></button>
    {Array.from({ length: pages }, (_, at) => <button type="button" key={at} aria-current={at === page ? "page" : undefined} aria-label={`${label}, page ${at + 1}`} aria-controls={controls} onClick={() => onPage(at)}>{at + 1}</button>)}
    <button type="button" onClick={() => onPage((page + 1) % pages)} aria-label={`Next ${noun}`} aria-controls={controls} disabled={single}><ChevronRight size={15} aria-hidden="true" /></button>
    <span role="status">{from}–{to} of {total}</span>
  </nav>;
}
