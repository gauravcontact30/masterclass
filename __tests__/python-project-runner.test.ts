import {runPythonProject} from '@/lib/python-project-runner';
import type {LearningProject} from '@/lib/api-learning-schema';
const project:LearningProject={title:'Example',template:'python',entry:'/main.py',files:[{path:'/main.py',code:'print(2)'},{path:'/README.md',code:'Run'}],dependencies:{},instructions:['Run']};
test('Python runtime ignores forged messages, uses an isolated module worker, and disposes on stop',()=>{
  Object.defineProperty(crypto,'randomUUID',{configurable:true,value:()=> 'test-token'});
  const line=jest.fn(),done=jest.fn();const stop=runPythonProject(project,line,done);
  const frame=document.querySelector('iframe')!;
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  expect(frame.srcdoc).toContain("{type:'module'}");
  expect(frame.srcdoc).toContain('pyodide.mjs');
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
  runPythonProject(project,line,done);jest.advanceTimersByTime(90001);
  expect(done).toHaveBeenCalledTimes(1);expect(line).toHaveBeenCalledWith(expect.stringContaining('time limit'));
  expect(document.querySelector('iframe')).toBeNull();jest.useRealTimers();
});
