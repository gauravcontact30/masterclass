-- Notes-only library. Learning materials are in-app notes; the PDF and PPTX
-- formats are retired (lib/server/repository.ts no longer lists them).
--
-- Adds the technologies introduced by the hand-authored notes guides
-- (lib/generation/guides) and one topic per guide, matching each guide's
-- technologyId/topicId so the library can name them and search them. Same
-- shape as 0004/0006/0008, which scripts/prepare-catalog-preview.mjs parses.
-- Every topic's references point at the official documentation the guide is
-- grounded in.
insert into public.technologies(id,title,title_hi,category) values
  ('vitest','Vitest','Vitest','Testing'),
  ('zustand','Zustand','Zustand','Web development'),
  ('tanstack-start','TanStack Start','TanStack Start','Web development'),
  ('devops','DevOps services','DevOps सेवाएँ','Tooling')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,category=excluded.category;

insert into public.topics(id,technology_id,title,title_hi,full_track,"references") values
  ('python-notes','python','Python: from first steps to Python 3.14','Python: पहले कदम से Python 3.14 तक',false,'["https://docs.python.org/3/tutorial/index.html","https://docs.python.org/3/whatsnew/3.14.html"]'),
  ('claude-skills-plugins-mcp','claude','Claude Skills, Plugins and MCP','Claude Skills, Plugins और MCP',false,'["https://code.claude.com/docs/en/skills","https://code.claude.com/docs/en/plugins","https://modelcontextprotocol.io/docs/learn/architecture"]'),
  ('llm-context-loop-memory','ai','LLMs, MCP, context, loop engineering and memory','LLM, MCP, कॉन्टेक्स्ट, लूप इंजीनियरिंग और मेमोरी',false,'["https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents","https://code.claude.com/docs/en/agent-sdk/agent-loop","https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool"]'),
  ('jest-30','jest','Jest 30: unit testing JavaScript and TypeScript','Jest 30: JavaScript और TypeScript की यूनिट टेस्टिंग',false,'["https://jestjs.io/docs/getting-started","https://jestjs.io/blog/2025/06/04/jest-30"]'),
  ('rtl-queries-user-event','rtl','Queries, user-event and async UI','क्वेरी, user-event और एसिंक UI',false,'["https://testing-library.com/docs/queries/about","https://testing-library.com/docs/user-event/intro"]'),
  ('vitest-5','vitest','Vitest 5: fast testing powered by Vite','Vitest 5: Vite पर आधारित तेज़ टेस्टिंग',true,'["https://vitest.dev/guide/","https://vitest.dev/guide/browser/"]'),
  ('playwright-automation','playwright','Playwright and browser automation','Playwright और ब्राउज़र ऑटोमेशन',false,'["https://playwright.dev/docs/intro","https://playwright.dev/docs/locators"]'),
  ('nextjs-hooks','nextjs','Next.js 16+ Hooks','Next.js 16+ Hooks',false,'["https://nextjs.org/docs/app/api-reference/functions/use-router","https://nextjs.org/docs/app/api-reference/functions/use-search-params"]'),
  ('react-19-hooks','react','React 19+ Hooks, one by one','React 19+ Hooks, एक-एक करके',false,'["https://react.dev/reference/react/hooks"]'),
  ('zustand-5','zustand','Zustand 5: small, fast React state','Zustand 5: छोटा, तेज़ React स्टेट',true,'["https://zustand.docs.pmnd.rs/getting-started/introduction"]'),
  ('es2026','javascript','JavaScript ES2026: every new feature','JavaScript ES2026: हर नई सुविधा',false,'["https://tc39.es/process-document/","https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sumPrecise"]'),
  ('typescript-7','typescript','TypeScript 7: the native compiler and modern types','TypeScript 7: नेटिव कंपाइलर और आधुनिक टाइप',false,'["https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/","https://www.typescriptlang.org/tsconfig/"]'),
  ('aws-popular-services','aws','AWS: the popular services, explained','AWS: लोकप्रिय सेवाएँ, सरल भाषा में',false,'["https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html"]'),
  ('devops-services','devops','DevOps services: from commit to production','DevOps सेवाएँ: कमिट से प्रोडक्शन तक',true,'["https://dora.dev/guides/dora-metrics-four-keys/","https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions"]'),
  ('tanstack-start','tanstack-start','TanStack Start: full-stack React with TanStack Router','TanStack Start: TanStack Router के साथ फ़ुल-स्टैक React',true,'["https://tanstack.com/start/latest/docs/framework/react/overview"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
