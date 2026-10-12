// Refresh the small client-side directory from the app's authored catalogues.
const fs = require('node:fs');
const entries = new Map();
const add = (name, url, aliases = []) => entries.set(name, { name, url, aliases });
const catalog = fs.readFileSync('lib/technology-catalog.ts', 'utf8');
for (const match of catalog.matchAll(/id: "([^"]+)"[\s\S]*?name: "([^"]+)"[\s\S]*?officialDocUrl: "([^"]+)"/g)) {
  add(match[2], match[3], [match[1]]);
}
for (const file of fs.readdirSync('lib/pro-learn/platform-handbooks')) {
  const source = fs.readFileSync(`lib/pro-learn/platform-handbooks/${file}`, 'utf8');
  for (const match of source.matchAll(/defineHandbook\("([^"]+)",\s*"[^"]*",\s*"([^"]+)"/g)) add(match[1], match[2]);
}
const extra = [
  ['React', 'https://react.dev/learn', 'React 19'],
  ['Next.js', 'https://nextjs.org/docs', 'nextjs'],
  ['Python', 'https://docs.python.org/3/tutorial/'],
  ['JavaScript', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', 'Modern JavaScript', 'JS Puzzles'],
  ['NestJS', 'https://docs.nestjs.com/', 'Nest.js', 'Nest JS'],
  ['Vue.js', 'https://vuejs.org/guide/', 'vue'],
  ['Angular', 'https://angular.dev/tutorials'],
  ['Flutter', 'https://docs.flutter.dev/'],
  ['Java', 'https://dev.java/learn/'],
  ['AWS', 'https://docs.aws.amazon.com/', 'Popular AWS services', 'Amazon Web Services'],
  ['DevOps', 'https://aws.amazon.com/devops/', 'DevOps with AWS CI/CD'],
  ['Git', 'https://git-scm.com/doc', 'Git & GitHub'],
  ['Docker', 'https://docs.docker.com/get-started/'],
  ['Jest', 'https://jestjs.io/docs/getting-started'],
  ['React Testing Library', 'https://testing-library.com/docs/react-testing-library/intro/', 'rtl'],
  ['Cypress', 'https://docs.cypress.io/'],
  ['Claude', 'https://platform.claude.com/docs/'],
  ['Claude Code', 'https://code.claude.com/docs/'],
  ['Prompt engineering', 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview'],
  ['AI fundamentals', 'https://huggingface.co/learn', 'AI terms', 'AI & ML', 'AI Tools'],
  ['Agentic AI', 'https://docs.langchain.com/oss/python/langchain/agents', 'AI Agents', 'Agentic AI & Claude'],
  ['LangChain', 'https://docs.langchain.com/oss/python/langchain/overview'],
  ['LangGraph', 'https://docs.langchain.com/oss/python/langgraph/overview'],
  ['LangSmith', 'https://docs.langchain.com/langsmith/observability'],
  ['Langflow', 'https://docs.langflow.org'],
  ['n8n', 'https://docs.n8n.io/'],
  ['PyTorch', 'https://pytorch.org/tutorials/'],
  ['TensorFlow', 'https://www.tensorflow.org/learn'],
  ['Elasticsearch', 'https://www.elastic.co/docs/reference/elasticsearch'],
  ['Platform Engineering', 'https://www.cncf.io/projects/'],
  ['Modern Data Stack & Data Engineering', 'https://spark.apache.org/docs/latest/', 'Data Engineering'],
  ['Cybersecurity', 'https://owasp.org/www-project-top-ten/'],
  ['Modern Full-Stack Technologies', 'https://developer.mozilla.org/en-US/docs/Learn_web_development'],
  ['Conform', 'https://conform.guide/'],
  ['Zod', 'https://zod.dev/'],
  ['Better Auth', 'https://www.better-auth.com/docs', 'BetterAuth'],
  ['Auth.js', 'https://authjs.dev/getting-started', 'Authentication with Auth.js & Kinde Auth'],
  ['Kinde', 'https://docs.kinde.com/'],
  ['Clerk', 'https://clerk.com/docs'],
  ['uv', 'https://docs.astral.sh/uv/'],
  ['Redis', 'https://redis.io/docs/latest/'],
  ['Inngest', 'https://www.inngest.com/docs'],
  ['T3 Stack', 'https://create.t3.gg/en/introduction'],
  ['TanStack', 'https://tanstack.com/'],
  ['NumPy', 'https://numpy.org/doc/'],
  ['Pandas', 'https://pandas.pydata.org/docs/'],
  ['Polars', 'https://docs.pola.rs/'],
  ['SciPy', 'https://docs.scipy.org/doc/scipy/'],
  ['Scikit-Learn', 'https://scikit-learn.org/stable/user_guide.html'],
  ['Keras', 'https://keras.io/guides/'],
  ['Seaborn', 'https://seaborn.pydata.org/tutorial.html'],
  ['Plotly', 'https://plotly.com/python/'],
  ['Requests', 'https://requests.readthedocs.io/'],
  ['HTTPX', 'https://www.python-httpx.org/'],
  ['Scrapy', 'https://docs.scrapy.org/'],
  ['Pydantic', 'https://docs.pydantic.dev/'],
  ['Mongoose', 'https://mongoosejs.com/docs/'],
];
for (const [name, url, ...aliases] of extra) add(name, url, aliases);
for (const entry of entries.values()) {
  const keys = [entry.name, ...entry.aliases].map(name => name.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  const key = keys.find(key => fs.existsSync(`public/images/brands/${key}.svg`));
  entry.thumbnail = key ? `/images/brands/${key}.svg` : '/images/learning/official-resource.svg';
}
fs.writeFileSync('lib/media/learning-sites.json', JSON.stringify([...entries.values()], null, 2) + '\n');
