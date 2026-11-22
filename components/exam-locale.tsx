"use client";
import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { useLanguage } from "./language-provider";
import { localizeExamData, type ExamDictionary } from "@/lib/exam-locale";
import { HINDI_SHARDS } from "@/lib/locales/hi";

/*
 * Hindi for the exam material is split into shards (lib/locales/hi): "common" for catalogues and page copy, one per
 * board class and subject, one per competitive exam. The provider always loads "common"; a page asks for the shard
 * of the pack it is showing with useExamShard, so a learner downloads only the Hindi they read.
 */
type Value = { dictionary: ExamDictionary; request: (shard: string) => void };
const Context = createContext<Value>({ dictionary: {}, request: () => {} });
const cache = new Map<string, Promise<ExamDictionary>>();
const load = (shard: string) => {
  const loader = HINDI_SHARDS[shard];
  if (!loader) return Promise.resolve({});
  let pending = cache.get(shard);
  if (!pending) cache.set(shard, pending = loader().then(data => data.default, () => { cache.delete(shard); return {}; }));
  return pending;
};

export function ExamLocaleProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [shards, setShards] = useState<Record<string, ExamDictionary>>({});
  const [wanted, setWanted] = useState<string[]>(["common"]);
  useEffect(() => {
    if (language !== "hi") return;
    let live = true;
    for (const shard of wanted) if (!shards[shard]) void load(shard).then(data => { if (live) setShards(current => current[shard] ? current : { ...current, [shard]: data }); });
    return () => { live = false; };
  }, [language, wanted, shards]);
  const value = useMemo<Value>(() => ({
    dictionary: language === "hi" ? Object.assign({}, ...wanted.map(shard => shards[shard] ?? {})) : {},
    request: shard => setWanted(current => current.includes(shard) ? current : [...current, shard]),
  }), [language, wanted, shards]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Load the Hindi shard for the pack a page shows ("board-10-math", "exam-ssc", ...). A no-op in English. */
export function useExamShard(shard: string) {
  const { request } = useContext(Context);
  useEffect(() => { request(shard); }, [request, shard]);
}

const reversed = new WeakMap<ExamDictionary, Map<string, string>>();
/** The English original of a translated string (picture keys and URLs stay in English), or the string itself. */
const englishOf = (dictionary: ExamDictionary, value: string) => {
  let map = reversed.get(dictionary);
  if (!map) reversed.set(dictionary, map = new Map(Object.entries(dictionary).map(([en, hi]) => [hi, en])));
  return map.get(value) ?? value;
};

export function useExamLocale() {
  const { dictionary } = useContext(Context);
  return { dictionary, localize: <T,>(value: T): T => localizeExamData(value, dictionary), english: (value: string) => englishOf(dictionary, value) };
}
/** Translate React text and accessibility labels without mutating DOM, controls, links or event handlers. */
export function ExamContent({ children }: { children: ReactNode }) {
  const { dictionary } = useContext(Context);
  const text = (value: string) => {
    const trimmed = value.trim();
    return dictionary[trimmed] ? value.replace(trimmed, dictionary[trimmed]) : value;
  };
  const visit = (nodes: ReactNode): ReactNode => Children.map(nodes, node => {
    if (typeof node === "string") return text(node);
    if (!isValidElement(node)) return node;
    const element = node as ReactElement<Record<string, unknown>>;
    if (element.props.translate === "no") return element;
    const next: Record<string, unknown> = {};
    for (const key of ["title", "aria-label", "placeholder", "alt"]) if (typeof element.props[key] === "string") next[key] = text(element.props[key] as string);
    if (element.props.children !== undefined) next.children = visit(element.props.children as ReactNode);
    return cloneElement(element, next);
  });
  return <>{visit(children)}</>;
}
