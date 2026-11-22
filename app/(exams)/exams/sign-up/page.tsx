import { forwardToPortal } from "@/lib/server/exam-forward";

/** The pre-split Exams sign-up page: forwards to the sign-up of the portal the requested page belongs to, or to /exams. */
export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await forwardToPortal(await searchParams, "signUp");
}
