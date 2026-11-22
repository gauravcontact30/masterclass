import "server-only";
import { redirect } from "next/navigation";
import { PORTALS } from "@/lib/portal";

/*
 * The pre-split Exams sign-in and sign-up pages (/exams/sign-in, /exams/sign-up) still appear in old links and
 * emails. Board Scholars and Exam Aspirants now have their own pages, so these forward to the portal the requested
 * page belongs to, keeping the query, or to the /exams chooser when the request names no portal.
 */
export async function forwardToPortal(query: { [key: string]: string | string[] | undefined }, page: "signIn" | "signUp"): Promise<never> {
  const target = typeof query.redirect === "string" ? query.redirect : "";
  const portal = target.startsWith(PORTALS.competitive.home) ? "competitive" : target.startsWith(PORTALS.boards.home) ? "boards" : null;
  if (!portal) redirect("/exams");
  const params = new URLSearchParams();
  for (const key of ["redirect", "email", "error"]) { const value = query[key]; if (typeof value === "string") params.set(key, value); }
  const search = params.size ? `?${params}` : "";
  redirect(`${PORTALS[portal][page]}${search}`);
}
