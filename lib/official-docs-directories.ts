import aws from "./official-docs-aws-index.json";
import git from "./official-docs-git-index.json";
import { popularityRank } from "./generation/guides/aws-popularity";
import { AGENTIC_AI_TOPICS } from "./pro-learn/automation-handbooks/agentic-ai";
import { SYSTEM_DESIGN_HANDBOOKS } from "./pro-learn/platform-handbooks/system-design";

export type ReferenceEntry = { name: string; category: string; summary: string; url: string; kind: string; points?: string[] };
export type ReferenceDirectory = { title: string; note: string; sourceUrl: string; entries: ReferenceEntry[] };

// Present service guides before API details. Rank before pagination so searching
// and category filtering preserve the same curated popularity order.
const rankedAws = [...aws].sort((a, b) =>
  Number(a.name.includes("(retired)")) - Number(b.name.includes("(retired)"))
  || Number(a.kind === "API reference") - Number(b.kind === "API reference")
  || popularityRank(a.name) - popularityRank(b.name)
  || a.name.localeCompare(b.name));

const reactHooks: [string, string, string][] = [
  ["useState", "State", "Store a value and schedule an update."], ["useReducer", "State", "Centralize state transitions in a reducer."],
  ["useContext", "Context", "Read a provider's current value."], ["useRef", "Refs", "Retain a mutable value or access a DOM element."],
  ["useImperativeHandle", "Refs", "Control the methods exposed through a ref."], ["useEffect", "Effects", "Synchronize with an external system and clean up subscriptions."],
  ["useLayoutEffect", "Effects", "Measure layout before the browser paints."], ["useInsertionEffect", "Effects", "Insert library-managed styles before layout effects."],
  ["useEffectEvent", "Effects", "Read current values from nonreactive logic called by an effect (React 19.2+)."],
  ["useMemo", "Performance", "Cache a calculation between renders."], ["useCallback", "Performance", "Keep a function reference stable while dependencies match."],
  ["useTransition", "Performance", "Track and schedule nonurgent updates."], ["useDeferredValue", "Performance", "Let a slower UI follow a changing value."],
  ["useId", "Accessibility", "Generate IDs for related accessible elements."], ["useDebugValue", "Libraries", "Label a custom hook in DevTools."],
  ["useSyncExternalStore", "Libraries", "Subscribe to state managed outside React."], ["useActionState", "Actions", "Track an action result and pending state."],
  ["useOptimistic", "Actions", "Show an optimistic value while an action completes."],
];
const nextHooks: [string, string, string][] = [
  ["use-router", "useRouter", "Navigate, replace history, refresh, or prefetch from a Client Component."],
  ["use-pathname", "usePathname", "Read the pathname without the query string."],
  ["use-search-params", "useSearchParams", "Read URL query parameters; wrap static consumers in Suspense."],
  ["use-params", "useParams", "Read dynamic route parameter values."],
  ["use-selected-layout-segment", "useSelectedLayoutSegment", "Read the active segment one level below a layout."],
  ["use-selected-layout-segments", "useSelectedLayoutSegments", "Read active segments below a layout, including nested routes."],
  ["use-link-status", "useLinkStatus", "Read pending navigation state in a descendant of Link; import from next/link."],
  ["use-report-web-vitals", "useReportWebVitals", "Report real browser performance measurements from next/web-vitals."],
];

export const DOCS_DIRECTORIES: Record<string, ReferenceDirectory> = {
  aws: { title: "AWS services & API directory", note: `${aws.length} references: ${aws.filter(entry => entry.kind === "Service guide").length} service guides and ${aws.filter(entry => entry.kind === "API reference").length} SDK/API references, grouped by purpose. Multiple APIs can belong to one service. Snapshot: 27 September 2026; check current availability in the official documentation.`, sourceUrl: "https://docs.aws.amazon.com/boto3/latest/reference/services/", entries: rankedAws },
  git: { title: "Git command directory", note: "157 command entries from Git's official command classification list, including porcelain and plumbing. Availability depends on the installed version and build; use git help -a for your installation. Snapshot: 27 September 2026.", sourceUrl: "https://github.com/git/git/blob/master/command-list.txt", entries: git },
  "react-hooks": { title: "React hook reference", note: "Browse built-in hooks by purpose. React DOM's useFormStatus is included separately; use is a related React API, not a conventional hook.", sourceUrl: "https://react.dev/reference/react/hooks", entries: [
    ...reactHooks.map(([name, category, summary]) => ({ name, category, summary, kind: "React hook", url: `https://react.dev/reference/react/${name}` })),
    { name: "useFormStatus", category: "Actions", summary: "Read the pending status of the nearest parent form.", kind: "React DOM hook", url: "https://react.dev/reference/react-dom/hooks/useFormStatus" },
    { name: "use", category: "Related APIs", summary: "Read a promise or context resource during rendering; promise reads can suspend.", kind: "React API", url: "https://react.dev/reference/react/use" },
  ] },
  "nextjs-hooks": { title: "Next.js App Router hook reference", note: "Client-side hooks for Next.js 16+. React hooks used in Next.js are documented in the separate React Hooks guide.", sourceUrl: "https://nextjs.org/docs/app/api-reference/functions", entries: nextHooks.map(([slug, name, summary]) => ({ name, summary, category: name === "useReportWebVitals" ? "Performance" : "Navigation", kind: "Next.js hook", url: `https://nextjs.org/docs/app/api-reference/functions/${slug}` })) },
  "agentic-ai": { title: "Agentic AI concept directory", note: "A structured learning map from foundations to production. This field has no single official specification; use the linked framework documentation alongside these original study notes.", sourceUrl: "https://docs.langchain.com/oss/python/langgraph/overview", entries: AGENTIC_AI_TOPICS.map(topic => ({ name: topic.name, category: topic.category, summary: topic.summary, points: topic.points, kind: "Concept", url: "https://docs.langchain.com/oss/python/langgraph/overview" })) },
  "system-design": { title: "System design learning map", note: "Requirements, data, scaling, and reliability organized around engineering decisions. The AWS Builders' Library provides further reading, not a universal system-design standard.", sourceUrl: "https://aws.amazon.com/builders-library/", entries: SYSTEM_DESIGN_HANDBOOKS.flatMap(book => book.topics.map(topic => ({ name: topic.name, category: topic.category, summary: topic.summary, points: topic.points, kind: "Design concept", url: "https://aws.amazon.com/builders-library/" }))) },
};
