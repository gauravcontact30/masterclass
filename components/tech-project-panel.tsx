"use client";
import { TECH_PROJECTS } from "@/lib/tech-doc-projects";
import { TechProjectEditor } from "./tech-project-editor";

/**
 * A platform's quick-start project, or nothing when it has none. Its own module so components/landing-tech-docs.tsx
 * can load the ~28 KB of project files and the editor with next/dynamic instead of shipping them with the landing page.
 */
export default function TechProjectPanel({ techId }: Readonly<{ techId: string }>) {
  const project = TECH_PROJECTS[techId];
  return project ? <TechProjectEditor project={project} /> : null;
}
