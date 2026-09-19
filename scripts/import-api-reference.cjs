// Extract inert literals only. Never execute the supplied HTML or its scripts.
const fs = require('node:fs');
const ts = require('typescript');
const retired = new Set(require('../lib/retired-technologies.json'));
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Pass the cadence HTML reference path');
const html = fs.readFileSync(sourcePath, 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).join('\n');
const tree = ts.createSourceFile('reference.js', scripts, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(property => {
    if (!ts.isPropertyAssignment(property) || !property.name || !('text' in property.name)) throw new Error('Nonliteral property');
    return [property.name.text, literal(property.initializer)];
  }));
  throw new Error('Executable or unsupported value in catalog');
}
const selected = new Set(['DEFAULT_TRACKS', 'API_DATA', 'TYPE_DEFS', 'ACCENT']);
const data = {};
for (const statement of tree.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && selected.has(declaration.name.text)) data[declaration.name.text] = literal(declaration.initializer);
  }
}
if (Object.keys(data).length !== selected.size) throw new Error('Reference is missing catalog declarations');
const packages = data.DEFAULT_TRACKS.filter(track => !retired.has(track.id) && data.API_DATA[track.id]?.length).map(track => {
  const seen = new Set();
  return { id: track.id, name: track.name, icon: track.icon, description: track.focus, docs: track.docs, accent: data.ACCENT[track.id] || '#4F46E5', topics: track.syllabus,
    entries: data.API_DATA[track.id].filter(entry => { if (seen.has(entry[0])) return false; seen.add(entry[0]); return true; }).map(([name, kind, status = 's']) => ({ name, kind, status })) };
});
for (const pkg of packages) if (!/^https:\/\//.test(pkg.docs)) throw new Error('Only HTTPS references are allowed');
fs.writeFileSync('lib/api-docs-catalog.json', JSON.stringify({ types: data.TYPE_DEFS, packages }, null, 2) + '\n');
console.log(JSON.stringify({ packages: packages.length, entries: packages.reduce((sum, pkg) => sum + pkg.entries.length, 0) }));
