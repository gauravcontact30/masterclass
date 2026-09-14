/* eslint-disable @typescript-eslint/no-require-imports -- This standalone CommonJS verifier registers a TypeScript require hook before loading the authored fixtures. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) { return resolve.call(this, id.startsWith('@/') ? path.join(process.cwd(), id.slice(2)) : id, ...args); };
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const { TOPIC_PROJECTS } = require('../lib/generation/topic-projects.ts');
const { codeExampleSchema } = require('../lib/domain.ts');
const root = path.resolve('node_modules/.cache/masterclass-learning-projects');
const seen = new Set();
let projects = 0;
let commands = 0;
function run(directory, executable, args) {
  const result = spawnSync(executable, args, { cwd: directory, encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`${path.basename(directory)}: ${executable} ${args.join(' ')}\n${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
  commands++;
}
for (const [topic, examples] of Object.entries(TOPIC_PROJECTS)) {
  for (const example of examples) {
    if (seen.has(example)) continue; // React/Next hook guides share their framework's projects.
    seen.add(example);
    codeExampleSchema.parse(example);
    // Jest's crawler excludes node_modules even when explicitly selected.
    const directory = path.join(topic === 'jest' ? path.resolve('.next/learning-jest-projects') : root, topic, example.kind);
    for (const file of example.files) {
      const destination = path.resolve(directory, file.path);
      assert.ok(destination.startsWith(directory + path.sep));
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, file.code, 'utf8');
      if (/\.(?:tsx?|jsx?|mjs|cjs)$/.test(file.path) && !file.path.endsWith('.d.ts')) {
        const result = ts.transpileModule(file.code, { fileName: file.path, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
        const errors = (result.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
        assert.equal(errors.length, 0, `${topic}/${file.path}: ${errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n')}`);
      }
    }
    if (topic === 'python') {
      run(directory, 'python', example.kind === 'concept' ? ['src/main.py'] : ['-m', 'src.main']);
      run(directory, 'python', ['-m', 'unittest', 'discover', '-s', 'tests']);
    }
    if (['es2026', 'llm-context-loop-memory'].includes(topic) || topic === 'devops-services' && example.kind === 'concept' || topic === 'aws-popular-services' && example.kind === 'application') {
      run(directory, process.execPath, ['--test']);
      if (example.files.some(file => file.path === 'src/main.mjs')) run(directory, process.execPath, ['src/main.mjs']);
    }
    if (topic === 'aws-popular-services' && example.kind === 'concept') run(directory, process.execPath, ['scripts/check.mjs']);
    if (topic === 'claude-skills-plugins-mcp' && example.kind === 'concept') run(directory, 'python', ['.claude/skills/review-checklist/scripts/check-json.py', 'fixtures/example.json']);
    if (topic === 'typescript-7' || topic === 'react-19' || topic === 'nextjs-16') {
      run(directory, process.execPath, [path.resolve('node_modules/typescript/bin/tsc'), '--project', 'tsconfig.json', '--skipLibCheck']);
      if (topic === 'typescript-7') run(directory, process.execPath, ['dist/main.js']);
    }
    if (topic === 'jest') run(directory, process.execPath, [path.resolve('node_modules/jest/bin/jest.js'), '--runInBand', '--config', JSON.stringify({ rootDir: directory, testEnvironment: 'node', testMatch: ['**/tests/*.test.cjs'] })]);
    projects++;
  }
}
console.log(`Validated ${projects} unique project schemas/source trees; ${commands} local execution, test and type-check commands passed. External framework installs, browser binaries and infrastructure deployments are not performed by this script.`);
