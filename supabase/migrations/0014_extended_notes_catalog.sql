-- Register the completed notes so preparation choices and generation agree.
insert into technologies(id,title,title_hi,category) values
  ('cypress','Cypress','Cypress','testing'),
  ('agentic-ai','Agentic AI','Agentic AI','ai'),
  ('platform-engineering','Platform Engineering','Platform Engineering','devops'),
  ('data-engineering','Modern Data Stack & Data Engineering','Modern Data Stack और Data Engineering','data'),
  ('cybersecurity','Cybersecurity','साइबर सुरक्षा','security')
on conflict(id) do update set title=excluded.title,title_hi=excluded.title_hi,category=excluded.category;

insert into topics(id,technology_id,title,title_hi,full_track,"references") values
  ('javascript-puzzles','javascript','JavaScript: predict the output','JavaScript: आउटपुट का अनुमान लगाएँ',false,'["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model"]'),
  ('cypress-testing','cypress','Cypress testing','Cypress टेस्टिंग',true,'["https://docs.cypress.io/app/get-started/why-cypress"]'),
  ('agentic-ai-systems','agentic-ai','Agentic AI systems','Agentic AI सिस्टम',true,'["https://www.anthropic.com/engineering/building-effective-agents"]'),
  ('platform-engineering-idp','platform-engineering','Internal developer platforms','आंतरिक डेवलपर प्लेटफ़ॉर्म',true,'["https://backstage.io/docs/overview/what-is-backstage/"]'),
  ('modern-data-stack','data-engineering','Modern data stack & data engineering','आधुनिक डेटा स्टैक और डेटा इंजीनियरिंग',true,'["https://docs.getdbt.com/docs/introduction","https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html","https://iceberg.apache.org/docs/latest/"]'),
  ('secure-applications','cybersecurity','Secure applications and operations','सुरक्षित ऐप और संचालन',true,'["https://owasp.org/www-project-top-ten/","https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"]'),
  ('aws-ai-services','aws','AWS AI services: practical notes','AWS AI सेवाएँ: व्यावहारिक नोट्स',false,'["https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html","https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html"]')
on conflict(id) do update set technology_id=excluded.technology_id,title=excluded.title,title_hi=excluded.title_hi,full_track=excluded.full_track,"references"=excluded."references";
