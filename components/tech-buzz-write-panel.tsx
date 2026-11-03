"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { Check, Circle, Eye, FileText, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { INK_LIMITS, WRITE_TECHNOLOGIES, type InkListItem, type InkStatus, type InkStory } from "@/lib/tech-buzz-ink";
import styles from "./tech-buzz-write-panel.module.css";

/*
 * The panel beside the Slate - Ink editor. Details edits the story's settings, which autosave with the draft through
 * /api/tech-buzz/write; the checklist mirrors the checks that route makes before publishing. Stories lists the writer's
 * stories from Supabase, with search, filters and a delete that asks first.
 */
type PanelMeta = { technology: string; tags: string; takeaways: string; founderTakeaway: string };
const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const FILTERS = [{ id: "all", label: "All" }, { id: "draft", label: "Drafts" }, { id: "published", label: "Published" }] as const;
const TECHNOLOGY_ITEMS = WRITE_TECHNOLOGIES.map(item => ({ value: item.id, label: item.label }));

export function WritePanel({ meta, story, words, status, stateLine, activeId, stories, onEdit, onDelete }: {
  meta: PanelMeta; story: InkStory; words: number; status: InkStatus; stateLine: string; activeId?: string; stories: InkListItem[];
  onEdit: (patch: Partial<PanelMeta>) => void; onDelete: (item: InkListItem) => Promise<void>;
}) {
  const [tagDraft, setTagDraft] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [pending, setPending] = useState<InkListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tech = WRITE_TECHNOLOGIES.find(item => item.id === meta.technology) ?? WRITE_TECHNOLOGIES[0];
  const tags = meta.tags.split(",").map(tag => tag.trim()).filter(Boolean);
  const minutes = Math.max(1, Math.round(words / 220));
  const checks = [
    { label: "A title", done: !!story.title },
    { label: "A subtitle of 10 characters or more", done: story.subtitle.length >= 10 },
    { label: "A section with a heading and text", done: story.sections.some(section => section.heading && section.paragraphs.length > 0) },
    { label: `${INK_LIMITS.minPublishWords} words or more (${words} so far)`, done: words >= INK_LIMITS.minPublishWords },
  ];
  const doneCount = checks.filter(check => check.done).length;

  const counts = useMemo(() => ({ all: stories.length, draft: stories.filter(item => item.status === "draft").length, published: stories.filter(item => item.status === "published").length }), [stories]);
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stories.filter(item => (filter === "all" || item.status === filter) && (!needle || item.title.toLowerCase().includes(needle)));
  }, [stories, filter, query]);

  const addTag = () => {
    const tag = tagDraft.replace(/,/g, " ").trim();
    setTagDraft("");
    if (!tag || tags.length >= INK_LIMITS.tags || tags.some(item => item.toLowerCase() === tag.toLowerCase())) return;
    onEdit({ tags: [...tags, tag].join(", ") });
  };
  const onTagKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); }
    else if (event.key === "Backspace" && !tagDraft && tags.length) onEdit({ tags: tags.slice(0, -1).join(", ") });
  };
  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    await onDelete(pending);
    setDeleting(false);
    setPending(null);
  };

  return <aside className={styles.panel} aria-label="Story settings and your stories">
    <Tabs defaultValue="details">
      <TabsList className={styles.tabs} aria-label="Panel">
        <TabsTab value="details" className={styles.tab}><Pencil size={14} aria-hidden="true" />Details</TabsTab>
        <TabsTab value="stories" className={styles.tab}><FileText size={14} aria-hidden="true" />Your stories<small>{stories.length}</small></TabsTab>
      </TabsList>

      <TabsPanel value="details" className={styles.body}>
        <section className={styles.status} aria-label="Story status">
          <div className={styles.statusTop}>
            <Badge variant={status === "published" ? "default" : "secondary"}>{status === "published" ? "Published" : "Draft"}</Badge>
            <span aria-live="polite">{stateLine}</span>
          </div>
          <p className={styles.stats}><b>{words.toLocaleString("en-IN")}</b> words<i aria-hidden="true" /><b>{minutes}</b> min read</p>
          <div className={styles.meter} role="progressbar" aria-label="Ready to publish" aria-valuemin={0} aria-valuemax={checks.length} aria-valuenow={doneCount}><span style={{ width: `${(doneCount / checks.length) * 100}%` }} /></div>
          <ul className={styles.checks} aria-label="Needed before publishing">
            {checks.map(check => <li key={check.label} data-done={check.done || undefined}>
              {check.done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
              <span>{check.label}<span className={styles.srOnly}>{check.done ? ", done" : ", not done yet"}</span></span>
            </li>)}
          </ul>
        </section>

        <div className={styles.field}>
          <Label htmlFor="write-technology">Technology</Label>
          <Select items={TECHNOLOGY_ITEMS} value={meta.technology} onValueChange={value => { if (value) onEdit({ technology: String(value) }); }}>
            <SelectTrigger id="write-technology" className={styles.select}><SelectValue /></SelectTrigger>
            <SelectContent>
              {WRITE_TECHNOLOGIES.map(item => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className={styles.hint}><Image src={`/images/tech/${tech.id}.png`} alt="" width={16} height={16} />Files under {tech.category}</p>
        </div>

        <div className={styles.field}>
          <Label htmlFor="write-tags">Tags <small>{tags.length} of {INK_LIMITS.tags}</small></Label>
          {tags.length > 0 && <ul className={styles.tags} aria-label="Tags on this story">
            {tags.map(tag => <li key={tag}>{tag}<button type="button" aria-label={`Remove tag ${tag}`} onClick={() => onEdit({ tags: tags.filter(item => item !== tag).join(", ") })}><X size={12} aria-hidden="true" /></button></li>)}
          </ul>}
          <div className={styles.tagAdd}>
            <Input id="write-tags" value={tagDraft} disabled={tags.length >= INK_LIMITS.tags} placeholder={tags.length >= INK_LIMITS.tags ? "Remove a tag to add another" : "Type a tag, press Enter"} onChange={event => setTagDraft(event.target.value)} onKeyDown={onTagKey} onBlur={addTag} />
            <Button type="button" variant="outline" size="icon" aria-label="Add tag" disabled={!tagDraft.trim() || tags.length >= INK_LIMITS.tags} onClick={addTag}><Plus size={15} aria-hidden="true" /></Button>
          </div>
        </div>

        <div className={styles.field}>
          <Label htmlFor="write-takeaways">Key takeaways <small>One per line, up to 5</small></Label>
          <Textarea id="write-takeaways" rows={4} value={meta.takeaways} placeholder="What readers should remember" onChange={event => onEdit({ takeaways: event.target.value })} />
        </div>

        <div className={styles.field}>
          <Label htmlFor="write-closing">Closing takeaway <small>{meta.founderTakeaway.length} of 600</small></Label>
          <Textarea id="write-closing" rows={3} maxLength={600} value={meta.founderTakeaway} placeholder="A short closing thought for the reader's next project" onChange={event => onEdit({ founderTakeaway: event.target.value })} />
        </div>
      </TabsPanel>

      <TabsPanel value="stories" className={styles.body}>
        <Button variant="outline" size="sm" className={styles.newStory} nativeButton={false} render={<Link href="/tech-buzz/write" onClick={event => { if (!activeId) event.preventDefault(); }} />}><Plus size={15} aria-hidden="true" />New story</Button>
        <div className={styles.search}>
          <Search size={15} aria-hidden="true" />
          <Input type="search" aria-label="Search your stories" placeholder="Search your stories" value={query} onChange={event => setQuery(event.target.value)} />
        </div>
        <div className={styles.filters} role="group" aria-label="Filter stories">
          {FILTERS.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}<small>{counts[item.id]}</small></button>)}
        </div>
        {shown.length > 0
          ? <ul className={styles.stories}>
            {shown.map(item => <li key={item.id} aria-current={item.id === activeId ? "true" : undefined}>
              <a href={`/tech-buzz/write?id=${item.id}`} className={styles.storyTitle}>{item.title}</a>
              <div className={styles.storyMeta}>
                <Badge variant={item.status === "published" ? "default" : "secondary"}>{item.status === "published" ? "Published" : "Draft"}</Badge>
                <span>{DATE.format(Date.parse(item.status === "published" ? item.publishedAt : item.updatedAt))}</span>
                <span className={styles.storyActions}>
                  {item.status === "published" && <Button variant="ghost" size="icon-xs" aria-label={`View ${item.title}`} title="View on Tech Buzz" nativeButton={false} render={<Link href={`/tech-buzz/${item.slug}`} />}><Eye size={14} aria-hidden="true" /></Button>}
                  <Button type="button" variant="ghost" size="icon-xs" aria-label={`Delete ${item.title}`} title="Delete" onClick={() => setPending(item)}><Trash2 size={14} aria-hidden="true" /></Button>
                </span>
              </div>
            </li>)}
          </ul>
          : <p className={styles.empty}>{stories.length ? "No story matches. Clear the search or choose another filter." : "Your drafts and published stories will appear here once you save one."}</p>}
      </TabsPanel>
    </Tabs>

    <Dialog open={!!pending} onOpenChange={open => { if (!open && !deleting) setPending(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this story?</DialogTitle>
          <DialogDescription>&ldquo;{pending?.title}&rdquo; will be deleted for good.{pending?.status === "published" ? " It will also be removed from Tech Buzz." : ""}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" disabled={deleting} />}>Keep story</DialogClose>
          <Button type="button" variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>{deleting && <Loader2 size={15} className={styles.spin} aria-hidden="true" />}Delete story</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </aside>;
}
