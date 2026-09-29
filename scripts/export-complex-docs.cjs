// Export the embedded learning projects for local execution and QA.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  module._compile(output.outputText, filename);
};
const { COMPLEX_DOCS_PROJECTS } = require('../lib/official-docs-complex.ts');
// Keep standalone project sources out of the application's TypeScript/Jest scan.
const root = path.resolve(__dirname, '../artifacts/node_modules/official-docs-complex-qa');
fs.mkdirSync(root, { recursive: true });
fs.writeFileSync(path.join(root, '.gitignore'), '*\n');
for (const [id, project] of Object.entries(COMPLEX_DOCS_PROJECTS)) {
  for (const file of project.files) {
    const target = path.resolve(root, id, file.path);
    if (!target.startsWith(root + path.sep)) throw new Error('Invalid example path');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.code);
  }
  console.log(id + ': ' + project.files.length + ' files');
}
