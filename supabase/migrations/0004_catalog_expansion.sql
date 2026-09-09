-- Expands the learning catalogue behind the two dashboard dropdowns.
-- Technologies group by `category`, which generation-form.tsx renders as
-- <optgroup> labels; topics hang off technology_id and filter client-side.
-- Existing rows are updated rather than skipped so React/Next.js pick up their
-- version-qualified titles.
insert into public.technologies(id,title,title_hi,category) values
  ('react','React 19+','React 19+','Web development'),
  ('nextjs','Next.js 16+','Next.js 16+','Web development'),
  ('tailwind','Tailwind CSS v4','Tailwind CSS v4','Web development'),
  ('node','Node.js','Node.js','Web development'),
  ('javascript','JavaScript','JavaScript','Languages'),
  ('typescript','TypeScript','TypeScript','Languages'),
  ('python','Python','Python','Languages'),
  ('java','Java','Java','Languages'),
  ('jest','Jest','Jest','Testing'),
  ('rtl','React Testing Library','React Testing Library','Testing'),
  ('playwright','Playwright','Playwright','Testing'),
  ('claude','Claude','Claude','AI tools'),
  ('claude-code','Claude Code','Claude Code','AI tools'),
  ('prompting','Prompt engineering','प्रॉम्प्ट इंजीनियरिंग','AI tools'),
  ('ai','AI fundamentals','AI की बुनियाद','AI tools'),
  ('sql','SQL','SQL','Data'),
  ('postgres','PostgreSQL','PostgreSQL','Data'),
  ('supabase','Supabase','Supabase','Data'),
  ('git','Git & GitHub','Git और GitHub','Tooling'),
  ('docker','Docker','Docker','Tooling')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,category=excluded.category;

