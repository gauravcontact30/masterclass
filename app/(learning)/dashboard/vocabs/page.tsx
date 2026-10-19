import { redirect } from "next/navigation";

export default function LegacyVocabsPage() {
  redirect("/dashboard/vocabulary");
}
