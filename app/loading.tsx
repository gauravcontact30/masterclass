import { LearningLoader } from "@/components/learning-loader";

// App-wide loading state for any page that waits on the server during navigation. Prerendered pages such as the
// landing page paint their own HTML on a direct visit, so this only appears while a new page is on its way.
export default function Loading() {
  return <div style={{ display: "grid", placeItems: "center", minHeight: "100dvh", background: "#faf9f5" }}><LearningLoader /></div>;
}
