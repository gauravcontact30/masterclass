import { ResetPasswordPage } from "@/components/reset-password-page";
import { privateMetadata } from "@/lib/seo";

export const metadata = { ...privateMetadata, title: "Reset password" };
// The session is read in the browser, so the prerendered shell is the same for everyone.
export default function Page() { return <ResetPasswordPage />; }
