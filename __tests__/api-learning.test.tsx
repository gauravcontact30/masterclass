import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {API_DETAILS} from '@/lib/api-docs-details';
import {API_PACKAGES} from '@/lib/api-docs';
import {enrichApiLearning} from '@/lib/api-learning';
import {apiDetailSchema} from '@/lib/pro-learn/types';
import {learningProjectSchema} from '@/lib/api-learning-schema';
import {ApiInterviewPractice} from '@/components/api-interview-practice';
import ts from 'typescript';
import path from 'node:path';

test.each(Object.entries(API_DETAILS))('curated %s has a complete project and all learning sections', (key,base)=>{
  const [packageId,name]=key.split(':');
  const pkg=API_PACKAGES.find(item=>item.id===packageId)!;
  const entry=pkg.entries.find(item=>item.name===name)!;
  const detail=apiDetailSchema.parse(enrichApiLearning(pkg,entry,base));
  expect(detail.project).not.toBeNull();
  expect(detail.project!.files.some(file=>file.path===detail.project!.entry)).toBe(true);
  expect(detail.vocabulary.every(item=>item.meaning&&item.sentence&&item.synonyms.length&&item.antonyms.length)).toBe(true);
  expect(detail.subjective.length).toBeGreaterThanOrEqual(3);
  expect(detail.objective.length).toBeGreaterThan(0);
  for (const file of detail.project!.files.filter(file=>/\.[jt]sx?$/.test(file.path))) {
    const compiled=ts.transpileModule(file.code,{fileName:file.path,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,experimentalDecorators:true}});
    expect(compiled.diagnostics?.filter(item=>item.category===ts.DiagnosticCategory.Error)).toEqual([]);
    for (const match of file.code.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
      const target=path.posix.resolve(path.posix.dirname(file.path),match[1]);
      expect(detail.project!.files.some(candidate=>[target,...['.ts','.tsx','.js','.jsx','.json'].map(ext=>target+ext)].includes(candidate.path))).toBe(true);
    }
  }
});

test('project validation rejects path traversal, missing entry, and aliases of duplicate files',()=>{
  const base={title:'test',template:'python',entry:'/main.py',files:[{path:'/main.py',code:'print(1)'},{path:'/README.md',code:'Run'}],dependencies:{},instructions:['Run']};
  expect(learningProjectSchema.safeParse({...base,entry:'/missing.py'}).success).toBe(false);
  expect(learningProjectSchema.safeParse({...base,files:[...base.files,{path:'/../secret',code:''}]}).success).toBe(false);
  expect(learningProjectSchema.safeParse({...base,files:[...base.files,{path:'main.py',code:''}]}).success).toBe(false);
});

test('interview practice reveals explanatory feedback and subjective answers',async()=>{
  const pkg=API_PACKAGES.find(item=>item.id==='react')!;
  const detail=enrichApiLearning(pkg,pkg.entries.find(item=>item.name==='useState')!,API_DETAILS['react:useState']);
  render(<ApiInterviewPractice detail={detail}/>);
  const user=userEvent.setup();
  await user.click(screen.getByRole('radio',{name:detail.objective[0].options[1]}));
  expect(screen.getByRole('status')).toHaveTextContent('Try reviewing this concept');
  await user.click(screen.getByRole('radio',{name:detail.objective[0].options[0]}));
  expect(screen.getByRole('status')).toHaveTextContent('Correct.');
  await user.click(screen.getByText(detail.subjective[0].question));
  expect(screen.getByText(detail.subjective[0].answer,{exact:false})).toBeVisible();
});
