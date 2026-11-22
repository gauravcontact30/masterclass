import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { HINDI_SHARDS } from "@/lib/locales/hi";

const dir = path.join(process.cwd(), "lib/locales/hi");
const shardFiles = readdirSync(dir).filter(name => name.endsWith(".json") && name !== "skip.json" && name !== "coverage.json");
const read = (name: string): Record<string, string> => JSON.parse(readFileSync(path.join(dir, name), "utf8"));
const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)*/g) ?? []).sort();
const placeholders = (text: string) => (text.match(/\{[A-Za-z_]+\}/g) ?? []).sort();

test("every published Hindi shard has a loader, and every loader a shard", () => {
  expect(Object.keys(HINDI_SHARDS).sort()).toEqual(shardFiles.map(name => name.replace(/\.json$/, "")).sort());
  expect(shardFiles).toContain("common.json");
});

test("Hindi learning text keeps every number, placeholder and operator of the English source", () => {
  for (const file of shardFiles) for (const [english, hindi] of Object.entries(read(file))) {
    expect({ file, english, numbers: numbers(hindi) }).toEqual({ file, english, numbers: numbers(english) });
    expect(placeholders(hindi)).toEqual(placeholders(english));
    for (const operator of ["=", "+", "−", "×", "÷", "√", "%", "₹"]) expect([english, hindi.split(operator).length]).toEqual([english, english.split(operator).length]);
  }
});

test("interface Hindi keeps placeholders", () => {
  const ui: Record<string, string> = JSON.parse(readFileSync(path.join(process.cwd(), "lib/locales/ui-hi.json"), "utf8"));
  for (const [english, hindi] of Object.entries(ui)) expect([english, placeholders(hindi)]).toEqual([english, placeholders(english)]);
});
