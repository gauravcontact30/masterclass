/** /api/landing/search-index: the dashboard Search page's handbook topics, compact: each topic is [name, category index, handbook index]. */
export type LandingSearchIndex = {
  handbooks: { title: string; logo: string | null; topics: number }[];
  categories: string[];
  topics: [string, number, number][];
};
