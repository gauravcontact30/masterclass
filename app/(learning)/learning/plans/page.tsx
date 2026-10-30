import { AccountPage } from "../_components/account-page";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "Plans" };
export default function PlansPage() { return <AccountPage tab="plans" />; }
