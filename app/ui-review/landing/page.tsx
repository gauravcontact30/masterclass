import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
export default function LandingReview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LandingPage />;
}
