import { LearningLoader } from "@/components/learning-loader";

// Full-screen loading state for the routes that read the request (sign-in, subscribe, notes) and so must stream.
// It is deliberately not app/loading.tsx: a root boundary wraps every page, and React streams a large boundary's
// content after its fallback, so the landing and library pages showed this loader until ~400 KB of hidden HTML had
// parsed (LCP ~6 s). Prerendered pages need no boundary and now paint their own HTML at once.
export default function RouteLoading() {
  return <div style={{ display: "grid", placeItems: "center", minHeight: "100dvh", background: "#faf9f5" }}><LearningLoader /></div>;
}
