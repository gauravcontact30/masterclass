/** An open book whose folded pages form an M, with a small guiding star. */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" className={`brand-mark ${className ?? ""}`} aria-hidden="true" focusable="false" fill="none">
    <path d="M5 12c7-1 13 2 19 7 6-5 12-8 19-7v24c-7-1-13 1-19 5-6-4-12-6-19-5V12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
    <path d="M10 8c5 1 10 4 14 9 4-5 9-8 14-9v23c-5 1-10 4-14 8-4-4-9-7-14-8V8Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
    <path d="M24 18v21M15 17v10l5 3M33 17v10l-5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="m24 1 1.7 4.3L30 7l-4.3 1.7L24 13l-1.7-4.3L18 7l4.3-1.7L24 1Z" fill="#d97757"/>
  </svg>;
}
export function Wordmark({ className }: { className?: string }) {
  return <span className={`brand-lockup ${className ?? ""}`}><BrandMark/><span className="brand-name">Master<span className="brand-spark" aria-hidden="true">✦</span><em>Class</em></span></span>;
}
