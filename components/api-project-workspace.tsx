"use client";
import dynamic from 'next/dynamic';
import type { LearningProject } from '@/lib/api-learning-schema';
const BrowserProject = dynamic(() => import('./api-browser-project'), {ssr:false,loading:()=><p role="status">Loading code workspace…</p>});
const PythonProject = dynamic(() => import('./api-python-project'), {ssr:false,loading:()=><p role="status">Loading Python workspace…</p>});
export function ApiProjectWorkspace({project}:{project:LearningProject}) {
  return project.template === 'python' || project.template === 'local' ? <PythonProject project={project}/> : <BrowserProject project={project}/>;
}
