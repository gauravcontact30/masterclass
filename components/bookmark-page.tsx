"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bookmark, Copy, Download, Search, Trash2, Library, Layers3 } from "lucide-react";
import { toast } from "sonner";
import { bookmarkText, type SavedBookmark } from "@/lib/bookmarks";
import { useBookmarks } from "./bookmarks";
import styles from "./bookmarks.module.css";

export function BookmarkPage({ technologies }: { technologies: { id: string; title: string }[] }) {
  const store = useBookmarks();
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("");
  const [sort, setSort] = useState("newest");
  const name = (id: string) => technologies.find(item => item.id === id)?.title ?? id;
  const items = store?.items ?? [];
  const filtered = items.filter(item => (!technology || item.technology === technology) && query.toLowerCase().trim().split(/\s+/).every(term => [item.title, name(item.technology), ...item.points].join(" ").toLowerCase().includes(term))).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "oldest" ? a.savedAt.localeCompare(b.savedAt) : b.savedAt.localeCompare(a.savedAt));
  const groups = useMemo(() => {
    const result = new Map<string, { title: string; technology: string; items: SavedBookmark[] }>();
    filtered.forEach(item => { const key = JSON.stringify([item.technology, item.title]); const group = result.get(key) ?? { title: item.title, technology: item.technology, items: [] }; group.items.push(item); result.set(key, group); });
    return [...result.values()];
  }, [filtered]);
  const techs = [...new Set(items.map(item => item.technology))].sort((a, b) => name(a).localeCompare(name(b)));
  const exportItems = filtered.map(item => ({ ...item, technology: name(item.technology) }));
  async function copy(text: string) { try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); } catch { toast.error("Could not copy. Try downloading your notes."); } }
  function download() {
    const url = URL.createObjectURL(new Blob([bookmarkText(exportItems)], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "masterclass-bookmarks.txt"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function remove(item: SavedBookmark) {
    if (await store?.remove(item)) toast("Bookmark removed", { action: { label: "Undo", onClick: () => { const { id: _id, savedAt: _time, ...draft } = item; void _id; void _time; void store?.save(draft); } } });
  }
  return <div className={styles.page}>
    <header className={styles.hero}><div><span className={styles.eyebrow}><Bookmark size={15} /> YOUR PERSONAL REFERENCE</span><h1>Bookmark</h1><p>Keep the ideas that matter. Revisit them when you need them.</p></div><Link href="/learning/notes">Explore notes <ArrowUpRight size={16} /></Link></header>
    <div className={styles.stats}><div><Bookmark size={19} /><strong>{items.length}</strong><span>Saved bookmarks</span></div><div><Library size={19} /><strong>{new Set(items.map(item => `${item.technology}:${item.title}`)).size}</strong><span>Source titles</span></div><div><Layers3 size={19} /><strong>{techs.length}</strong><span>Technologies & subjects</span></div></div>
    <section className={styles.toolbar} aria-label="Bookmark filters"><Label className={styles.search}><Search size={18} /><Input aria-label="Search bookmarks" placeholder="Search a key point, title or technology…" value={query} onChange={event => setQuery(event.target.value)} /></Label><NativeSelect aria-label="Filter bookmarks by technology" value={technology} onChange={event => setTechnology(event.target.value)}><NativeSelectOption value="">All technologies</NativeSelectOption>{techs.map(id => <NativeSelectOption key={id} value={id}>{name(id)}</NativeSelectOption>)}</NativeSelect><NativeSelect aria-label="Sort bookmarks" value={sort} onChange={event => setSort(event.target.value)}><NativeSelectOption value="newest">Newest first</NativeSelectOption><NativeSelectOption value="oldest">Oldest first</NativeSelectOption><NativeSelectOption value="title">Title A–Z</NativeSelectOption></NativeSelect></section>
    <div className={styles.results}><span role="status">{filtered.length} of {items.length} bookmarks{store?.owner === "demo" ? " · Saved in this browser" : ""}</span><div><button disabled={!filtered.length} onClick={() => void copy(bookmarkText(exportItems))}><Copy size={15} /> Copy results</button><button disabled={!filtered.length} onClick={download}><Download size={15} /> Export .txt</button></div></div>
    {!store || store.status === "loading" ? <div className={styles.empty} role="status">Loading your bookmarks…</div> : store.status === "error" ? <div className={styles.empty} role="alert"><h2>We couldn’t load your bookmarks</h2><p>Your saved notes have not been changed.</p><button onClick={store.refresh}>Try again</button></div> : store.status === "signin" ? <div className={styles.empty}><h2>Save your personal reference library</h2><Link href="/sign-in">Sign in to view bookmarks</Link></div> : !items.length ? <div className={styles.empty}><Bookmark size={34} /><h2>A home for your most useful ideas</h2><p>Use Bookmark on a notes card, or save individual points inside Learn in App. They’ll appear here with their source title and technology.</p><Link href="/learning/notes">Find your first key note <ArrowUpRight size={16} /></Link></div> : !filtered.length ? <div className={styles.empty}><Search size={30} /><h2>No matching bookmarks</h2><p>Try another phrase or clear your technology filter.</p><button onClick={() => { setQuery(""); setTechnology(""); }}>Clear filters</button></div> : <div className={styles.groups}>{groups.map(group => <section key={`${group.technology}:${group.title}`} className={styles.group}><header><span className={styles.tag}>{name(group.technology)}</span><h2>{group.title}</h2><small>{group.items.length} saved {group.items.length === 1 ? "bookmark" : "bookmarks"}</small></header><div>{group.items.map(item => <article className={styles.entry} key={item.id}><ul>{item.points.map((point, index) => <li key={index}>{point}</li>)}</ul><footer><span>Saved {new Date(item.savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span><div><Link href={item.href} aria-label={`Open source: ${item.title}`}>Open source <ArrowUpRight size={14} /></Link><button aria-label={`Copy bookmark: ${item.title}`} onClick={() => void copy(bookmarkText([{ ...item, technology: name(item.technology) }]))}><Copy size={15} /></button><button disabled={store.busy} aria-label={`Remove bookmark: ${item.title}`} onClick={() => void remove(item)}><Trash2 size={15} /></button></div></footer></article>)}</div></section>)}</div>}
  </div>;
}
