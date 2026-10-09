import type { DocsProject } from "./official-docs-projects";
import type { AnswerFile } from "./pro-learn/types";

const file = (path: string, code: string): AnswerFile => ({ path, code: code.trim() + "\n", note: "" });

const model = `export const initialInventory = [
  { id: 'notebook', name: 'Notebook', stock: 4 },
  { id: 'pencil', name: 'Pencil', stock: 0 },
  { id: 'pen', name: 'Pen', stock: 8 },
];
export function validInventory(value) {
  return Array.isArray(value) && value.length > 0 && value.length <= 100 &&
    new Set(value.map(item => item?.id)).size === value.length &&
    value.every(item => item && typeof item.id === 'string' && item.id.length > 0 &&
      typeof item.name === 'string' && item.name.trim().length > 0 &&
      Number.isSafeInteger(item.stock) && item.stock >= 0 && item.stock <= 999);
}
export function inventoryReducer(state, action) {
  if (action.type === 'restore') return validInventory(action.items) ? action.items : state;
  if (action.type === 'reset') return initialInventory.map(item => ({ ...item }));
  if (action.type !== 'adjust' || !Number.isSafeInteger(action.delta)) return state;
  return state.map(item => {
    if (item.id !== action.id) return item;
    const stock = item.stock + action.delta;
    return stock >= 0 && stock <= 999 ? { ...item, stock } : item;
  });
}`;

const inventoryApp = `'use client';
import React, { useEffect, useReducer, useState } from 'react';
import { initialInventory, inventoryReducer, validInventory } from './inventory.js';
const storageKey = 'docs-inventory-v1';
export default function Inventory() {
  const [items, dispatch] = useReducer(inventoryReducer, initialInventory);
  const [query, setQuery] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (!validInventory(parsed)) throw new Error('Invalid saved inventory');
        dispatch({ type: 'restore', items: parsed });
      }
    } catch { setNotice('Saved data could not be loaded. Using the starter inventory.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify(items)); }
    catch { setNotice('Storage is unavailable. Changes last only for this session.'); }
  }, [items, ready]);
  const visible = items.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase()) && (!lowOnly || item.stock < 5));
  return <main><h1>Supply room inventory</h1>
    <p>Track stock, find items that need replenishing, and restore your work after a reload.</p>
    {notice && <p role="alert">{notice}</p>}
    <label>Find supplies <input value={query} onChange={event => setQuery(event.target.value)} /></label>
    <label><input type="checkbox" checked={lowOnly} onChange={event => setLowOnly(event.target.checked)} /> Low stock only</label>
    <p role="status">{visible.length} products shown; {items.reduce((total, item) => total + item.stock, 0)} units in stock</p>
    <ul>{visible.map(item => <li key={item.id}>
      <h2>{item.name}</h2><p>{item.stock} units{item.stock < 5 ? ' — reorder soon' : ''}</p>
      <button disabled={!ready || item.stock === 0} aria-label={'Use one ' + item.name} onClick={() => dispatch({ type: 'adjust', id: item.id, delta: -1 })}>Use one</button>
      <button disabled={!ready || item.stock > 994} aria-label={'Restock ' + item.name} onClick={() => dispatch({ type: 'adjust', id: item.id, delta: 5 })}>Restock five</button>
    </li>)}</ul>
    {!visible.length && <p>No supplies match these filters.</p>}
    <button disabled={!ready} onClick={() => dispatch({ type: 'reset' })}>Reset demo inventory</button>
  </main>;
}`;

const inventoryCoreApp = `'use client';
import React, { useReducer, useState } from 'react';
import { initialInventory, inventoryReducer } from './inventory.js';
export default function Inventory() {
  const [items, dispatch] = useReducer(inventoryReducer, initialInventory);
  const [lowOnly, setLowOnly] = useState(false);
  const visible = items.filter(item => !lowOnly || item.stock < 5);
  return <main><h1>Supply room inventory</h1>
    <label><input type="checkbox" checked={lowOnly} onChange={event => setLowOnly(event.target.checked)} /> Low stock only</label>
    <p role="status">{items.reduce((sum, item) => sum + item.stock, 0)} units in stock</p>
    <ul>{visible.map(item => <li key={item.id}><h2>{item.name}</h2><p>{item.stock} units</p>
      <button disabled={item.stock === 0} aria-label={'Use one ' + item.name} onClick={() => dispatch({ type: 'adjust', id: item.id, delta: -1 })}>Use one</button>
      <button disabled={item.stock > 994} aria-label={'Restock ' + item.name} onClick={() => dispatch({ type: 'adjust', id: item.id, delta: 5 })}>Restock five</button>
    </li>)}</ul>
    {!visible.length && <p>No items need restocking.</p>}
    <button onClick={() => dispatch({ type: 'reset' })}>Reset demo inventory</button>
  </main>;
}`;

