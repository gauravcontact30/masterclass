import { themes, ThemeName } from "@/lib/generation/theme";

/*
 * Library card art: a small facsimile of the actual file, not a generic file
 * icon. PDF gets the real A4 portrait proportions render.ts prints; PPTX gets
 * the real 16:9 slide proportions; both carry the same violet/gold head rule
 * and MASTERCLASS brand label the generated pages do, in the document's own
 * theme colors. Notes is deliberately unlike the other two — a dashed, paper-
 * less card with bullet dots — since it isn't a rendered page at all.
 */
export function FileThumbnail({ format, theme, title }: { format: "pdf" | "pptx"; theme: ThemeName; title: string }) {
  const t = themes[theme];
  const slide = format === "pptx";
  const lines = slide ? [86, 60] : [92, 78, 64];
  return (
    <div className={`file-thumb ${slide ? "file-thumb-slide" : "file-thumb-portrait"}`}>
      <div className="file-thumb-page" style={{ background: `#${t.background}` }}>
        <span className="file-thumb-rule" style={{ background: `#${t.accent}` }}>
          <i style={{ background: `#${t.accent2}` }} />
        </span>
        <span className="file-thumb-brand" style={{ color: `#${t.accent}` }}>MASTERCLASS</span>
        <span className="file-thumb-title" style={{ color: `#${t.foreground}` }}>{title}</span>
        <div className="file-thumb-lines">
          {lines.map((w, i) => <span key={i} style={{ width: `${w}%`, background: `#${t.foreground}` }} />)}
        </div>
      </div>
      <span className="file-thumb-tag" style={{ background: `#${t.accent}` }}>{format.toUpperCase()}</span>
    </div>
  );
}

export function NotesThumbnail() {
  return (
    <div className="file-thumb file-thumb-notes" aria-hidden="true">
      <div className="file-thumb-page">
        {[86, 68, 92, 54].map((w, i) => (
          <span key={i} className="file-thumb-notes-row"><i /><b style={{ width: `${w}%` }} /></span>
        ))}
      </div>
      <span className="file-thumb-tag file-thumb-tag-notes">TXT</span>
    </div>
  );
}
