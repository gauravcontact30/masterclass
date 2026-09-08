insert into public.technologies(id,title,title_hi,category) values
('javascript','JavaScript','JavaScript','Development'),('python','Python','Python','Development'),('react','React','React','Development'),('nextjs','Next.js','Next.js','Development'),('sql','SQL','SQL','Data'),('ai','AI fundamentals','AI की बुनियाद','Artificial intelligence'),('claude','Claude','Claude','AI tools') on conflict(id) do nothing;
insert into public.topics(id,technology_id,title,title_hi,full_track,"references") values
('js-full','javascript','Complete JavaScript path','पूरा JavaScript पाठ्यक्रम',true,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"]'),
('js-functions','javascript','Functions and scope','फ़ंक्शन और स्कोप',false,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions"]'),
('js-async','javascript','Promises and async/await','Promises और async/await',false,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises"]'),
('python-full','python','Complete Python path','पूरा Python पाठ्यक्रम',true,'["https://docs.python.org/3/tutorial/"]'),
('python-basics','python','Variables and control flow','वेरिएबल और नियंत्रण प्रवाह',false,'["https://docs.python.org/3/tutorial/controlflow.html"]'),
('react-full','react','Complete React path','पूरा React पाठ्यक्रम',true,'["https://react.dev/learn"]'),
('react-state','react','Components, props and state','कंपोनेंट, props और state',false,'["https://react.dev/learn/state-a-components-memory"]'),
('nextjs-full','nextjs','Complete Next.js path','पूरा Next.js पाठ्यक्रम',true,'["https://nextjs.org/docs/app"]'),
('nextjs-routing','nextjs','Routing and layouts','राउटिंग और लेआउट',false,'["https://nextjs.org/docs/app/getting-started/layouts-and-pages"]'),
('sql-full','sql','Complete SQL path','पूरा SQL पाठ्यक्रम',true,'["https://www.postgresql.org/docs/current/tutorial.html"]'),
('sql-joins','sql','Queries and joins','क्वेरी और जॉइन',false,'["https://www.postgresql.org/docs/current/tutorial-join.html"]'),
('ai-full','ai','AI foundations learning path','AI आधार पाठ्यक्रम',true,'["https://developers.google.com/machine-learning/crash-course"]'),
('ai-evaluation','ai','Evaluating model outputs','मॉडल के परिणामों का मूल्यांकन',false,'["https://developers.google.com/machine-learning/crash-course"]'),
('claude-full','claude','Learn Claude step by step','Claude चरण दर चरण सीखें',true,'["https://docs.anthropic.com/en/docs/overview"]'),
('claude-prompts','claude','Writing effective prompts','प्रभावी प्रॉम्प्ट लिखना',false,'["https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview"]') on conflict(id) do nothing;
