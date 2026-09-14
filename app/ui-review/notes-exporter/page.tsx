import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesExporter } from "@/app/components/NotesExporter";

// The parent ui-review layout already marks everything under it noindex.
export const metadata: Metadata = { title: "Notes exporter" };

/**
 * Internal harness for the artistic-notes pipeline (/api/generate/*). Gated
 * exactly like the sibling /ui-review page: available under `next dev` only.
 * The endpoints themselves still require a signed-in session.
 */
export default function NotesExporterReview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className="min-h-screen bg-[#0b0b10] px-4 py-10 text-zinc-100 sm:px-8 lg:px-12">
      <NotesExporter />
    </main>
  );
}
