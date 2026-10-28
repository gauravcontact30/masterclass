import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { EnglishWordSearch } from "@/components/english-word-search";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import styles from "@/components/answer-search.module.css";
import { signInFor } from "@/lib/safe-redirect";

export const metadata = { title: "Vocabulary" };

export default async function VocabularyPage() {
  const authEnabled = authConfigured();
  const user = (authEnabled || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authEnabled && !user) redirect(signInFor("/learning/vocabulary"));

  return <Workspace initialCategory="vocabulary" authEnabled={authEnabled}
    configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<section className={styles.page} aria-labelledby="vocabulary-heading">
      <header className={styles.head}>
        <h1 id="vocabulary-heading">Vocabulary</h1>
        <p>Explore English words and phrases with Hindi meanings, pronunciation, examples, synonyms and antonyms.</p>
      </header>
      <EnglishWordSearch historyKey={`masterclass:vocabulary:${user?.id ?? "guest"}`} />
    </section>} />;
}
