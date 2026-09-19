import { createElement } from "react";
import { Atom, BarChart3, Binary, BookText, Braces, Brain, Bug, Boxes, Clock, Code2, Container, Cpu, Database, Eye, FileCheck2, FileCode2, FileText, FlaskConical, Gauge, GitBranch, Globe, HeartPulse, KeyRound, Layers, Lock, MessageSquareText, MousePointer2, Network, Package, Palette, PlugZap, Radio, Regex, Route, Server, ServerCog, Settings, Share2, ShieldCheck, Sparkles, SplitSquareHorizontal, TerminalSquare, TestTube2, Timer, Type, Volume2, Wand2, Workflow, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "Foundations": Layers, "State & effects": Workflow, "Actions & forms": Braces, "Async UI": Timer, "Server & client": Server,
  "Performance": Gauge, "Modern React": Sparkles, "Routing": Route, "Rendering": Palette, "Data & caching": Database,
  "Mutations": Workflow, "Request handling": Network, "Toolchain": Package, "API routes": Globe, "Navigation": Route,
  "Language core": Code2, "Async JavaScript": Timer, "ES2026 additions": Sparkles, "Shipping JavaScript": ShieldCheck,
  "Compiler": Cpu, "Type system": Type, "Type manipulation": Braces, "Configuration": Settings, "JavaScript interop": FileCode2,
  "Migration": GitBranch,
  "Browser basics": MousePointer2, "Test design": FileCheck2, "Debugging": Bug,
  "Test foundations": TestTube2, "Assertions": ShieldCheck, "Test doubles": Braces, "Async testing": Timer, "Quality": Gauge,
  "Queries": MousePointer2, "Interactions": MessageSquareText, "Async behavior": Timer,
  "Network control": Network, "Runtime foundations": ServerCog, "Modules": Package, "Platform APIs": Server,
  "Networking": Globe, "Operations": Settings, "Architecture": Layers, "HTTP APIs": Route, "Request safety": ShieldCheck,
  "Security": ShieldCheck, "Workplace speaking": MessageSquareText, "Corporate vocabulary": BookText,
  "Professional tone": MessageSquareText, "Synonyms": BookText, "Antonyms": BookText, "Speaking practice": MessageSquareText,
  "Leadership & strategy": Gauge, "Meetings & negotiation": MessageSquareText, "Writing & presentations": FileText,
  "People & culture": Globe, "Business analysis": BarChart3, "Synonyms & precision": BookText, "Antonyms & contrast": GitBranch,
  "Reading vocabulary": BookText, "Writing Task 1": FileText, "Writing Task 2": FileCheck2, "Speaking fluency": MessageSquareText,
  "Listening vocabulary": Volume2, "Environment & climate": Globe, "Education & society": Layers,
  "Science & technology": Cpu, "Health & lifestyle": HeartPulse, "Work & economics": BarChart3,
  "URL hooks": Route, "Navigation hooks": Network, "Layout hooks": Layers, "Observability hooks": Gauge,
  "Connectivity hooks": Globe, "Rules and boundaries": ShieldCheck, "Rules and foundations": ShieldCheck,
  "State hooks": Workflow, "Effect hooks": Timer, "Ref hooks": MousePointer2, "Context hooks": Layers,
  "Action hooks": Braces, "Concurrency hooks": Gauge, "Async hooks": Timer, "External store hooks": Database,
  "Utility hooks": Settings, "Performance hooks": Sparkles, "Testing Hooks": TestTube2,

  // Node.js packages
  "Core modules": Package, "Streams & buffers": Workflow, "Networking modules": Globe,
  "System & process": ServerCog, "Crypto & security": KeyRound, "Testing & diagnostics": TestTube2,
  "Web frameworks": Server, "Middleware": Layers, "Data & ORM": Database, "Utilities & tooling": Settings,

  // Nest.js
  "Core packages": Package, "Module system": Boxes, "Controllers & routing": Route,
  "Providers & DI": PlugZap, "Pipes & validation": FileCheck2, "Guards & auth": ShieldCheck,
  "Interceptors & filters": SplitSquareHorizontal, "Data & persistence": Database,
  "Microservices & transport": Network, "GraphQL & realtime": Share2, "Testing & tooling": TestTube2,

  // Next.js APIs
  "Directives": Sparkles, "Components": Palette, "File conventions": FileCode2,
  "Metadata files": FileText, "Route segment config": Settings, "Server functions": Server,
  "Caching APIs": Timer, "Request APIs": Globe, "Client hooks": Atom,
  "next.config keys": Settings, "Turbopack config": Gauge, "CLI & adapters": TerminalSquare,

  // Python
  "Text & data types": Type, "Collections & algorithms": Boxes, "Files & paths": FileCode2,
  "OS & processes": ServerCog, "Concurrency & async": Timer, "Networking & web": Globe,
  "Data formats": Braces, "Dates & math": Clock, "Testing & typing": TestTube2,
  "Packaging & tooling": Package, "Data & scientific": BarChart3, "ML & AI": Brain,
  "Automation & scraping": Wand2,

  // GraphQL
  "Schema language": Braces, "Execution": Workflow,
  "Server libraries": Server, "Client libraries": MousePointer2, "Federation & gateway": Share2,
  "Code generation": Binary, "Security & performance": Lock,

  // Playwright
  "Core API": Container, "Locators": MousePointer2, "Actions": Radio,
  "Fixtures & hooks": FlaskConical, "Network & mocking": Network,
  "Debugging & tracing": Eye, "Advanced automation": Regex,
};

export function TechnologyCategoryIcon({ category, size = 14, className }: { category: string; size?: number; className?: string }) {
  return createElement(ICONS[category] ?? Code2, { size, className, "aria-hidden": true });
}

export function TechnologyTopicIcon({ category, size = 15, className }: { category: string; size?: number; className?: string }) {
  return createElement(ICONS[category] ?? Code2, { size, className, "aria-hidden": true });
}