const modelTest = `import assert from 'node:assert/strict';
import { initialInventory, inventoryReducer, validInventory } from './inventory.js';
const before = structuredClone(initialInventory);
const restocked = inventoryReducer(before, { type: 'adjust', id: 'pencil', delta: 5 });
assert.equal(restocked.find(item => item.id === 'pencil').stock, 5);
assert.deepEqual(before, initialInventory, 'Reducer must not mutate previous state');
assert.equal(inventoryReducer(before, { type: 'adjust', id: 'pencil', delta: -1 }).find(item => item.id === 'pencil').stock, 0);
assert.equal(validInventory([{ id: 'x', name: 'Item', stock: -1 }]), false);
assert.equal(validInventory([{ id: 'x', name: 'Item', stock: 1 }, { id: 'x', name: 'Duplicate', stock: 1 }]), false);
assert.equal(validInventory(null), false);
assert.deepEqual(inventoryReducer(restocked, { type: 'restore', items: null }), restocked);
console.log('Inventory boundary and immutability checks passed.');`;

export const INVENTORY_SCENARIO = `await expect(page.getByRole('button', { name: 'Use one Pencil', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Restock Pencil', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('17 units in stock');
  await page.reload();
  await expect(page.getByRole('status')).toContainText('17 units in stock');
  await page.getByRole('checkbox', { name: 'Low stock only' }).check();
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('listitem')).toContainText('Notebook');
  await page.getByRole('textbox', { name: 'Find supplies' }).fill('missing');
  await expect(page.getByText('No supplies match these filters.')).toBeVisible();
  await page.getByRole('textbox').fill('');
  await page.getByRole('checkbox').uncheck();
  await page.getByRole('button', { name: 'Reset demo inventory' }).click();
  await expect(page.getByRole('status')).toContainText('12 units in stock');`;

export function inventoryProject(id: string, base: DocsProject, persist = true): DocsProject {
  const isNext = id === "nextjs" || id === "nextjs-hooks";
  const folder = isNext ? "app" : "src";
  const preserved = isNext ? ["app/layout.js", "app/globals.css", "package.json"] : ["src/main.jsx", "src/style.css", "index.html", "package.json"];
  const files = base.files.filter(entry => preserved.includes(entry.path));
  if (isNext && !files.some(entry => entry.path === "app/layout.js")) {
    files.push(file("app/layout.js", `export default function Layout({ children }) { return <html lang="en"><body>{children}</body></html>; }`));
  }
  return {
    ...base,
    title: persist ? "An inventory dashboard with recovery and stock validation" : "Manage stock with a tested inventory reducer",
    summary: persist ? "Solve a supply-room workflow: filter inventory, prevent negative stock, replenish items, and persist changes across reloads. Recover from invalid saved data without breaking the screen. Storage is local to this browser, not a shared database." : "Separate stock rules from the screen, reject invalid adjustments, and surface low-stock items. Includes the app entry point, reducer, boundary tests, and configuration. Stock lives in memory; refreshing resets this example.",
    files: [file(`${folder}/${isNext ? "Inventory.jsx" : "App.jsx"}`, persist ? inventoryApp : inventoryCoreApp), file(`${folder}/inventory.js`, model), file(`${folder}/inventory.test.mjs`, modelTest), ...(isNext ? [file("app/page.js", `import Inventory from './Inventory.jsx';\nexport default function Page() { return <Inventory />; }`)] : []), ...files],
    verify: [`Restock Pencil: the total rises from 12 to 17${persist ? " and remains 17 after a reload" : "; reloading resets the total to 12"}.`, "Low stock only initially shows Notebook and Pencil; a zero-stock item cannot be used.", "Reset demo inventory restores the initial quantities."],
    commands: [{ command: "npm install", description: "Install project dependencies." }, { command: `node ${folder}/inventory.test.mjs`, description: "Check stock limits, immutable updates, and saved-data validation." }, { command: "npm start", description: `Open http://localhost:${isNext ? 3000 : 5173} to manage inventory.` }],
  };
}
