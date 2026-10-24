"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Undo2, Redo2, Scissors, Copy, ClipboardPaste, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, IndentIncrease, IndentDecrease, Eraser, Highlighter, Minus, Unlink, Link2, FilePlus2, Save, FileDown, Printer, ImagePlus, Table2, FilePlus, Download, X, Check, Type, Heading, ALargeSmall, PaintBucket, Star, Files, Trash2, GitBranch, ZoomIn, ZoomOut, Upload, type LucideIcon, ChevronDown, Wrench } from "lucide-react";
import { sanitizeNotepadHtml, notepadDocument, PAPER_COLORS } from "@/lib/notepad";
import { newNotepadFile, readNotepadCollection, workflowHtml, type NotepadFile } from "@/lib/notepad-library";
import { NotepadLibrary } from "./notepad-library";
import { PaperPicker } from "./notepad-paper-picker";
import styles from "./super-admin-notepad.module.css";

const COMMAND_ICONS: Record<string, LucideIcon> = { bold: Bold, italic: Italic, underline: Underline, strikeThrough: Strikethrough, subscript: Subscript, superscript: Superscript, undo: Undo2, redo: Redo2, insertUnorderedList: List, insertOrderedList: ListOrdered, justifyLeft: AlignLeft, justifyCenter: AlignCenter, justifyRight: AlignRight, justifyFull: AlignJustify, indent: IndentIncrease, outdent: IndentDecrease, removeFormat: Eraser, hiliteColor: Highlighter, insertHTML: FilePlus, insertHorizontalRule: Minus, unlink: Unlink };
function IconButton({ label, icon: Icon, ...props }: ComponentProps<"button"> & { label: string; icon: LucideIcon }) {
  return <button type="button" {...props} aria-label={label} data-tooltip={label}><Icon size={17} aria-hidden="true" /></button>;
}

