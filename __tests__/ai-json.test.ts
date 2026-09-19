/** @jest-environment node */
import {z} from 'zod';
import {validatedAiJson} from '@/lib/server/ai-json';
import {apiDetailSchema} from '@/lib/pro-learn/types';
import {API_DETAILS} from '@/lib/api-docs-details';
import {API_PACKAGES} from '@/lib/api-docs';
import {enrichApiLearning} from '@/lib/api-learning';

test('model receives real field limits and repairs a schema-invalid response',async()=>{
  const schema=z.object({title:z.string().max(12)});
  const generate=jest.fn().mockResolvedValueOnce('{"title":"A title that is too long"}').mockResolvedValueOnce('{"title":"Ready"}');
  await expect(validatedAiJson(schema,'Write a title',generate)).resolves.toEqual({title:'Ready'});
  expect(generate).toHaveBeenCalledTimes(2);
  expect(generate.mock.calls[0][0]).toContain('"maxLength":12');
  expect(generate.mock.calls[1][0]).toContain('title: too_big');
  expect(generate.mock.calls[1][0]).not.toContain('A title that is too long');
});
test('invalid JSON and truncated output get only one correction attempt',async()=>{
  const generate=jest.fn().mockRejectedValueOnce(new Error('truncated')).mockResolvedValueOnce('```json\n{"ok":true}\n```');
  await expect(validatedAiJson(z.object({ok:z.boolean()}),'Generate',generate)).resolves.toEqual({ok:true});
  const broken=jest.fn().mockResolvedValue('not JSON');
  await expect(validatedAiJson(z.object({ok:z.boolean()}),'Generate',broken)).rejects.toBeInstanceOf(SyntaxError);
  expect(broken).toHaveBeenCalledTimes(2);
});
test('provider failures and cancellation are not retried as invalid content',async()=>{
  const generate=jest.fn().mockRejectedValue(new Error('provider unavailable'));
  await expect(validatedAiJson(z.object({ok:z.boolean()}),'Generate',generate)).rejects.toThrow('provider unavailable');
  expect(generate).toHaveBeenCalledTimes(1);
  const cancelled=new AbortController();cancelled.abort();generate.mockClear();
  await expect(validatedAiJson(z.object({ok:z.boolean()}),'Generate',generate,cancelled.signal)).rejects.toThrow();
  expect(generate).not.toHaveBeenCalled();
});
test('complete reference schema serializes and validates the built-in usePathname project',async()=>{
  const pkg=API_PACKAGES.find(item=>item.id==='nextjs')!;
  const detail=enrichApiLearning(pkg,pkg.entries.find(item=>item.name==='usePathname')!,API_DETAILS['nextjs:usePathname']);
  const generate=jest.fn().mockResolvedValue(JSON.stringify(detail));
  const result=await validatedAiJson(apiDetailSchema,'Reference',generate);
  expect(result.project?.files.find(file=>file.path==='/app/page.tsx')?.code).toContain('export default PathnameExample;');
});
