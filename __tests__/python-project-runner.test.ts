import {runPythonProject} from '@/lib/python-project-runner';
import type {LearningProject} from '@/lib/api-learning-schema';
const project:LearningProject={title:'Example',template:'python',entry:'/main.py',files:[{path:'/main.py',code:'print(2)'},{path:'/README.md',code:'Run'}],dependencies:{},instructions:['Run']};
test('Python runtime ignores forged messages, uses an isolated worker, and disposes on stop',()=>{
  Object.defineProperty(crypto,'randomUUID',{configurable:true,value:()=> 'test-token'});
  const line=jest.fn(),done=jest.fn();const stop=runPythonProject(project,line,done);
  const frame=document.querySelector('iframe')!;
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  // A classic worker from a blob: URL: the frame's opaque origin cannot start a module worker (lib/python-project-runner.ts).
  expect(frame.srcdoc).toContain("{type:'text/javascript'}");
  expect(frame.srcdoc).toContain('pyodide.js');
  expect(frame.srcdoc).toContain("default-src 'none'");
  window.dispatchEvent(new MessageEvent('message',{source:window,data:{token:'test-token',type:'line',line:'forged'}}));
  expect(line).not.toHaveBeenCalled();
  window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{token:'wrong',type:'line',line:'forged'}}));
  expect(line).not.toHaveBeenCalled();
  window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{token:'test-token',type:'line',line:'2'}}));
  expect(line).toHaveBeenCalledWith('2');
  stop();stop();expect(done).toHaveBeenCalledTimes(1);expect(document.querySelector('iframe')).toBeNull();
});
test('a stalled runtime is terminated by the startup watchdog',()=>{
  jest.useFakeTimers();const line=jest.fn(),done=jest.fn();
  // Startup may download the Python runtime, so the watchdog allows 3 minutes before it gives up.
  runPythonProject(project,line,done);jest.advanceTimersByTime(179_000);expect(done).not.toHaveBeenCalled();jest.advanceTimersByTime(1001);
  expect(done).toHaveBeenCalledTimes(1);expect(line).toHaveBeenCalledWith(expect.stringContaining('time limit'));
  expect(document.querySelector('iframe')).toBeNull();jest.useRealTimers();
});
