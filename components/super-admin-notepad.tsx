"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Undo2, Redo2,
  Scissors, Copy, ClipboardPaste, List, ListOrdered, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, IndentIncrease, IndentDecrease, Eraser, Highlighter,
  Minus, Unlink, Link2, FilePlus2, Save, FileDown, Printer, ImagePlus, Table2,
  FilePlus, Download, X, Check, Type, Heading, ALargeSmall, PaintBucket, Star,
  Files, Trash2, GitBranch, ZoomIn, ZoomOut, Upload, type LucideIcon, ChevronDown,
  ChevronUp, Wrench, Maximize2, Minimize2, FolderOpen,
  AArrowUp, AArrowDown, Baseline, CaseUpper, CaseLower, WrapText,
  AlertCircle, SquareCheck, Code, Code2, Clock, Sparkles, Search, Replace,
  Rows, Columns, BarChart2
} from "lucide-react";
import { sanitizeNotepadHtml, notepadDocument, PAPER_COLORS } from "@/lib/notepad";
import { newNotepadFile, readNotepadCollection, workflowHtml, type NotepadFile } from "@/lib/notepad-library";
import { downloadNotepadPdf } from "@/lib/notepad-pdf";
import { READING_FONTS } from "@/lib/tech-buzz-public";
import { loadGoogleFont } from "@/lib/google-fonts";
import { FontFamilyDropdown } from "./font-family-dropdown";
import { NotepadLibrary } from "./notepad-library";
import { PaperPicker } from "./notepad-paper-picker";
import styles from "./super-admin-notepad.module.css";

const COMMAND_ICONS: Record<string, LucideIcon> = {
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikeThrough: Strikethrough,
  subscript: Subscript,
  superscript: Superscript,
  undo: Undo2,
  redo: Redo2,
  insertUnorderedList: List,
  insertOrderedList: ListOrdered,
  justifyLeft: AlignLeft,
  justifyCenter: AlignCenter,
  justifyRight: AlignRight,
  justifyFull: AlignJustify,
  indent: IndentIncrease,
  outdent: IndentDecrease,
  removeFormat: Eraser,
  hiliteColor: Highlighter,
  insertHTML: FilePlus,
  insertHorizontalRule: Minus,
  unlink: Unlink
};

const FONT_FAMILIES = [
  "Arial",
  "Inter",
  "Roboto",
  "Calibri",
  "Segoe UI",
  "Helvetica",
  "Trebuchet MS",
  "Verdana",
  "Tahoma",
  "Georgia",
  "Times New Roman",
  "Garamond",
  "Merriweather",
  "Playfair Display",
  "Palatino",
  "Book Antiqua",
  "Courier New",
  "Consolas",
  "Monaco",
  "Fira Code",
  "Impact",
  "Century Gothic",
  "Comic Sans MS"
];

const FONT_SIZES = [9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72];

const FONT_STYLES = [
  { label: "Normal (Regular)", value: "normal" },
  { label: "Italic", value: "italic" },
  { label: "Bold", value: "bold" },
  { label: "Bold Italic", value: "bold-italic" },
  { label: "Light (300)", value: "weight-300" },
  { label: "Medium (500)", value: "weight-500" },
  { label: "Semi-Bold (600)", value: "weight-600" },
  { label: "Extra Bold (800)", value: "weight-800" },
  { label: "Black / Heavy (900)", value: "weight-900" },
  { label: "UPPERCASE", value: "uppercase" },
  { label: "lowercase", value: "lowercase" },
  { label: "Capitalize (Title Case)", value: "capitalize" },
];

const LINE_SPACINGS = [
  { label: "Single (1.0)", value: "1.0" },
  { label: "1.15", value: "1.15" },
  { label: "1.3", value: "1.3" },
  { label: "Normal (1.65)", value: "1.65" },
  { label: "1.8", value: "1.8" },
  { label: "Double (2.0)", value: "2.0" },
];

