import { Award } from "lucide-react";
// Type only: the review table itself stays on the server (lib/tech-buzz-reviews.ts).
import type { ExpertReview } from "@/lib/tech-buzz-reviews";
import styles from "./tech-buzz-review-stars.module.css";

const REVIEW_BYLINE = "Senior full-stack review";
const REVIEW_NOTE = "Rated by Claude (AI) from a senior full-stack engineer's perspective: accuracy, depth, code quality and practical value.";

/** Five stars filled to the review's score (half stars included); the number beside them is what is read out. */
function StarTrack({ stars }: { stars: number }) {
  return <span className={styles.track} aria-hidden="true">★★★★★<span style={{ width: `${(stars / 5) * 100}%` }}>★★★★★</span></span>;
}

const label = (stars: number) => `${REVIEW_BYLINE}: ${stars} out of 5 stars`;

/** The card-sized rating: stars and score, with the one-line verdict as its tooltip. */
export function ReviewStars({ review }: { review?: ExpertReview }) {
  if (!review) return null;
  return <span className={styles.compact} title={`${REVIEW_BYLINE} · ${review.verdict}`}>
    <StarTrack stars={review.stars} />
    <b>{review.stars.toFixed(1)}</b>
    <span className={styles.srOnly}>{label(review.stars)}</span>
  </span>;
}

/** The article-page panel: byline, stars, score and the verdict, with how the rating was made. */
export function ReviewPanel({ review }: { review?: ExpertReview }) {
  if (!review) return null;
  return <aside className={styles.panel} aria-label={label(review.stars)}>
    <p className={styles.head}>
      <Award size={16} aria-hidden="true" />
      <span className={styles.byline}>{REVIEW_BYLINE}</span>
      <StarTrack stars={review.stars} />
      <b className={styles.score}>{review.stars.toFixed(1)}<span>/5</span></b>
    </p>
    <p className={styles.verdict}>{review.verdict}</p>
    <p className={styles.note}>{REVIEW_NOTE}</p>
  </aside>;
}
