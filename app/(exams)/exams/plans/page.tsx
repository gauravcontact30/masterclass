import { redirect } from "next/navigation";

/** The pre-split Exams plans page. Each exam portal now has its own membership, so this sends readers to the /exams chooser. */
export default function Page() { redirect("/exams"); }