export function SuperAdminNotepad({ userId }: { userId: string }) {
  const editor = useRef<HTMLDivElement>(null);
  const selection = useRef<Range | null>(null);
  const titleRef = useRef("Untitled document");
  const dirty = useRef(false);
  const backgroundRef = useRef("#ffffff");
  const [background, setBackground] = useState("#ffffff");
  const htmlRef = useRef("");
  const ready = useRef(false);
  const storedRef = useRef<string | null>(null);
  const filesRef = useRef<NotepadFile[]>([]);
  const activeIdRef = useRef("");
  const [files, setFiles] = useState<NotepadFile[]>([]);
  const [activeId, setActiveId] = useState("");
  const [exportName, setExportName] = useState("");
  const [exportCopy, setExportCopy] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);
  const [diagramType, setDiagramType] = useState("workflow");
  const [diagramText, setDiagramText] = useState("Plan\nReview\nPublish");
  const [zoom, setZoom] = useState(100);
  // Tools panel open/closed is a per-viewer convenience, so it is remembered in this browser only.
  const [toolsOpen, setToolsOpen] = useState(true);
  const toggleTools = () => setToolsOpen(value => { try { localStorage.setItem("masterclass:notepad-tools", value ? "closed" : "open"); } catch {} return !value; });
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("Untitled document");
  const [status, setStatus] = useState("Drafts are saved in this browser only.");
  const [error, setError] = useState("");
  const [words, setWords] = useState(0);
  const [saveAs, setSaveAs] = useState(false);
  const [format, setFormat] = useState("html");
  const [tableOpen, setTableOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [active, setActive] = useState<string[]>([]);
  const key = `masterclass:admin-notepad:${userId}`;
  const count = () => setWords((editor.current?.textContent || "").trim().split(/\s+/).filter(Boolean).length);
  const changed = () => { htmlRef.current = editor.current?.innerHTML || ""; dirty.current = true; setStatus("Unsaved changes · autosave every 2 minutes"); count(); };
  const writeCollection = useCallback((documents: NotepadFile[], selected: string) => {
    const file = documents.find(item => item.id === selected);
    if (!file || !ready.current) return false;
    try {
      if (localStorage.getItem(key) !== storedRef.current) {
        setError("The document library changed in another tab. Export your current work, then reload to open the latest library."); return false;
      }
      // Store each document once, including its embedded images.
      const serialized = JSON.stringify({ version: 2, activeId: selected, documents });
      localStorage.setItem(key, serialized); storedRef.current = serialized;
      filesRef.current = documents; setFiles(documents);
      setError(""); return true;
    } catch { setError("Draft could not be saved. Browser storage may be full or unavailable. Export a file to download your work."); return false; }
  }, [key, setError, setFiles]);
  const persist = useCallback(() => {
    if (!ready.current) return false;
    const previous = filesRef.current.find(file => file.id === activeIdRef.current);
    if (!previous) return false;
    const file = { ...previous, title: titleRef.current || "Untitled document", html: editor.current?.innerHTML ?? htmlRef.current, background: backgroundRef.current, updatedAt: new Date().toISOString() };
    if (!writeCollection(filesRef.current.map(item => item.id === file.id ? file : item), file.id)) return false;
    dirty.current = false; setStatus(`Saved in this browser at ${new Date(file.updatedAt).toLocaleTimeString()}`); return true;
  }, [writeCollection]);
  const loadDocument = useCallback((file: NotepadFile) => {
    activeIdRef.current = file.id; setActiveId(file.id);
    titleRef.current = file.title; setTitle(file.title);
    backgroundRef.current = file.background; setBackground(file.background);
    htmlRef.current = sanitizeNotepadHtml(file.html);
    if (editor.current) editor.current.innerHTML = htmlRef.current;
    selection.current = null; dirty.current = false; setActive([]);
    setWords((editor.current?.textContent || "").trim().split(/\s+/).filter(Boolean).length);
    setClearOpen(false); setDiagramOpen(false); setTableOpen(false);
    setStatus("Opened saved document. Edits autosave every 2 minutes.");
  }, []);
  function openDocument(id: string) {
    if (id === activeIdRef.current) return;
    if (dirty.current && !persist()) return;
    const file = filesRef.current.find(item => item.id === id);
    if (file && writeCollection(filesRef.current, id)) loadDocument(file);
  }
  function openExport(copy = false) { setExportCopy(copy); setExportName(titleRef.current); setSaveAs(true); }
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
    if (cancelled) return;
    try { if (localStorage.getItem("masterclass:notepad-tools") === "closed") setToolsOpen(false); } catch {}
    try {
      storedRef.current = localStorage.getItem(key);
      const collection = readNotepadCollection(storedRef.current);
      filesRef.current = collection.documents; setFiles(collection.documents);
      loadDocument(collection.documents.find(file => file.id === collection.activeId)!);
      ready.current = true;
    } catch { setError("Could not restore the browser library. The saved data has not been overwritten. You can still export the current document."); }
    });
    const timer = window.setInterval(() => { if (dirty.current) persist(); }, 120_000);
    const onHide = () => { if (document.visibilityState === "hidden" && dirty.current) persist(); };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty.current && !persist()) { event.preventDefault(); event.returnValue = ""; } };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", beforeUnload);
    return () => { cancelled = true; if (dirty.current) persist(); clearInterval(timer); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("beforeunload", beforeUnload); };
  }, [key, persist, loadDocument]);
  useEffect(() => {
    function remember() {
      const current = window.getSelection();
      if (current?.rangeCount && editor.current?.contains(current.anchorNode) && editor.current.contains(current.focusNode)) {
        selection.current = current.getRangeAt(0).cloneRange();
        setActive(["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"].filter(command => document.queryCommandState?.(command)));
      }
    }
    document.addEventListener("selectionchange", remember);
    return () => document.removeEventListener("selectionchange", remember);
  }, []);
  function restore() {
    editor.current?.focus();
    const current = window.getSelection();
    if (selection.current && editor.current?.contains(selection.current.commonAncestorContainer)) {
      current?.removeAllRanges(); current?.addRange(selection.current);
    }
  }
  // Native editing commands retain the browser's undo history and selection.
  function command(name: string, value?: string) {
    restore();
    document.execCommand(name, false, value);
    changed();
  }
  function download() {
    const html = editor.current?.innerHTML || "";
    const name = exportName.trim() || titleRef.current || "Untitled document";
    const contents = format === "txt" ? editor.current?.innerText || editor.current?.textContent || "" : format === "json" ? JSON.stringify({ title: name, html: sanitizeNotepadHtml(html), background }, null, 2) : notepadDocument(name, html, background);
    if (exportCopy) createDocument(html, name, background, "saved"); else persist();
    // Downloads remain available when browser storage is full.
    const url = URL.createObjectURL(new Blob([contents], { type: format === "txt" ? "text/plain;charset=utf-8" : format === "json" ? "application/json" : "text/html;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")}.${format}`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setSaveAs(false);
  }
  function createDocument(html: string, name: string, paper = "#ffffff", kind: NotepadFile["kind"] = "draft") {
    if (dirty.current && !persist()) return false;
    const color = PAPER_COLORS.some(item => item.value === paper) ? paper : "#ffffff";
    const file = newNotepadFile(name || "Untitled document", sanitizeNotepadHtml(html), color, kind);
    if (!writeCollection([...filesRef.current, file], file.id)) return false;
    loadDocument(file); return true;
  }
  function toggleStar() {
    if (dirty.current && !persist()) return;
    writeCollection(filesRef.current.map(file => file.id === activeIdRef.current ? { ...file, starred: !file.starred } : file), activeIdRef.current);
  }
  async function openFile(file?: File) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setError("Open a document smaller than 20 MB."); return; }
    try {
      const text = await file.text();
      if (!/\.(txt|html?|md|json)$/i.test(file.name)) { setError("Open an HTML, TXT, Markdown text, or Notepad JSON file. DOCX is not supported."); return; }
      if (/\.json$/i.test(file.name)) {
        const data = JSON.parse(text);
        if (typeof data.title !== "string" || typeof data.html !== "string") throw new Error("Invalid Notepad file");
        createDocument(data.html, data.title.slice(0, 120), data.background, "imported"); return;
      }
      const plain = document.createElement("div"); plain.textContent = text; plain.style.whiteSpace = "pre-wrap";
      createDocument(/\.html?$/i.test(file.name) ? sanitizeNotepadHtml(text) : plain.outerHTML, file.name.replace(/\.[^.]+$/, ""), new DOMParser().parseFromString(text, "text/html").querySelector("meta[name=notepad-paper]")?.getAttribute("content") || "#ffffff", "imported");
    } catch { setError("This file could not be opened."); }
  }
  async function images(files: FileList | null) {
    if (!files) return;
    const targetDocument = activeIdRef.current;
    for (const file of Array.from(files)) {
      if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) { setError("Images must be PNG, JPEG, GIF or WebP, up to 2 MB each."); continue; }
      try {
        const src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
        if (activeIdRef.current !== targetDocument) { setError("The active document changed. Insert the images again in the intended document."); return; }
        command("insertHTML", `<img src="${src}" alt="Imported image"><p><br></p>`);
        const current = window.getSelection(); if (current?.rangeCount) selection.current = current.getRangeAt(0).cloneRange();
      } catch { setError("An image could not be read."); }
    }
  }
  async function clipboard(action: "copy" | "cut" | "paste") {
    restore();
    try {
      if (action === "paste") command("insertText", await navigator.clipboard.readText());
      else if (!document.execCommand(action)) throw new Error("Clipboard blocked");
      if (action === "cut") changed();
    } catch { setError(`Use ${navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+${action === "copy" ? "C" : action === "cut" ? "X" : "V"} in the document; your browser has restricted clipboard access.`); }
  }
  const tool = (label: string, name: string, value?: string) => <IconButton key={name} label={label} icon={COMMAND_ICONS[name]} aria-pressed={["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"].includes(name) ? active.includes(name) : undefined} onMouseDown={e => e.preventDefault()} onClick={() => command(name, value)} />;
  return <section className={styles.notepad} aria-label="Notepad">
    <NotepadLibrary files={files} activeId={activeId} activeTitle={title} onOpen={openDocument}/>
    <div id="notepad-document-panel" role="tabpanel" aria-label={title || "Untitled document"}>
    <div className={styles.filebar}>
      <label className={styles.title}>Document name<input aria-label="Document name" value={title} maxLength={120} onChange={e => { titleRef.current = e.target.value; setTitle(e.target.value); changed(); }} /></label>
      <div className={styles.actions}>
        <IconButton type="button" label="New document" icon={FilePlus2} onClick={() => createDocument("<p><br></p>", "Untitled document")} />
        <IconButton type="button" label="Import document from computer" icon={Upload} onClick={() => fileInput.current?.click()} />
        <IconButton type="button" label="Save draft" icon={Save} onClick={persist} />
        <IconButton label="Save as a new document" icon={Files} onClick={() => openExport(true)} />
        <IconButton label="Export / download document" icon={FileDown} onClick={() => openExport()} />
        <IconButton label="Duplicate document" icon={Copy} onClick={() => createDocument(editor.current?.innerHTML || "", `${title} (copy)`, background)} />
        <IconButton label="Star document" icon={Star} aria-pressed={files.find(file => file.id === activeId)?.starred || false} onClick={toggleStar} />
        <IconButton label="Clear document" icon={Trash2} onClick={() => setClearOpen(true)} />
        <IconButton type="button" label="Print / PDF" icon={Printer} onClick={() => { const preview = window.open("", "_blank"); if (!preview) { setError("Allow popups to print or save as PDF."); return; } preview.onload = () => preview.print(); preview.document.write(notepadDocument(title, editor.current?.innerHTML || "", background)); preview.document.close(); preview.focus(); }} />
      </div>
    </div>
    <input hidden aria-label="Import document file" ref={fileInput} type="file" accept=".txt,.html,.htm,.md,.json" onChange={e => { void openFile(e.target.files?.[0]); e.target.value = ""; }} />
    <input hidden ref={imageInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple onChange={e => { void images(e.target.files); e.target.value = ""; }} />
    <div className={styles.tools}>
    <div className={styles.toolsHead}>
      <button type="button" className={styles.toolsToggle} aria-expanded={toolsOpen} aria-controls="notepad-tools" onClick={toggleTools}><Wrench size={15} aria-hidden="true"/><span>Tools</span><ChevronDown size={15} aria-hidden="true"/></button>
      <div className={styles.status}><span>{words} words</span><span className={styles.zoom}><IconButton label="Zoom out" icon={ZoomOut} disabled={zoom <= 60} onClick={() => setZoom(value => value - 10)}/>{zoom}%<IconButton label="Zoom in" icon={ZoomIn} disabled={zoom >= 160} onClick={() => setZoom(value => value + 10)}/></span><span role="status">{status}</span><span className={styles.shortcut}>Ctrl/⌘+S saves draft · Shift+Ctrl/⌘+S exports</span></div>
    </div>
    <div id="notepad-tools" className={styles.ribbon} role="group" aria-label="Document formatting" hidden={!toolsOpen}>
      <div className={styles.group} aria-label="Clipboard and history">{tool("Undo", "undo")}{tool("Redo", "redo")}{(["cut", "copy", "paste"] as const).map(action => <IconButton key={action} label={action[0].toUpperCase() + action.slice(1)} icon={action === "cut" ? Scissors : action === "copy" ? Copy : ClipboardPaste} onMouseDown={e => e.preventDefault()} onClick={() => void clipboard(action)} />)}</div>
      <div className={styles.group}>
        <label className={styles.iconField} data-tooltip="Paragraph style"><Heading size={18} aria-hidden="true"/><select aria-label="Paragraph style" defaultValue="p" onChange={e => command("formatBlock", e.target.value)}>{["p", "h1", "h2", "h3", "blockquote", "pre"].map((tag, i) => <option key={tag} value={tag}>{["Normal text", "Heading 1", "Heading 2", "Heading 3", "Quote", "Code"][i]}</option>)}</select></label>
        <label className={styles.iconField} data-tooltip="Font family"><Type size={18} aria-hidden="true"/><select aria-label="Font family" defaultValue="Arial" onChange={e => command("fontName", e.target.value)}>{["Arial", "Calibri", "Georgia", "Times New Roman", "Verdana", "Courier New"].map(font => <option key={font}>{font}</option>)}</select></label>
        <label className={styles.iconField} data-tooltip="Font size"><ALargeSmall size={18} aria-hidden="true"/><select aria-label="Font size" defaultValue="3" onChange={e => command("fontSize", e.target.value)}>{[10, 13, 16, 18, 24, 32, 48].map((size, i) => <option key={size} value={i + 1}>{size}</option>)}</select></label>
      </div>
      <div className={styles.group}>{tool("Bold", "bold")}{tool("Italic", "italic")}{tool("Underline", "underline")}{tool("Strikethrough", "strikeThrough")}{tool("Subscript", "subscript")}{tool("Superscript", "superscript")}{tool("Clear formatting", "removeFormat")}</div>
      <div className={styles.group}>
        <label className={styles.iconField} data-tooltip="Text color"><Type size={18} aria-hidden="true"/><input aria-label="Text color" type="color" defaultValue="#262624" onChange={e => command("foreColor", e.target.value)} /></label>
        <label className={styles.iconField} data-tooltip="Highlight color"><Highlighter size={18} aria-hidden="true"/><input aria-label="Highlight color" type="color" defaultValue="#fff176" onChange={e => command("hiliteColor", e.target.value)} /></label>
        {tool("Yellow marker", "hiliteColor", "#fff176")}
        <label className={styles.iconField} data-tooltip="Text background color"><PaintBucket size={18} aria-hidden="true"/><input aria-label="Text background color" type="color" defaultValue="#e4efff" onChange={e => command("hiliteColor", e.target.value)} /></label>
      </div>
      <div className={styles.group}>{tool("Bullets", "insertUnorderedList")}{tool("Numbering", "insertOrderedList")}{tool("Align left", "justifyLeft")}{tool("Center", "justifyCenter")}{tool("Align right", "justifyRight")}{tool("Justify", "justifyFull")}{tool("Indent", "indent")}{tool("Outdent", "outdent")}</div>
      <div className={styles.group}>
        <IconButton type="button" label="Insert images" icon={ImagePlus} onClick={() => imageInput.current?.click()} />
        <IconButton label="Insert workflow or diagram" icon={GitBranch} onClick={() => setDiagramOpen(value => !value)} />
        <IconButton type="button" label="Insert table" icon={Table2} onClick={() => setTableOpen(value => !value)} />
        {tool("New page", "insertHTML", '<div style="break-before:page;page-break-before:always"><br></div>')}
        {tool("Horizontal rule", "insertHorizontalRule")}
        <IconButton type="button" label="Insert link" icon={Link2} onMouseDown={e => e.preventDefault()} onClick={() => { const url = window.prompt("Link URL (https://…)"); if (url && /^https?:\/\//i.test(url)) command("createLink", url); else if (url) setError("Use an http:// or https:// link."); }} />
        {tool("Remove link", "unlink")}
      </div>
      <div className={styles.group}><PaperPicker value={background} onChange={color => { backgroundRef.current = color; setBackground(color); changed(); }}/></div>
    </div>
    </div>
    {clearOpen && <div className={styles.options} role="alertdialog" aria-label="Clear document confirmation"><p>Clear all content in this document? A recovery copy will be saved first.</p><IconButton label="Confirm clear document" icon={Check} onClick={() => {
      if (!persist()) return;
      const original = filesRef.current.find(file => file.id === activeIdRef.current)!;
      const recovery = { ...original, id: crypto.randomUUID(), title: `${original.title} (before clear)`, createdAt: new Date().toISOString() };
      if (!writeCollection([...filesRef.current, recovery], original.id)) return;
      editor.current!.innerHTML = ""; selection.current = null; changed(); persist(); setClearOpen(false);
    }} /><IconButton label="Cancel clear document" icon={X} onClick={() => setClearOpen(false)} /></div>}
    {diagramOpen && <form className={styles.options} aria-label="Workflow and diagram builder" onSubmit={e => { e.preventDefault(); command("insertHTML", workflowHtml(diagramText, diagramType === "decision")); setDiagramOpen(false); }}><label>Diagram type<select value={diagramType} onChange={e => { setDiagramType(e.target.value); setDiagramText(e.target.value === "decision" ? "Ready to publish?\nPublish\nRevise" : "Plan\nReview\nPublish"); }}><option value="workflow">Workflow</option><option value="decision">Decision diagram</option></select></label><label>{diagramType === "decision" ? "Decision, yes outcome, no outcome (one per line)" : "Workflow steps (one per line, up to 12)"}<textarea aria-label="Diagram contents" rows={4} maxLength={2000} required value={diagramText} onChange={e => setDiagramText(e.target.value)}/></label><IconButton type="submit" label="Insert diagram" icon={Check}/><IconButton label="Cancel diagram" icon={X} onClick={() => setDiagramOpen(false)}/><small>Text and diagram cells remain editable. HTML and Notepad JSON exports preserve them.</small></form>}
    {tableOpen && <form className={styles.options} onSubmit={e => { e.preventDefault(); command("insertHTML", `<table><thead><tr>${Array.from({ length: columns }, (_, index) => `<th>Column ${index + 1}</th>`).join("")}</tr></thead><tbody>${Array.from({ length: rows }, () => `<tr>${"<td><br></td>".repeat(columns)}</tr>`).join("")}</tbody></table><p><br></p>`); setTableOpen(false); }}><label>Body rows<input type="number" min="1" max="20" required value={rows} onChange={e => setRows(Number(e.target.value))} /></label><label>Columns<input type="number" min="1" max="10" required value={columns} onChange={e => setColumns(Number(e.target.value))} /></label><IconButton type="submit" label="Add table" icon={Check} /><IconButton type="button" label="Cancel" icon={X} onClick={() => setTableOpen(false)} /></form>}
    {saveAs && <form className={styles.options} aria-label="Save as" onSubmit={e => { e.preventDefault(); download(); }}><label>Document / file name<input aria-label="Export document name" maxLength={120} required value={exportName} onChange={e => setExportName(e.target.value)}/></label><label>File format<select value={format} onChange={e => setFormat(e.target.value)}><option value="html">HTML — formatting, tables and images</option><option value="json">Notepad JSON - reopen with all content</option><option value="txt">Plain text — text only</option></select></label><IconButton type="submit" label="Download file" icon={Download} /><IconButton type="button" label="Cancel" icon={X} onClick={() => setSaveAs(false)} /><small>{exportCopy ? "Creates a separate saved document in your library and downloads it." : "Downloads this document. HTML / Notepad JSON retain embedded images, tables and diagrams; plain text omits them."} Use Print / PDF for a PDF copy.</small></form>}
    {error && <div className={styles.error} role="alert">{error}<IconButton type="button" label="Dismiss" icon={X} onClick={() => setError("")} /></div>}
    <div className={styles.canvas} data-zoomed={zoom > 100 || undefined}><div ref={editor} className={styles.paper} style={{ backgroundColor: background, zoom: zoom / 100 }} contentEditable suppressContentEditableWarning role="textbox" aria-label="Document content" aria-multiline="true" spellCheck onInput={changed} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (e.shiftKey) openExport(true); else persist(); } }} onPaste={e => { e.preventDefault(); const html = e.clipboardData.getData("text/html"); if (html) command("insertHTML", sanitizeNotepadHtml(html)); else command("insertText", e.clipboardData.getData("text/plain")); }} onDrop={e => { e.preventDefault(); setError("Use Insert images or Import document to add files; paste text with Ctrl+V / ⌘V."); }} /></div>
    </div>
  </section>;
}
