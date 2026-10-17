"use client";
import dynamic from 'next/dynamic';
import { LearningLoader } from "./learning-loader";
import type { LearningProject } from '@/lib/api-learning-schema';
const BrowserProject = dynamic(() => import('./api-browser-project'), {ssr:false,loading:()=><LearningLoader size="inline" label="Loading the code workspace…" />});
const PythonProject = dynamic(() => import('./api-python-project'), {ssr:false,loading:()=><LearningLoader size="inline" label="Loading the Python workspace…" />});
export function ApiProjectWorkspace({project}:{project:LearningProject}) {
  return project.template === 'python' || project.template === 'local' ? <PythonProject project={project}/> : <BrowserProject project={project}/>;
}
