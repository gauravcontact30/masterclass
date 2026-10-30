import { redirect } from "next/navigation";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export default function LegacyVocabsPage() {
  redirect("/learning/vocabulary");
}
