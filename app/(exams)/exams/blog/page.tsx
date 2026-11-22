import { redirect } from "next/navigation";

/** The pre-split Exams blog. Each exam portal now has its own blog, so this sends readers to the /exams chooser. */
export default function Page() { redirect("/exams"); }