-- Exactly one full_track row per technology (the "complete path"), then the
-- narrower topics a learner picks when they want one idea rather than a course.
insert into public.topics(id,technology_id,title,title_hi,full_track,"references") values
  ('react-full','react','Complete React 19 path','पूरा React 19 पाठ्यक्रम',true,'["https://react.dev/learn"]'),
  ('react-state','react','Components, props and state','कंपोनेंट, props और state',false,'["https://react.dev/learn/state-a-components-memory"]'),
  ('react-hooks','react','Hooks in depth','Hooks विस्तार से',false,'["https://react.dev/reference/react/hooks"]'),
  ('react-actions','react','Actions and useActionState','Actions और useActionState',false,'["https://react.dev/reference/react/useActionState"]'),
  ('react-server','react','Server Components and use()','Server Components और use()',false,'["https://react.dev/reference/rsc/server-components"]'),
  ('react-perf','react','Rendering performance','रेंडरिंग प्रदर्शन',false,'["https://react.dev/learn/render-and-commit"]'),

  ('nextjs-full','nextjs','Complete Next.js 16 path','पूरा Next.js 16 पाठ्यक्रम',true,'["https://nextjs.org/docs/app"]'),
  ('nextjs-routing','nextjs','Routing and layouts','राउटिंग और लेआउट',false,'["https://nextjs.org/docs/app/getting-started/layouts-and-pages"]'),
  ('nextjs-fetching','nextjs','Data fetching and caching','डेटा फ़ेचिंग और कैशिंग',false,'["https://nextjs.org/docs/app/getting-started/fetching-data"]'),
  ('nextjs-actions','nextjs','Server Actions and mutations','Server Actions और म्यूटेशन',false,'["https://nextjs.org/docs/app/getting-started/updating-data"]'),
  ('nextjs-routes','nextjs','Route Handlers and APIs','Route Handlers और API',false,'["https://nextjs.org/docs/app/api-reference/file-conventions/route"]'),
  ('nextjs-deploy','nextjs','Rendering modes and deployment','रेंडरिंग मोड और डिप्लॉयमेंट',false,'["https://nextjs.org/docs/app/getting-started/deploying"]'),

  ('tailwind-full','tailwind','Complete Tailwind CSS v4 path','पूरा Tailwind CSS v4 पाठ्यक्रम',true,'["https://tailwindcss.com/docs/styling-with-utility-classes"]'),
  ('tailwind-utility','tailwind','Thinking in utility classes','यूटिलिटी क्लास में सोचना',false,'["https://tailwindcss.com/docs/styling-with-utility-classes"]'),
  ('tailwind-theme','tailwind','Theme variables and tokens','थीम वेरिएबल और टोकन',false,'["https://tailwindcss.com/docs/theme"]'),
  ('tailwind-responsive','tailwind','Responsive and dark mode','रिस्पॉन्सिव और डार्क मोड',false,'["https://tailwindcss.com/docs/responsive-design"]'),
  ('tailwind-layout','tailwind','Flexbox and grid layouts','Flexbox और grid लेआउट',false,'["https://tailwindcss.com/docs/flex"]'),

  ('node-full','node','Complete Node.js path','पूरा Node.js पाठ्यक्रम',true,'["https://nodejs.org/docs/latest/api/"]'),
  ('node-modules','node','Modules and the event loop','मॉड्यूल और इवेंट लूप',false,'["https://nodejs.org/docs/latest/api/modules.html"]'),
  ('node-async','node','Streams and async patterns','Streams और async पैटर्न',false,'["https://nodejs.org/docs/latest/api/stream.html"]'),
  ('node-http','node','Building HTTP servers','HTTP सर्वर बनाना',false,'["https://nodejs.org/docs/latest/api/http.html"]'),
  ('node-files','node','Working with the file system','फ़ाइल सिस्टम के साथ काम',false,'["https://nodejs.org/docs/latest/api/fs.html"]'),

  ('js-full','javascript','Complete JavaScript path','पूरा JavaScript पाठ्यक्रम',true,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"]'),
  ('js-functions','javascript','Functions and scope','फ़ंक्शन और स्कोप',false,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions"]'),
  ('js-async','javascript','Promises and async/await','Promises और async/await',false,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises"]'),
  ('js-objects','javascript','Objects, arrays and destructuring','ऑब्जेक्ट, ऐरे और डीस्ट्रक्चरिंग',false,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects"]'),
  ('js-dom','javascript','The DOM and events','DOM और इवेंट',false,'["https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model"]'),
  ('js-modules','javascript','Modules and bundling','मॉड्यूल और बंडलिंग',false,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules"]'),

  ('ts-full','typescript','Complete TypeScript path','पूरा TypeScript पाठ्यक्रम',true,'["https://www.typescriptlang.org/docs/handbook/intro.html"]'),
  ('ts-basics','typescript','Types, interfaces and unions','टाइप, इंटरफ़ेस और यूनियन',false,'["https://www.typescriptlang.org/docs/handbook/2/everyday-types.html"]'),
  ('ts-generics','typescript','Generics and constraints','जेनेरिक और कंस्ट्रेंट',false,'["https://www.typescriptlang.org/docs/handbook/2/generics.html"]'),
  ('ts-narrowing','typescript','Narrowing and type guards','नैरोइंग और टाइप गार्ड',false,'["https://www.typescriptlang.org/docs/handbook/2/narrowing.html"]'),
  ('ts-utility','typescript','Utility and mapped types','यूटिलिटी और मैप्ड टाइप',false,'["https://www.typescriptlang.org/docs/handbook/utility-types.html"]'),

  ('python-full','python','Complete Python path','पूरा Python पाठ्यक्रम',true,'["https://docs.python.org/3/tutorial/"]'),
  ('python-basics','python','Variables and control flow','वेरिएबल और नियंत्रण प्रवाह',false,'["https://docs.python.org/3/tutorial/controlflow.html"]'),
  ('python-data','python','Lists, dicts and comprehensions','लिस्ट, dict और कॉम्प्रिहेंशन',false,'["https://docs.python.org/3/tutorial/datastructures.html"]'),
  ('python-functions','python','Functions and modules','फ़ंक्शन और मॉड्यूल',false,'["https://docs.python.org/3/tutorial/modules.html"]'),
  ('python-oop','python','Classes and objects','क्लास और ऑब्जेक्ट',false,'["https://docs.python.org/3/tutorial/classes.html"]'),
  ('python-errors','python','Errors and exceptions','त्रुटियाँ और अपवाद',false,'["https://docs.python.org/3/tutorial/errors.html"]'),

  ('java-full','java','Complete Java path','पूरा Java पाठ्यक्रम',true,'["https://dev.java/learn/"]'),
  ('java-basics','java','Syntax, types and control flow','सिंटैक्स, टाइप और नियंत्रण प्रवाह',false,'["https://dev.java/learn/language-basics/"]'),
  ('java-oop','java','Classes, objects and inheritance','क्लास, ऑब्जेक्ट और इनहेरिटेंस',false,'["https://dev.java/learn/oop/"]'),
  ('java-collections','java','Collections and generics','कलेक्शन और जेनेरिक',false,'["https://dev.java/learn/api/collections-framework/"]'),
  ('java-streams','java','Streams and lambdas','Streams और lambda',false,'["https://dev.java/learn/api/streams/"]'),

  ('jest-full','jest','Complete Jest path','पूरा Jest पाठ्यक्रम',true,'["https://jestjs.io/docs/getting-started"]'),
  ('jest-matchers','jest','Matchers and assertions','Matchers और assertion',false,'["https://jestjs.io/docs/using-matchers"]'),
  ('jest-mocks','jest','Mocks, spies and modules','Mock, spy और मॉड्यूल',false,'["https://jestjs.io/docs/mock-functions"]'),
  ('jest-async','jest','Testing asynchronous code','एसिंक्रोनस कोड की टेस्टिंग',false,'["https://jestjs.io/docs/asynchronous"]'),
  ('jest-coverage','jest','Coverage and configuration','कवरेज और कॉन्फ़िगरेशन',false,'["https://jestjs.io/docs/configuration"]'),

  ('rtl-full','rtl','Complete React Testing Library path','पूरा React Testing Library पाठ्यक्रम',true,'["https://testing-library.com/docs/react-testing-library/intro/"]'),
  ('rtl-queries','rtl','Queries and accessible roles','क्वेरी और सुलभ रोल',false,'["https://testing-library.com/docs/queries/about/"]'),
  ('rtl-events','rtl','User events and interaction','यूज़र इवेंट और इंटरैक्शन',false,'["https://testing-library.com/docs/user-event/intro/"]'),
  ('rtl-async','rtl','waitFor and findBy patterns','waitFor और findBy पैटर्न',false,'["https://testing-library.com/docs/dom-testing-library/api-async/"]'),
  ('rtl-practice','rtl','Testing like a real user','असली यूज़र की तरह टेस्टिंग',false,'["https://testing-library.com/docs/guiding-principles/"]'),

  ('playwright-full','playwright','Complete Playwright path','पूरा Playwright पाठ्यक्रम',true,'["https://playwright.dev/docs/intro"]'),
  ('playwright-locators','playwright','Locators and assertions','Locators और assertion',false,'["https://playwright.dev/docs/locators"]'),
  ('playwright-fixtures','playwright','Fixtures and test isolation','Fixtures और टेस्ट आइसोलेशन',false,'["https://playwright.dev/docs/test-fixtures"]'),
  ('playwright-debug','playwright','Tracing and debugging','ट्रेसिंग और डिबगिंग',false,'["https://playwright.dev/docs/trace-viewer"]'),

  ('claude-full','claude','Learn Claude step by step','Claude चरण दर चरण सीखें',true,'["https://docs.anthropic.com/en/docs/overview"]'),
  ('claude-prompts','claude','Writing effective prompts','प्रभावी प्रॉम्प्ट लिखना',false,'["https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview"]'),
  ('claude-tools','claude','Tool use and structured output','टूल उपयोग और संरचित आउटपुट',false,'["https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview"]'),
  ('claude-context','claude','Context windows and caching','कॉन्टेक्स्ट विंडो और कैशिंग',false,'["https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching"]'),
  ('claude-vision','claude','Working with images and files','छवियों और फ़ाइलों के साथ काम',false,'["https://docs.anthropic.com/en/docs/build-with-claude/vision"]'),

  ('claude-code-full','claude-code','Complete Claude Code path','पूरा Claude Code पाठ्यक्रम',true,'["https://docs.anthropic.com/en/docs/claude-code/overview"]'),
  ('claude-code-start','claude-code','Getting started in your terminal','अपने टर्मिनल में शुरुआत',false,'["https://docs.anthropic.com/en/docs/claude-code/quickstart"]'),
  ('claude-code-memory','claude-code','CLAUDE.md and project memory','CLAUDE.md और प्रोजेक्ट मेमोरी',false,'["https://docs.anthropic.com/en/docs/claude-code/memory"]'),
  ('claude-code-skills','claude-code','Skills and slash commands','Skills और slash कमांड',false,'["https://docs.anthropic.com/en/docs/claude-code/slash-commands"]'),
  ('claude-code-hooks','claude-code','Hooks and automation','Hooks और ऑटोमेशन',false,'["https://docs.anthropic.com/en/docs/claude-code/hooks"]'),
  ('claude-code-mcp','claude-code','MCP servers and integrations','MCP सर्वर और इंटीग्रेशन',false,'["https://docs.anthropic.com/en/docs/claude-code/mcp"]'),

  ('prompting-full','prompting','Complete prompt engineering path','पूरा प्रॉम्प्ट इंजीनियरिंग पाठ्यक्रम',true,'["https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview"]'),
  ('prompting-clarity','prompting','Being clear and direct','स्पष्ट और सीधा होना',false,'["https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct"]'),
  ('prompting-examples','prompting','Few-shot examples','कुछ-उदाहरण प्रॉम्प्टिंग',false,'["https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting"]'),
  ('prompting-chain','prompting','Chain of thought and reasoning','विचार-शृंखला और तर्क',false,'["https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought"]'),

  ('ai-full','ai','AI foundations learning path','AI आधार पाठ्यक्रम',true,'["https://developers.google.com/machine-learning/crash-course"]'),
  ('ai-evaluation','ai','Evaluating model outputs','मॉडल के परिणामों का मूल्यांकन',false,'["https://developers.google.com/machine-learning/crash-course"]'),
  ('ai-embeddings','ai','Embeddings and vector search','एम्बेडिंग और वेक्टर खोज',false,'["https://developers.google.com/machine-learning/crash-course/embeddings"]'),
  ('ai-rag','ai','Retrieval augmented generation','पुनर्प्राप्ति-संवर्धित जनरेशन',false,'["https://docs.anthropic.com/en/docs/build-with-claude/embeddings"]'),

  ('sql-full','sql','Complete SQL path','पूरा SQL पाठ्यक्रम',true,'["https://www.postgresql.org/docs/current/tutorial.html"]'),
  ('sql-joins','sql','Queries and joins','क्वेरी और जॉइन',false,'["https://www.postgresql.org/docs/current/tutorial-join.html"]'),
  ('sql-aggregates','sql','Grouping and aggregates','ग्रुपिंग और एग्रीगेट',false,'["https://www.postgresql.org/docs/current/tutorial-agg.html"]'),
  ('sql-subqueries','sql','Subqueries and CTEs','सबक्वेरी और CTE',false,'["https://www.postgresql.org/docs/current/queries-with.html"]'),

  ('postgres-full','postgres','Complete PostgreSQL path','पूरा PostgreSQL पाठ्यक्रम',true,'["https://www.postgresql.org/docs/current/index.html"]'),
  ('postgres-indexes','postgres','Indexes and query plans','इंडेक्स और क्वेरी प्लान',false,'["https://www.postgresql.org/docs/current/indexes.html"]'),
  ('postgres-json','postgres','JSON and JSONB','JSON और JSONB',false,'["https://www.postgresql.org/docs/current/datatype-json.html"]'),
  ('postgres-transactions','postgres','Transactions and locking','ट्रांज़ैक्शन और लॉकिंग',false,'["https://www.postgresql.org/docs/current/mvcc.html"]'),

  ('supabase-full','supabase','Complete Supabase path','पूरा Supabase पाठ्यक्रम',true,'["https://supabase.com/docs"]'),
  ('supabase-auth','supabase','Authentication and sessions','प्रमाणीकरण और सेशन',false,'["https://supabase.com/docs/guides/auth"]'),
  ('supabase-rls','supabase','Row Level Security policies','Row Level Security नीतियाँ',false,'["https://supabase.com/docs/guides/database/postgres/row-level-security"]'),
  ('supabase-storage','supabase','Storage and file uploads','स्टोरेज और फ़ाइल अपलोड',false,'["https://supabase.com/docs/guides/storage"]'),
  ('supabase-realtime','supabase','Realtime subscriptions','रीयलटाइम सब्सक्रिप्शन',false,'["https://supabase.com/docs/guides/realtime"]'),

  ('git-full','git','Complete Git & GitHub path','पूरा Git और GitHub पाठ्यक्रम',true,'["https://git-scm.com/doc"]'),
  ('git-basics','git','Commits, branches and merges','कमिट, ब्रांच और मर्ज',false,'["https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging"]'),
  ('git-rebase','git','Rebasing and history','Rebase और हिस्ट्री',false,'["https://git-scm.com/book/en/v2/Git-Branching-Rebasing"]'),
  ('git-collab','git','Pull requests and code review','Pull request और कोड रिव्यू',false,'["https://docs.github.com/en/pull-requests"]'),

  ('docker-full','docker','Complete Docker path','पूरा Docker पाठ्यक्रम',true,'["https://docs.docker.com/get-started/"]'),
  ('docker-images','docker','Images and Dockerfiles','इमेज और Dockerfile',false,'["https://docs.docker.com/build/building/packaging/"]'),
  ('docker-compose','docker','Compose and multi-container apps','Compose और मल्टी-कंटेनर ऐप',false,'["https://docs.docker.com/compose/"]'),
  ('docker-volumes','docker','Volumes and networking','वॉल्यूम और नेटवर्किंग',false,'["https://docs.docker.com/engine/storage/volumes/"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
