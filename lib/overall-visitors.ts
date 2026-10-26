export type OverallVisitors = {
  totals: { views: number; visitors: number; sessions: number; accounts: number; recent: number; first: string | null; latest: string | null };
  daily: { day: string; views: number; visitors: number; sessions: number }[];
  pages: { path: string; views: number; visitors: number }[];
  sources: { source: string; views: number; visitors: number }[];
  countries: { country: string; views: number; visitors: number }[];
  generatedAt: string;
  retentionDays: number;
};
