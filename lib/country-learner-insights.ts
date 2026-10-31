/*
 * What learners from a country usually look for on a coding-and-AI learning platform like this one, for the Live
 * visitor stream's "Learner origin" column (components/super-admin-overview-live.tsx). This is general market
 * guidance written for the super admin (31 Oct 2026), not something measured from the visitor: the card labels it so.
 * Countries without their own entry fall back to their region's profile.
 */
export type LearnerInsight = {
  /** Who typically arrives from here. */
  profile: string;
  /** What they come looking for, most common first. */
  lookingFor: string[];
  /** What they expect from a learning platform before paying. */
  expects: string[];
  /** One thing this platform can do for them. */
  tip: string;
  currency: string;
};

type Region = "southAsia" | "northAmerica" | "anglo" | "westEurope" | "eastEurope" | "eastAsia" | "southeastAsia" | "latam" | "middleEast" | "africa" | "cis" | "global";

const REGIONS: Record<Region, Omit<LearnerInsight, "currency">> = {
  southAsia: {
    profile: "Students and early-career developers preparing for jobs, and freelancers selling skills abroad.",
    lookingFor: ["Interview and placement prep (DSA, system design)", "Job-ready full-stack and AI projects for a résumé", "Freelancing skills for remote clients"],
    expects: ["Affordable local pricing and local payment methods", "Mobile-first pages that work on slow data", "Certificates they can show employers", "Plain-English (or Hinglish) explanations"],
    tip: "Lead with interview prep, the free trial and certificates; keep pages light for mobile data.",
  },
  northAmerica: {
    profile: "Working developers upskilling into AI engineering, and career switchers from other fields.",
    lookingFor: ["LLMs, agents and RAG in production", "Senior-level system design", "Portfolio projects that prove skill"],
    expects: ["Concise, current content with runnable code", "Card / Apple Pay checkout in USD", "A free trial before committing", "Credible authorship and up-to-date versions"],
    tip: "Show the AI and agent tracks and Tech Buzz depth first; they judge quality in the first minute.",
  },
  anglo: {
    profile: "Professional developers and bootcamp graduates looking to move up or into AI work.",
    lookingFor: ["AI engineering and agent frameworks", "Interview prep for product companies", "Cloud and backend depth"],
    expects: ["Prices in their own currency", "Clear refund and privacy terms", "Structured paths rather than loose articles", "Certificates for CVs and LinkedIn"],
    tip: "Make the structured learning paths and certificates obvious from the landing page.",
  },
  westEurope: {
    profile: "Experienced engineers who read in English and value depth and correctness.",
    lookingFor: ["Backend architecture and data engineering", "AI/LLM integration done properly", "Comparisons of tools and frameworks"],
    expects: ["GDPR-grade privacy and clear data terms", "Thorough, accurate material with sources", "Euro pricing and SEPA or card payment", "No dark patterns in checkout"],
    tip: "The API Reference and tool comparisons suit them; keep privacy wording prominent.",
  },
  eastEurope: {
    profile: "Strong engineers, many in outsourcing, upskilling for remote work with Western clients.",
    lookingFor: ["Modern stacks clients ask for (Next.js, AI agents, cloud)", "System design for senior roles", "English technical vocabulary"],
    expects: ["Fair pricing for local purchasing power", "Depth over motivational content", "Hands-on projects", "Content that keeps up with new releases"],
    tip: "Regional pricing and the hands-on tracks matter more than marketing copy here.",
  },
  eastAsia: {
    profile: "Detail-oriented developers who often prefer content in their own language.",
    lookingFor: ["Precise reference material", "AI and data tooling", "Well-structured courses"],
    expects: ["High polish and accuracy", "Native-language support or very clear English", "Local payment options"],
    tip: "English-only content is a hurdle: concise, well-structured reference pages work best.",
  },
  southeastAsia: {
    profile: "Students and developers in growing tech and outsourcing hubs, mostly on mobile.",
    lookingFor: ["Job-ready web and AI skills", "Freelancing and remote-work skills", "Beginner-friendly paths"],
    expects: ["Low prices or purchasing-power discounts", "Mobile-first, low-data pages", "Certificates", "Local wallets or cards"],
    tip: "Keep the mobile experience fast and point them to beginner-friendly tracks.",
  },
  latam: {
    profile: "Developers aiming at remote jobs with US companies (nearshoring), many self-taught.",
    lookingFor: ["Skills US employers hire for", "English technical interviews", "AI and full-stack projects"],
    expects: ["Purchasing-power pricing", "Spanish or Portuguese support, or very plain English", "Practical, project-based learning"],
    tip: "Interview prep and portfolio projects aimed at remote roles fit them best.",
  },
  middleEast: {
    profile: "A mix of strong local tech scenes and expatriate professionals.",
    lookingFor: ["AI engineering", "Cloud and security", "Leadership-level system design"],
    expects: ["Professional, current content", "Certificates", "Card payment in USD or local currency"],
    tip: "Senior and AI tracks are the draw; keep checkout simple.",
  },
  africa: {
    profile: "Fast-growing developer communities targeting remote and freelance work.",
    lookingFor: ["Job-ready web development", "Remote and freelance skills", "AI fundamentals"],
    expects: ["Very affordable pricing", "Pages that work on expensive mobile data", "Certificates", "Mobile money or card payment"],
    tip: "Light pages and an obvious free trial matter most.",
  },
  cis: {
    profile: "Technically strong developers, often reading in Russian, moving to international work.",
    lookingFor: ["Modern frameworks and AI", "System design", "English for technical interviews"],
    expects: ["Regional pricing", "Depth and accuracy", "Payment options that work locally"],
    tip: "Clear, technical English and the reference material serve them best.",
  },
  global: {
    profile: "Developers and learners reading the site in English.",
    lookingFor: ["AI engineering and agents", "Full-stack skills", "Interview prep"],
    expects: ["A free trial", "Up-to-date, runnable examples", "Prices in their own currency"],
    tip: "Point them to the most-read tracks and the free trial.",
  },
};