const SYMBOLS = [
  { char: "→", label: "Right arrow" },
  { char: "←", label: "Left arrow" },
  { char: "↑", label: "Up arrow" },
  { char: "↓", label: "Down arrow" },
  { char: "⇄", label: "Exchange arrow" },
  { char: "⇒", label: "Implies arrow" },
  { char: "✓", label: "Checkmark" },
  { char: "✗", label: "Cross" },
  { char: "★", label: "Black star" },
  { char: "☆", label: "White star" },
  { char: "•", label: "Bullet" },
  { char: "—", label: "Em dash" },
  { char: "–", label: "En dash" },
  { char: "…", label: "Ellipsis" },
  { char: "“", label: "Left quote" },
  { char: "”", label: "Right quote" },
  { char: "‘", label: "Left single quote" },
  { char: "’", label: "Right single quote" },
  { char: "©", label: "Copyright" },
  { char: "®", label: "Registered" },
  { char: "™", label: "Trademark" },
  { char: "€", label: "Euro" },
  { char: "£", label: "Pound" },
  { char: "¥", label: "Yen" },
  { char: "₹", label: "Rupee" },
  { char: "$", label: "Dollar" },
  { char: "°", label: "Degree" },
  { char: "±", label: "Plus-minus" },
  { char: "≠", label: "Not equal" },
  { char: "≈", label: "Almost equal" },
  { char: "≤", label: "Less than or equal" },
  { char: "≥", label: "Greater than or equal" },
  { char: "∞", label: "Infinity" },
  { char: "÷", label: "Division" },
  { char: "×", label: "Multiplication" },
  { char: "π", label: "Pi" },
  { char: "§", label: "Section" },
  { char: "¶", label: "Pilcrow" },
];

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
  const [maximized, setMaximized] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  // Tools panel open/closed is a per-viewer convenience, so it is remembered in this browser only.
  const [toolsOpen, setToolsOpen] = useState(true);
  const toggleTools = () => setToolsOpen(value => { try { localStorage.setItem("masterclass:notepad-tools", value ? "closed" : "open"); } catch {} return !value; });
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("Untitled document");
  const [status, setStatus] = useState("Drafts are saved in this browser only.");
  const [error, setError] = useState("");
  const [words, setWords] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [charCountNoSpaces, setCharCountNoSpaces] = useState(0);
  const [paraCount, setParaCount] = useState(0);
  const [statsOpen, setStatsOpen] = useState(false);
  const [saveAs, setSaveAs] = useState(false);
  const [format, setFormat] = useState("html");
  const [tableOpen, setTableOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [active, setActive] = useState<string[]>([]);

  // Font styling and rich text states
  const [fontSizeVal, setFontSizeVal] = useState("16");
  const [fontFamilyVal, setFontFamilyVal] = useState("Arial");
  const [fontStyleVal, setFontStyleVal] = useState("normal");
  const [lineSpacingVal, setLineSpacingVal] = useState("1.65");
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [findStatus, setFindStatus] = useState("");
  const [calloutOpen, setCalloutOpen] = useState(false);
  const [calloutType, setCalloutType] = useState<"info" | "tip" | "warning" | "alert" | "note">("info");
  const [calloutTitle, setCalloutTitle] = useState("Info");
  const [calloutText, setCalloutText] = useState("Important insight or reminder");
  const [symbolsOpen, setSymbolsOpen] = useState(false);

  const key = `masterclass:admin-notepad:${userId}`;
  const count = () => {
    const raw = editor.current ? (editor.current.innerText || editor.current.innerHTML.replace(/<[^>]+>/g, " ")) : "";
    const wordsArr = raw.trim().split(/\s+/).filter(Boolean);
    setWords(wordsArr.length);
    setCharCount((editor.current?.textContent || "").length);
    setCharCountNoSpaces((editor.current?.textContent || "").replace(/\s/g, "").length);
    const paras = (editor.current?.innerHTML || "").split(/<\/p>|<br\s*\/?>|<div>/i).filter(p => p.replace(/<[^>]+>/g, "").trim().length > 0);
    setParaCount(paras.length || (wordsArr.length ? 1 : 0));
  };

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
    const raw = file.html.replace(/<[^>]+>/g, " ");
    const wordsArr = raw.trim().split(/\s+/).filter(Boolean);
    setWords(wordsArr.length);
    setCharCount((editor.current?.textContent || "").length);
    setCharCountNoSpaces((editor.current?.textContent || "").replace(/\s/g, "").length);
    const paras = file.html.split(/<\/p>|<br\s*\/?>|<div>/i).filter(p => p.replace(/<[^>]+>/g, "").trim().length > 0);
    setParaCount(paras.length || (wordsArr.length ? 1 : 0));
    setClearOpen(false); setDiagramOpen(false); setTableOpen(false);
    setCalloutOpen(false); setSymbolsOpen(false); setFindReplaceOpen(false); setStatsOpen(false);
    setStatus("Opened saved document. Edits autosave every 2 minutes.");
  }, []);

  function openDocument(id: string) {
    if (id === activeIdRef.current) return;
    if (dirty.current && !persist()) return;
    const file = filesRef.current.find(item => item.id === id);
    if (file && writeCollection(filesRef.current, id)) loadDocument(file);
  }

  const deleteDocument = useCallback((id: string) => {
    const target = filesRef.current.find(item => item.id === id);
    if (!target) return;
    const remaining = filesRef.current.filter(item => item.id !== id);
    if (!remaining.length) {
      const fresh = newNotepadFile();
      writeCollection([fresh], fresh.id);
      loadDocument(fresh);
      setStatus(`Deleted "${target.title}". Created new blank document.`);
      return;
    }
    const nextActive = id === activeIdRef.current ? remaining[0].id : activeIdRef.current;
    if (writeCollection(remaining, nextActive)) {
      if (id === activeIdRef.current) {
        loadDocument(remaining[0]);
      }
      setStatus(`Deleted "${target.title}".`);
    }
  }, [writeCollection, loadDocument]);

  // The Save icon on a My documents card downloads that document as a PDF (the toolbar export keeps HTML, JSON, text).
  const saveDocumentCopy = (id: string) => {
    const file = filesRef.current.find(item => item.id === id);
    if (!file) return;
    setStatus(`Preparing "${file.title}" as a PDF…`);
    downloadNotepadPdf(file.title, file.html, file.background).then(
      () => setStatus(`Downloaded "${file.title}" as a PDF.`),
      () => setError(`Could not create a PDF of "${file.title}". Try Print / PDF instead.`),
    );
  };

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
        setActive(["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"].filter(cmd => document.queryCommandState?.(cmd)));
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

  function applyInlineStyle(stylesMap: Record<string, string>) {
    restore();
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        document.execCommand("fontSize", false, "7");
        const fonts = editor.current?.querySelectorAll('font[size="7"]');
        if (fonts && fonts.length > 0) {
          fonts.forEach(f => {
            f.removeAttribute("size");
            for (const [prop, value] of Object.entries(stylesMap)) {
              (f as HTMLElement).style.setProperty(prop, value);
            }
          });
          changed();
          return;
        }
      }
    } catch {}
    changed();
  }

  function applyFontSize(targetSize: number) {
    restore();
    setFontSizeVal(String(targetSize));
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        document.execCommand("fontSize", false, "7");
        const fonts = editor.current?.querySelectorAll('font[size="7"]');
        if (fonts && fonts.length > 0) {
          fonts.forEach(f => {
            f.removeAttribute("size");
            (f as HTMLElement).style.fontSize = `${targetSize}px`;
          });
          changed();
          return;
        }
      }
    } catch {}
    // Fallback to execCommand standard fontSize 1-7
    const step = targetSize <= 10 ? "1" : targetSize <= 13 ? "2" : targetSize <= 16 ? "3" : targetSize <= 18 ? "4" : targetSize <= 24 ? "5" : targetSize <= 32 ? "6" : "7";
    command("fontSize", step);
  }

  function stepFontSize(direction: "increase" | "decrease") {
    restore();
    let current = parseInt(fontSizeVal, 10) || 16;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      if (node instanceof HTMLElement) {
        const computed = window.getComputedStyle?.(node)?.fontSize;
        if (computed) {
          const parsed = parseFloat(computed);
          if (!isNaN(parsed) && parsed > 0) current = Math.round(parsed);
        }
      }
    }
    let nextSize: number;
    if (direction === "increase") {
      nextSize = FONT_SIZES.find(s => s > current) ?? Math.min(current + 2, 96);
    } else {
      nextSize = [...FONT_SIZES].reverse().find(s => s < current) ?? Math.max(current - 2, 8);
    }
    applyFontSize(nextSize);
    setStatus(`Font size: ${nextSize}px`);
  }

  function applyFontStyle(styleVal: string) {
    restore();
    setFontStyleVal(styleVal);
    if (styleVal === "normal") {
      applyInlineStyle({ "font-style": "normal", "font-weight": "400", "text-transform": "none" });
    } else if (styleVal === "italic") {
      command("italic");
    } else if (styleVal === "bold") {
      command("bold");
    } else if (styleVal === "bold-italic") {
      command("bold");
      command("italic");
    } else if (styleVal.startsWith("weight-")) {
      const weight = styleVal.replace("weight-", "");
      applyInlineStyle({ "font-weight": weight });
    } else if (["uppercase", "lowercase", "capitalize"].includes(styleVal)) {
      applyInlineStyle({ "text-transform": styleVal });
    }
  }

  function applyFontFamily(fontName: string) {
    restore();
    setFontFamilyVal(fontName);
    loadGoogleFont(fontName);
    command("fontName", fontName);
    applyInlineStyle({ "font-family": fontName });
    if (editor.current) {
      editor.current.style.fontFamily = `"${fontName}", sans-serif`;
      const pages = editor.current.querySelectorAll('[data-notepad-page="true"]');
      pages.forEach(p => {
        (p as HTMLElement).style.fontFamily = `"${fontName}", sans-serif`;
      });
      changed();
    }
  }

  function insertNewPage() {
    restore();
    const family = fontFamilyVal ? `"${fontFamilyVal}", sans-serif` : "inherit";
    command("insertHTML", `<div data-notepad-page="true" style="break-before:page;page-break-before:always;font-family:${family};margin-top:40px;padding-top:20px;min-height:300px;"><p style="font-family:${family};"><br></p></div>`);
  }

  function applyLineHeight(spacing: string) {
    restore();
    setLineSpacingVal(spacing);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const block = (node as HTMLElement)?.closest?.("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div");
      if (block && editor.current?.contains(block)) {
        (block as HTMLElement).style.lineHeight = spacing;
        changed();
        return;
      }
    }
    if (editor.current) {
      editor.current.style.lineHeight = spacing;
      changed();
    }
  }

  function insertChecklist() {
    restore();
    command("insertHTML", '<ul data-notepad-checklist="true" style="list-style:none;padding-left:4px;"><li style="display:flex;align-items:center;gap:10px;margin:8px 0;"><input type="checkbox"> <span>New task item</span></li></ul><p><br></p>');
  }

  function insertCodeBlock() {
    restore();
    command("insertHTML", '<pre style="background:#1e293b;color:#f1f5f9;padding:16px;border-radius:8px;font-family:monospace;margin:16px 0;"><code>// Write code snippet here</code></pre><p><br></p>');
  }

  function formatInlineCode() {
    restore();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString();
      command("insertHTML", `<code style="background:#f1f0eb;padding:2px 6px;border-radius:4px;font-family:monospace;color:#b53d27;">${text}</code>`);
    } else {
      command("insertHTML", `<code style="background:#f1f0eb;padding:2px 6px;border-radius:4px;font-family:monospace;color:#b53d27;">code</code>`);
    }
  }

  function insertCallout(type: "info" | "tip" | "warning" | "alert" | "note", heading: string, text: string) {
    restore();
    const colors = {
      info: { bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a" },
      tip: { bg: "#ecfdf5", border: "#059669", text: "#064e3b" },
      warning: { bg: "#fffbeb", border: "#d97706", text: "#78350f" },
      alert: { bg: "#fef2f2", border: "#dc2626", text: "#7f1d1d" },
      note: { bg: "#f5f3ff", border: "#7c3aed", text: "#4c1d95" },
    }[type];
    const safeHeading = heading.replace(/[<>&]/g, "");
    const safeText = text.replace(/[<>&]/g, "");
    command("insertHTML", `<div data-notepad-callout="${type}" style="background-color:${colors.bg};border-left:4px solid ${colors.border};padding:14px 18px;border-radius:8px;margin:16px 0;color:${colors.text};"><p><strong>${safeHeading ? `${safeHeading}: ` : ""}</strong>${safeText}</p></div><p><br></p>`);
  }

  function insertDateTime() {
    restore();
    const now = new Date();
    const formatted = now.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " at " + now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    command("insertHTML", `<span>${formatted}</span>&nbsp;`);
  }

  function insertSymbol(char: string) {
    restore();
    command("insertHTML", `<span>${char}</span>`);
  }

  function addTableRow() {
    restore();
    const sel = window.getSelection();
    let node: Node | null = sel?.anchorNode ?? null;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const tr = (node as HTMLElement)?.closest?.("tr");
    const table = tr?.closest?.("table");
    if (tr && table) {
      const colCount = tr.children.length;
      const newTr = document.createElement("tr");
      for (let i = 0; i < colCount; i++) {
        const newTd = document.createElement("td");
        newTd.innerHTML = "<br>";
        newTr.appendChild(newTd);
      }
      tr.after(newTr);
      changed();
    } else {
      setError("Place your cursor inside a table cell to add a row.");
    }
  }

  function addTableColumn() {
    restore();
    const sel = window.getSelection();
    let node: Node | null = sel?.anchorNode ?? null;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const td = (node as HTMLElement)?.closest?.("td, th");
    const table = td?.closest?.("table");
    if (td && table) {
      const tr = td.closest("tr");
      const colIndex = Array.from(tr?.children || []).indexOf(td);
      table.querySelectorAll("tr").forEach(row => {
        const isHeader = row.parentElement?.tagName === "THEAD" || !!row.querySelector("th");
        const cell = document.createElement(isHeader ? "th" : "td");
        cell.innerHTML = isHeader ? `Column ${row.children.length + 1}` : "<br>";
        if (colIndex >= 0 && row.children[colIndex]) {
          row.children[colIndex].after(cell);
        } else {
          row.appendChild(cell);
        }
      });
      changed();
    } else {
      setError("Place your cursor inside a table cell to add a column.");
    }
  }

  function deleteTableRow() {
    restore();
    const sel = window.getSelection();
    let node: Node | null = sel?.anchorNode ?? null;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const tr = (node as HTMLElement)?.closest?.("tr");
    if (tr) {
      tr.remove();
      changed();
    } else {
      setError("Place your cursor inside a table row to delete it.");
    }
  }

  function findNext() {
    if (!findText) return;
    restore();
    if (typeof (window as unknown as { find?: (q: string, a: boolean, b: boolean, c: boolean, d: boolean, e: boolean, f: boolean) => boolean }).find === "function") {
      const found = (window as unknown as { find: (q: string, a: boolean, b: boolean, c: boolean, d: boolean, e: boolean, f: boolean) => boolean }).find(findText, false, false, true, false, false, false);
      if (!found) {
        window.getSelection()?.collapse(editor.current, 0);
        const wrapFound = (window as unknown as { find: (q: string, a: boolean, b: boolean, c: boolean, d: boolean, e: boolean, f: boolean) => boolean }).find(findText, false, false, true, false, false, false);
        setFindStatus(wrapFound ? "Found (wrapped to top)" : "No matches found");
      } else {
        setFindStatus("Match found");
      }
    } else {
      const text = editor.current?.textContent || "";
      const occurrences = text.split(findText).length - 1;
      setFindStatus(occurrences > 0 ? `${occurrences} match${occurrences === 1 ? "" : "es"} in document` : "No matches found");
    }
  }

  function replaceCurrent() {
    if (!findText) return;
    restore();
    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === findText.toLowerCase()) {
      command("insertText", replaceText);
      findNext();
    } else {
      findNext();
    }
  }

  function replaceAll() {
    if (!findText || !editor.current) return;
    restore();
    let countReplaced = 0;
    const walker = document.createTreeWalker(editor.current, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    for (const textNode of textNodes) {
      if (textNode.nodeValue && textNode.nodeValue.includes(findText)) {
        const occurrences = textNode.nodeValue.split(findText).length - 1;
        countReplaced += occurrences;
        textNode.nodeValue = textNode.nodeValue.replaceAll(findText, replaceText);
      }
    }
    if (countReplaced > 0) {
      changed();
      setFindStatus(`Replaced ${countReplaced} occurrence${countReplaced === 1 ? "" : "s"}.`);
    } else {
      setFindStatus("No occurrences found.");
    }
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

  async function images(filesList: FileList | null) {
    if (!filesList) return;
    const targetDocument = activeIdRef.current;
    for (const file of Array.from(filesList)) {
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

  return <section className={styles.notepad} data-maximized={maximized || undefined} aria-label="Notepad">
    <div className={styles.libraryToggleBar}>
      <button
        type="button"
        className={styles.libraryToggleBtn}
        onClick={() => setLibraryOpen(v => !v)}
        aria-expanded={libraryOpen}
        aria-label={libraryOpen ? "Hide saved documents library" : "Show saved documents library"}
      >
        <FolderOpen size={15} aria-hidden="true" />
        <span>Saved Documents ({files.length})</span>
        {libraryOpen ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </button>
      <div className={styles.windowHeightBadge}>
        <span>Canvas Window: {maximized ? "100vh Full Window" : "Expanded Tall (850px+)"}</span>
        <button
          type="button"
          className={styles.quickExpandBtn}
          onClick={() => setMaximized(v => !v)}
          title={maximized ? "Exit full window" : "Expand canvas window height"}
          aria-label={maximized ? "Exit full window height" : "Expand canvas window height"}
        >
          {maximized ? <Minimize2 size={13} aria-hidden="true" /> : <Maximize2 size={13} aria-hidden="true" />}
          <span>{maximized ? "Exit Full Window" : "Maximize Height"}</span>
        </button>
      </div>
    </div>
    {libraryOpen && <NotepadLibrary files={files} activeId={activeId} activeTitle={title} onOpen={openDocument} onDelete={deleteDocument} onSave={saveDocumentCopy}/>}
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
        <IconButton type="button" label={maximized ? "Exit full window height" : "Expand canvas window height"} icon={maximized ? Minimize2 : Maximize2} aria-pressed={maximized} onClick={() => setMaximized(v => !v)} />
      </div>
    </div>
    <input hidden aria-label="Import document file" ref={fileInput} type="file" accept=".txt,.html,.htm,.md,.json" onChange={e => { void openFile(e.target.files?.[0]); e.target.value = ""; }} />
    <input hidden ref={imageInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple onChange={e => { void images(e.target.files); e.target.value = ""; }} />
    <div className={styles.tools}>
    <div className={styles.toolsHead}>
      <button type="button" className={styles.toolsToggle} aria-expanded={toolsOpen} aria-controls="notepad-tools" onClick={toggleTools}><Wrench size={15} aria-hidden="true"/><span>Tools</span><ChevronDown size={15} aria-hidden="true"/></button>
      <div className={styles.status}>
        <span
          className={styles.statsTrigger}
          onClick={() => setStatsOpen(v => !v)}
          title="Click to view detailed document statistics"
        >
          <BarChart2 size={13} aria-hidden="true" style={{ verticalAlign: "middle", marginRight: 3 }} />
          <span>{words} words</span>
          {statsOpen && (
            <div className={styles.statsDrawer} role="dialog" aria-label="Document statistics">
              <div className={styles.statsRow}><span>Words:</span><strong>{words}</strong></div>
              <div className={styles.statsRow}><span>Characters (with spaces):</span><strong>{charCount}</strong></div>
              <div className={styles.statsRow}><span>Characters (no spaces):</span><strong>{charCountNoSpaces}</strong></div>
              <div className={styles.statsRow}><span>Paragraphs:</span><strong>{paraCount}</strong></div>
              <div className={styles.statsRow}><span>Reading time:</span><strong>~{Math.max(1, Math.ceil(words / 200))} min</strong></div>
            </div>
          )}
        </span>
        <span className={styles.zoom}><IconButton label="Zoom out" icon={ZoomOut} disabled={zoom <= 60} onClick={() => setZoom(value => value - 10)}/>{zoom}%<IconButton label="Zoom in" icon={ZoomIn} disabled={zoom >= 160} onClick={() => setZoom(value => value + 10)}/></span>
        <span role="status">{status}</span>
        <span className={styles.shortcut}>Ctrl/⌘+S saves · Ctrl+F finds · Shift+Ctrl/⌘+S exports</span>
      </div>
      <div className={styles.toolsHeadFont}>
        <FontFamilyDropdown
          value={fontFamilyVal}
          onChange={applyFontFamily}
          fonts={READING_FONTS}
          ariaLabel="Font family"
          variant="toolbar"
          valueType="name"
          defaultVal="Arial"
        />
      </div>
    </div>
    <div id="notepad-tools" className={styles.ribbon} role="group" aria-label="Document formatting" hidden={!toolsOpen}>
      <div className={styles.group} aria-label="Clipboard and history">
        {tool("Undo", "undo")}
        {tool("Redo", "redo")}
        {(["cut", "copy", "paste"] as const).map(action => (
          <IconButton key={action} label={action[0].toUpperCase() + action.slice(1)} icon={action === "cut" ? Scissors : action === "copy" ? Copy : ClipboardPaste} onMouseDown={e => e.preventDefault()} onClick={() => void clipboard(action)} />
        ))}
      </div>
      <div className={styles.group} aria-label="Typography">
        <label className={styles.iconField} data-tooltip="Paragraph style">
          <Heading size={18} aria-hidden="true"/>
          <select aria-label="Paragraph style" defaultValue="p" onChange={e => command("formatBlock", e.target.value)}>
            {["p", "h1", "h2", "h3", "blockquote", "pre"].map((tag, i) => (
              <option key={tag} value={tag}>{["Normal text", "Heading 1", "Heading 2", "Heading 3", "Quote", "Code block"][i]}</option>
            ))}
          </select>
        </label>
        <label className={styles.iconField} data-tooltip="Font style">
          <Baseline size={18} aria-hidden="true"/>
          <select aria-label="Font style" value={fontStyleVal} onChange={e => applyFontStyle(e.target.value)}>
            {FONT_STYLES.map(style => (
              <option key={style.value} value={style.value}>{style.label}</option>
            ))}
          </select>
        </label>
        <IconButton label="Decrease text size" icon={AArrowDown} onMouseDown={e => e.preventDefault()} onClick={() => stepFontSize("decrease")} />
        <label className={styles.iconField} data-tooltip="Font size">
          <ALargeSmall size={18} aria-hidden="true"/>
          <select aria-label="Font size" value={fontSizeVal} onChange={e => applyFontSize(Number(e.target.value))}>
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </label>
        <IconButton label="Increase text size" icon={AArrowUp} onMouseDown={e => e.preventDefault()} onClick={() => stepFontSize("increase")} />
        <label className={styles.iconField} data-tooltip="Line spacing">
          <WrapText size={18} aria-hidden="true"/>
          <select aria-label="Line spacing" value={lineSpacingVal} onChange={e => applyLineHeight(e.target.value)}>
            {LINE_SPACINGS.map(item => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.group} aria-label="Formatting">
        {tool("Bold", "bold")}
        {tool("Italic", "italic")}
        {tool("Underline", "underline")}
        {tool("Strikethrough", "strikeThrough")}
        {tool("Subscript", "subscript")}
        {tool("Superscript", "superscript")}
        <IconButton label="Inline code" icon={Code} onMouseDown={e => e.preventDefault()} onClick={formatInlineCode} />
        <IconButton label="Uppercase" icon={CaseUpper} onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle({ "text-transform": "uppercase" })} />
        <IconButton label="Lowercase" icon={CaseLower} onMouseDown={e => e.preventDefault()} onClick={() => applyInlineStyle({ "text-transform": "lowercase" })} />
        {tool("Clear formatting", "removeFormat")}
      </div>
      <div className={styles.group} aria-label="Colors">
        <label className={styles.iconField} data-tooltip="Text color"><Type size={18} aria-hidden="true"/><input aria-label="Text color" type="color" defaultValue="#262624" onChange={e => command("foreColor", e.target.value)} /></label>
        <label className={styles.iconField} data-tooltip="Highlight color"><Highlighter size={18} aria-hidden="true"/><input aria-label="Highlight color" type="color" defaultValue="#fff176" onChange={e => command("hiliteColor", e.target.value)} /></label>
        {tool("Yellow marker", "hiliteColor", "#fff176")}
        <label className={styles.iconField} data-tooltip="Text background color"><PaintBucket size={18} aria-hidden="true"/><input aria-label="Text background color" type="color" defaultValue="#e4efff" onChange={e => command("hiliteColor", e.target.value)} /></label>
      </div>
      <div className={styles.group} aria-label="Lists and alignment">
        {tool("Bullets", "insertUnorderedList")}
        {tool("Numbering", "insertOrderedList")}
        <IconButton label="Task checklist" icon={SquareCheck} onMouseDown={e => e.preventDefault()} onClick={insertChecklist} />
        {tool("Align left", "justifyLeft")}
        {tool("Center", "justifyCenter")}
        {tool("Align right", "justifyRight")}
        {tool("Justify", "justifyFull")}
        {tool("Indent", "indent")}
        {tool("Outdent", "outdent")}
      </div>
      <div className={styles.group} aria-label="Insert elements">
        <IconButton type="button" label="Insert images" icon={ImagePlus} onClick={() => imageInput.current?.click()} />
        <IconButton label="Insert workflow or diagram" icon={GitBranch} onClick={() => setDiagramOpen(value => !value)} />
        <IconButton type="button" label="Insert table" icon={Table2} onClick={() => setTableOpen(value => !value)} />
        <IconButton label="Add table row" icon={Rows} onMouseDown={e => e.preventDefault()} onClick={addTableRow} />
        <IconButton label="Add table column" icon={Columns} onMouseDown={e => e.preventDefault()} onClick={addTableColumn} />
        <IconButton label="Insert callout box" icon={AlertCircle} onClick={() => setCalloutOpen(v => !v)} />
        <IconButton label="Insert code block" icon={Code2} onMouseDown={e => e.preventDefault()} onClick={insertCodeBlock} />
        <IconButton label="Insert special symbol" icon={Sparkles} onClick={() => setSymbolsOpen(v => !v)} />
        <IconButton label="Insert current date and time" icon={Clock} onMouseDown={e => e.preventDefault()} onClick={insertDateTime} />
        <IconButton label="New page" icon={FilePlus} onMouseDown={e => e.preventDefault()} onClick={insertNewPage} />
        {tool("Horizontal rule", "insertHorizontalRule")}
        <IconButton type="button" label="Insert link" icon={Link2} onMouseDown={e => e.preventDefault()} onClick={() => { const url = window.prompt("Link URL (https://…)"); if (url && /^https?:\/\//i.test(url)) command("createLink", url); else if (url) setError("Use an http:// or https:// link."); }} />
        {tool("Remove link", "unlink")}
      </div>
      <div className={styles.group} aria-label="Tools and page settings">
        <IconButton label="Find and replace" icon={Search} onClick={() => setFindReplaceOpen(v => !v)} />
        <PaperPicker value={background} onChange={color => { backgroundRef.current = color; setBackground(color); changed(); }}/>
      </div>
    </div>
    </div>
    {findReplaceOpen && (
      <form className={styles.findBar} role="search" aria-label="Find and replace" onSubmit={e => { e.preventDefault(); findNext(); }}>
        <label>Find:<input type="text" placeholder="Find in document…" value={findText} onChange={e => setFindText(e.target.value)} /></label>
        <label>Replace:<input type="text" placeholder="Replace with…" value={replaceText} onChange={e => setReplaceText(e.target.value)} /></label>
        <div className={styles.findBarActions}>
          <IconButton type="submit" label="Find next" icon={Search} />
          <IconButton type="button" label="Replace current" icon={Replace} onClick={replaceCurrent} />
          <IconButton type="button" label="Replace all" icon={Check} onClick={replaceAll} />
          <IconButton type="button" label="Close find and replace" icon={X} onClick={() => { setFindReplaceOpen(false); setFindStatus(""); }} />
        </div>
        {findStatus && <span className={styles.findStatus} aria-live="polite">{findStatus}</span>}
      </form>
    )}
    {symbolsOpen && (
      <div className={styles.symbolsPanel} role="region" aria-label="Insert special symbol">
        <div className={styles.symbolsHeader}>
          <span>Special Symbols & Characters</span>
          <IconButton type="button" label="Close symbols" icon={X} onClick={() => setSymbolsOpen(false)} />
        </div>
        <div className={styles.symbolsGrid}>
          {SYMBOLS.map(sym => (
            <button
              key={sym.char}
              type="button"
              className={styles.symbolBtn}
              aria-label={`Insert symbol ${sym.label}`}
              title={`${sym.label} (${sym.char})`}
              onClick={() => insertSymbol(sym.char)}
            >
              <Sparkles size={11} aria-hidden="true" />
              <span>{sym.char}</span>
            </button>
          ))}
        </div>
      </div>
    )}
    {calloutOpen && (
      <form className={styles.options} aria-label="Callout box builder" onSubmit={e => { e.preventDefault(); insertCallout(calloutType, calloutTitle, calloutText); setCalloutOpen(false); }}>
        <label>Callout type
          <select value={calloutType} onChange={e => {
            const val = e.target.value as "info" | "tip" | "warning" | "alert" | "note";
            setCalloutType(val);
            setCalloutTitle(val === "info" ? "Info" : val === "tip" ? "Pro Tip" : val === "warning" ? "Warning" : val === "alert" ? "Important" : "Note");
          }}>
            <option value="info">Info (Blue)</option>
            <option value="tip">Pro Tip / Success (Green)</option>
            <option value="warning">Warning (Amber)</option>
            <option value="alert">Important / Alert (Red)</option>
            <option value="note">Note / Idea (Purple)</option>
          </select>
        </label>
        <label>Callout title
          <input style={{ width: 140 }} value={calloutTitle} onChange={e => setCalloutTitle(e.target.value)} />
        </label>
        <label style={{ flex: 1, minWidth: 200 }}>Message
          <input style={{ width: "100%" }} required value={calloutText} onChange={e => setCalloutText(e.target.value)} />
        </label>
        <IconButton type="submit" label="Add callout box" icon={Check} />
        <IconButton type="button" label="Cancel callout" icon={X} onClick={() => setCalloutOpen(false)} />
      </form>
    )}
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
    <div className={styles.canvas} data-zoomed={zoom > 100 || undefined}><div ref={editor} className={styles.paper} style={{ backgroundColor: background, zoom: zoom / 100 }} contentEditable suppressContentEditableWarning role="textbox" aria-label="Document content" aria-multiline="true" spellCheck onInput={changed} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (e.shiftKey) openExport(true); else persist(); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); setFindReplaceOpen(true); } else if ((e.ctrlKey || e.metaKey) && (e.key === "]" || (e.shiftKey && e.key === ">"))) { e.preventDefault(); stepFontSize("increase"); } else if ((e.ctrlKey || e.metaKey) && (e.key === "[" || (e.shiftKey && e.key === "<"))) { e.preventDefault(); stepFontSize("decrease"); } }} onPaste={e => { e.preventDefault(); const html = e.clipboardData.getData("text/html"); if (html) command("insertHTML", sanitizeNotepadHtml(html)); else command("insertText", e.clipboardData.getData("text/plain")); }} onDrop={e => { e.preventDefault(); setError("Use Insert images or Import document to add files; paste text with Ctrl+V / ⌘V."); }} /></div>
    </div>
  </section>;
}
