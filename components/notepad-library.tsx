"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, FileText, Star, X, Image as ImageIcon, GitBranch, Table2, Pencil, Save, Trash2 } from "lucide-react";
import { documentText, type NotepadFile } from "@/lib/notepad-library";
import { Pager } from "./super-admin-pager";
import styles from "./super-admin-notepad.module.css";

/** Documents per page in My documents. */
const PER_PAGE = 3;

/** Wraps each search term in <mark> so a suggestion shows why it matched. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part)}</>;
}

/** About 100 characters of the document around the first term it contains, so content matches are visible. */
const snippet = (text: string, terms: string[]) => {
  const at = Math.min(...terms.map(term => text.toLowerCase().indexOf(term)).filter(index => index >= 0));
  if (!Number.isFinite(at) || at < 40) return text.slice(0, 100);
  return `…${text.slice(at - 30, at + 70)}`;
};

export function NotepadLibrary({
  files,
  activeId,
  activeTitle,
  onOpen,
  onDelete,
  onSave
}: {
  files: NotepadFile[];
  activeId: string;
  activeTitle: string;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  onSave?: (id: string) => void;
}) {
  const [deletingFile, setDeletingFile] = useState<NotepadFile | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(false);
  const [kind, setKind] = useState("all");
  const [media, setMedia] = useState("all");
  const [starred, setStarred] = useState(false);
  const [sort, setSort] = useState("recent");
  const [after, setAfter] = useState("");
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const indexed = useMemo(() => files.map(file => ({ ...file, text: documentText(file.html) })), [files]);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = indexed.filter(file => {
    const title = file.id === activeId ? activeTitle : file.title;
    return terms.every(term => `${title} ${file.text}`.toLowerCase().includes(term))
      && (kind === "all" || file.kind === kind) && (!starred || file.starred)
      && (!after || file.updatedAt.slice(0, 10) >= after)
      && (media === "all" || media === "images" && /<img\b/i.test(file.html) || media === "tables" && /<table\b/i.test(file.html) || media === "diagrams" && file.html.includes("data-notepad-diagram"));
  }).sort((a, b) => sort === "name" ? a.title.localeCompare(b.title) : sort === "oldest" ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt));
  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const visible = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const proposed = terms.length ? results.slice(0, 5) : [];
  const open = (id: string) => { onOpen(id); setSuggestions(false); setHighlight(-1); };
  return <div className={styles.library}>
    <div className={styles.libraryHead}><div><strong>My documents</strong><small>Saved in this browser · HTML exports include embedded images and diagrams.</small></div>
      <div className={styles.librarySearch}>
        <Search size={16} aria-hidden="true"/>
        <input role="combobox" aria-label="Search saved documents" aria-autocomplete="list" aria-expanded={suggestions && proposed.length > 0} aria-controls="notepad-suggestions" aria-activedescendant={suggestions && highlight >= 0 ? `notepad-suggestion-${highlight}` : undefined} placeholder="Search names and contents…" value={query} onFocus={() => setSuggestions(true)} onBlur={() => setSuggestions(false)} onChange={e => { setQuery(e.target.value); setPage(1); setSuggestions(true); setHighlight(-1); }} onKeyDown={e => {
          if (e.key === "Escape") setSuggestions(false);
          if (e.key === "ArrowDown") { e.preventDefault(); setSuggestions(true); setHighlight(value => Math.min(value + 1, proposed.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(value => Math.max(0, value - 1)); }
          if (e.key === "Enter" && suggestions && proposed[highlight]) { e.preventDefault(); open(proposed[highlight].id); }
        }} />
        {query && <button type="button" aria-label="Clear document search" onClick={() => { setQuery(""); setPage(1); setHighlight(-1); }}><X size={15} aria-hidden="true"/></button>}
        {suggestions && proposed.length > 0 && <ul id="notepad-suggestions" role="listbox" aria-label="Suggested documents" className={styles.suggestions}>{proposed.map((file, index) => <li role="option" id={`notepad-suggestion-${index}`} aria-selected={highlight === index} key={file.id} onMouseDown={e => e.preventDefault()} onClick={() => open(file.id)}><FileText size={16} aria-hidden="true"/><span><b><Highlight text={(file.id === activeId ? activeTitle : file.title) || "Untitled document"} terms={terms}/></b><small>{file.text ? <Highlight text={snippet(file.text, terms)} terms={terms}/> : "Empty document"}</small></span></li>)}</ul>}
      </div>
      <button type="button" aria-label="Filter saved documents" aria-expanded={filters} aria-controls="notepad-filters" onClick={() => setFilters(value => !value)}><SlidersHorizontal size={17} aria-hidden="true"/></button>
    </div>
    {filters && <div id="notepad-filters" className={styles.libraryFilters}>
      <label>Status<select value={kind} onChange={e => { setKind(e.target.value); setPage(1); }}><option value="all">All documents</option><option value="draft">Drafts</option><option value="saved">Saved copies</option><option value="imported">Imported</option></select></label>
      <label>Contains<select value={media} onChange={e => { setMedia(e.target.value); setPage(1); }}><option value="all">Any content</option><option value="images">Images</option><option value="tables">Tables</option><option value="diagrams">Workflows / diagrams</option></select></label>
      <label>Sort<select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="recent">Recently saved</option><option value="oldest">Oldest saved</option><option value="name">Name A–Z</option></select></label>
      <label>Saved since (UTC)<input type="date" value={after} onChange={e => { setAfter(e.target.value); setPage(1); }}/></label>
      <button type="button" aria-label="Show starred documents" aria-pressed={starred} onClick={() => { setStarred(value => !value); setPage(1); }}><Star size={17} aria-hidden="true"/></button>
      <button type="button" aria-label="Reset document filters" onClick={() => { setKind("all"); setMedia("all"); setAfter(""); setStarred(false); setSort("recent"); setPage(1); }}><X size={17} aria-hidden="true"/></button>
    </div>}
    <div role="tablist" aria-label="Saved documents" className={styles.documentTabs}>
      {visible.map((file, index) => (
        <div key={file.id} className={styles.documentCard} data-active={file.id === activeId}>
          <button
            type="button"
            role="tab"
            id={`notepad-tab-${file.id}`}
            aria-label={file.id === activeId ? activeTitle || "Untitled document" : file.title || "Untitled document"}
            aria-selected={file.id === activeId}
            aria-controls="notepad-document-panel"
            className={styles.documentTabBtn}
            onClick={() => open(file.id)}
            onKeyDown={e => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const next = visible[(index + (e.key === "ArrowRight" ? 1 : -1) + visible.length) % visible.length];
                document.getElementById(`notepad-tab-${next.id}`)?.focus();
                open(next.id);
              }
            }}
          >
            <FileText size={17} aria-hidden="true" />
            <span>
              <b>{file.id === activeId ? activeTitle || "Untitled document" : file.title || "Untitled document"}</b>
              <small>{file.kind} · {new Date(file.updatedAt).toLocaleDateString()}</small>
            </span>
            {file.starred && <Star size={13} aria-hidden="true" />}
            {/<img\b/i.test(file.html) && <ImageIcon size={13} aria-hidden="true" />}
            {file.html.includes("data-notepad-diagram") ? <GitBranch size={13} aria-hidden="true" /> : /<table\b/i.test(file.html) && <Table2 size={13} aria-hidden="true" />}
          </button>

          {/* Hover actions: Edit, Save/Download, Delete */}
          <div className={styles.documentCardHoverActions}>
            <button
              type="button"
              className={styles.cardActionBtn}
              data-action="edit"
              aria-label={`Edit ${file.title || "document"}`}
              title="Edit document"
              onClick={e => {
                e.stopPropagation();
                open(file.id);
              }}
            >
              <Pencil size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.cardActionBtn}
              data-action="save"
              aria-label={`Save copy of ${file.title || "document"}`}
              title="Save / Download copy"
              onClick={e => {
                e.stopPropagation();
                onSave?.(file.id);
              }}
            >
              <Save size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.cardActionBtn}
              data-action="delete"
              aria-label={`Delete ${file.title || "document"}`}
              title="Delete document"
              onClick={e => {
                e.stopPropagation();
                setDeletingFile(file);
              }}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Delete Confirmation Dialog */}
    {deletingFile && (
      <div className={styles.deleteConfirmOverlay} role="dialog" aria-modal="true" aria-label="Confirm delete document">
        <div className={styles.deleteConfirmBox}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b91c1c", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
            <Trash2 size={16} aria-hidden="true" />
            <span>Delete Document</span>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
            Are you sure you want to permanently delete <b>"{deletingFile.title || "Untitled document"}"</b>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              className={styles.deleteCancelBtn}
              onClick={() => setDeletingFile(null)}
              aria-label="Cancel deletion"
            >
              <X size={13} aria-hidden="true" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              className={styles.deleteConfirmBtn}
              onClick={() => {
                const id = deletingFile.id;
                setDeletingFile(null);
                onDelete?.(id);
              }}
              aria-label="Confirm permanent deletion"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Delete permanently</span>
            </button>
          </div>
        </div>
      </div>
    )}
    {!results.length && <p className={styles.libraryEmpty}>No documents match your search and filters.</p>}
    <div className={styles.pagination}><Pager page={current} pages={totalPages} total={results.length} size={PER_PAGE} onPage={setPage}/></div>
  </div>;
}
