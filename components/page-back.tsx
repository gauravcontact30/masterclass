"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "@/components/site-link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/*
 * "Back to …" at the top left of every page but the landing page (user rule 2026-11-02). It goes up to the page this one
 * belongs under, which works the same however the visitor arrived, including from a shared link. The strip's height is
 * reserved in the prerendered HTML and its text comes after hydration, so it never moves the page.
 */
const LABELS: Record<string, string> = {
  "/": "Home", "/about": "About", "/api-reference": "API Reference", "/compare": "Comparisons", "/contact": "Contact", "/courses": "Courses",
  "/interview-questions": "Interview Questions", "/learn": "Handbooks", "/library": "Free Library", "/tech-buzz": "Tech Buzz", "/vocabulary": "Vocabulary", "/workflows": "Workflow Blueprints",
  "/learning": "Learning Dashboard", "/learning/api-docs": "API Docs", "/learning/coffee-and-code": "Coffee & Code", "/learning/lessons": "Lessons", "/super-admin": "Super Admin",
};
/** Dynamic pages that have children of their own. */
const DYNAMIC_PARENTS = [/^\/api-reference\/[^/]+$/];
const titled = (segment: string) => decodeURIComponent(segment).replace(/[-_]+/g, " ").replace(/^\w/, letter => letter.toUpperCase());

/** The nearest page above this one; a page with no parent of its own goes to the dashboard or the home page. */
function parentOf(path: string) {
  let parent = path.replace(/\/+$/, "");
  while (parent.includes("/")) {
    parent = parent.slice(0, parent.lastIndexOf("/")) || "/";
    if (parent === "/") break;
    if (LABELS[parent] || DYNAMIC_PARENTS.some(pattern => pattern.test(parent))) break;
  }
  if (path === "/super-admin") return "/learning";
  return parent;
}

const never = () => () => {};

function BackLink() {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(never, () => true, () => false);
  if (!hydrated || !pathname || pathname === "/") return null;
  const parent = parentOf(pathname);
  return <Link href={parent} prefetch={false} className="page-back-link">
    <ArrowLeft size={15} aria-hidden="true" />Back to {LABELS[parent] ?? titled(parent.slice(parent.lastIndexOf("/") + 1))}
  </Link>;
}

export function PageBack() {
  return <nav className="page-back-strip" aria-label="Back"><Suspense fallback={null}><BackLink /></Suspense></nav>;
}
