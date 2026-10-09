export type SourceSnapshot = {
  url: string;
  title: string;
  text: string;
  retrievedAt: string;
  hash: string;
};

export type DocumentationUpdate = {
  id: string;
  title: string;
  officialUrl: string;
  checkedAt: string | null;
  importedAt: string | null;
  status: "unchecked" | "available" | "changed" | "current" | "error";
  error?: string;
};

export type DocumentationRecord = {
  checkedAt: string;
  importedAt: string | null;
  published: SourceSnapshot | null;
  pending: SourceSnapshot;
};

export const DOCS_CHECK_INTERVAL = 6 * 60 * 60 * 1000;