const REGION_OF: Record<string, Region> = {
  IN: "southAsia", PK: "southAsia", BD: "southAsia", NP: "southAsia", LK: "southAsia", BT: "southAsia", MV: "southAsia",
  US: "northAmerica", CA: "northAmerica",
  GB: "anglo", IE: "anglo", AU: "anglo", NZ: "anglo",
  DE: "westEurope", FR: "westEurope", NL: "westEurope", BE: "westEurope", SE: "westEurope", NO: "westEurope", DK: "westEurope", FI: "westEurope", CH: "westEurope", AT: "westEurope", IT: "westEurope", ES: "westEurope", PT: "westEurope", LU: "westEurope",
  PL: "eastEurope", UA: "eastEurope", HU: "eastEurope", BG: "eastEurope", RO: "eastEurope", CZ: "eastEurope", SK: "eastEurope", RS: "eastEurope", HR: "eastEurope", LT: "eastEurope", LV: "eastEurope", EE: "eastEurope", SI: "eastEurope", MD: "eastEurope", GR: "eastEurope",
  JP: "eastAsia", KR: "eastAsia", CN: "eastAsia", TW: "eastAsia", HK: "eastAsia",
  VN: "southeastAsia", PH: "southeastAsia", ID: "southeastAsia", MY: "southeastAsia", TH: "southeastAsia", SG: "southeastAsia", KH: "southeastAsia", MM: "southeastAsia",
  BR: "latam", MX: "latam", AR: "latam", CL: "latam", CO: "latam", PE: "latam", UY: "latam", EC: "latam", VE: "latam", BO: "latam", CR: "latam", GT: "latam", DO: "latam",
  IL: "middleEast", AE: "middleEast", SA: "middleEast", QA: "middleEast", KW: "middleEast", BH: "middleEast", OM: "middleEast", JO: "middleEast", TR: "middleEast", EG: "middleEast",
  NG: "africa", KE: "africa", ZA: "africa", GH: "africa", ET: "africa", UG: "africa", TZ: "africa", RW: "africa", MA: "africa",
  KZ: "cis", RU: "cis", BY: "cis", UZ: "cis", KG: "cis", AZ: "cis", AM: "cis", GE: "cis",
};

/** Countries with traffic of their own get notes on top of their region's profile. */
const COUNTRY: Record<string, Partial<Omit<LearnerInsight, "currency">>> = {
  IN: {
    profile: "The platform's core audience: college students, freshers and working developers in India, mostly on phones.",
    lookingFor: ["Placement and interview prep (DSA, system design, HR rounds)", "Full-stack and AI projects for a résumé", "Switching from service companies to product companies", "Short daily study that fits around college or work"],
    expects: ["INR pricing with UPI (already live via Razorpay)", "A free trial before paying", "Certificates for LinkedIn and résumés", "Hinglish-friendly explanations (Hindi is not enabled yet)", "Short sessions that fit around college or work hours"],
    tip: "Lead with interview prep, the 1-day trial and UPI checkout; keep mobile pages fast.",
  },
  US: { tip: "The largest paying market for AI engineering content: show agent and LLM tracks first and keep checkout to one step." },
  NP: { expects: ["Very affordable pricing", "Content that works on mobile data", "Certificates", "Hindi-friendly explanations help many readers"] },
  BD: { lookingFor: ["Freelancing skills (Upwork, Fiverr)", "Job-ready web development", "Interview prep"] },
  PK: { lookingFor: ["Freelancing skills (Upwork, Fiverr)", "Full-stack and AI projects", "Interview prep for remote roles"] },
  DE: { expects: ["Thorough, accurate material", "Strict privacy (GDPR) and clear imprint/terms", "Euro pricing", "Recognised certificates"] },
  JP: { expects: ["Japanese-language content is strongly preferred", "Very high accuracy and polish", "Local payment options"] },
};

/** The currency a country's visitors think in, for the card's hint. */
const CURRENCY: Record<string, string> = {
  IN: "INR", US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "NZD", IE: "EUR", DE: "EUR", FR: "EUR", NL: "EUR", BE: "EUR", IT: "EUR", ES: "EUR", PT: "EUR", AT: "EUR", FI: "EUR", LU: "EUR", GR: "EUR", SK: "EUR", SI: "EUR", LT: "EUR", LV: "EUR", EE: "EUR", HR: "EUR",
  SE: "SEK", NO: "NOK", DK: "DKK", CH: "CHF", PL: "PLN", UA: "UAH", HU: "HUF", BG: "BGN", RO: "RON", CZ: "CZK", RS: "RSD", MD: "MDL",
  JP: "JPY", KR: "KRW", CN: "CNY", TW: "TWD", HK: "HKD", VN: "VND", PH: "PHP", ID: "IDR", MY: "MYR", TH: "THB", SG: "SGD",
  BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", IL: "ILS", AE: "AED", SA: "SAR", TR: "TRY", EG: "EGP",
  NG: "NGN", KE: "KES", ZA: "ZAR", GH: "GHS", KZ: "KZT", RU: "RUB", PK: "PKR", BD: "BDT", NP: "NPR", LK: "LKR",
};

export function learnerInsight(country: string | null | undefined): LearnerInsight {
  const code = (country ?? "").toUpperCase();
  const base = REGIONS[REGION_OF[code] ?? "global"], own = COUNTRY[code] ?? {};
  return { ...base, ...own, currency: CURRENCY[code] ?? "USD" };
}
