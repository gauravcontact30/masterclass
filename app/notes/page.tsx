import { redirect } from "next/navigation";

/** Preserve bookmarked searches while keeping Notes inside the dashboard. */
export default async function NotesRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) value.forEach(item => query.append(key, item));
  }
  redirect(`/learning/notes${query.size ? `?${query}` : ""}`);
}
