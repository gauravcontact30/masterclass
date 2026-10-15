/** @jest-environment node */
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apiDomainPolicy, isOfficialUrl, searchDomainPolicy } from '@/lib/official-content/domains';
import { officialDraftSchema, verifyDraft, type OfficialDraft } from '@/lib/official-content/card';
import { officialApiDetail, withOfficialCard } from '@/lib/official-content/apply';
import { summaryExplanation } from '@/lib/pro-learn/prepared-explanation';

const page = {
  url: 'https://zod.dev/api#strings',
  text: 'Zod provides a handful of built-in string validations and transforms. To validate a string against a regular expression, use z.string().regex(). The trim method removes leading and trailing whitespace before the value is checked. Refinements are run after parsing succeeds, so they never see invalid input.',
};
const policy = searchDomainPolicy('Zod validation libraries', [{ url: 'https://zod.dev/' }]);

function draft(overrides: Partial<OfficialDraft> = {}): OfficialDraft {
  return officialDraftSchema.parse({
    found: true, sourceUrl: 'https://zod.dev/api#strings', sourceTitle: 'Defining schemas', summary: 'String schemas validate and transform text.',
    explanation: 'A string schema checks the type first, then each validation in order.', syntax: 'z.string().regex(pattern)', parameters: [], returns: 'ZodString',
    keyPoints: [
      { text: 'Use regex() to require a pattern.', evidence: 'validate a string against a regular expression' },
      { text: 'trim() strips surrounding spaces before checks run.', evidence: 'removes leading and trailing whitespace' },
      { text: 'Refinements only run on input that already parsed.', evidence: 'Refinements are run after parsing succeeds' },
      { text: 'Made-up claim.', evidence: 'this sentence is not on the page' },
    ],
    gotchas: [], example: { title: 'Slug', code: 'z.string().regex(/^[a-z-]+$/)', language: 'ts', explanation: 'Accepts lowercase slugs.' },
    useCases: [{ title: 'Form input', scenario: 'Validate a username field.' }], related: ['z.email'], since: '',
    ...overrides,
  });
}

test('only official hosts pass, and open tabs still refuse blogs', () => {
  expect(isOfficialUrl('https://zod.dev/api', policy)).toBe(true);
  expect(isOfficialUrl('https://medium.com/zod', policy)).toBe(false);
  expect(isOfficialUrl('http://zod.dev/api', policy)).toBe(false);
  const open = searchDomainPolicy('Node.js Packages — Modules, Libraries & Middleware');
  expect(isOfficialUrl('https://expressjs.com/en/api.html', open)).toBe(true);
  expect(isOfficialUrl('https://www.geeksforgeeks.org/express', open)).toBe(false);
  expect(searchDomainPolicy('React 19+ Hooks — State, Effects & Actions')).toEqual({ allowed: ['react.dev'] });
  expect(apiDomainPolicy({ id: 'neon', docs: 'https://neon.tech/docs' })).toEqual({ allowed: ['neon.tech', 'neon.com'] });
});

test('verification drops unsupported points and keeps the supported ones', () => {
  const result = verifyDraft(draft(), [page], policy, new Date('2026-10-15'));
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.card.keyPoints).toHaveLength(3);
  expect(result.dropped).toEqual([{ text: 'Made-up claim.', reason: 'evidence_not_on_page' }]);
  expect(result.card.checkedAt).toBe('2026-10-15');
  expect(JSON.stringify(result.card)).not.toContain('evidence');
});

test('a card is rejected when its source is unofficial, unfetched or thinly supported', () => {
  expect(verifyDraft(draft({ sourceUrl: 'https://dev.to/zod' }), [page], policy)).toMatchObject({ ok: false, reason: 'source_not_official' });
  expect(verifyDraft(draft({ sourceUrl: 'https://zod.dev/other' }), [page], policy)).toMatchObject({ ok: false, reason: 'source_not_fetched' });
  expect(verifyDraft(draft({ found: false }), [page], policy)).toMatchObject({ ok: false });
  const thin = draft();
  thin.keyPoints = thin.keyPoints.slice(2);
  expect(verifyDraft(thin, [page], policy)).toMatchObject({ ok: false, reason: 'only_1_verified_points' });
});

test('points copied word for word from the page are dropped', () => {
  const copied = draft();
  copied.keyPoints[0] = { text: 'Zod provides a handful of built-in string validations and transforms to validate a string', evidence: 'validate a string against a regular expression' };
  const result = verifyDraft(copied, [page], policy);
  expect(result.dropped).toContainEqual(expect.objectContaining({ reason: 'copied_verbatim' }));
});

test('over-long prose is clipped instead of failing the card', () => {
  expect(draft({ summary: 'x'.repeat(900) }).summary).toHaveLength(500);
});

test('a card adds to the prepared answer and API reference without mutating them', () => {
  const result = verifyDraft(draft(), [page], policy);
  if (!result.ok) throw new Error(result.reason);
  const prepared = summaryExplanation('String validation', 'Validate strings with Zod.', 'Schemas');
  prepared.answer.keyPoints = ['Authored point.'];
  const merged = withOfficialCard(prepared, result.card);
  expect(prepared.answer.keyPoints).toEqual(['Authored point.']);
  expect(merged.answer.keyPoints[0]).toBe('Authored point.');
  expect(merged.answer.keyPoints).toContain('Use regex() to require a pattern.');
  expect(merged.answer.steps.map(step => step.title)).toEqual(['How it works', 'Syntax', 'Slug']);
  expect(merged.sources?.[0]).toEqual({ title: 'Defining schemas', url: 'https://zod.dev/api#strings' });

  const base = { packageName: 'zod', description: 'Catalogue text', signature: '', parameters: [], returns: '', notes: [], useCases: [], code: '', language: 'typescript' as const, source: 'https://zod.dev', related: ['z.number'] };
  const detail = officialApiDetail(result.card, base);
  expect(detail).toMatchObject({ description: 'String schemas validate and transform text.', source: 'https://zod.dev/api#strings', language: 'typescript', related: ['z.email', 'z.number'] });
});

test('the server loader reads a tab file and ignores malformed cards', async () => {
  const root = mkdtempSync(join(tmpdir(), 'official-'));
  mkdirSync(join(root, 'content', 'official', 'search'), { recursive: true });
  const result = verifyDraft(draft(), [page], policy);
  if (!result.ok) throw new Error(result.reason);
  writeFileSync(join(root, 'content', 'official', 'search', 'zod-validation-libraries.json'), JSON.stringify({ 'Schemas::String validation': result.card, 'Schemas::Broken': { summary: 1 } }));
  const cwd = jest.spyOn(process, 'cwd').mockReturnValue(root);
  jest.resetModules();
  const { officialSearchCard } = await import('@/lib/server/official-content');
  expect(officialSearchCard('Zod validation libraries', 'Schemas', 'String validation')?.sourceUrl).toBe('https://zod.dev/api#strings');
  expect(officialSearchCard('Zod validation libraries', 'Schemas', 'Broken')).toBeUndefined();
  expect(officialSearchCard('Redux', 'Schemas', 'String validation')).toBeUndefined();
  cwd.mockRestore();
});
