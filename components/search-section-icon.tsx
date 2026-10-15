import { createElement } from "react";
import {
  Atom, BookText, Bug, BrainCircuit, Braces, Boxes, Cloud, FileCode2, Layers, MousePointer2,
  Route, ServerCog, Share2, TestTube2, Type, Zap, Calculator, FlaskConical, Shield,
  GraduationCap, Trophy, School, Wrench, Leaf, Landmark, Gavel, Palette, BriefcaseBusiness, Link2, GitBranch, Activity, Workflow, Container,
  Table, ClipboardList, Rocket, List, Database, KeyRound, ShieldCheck, UserCog, Blocks, Ship,
  CirclePlay, Webhook, Repeat, ShieldAlert, CreditCard, ClipboardCheck, Settings2, Network, Package, RefreshCw, Waypoints,
  type LucideIcon,
} from "lucide-react";

/**
 * The mark on a search-section tab.
 *
 * The tab strip names whole catalogues — "Popular AWS services", "Jest",
 * "Python handbook" — not the categories inside them, so the per-category
 * resolvers cannot answer here. Matching runs on the handbook title because
 * that is the only stable identifier a handbook carries; the order matters,
 * since "Next.js Packages" and "Python Packages" both say "Packages" and the
 * technology has to win over the word it shares.
 */
const BY_TITLE: [RegExp, LucideIcon][] = [
  // The platform handbooks. These sit first because several of them contain a
  // word a later rule also claims — "TanStack Router" would otherwise be
  // caught by the Next.js routing rule, and "Conform - Validation libraries"
  // shares "libraries" with the package handbooks.
  [/^tanstack query/i, RefreshCw],
  [/^tanstack form/i, ClipboardList],
  [/^tanstack table/i, Table],
  [/^tanstack router/i, Route],
  [/^tanstack start/i, Rocket],
  [/^tanstack virtual/i, List],
  [/^prisma/i, Database],
  [/^drizzle/i, Database],
  [/^neon/i, Database],
  [/^upstash/i, Zap],
  [/^redis/i, Zap],
  [/auth\.js|kinde/i, KeyRound],
  [/^betterauth|^better auth/i, ShieldCheck],
  [/^clerk/i, UserCog],
  [/^terraform/i, Blocks],
  [/^kubernetes/i, Ship],
  [/^github actions/i, CirclePlay],
  [/^webhook/i, Webhook],
  [/^inngest/i, Repeat],
  [/^arcjet/i, ShieldAlert],
  [/^payment gateway/i, CreditCard],
  [/^conform/i, ClipboardCheck],
  [/^t3 environment/i, Settings2],
  [/^system design/i, Network],
  [/^uv package manager/i, Package],
  [/^zod/i, ClipboardCheck],
  [/^zustand/i, Boxes],
  [/^redux/i, Workflow],
  [/^modern full-stack/i, Layers],
  [/^langchain/i, Link2],
  [/^langgraph/i, GitBranch],
  [/^langsmith/i, Activity],
  [/^langflow/i, Waypoints],
  [/^n8n/i, Workflow],
  [/^docker/i, Container],
  [/^devops/i, Cloud],
  [/^agentic ai/i, BrainCircuit],
  [/^maths$/i, Calculator],
  [/^physics$/i, Atom],
  [/^chemistry$/i, FlaskConical],
  [/government.*defence|defence.*government/i, Shield],
  [/diploma|polytechnic/i, Wrench],
  [/talent|olympiad/i, Trophy],
  [/navodaya/i, School],
  [/engineering.*technology/i, GraduationCap],
  [/medical.*sciences/i, Leaf],
  [/humanities/i, Landmark],
  [/^law$/i, Gavel],
  [/design.*architecture/i, Palette],
  [/civil services/i, BriefcaseBusiness],
  [/^popular aws/i, Cloud],
  [/^ai terms/i, BrainCircuit],
  [/react testing library/i, MousePointer2],
  [/playwright/i, MousePointer2],
  [/cypress/i, Bug],
  [/vitest/i, Zap],
  [/jest/i, TestTube2],
  [/nest\.js/i, Boxes],
  [/node\.js/i, ServerCog],
  [/next\.js/i, Route],
  [/typescript/i, Type],
  [/javascript/i, Braces],
  [/react/i, Atom],
  [/graphql/i, Share2],
  [/python/i, FileCode2],
  [/english/i, BookText],
];

export function SearchSectionIcon({ title, size = 14, className }: { title: string; size?: number; className?: string }) {
  const found = BY_TITLE.find(([pattern]) => pattern.test(title));
  return createElement(found?.[1] ?? Layers, { size, className, "aria-hidden": true });
}
