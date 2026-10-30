import { AccountPage } from "../_components/account-page";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "My library" };
export default function LibraryPage() { return <AccountPage tab="library" />; }
