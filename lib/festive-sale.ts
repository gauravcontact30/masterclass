/** The site-wide festive sale shown on Tech Buzz, Courses and the Tech Buzz share images. */
export interface FestiveSaleInfo {
  title: string;
  festival: string;
  discountPercent: number;
  validTill: string;
  regularMonthly: number;
  discountedMonthly: number;
  regularYearly: number;
  discountedYearly: number;
  active: boolean;
}

export function getDiwaliFestiveSaleInfo(currentTime?: Date | number): FestiveSaleInfo {
  // Epoch ms for 2026-11-15T23:59:59+05:30 = 1794767399000
  const endsAtMs = 1794767399000;
  // If currentTime is provided (e.g., in client useEffect), evaluate active status;
  // otherwise default to true to prevent Next.js prerender error 'new Date() in Client Component'.
  const active = currentTime !== undefined
    ? (typeof currentTime === "number" ? currentTime : currentTime.getTime()) <= endsAtMs
    : true;
  return {
    title: "Diwali Festive Sale",
    festival: "Diwali 2026",
    discountPercent: 25,
    validTill: "15th November",
    regularMonthly: 299,
    discountedMonthly: 225,
    regularYearly: 2999,
    discountedYearly: 2250,
    active
  };
}
