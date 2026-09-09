/*
 * The hero object: three generated guide pages, fanned.
 *
 * This is a facsimile of what lib/generation/render.ts actually produces — the
 * accent rule across the head, the brand line, the title, the body block and the
 * page counter in the footer — drawn in the three real document themes so the
 * hero shows the product's output rather than an abstraction of it.
 *
 * Purely decorative in the accessibility tree beyond its label; the page's
 * meaning lives in the headline beside it.
 */
import { themes } from "@/lib/generation/theme";

type Face = { theme: keyof typeof themes; title: string; lines: number[]; page: string };

// Line widths are hand-set rather than random so the three pages keep a
// deliberate rhythm instead of looking like noise.
const FACES: Face[] = [
  { theme: "cyberpunk", title: "Promises and async/await", lines: [96, 88, 74, 92, 61], page: "12 / 34" },
  { theme: "corporate", title: "Hooks in depth", lines: [92, 79, 96, 68, 84], page: "07 / 28" },
  { theme: "minimal", title: "Server Components and use()", lines: [88, 96, 71, 90, 55], page: "03 / 24" },
];

export function GuideStack({ label }: { label: string }) {
  return (
    <div className="guide-stack" role="img" aria-label={label}>
      {FACES.map((face, index) => {
        const theme = themes[face.theme];
        return (
          <article
            key={face.theme}
            className="guide-page"
            style={{
              background: `#${theme.background}`,
              color: `#${theme.foreground}`,
              borderTopColor: `#${theme.accent}`,
              // Each page sits a step further back and further left than the one in front.
              ["--depth" as string]: String(FACES.length - 1 - index),
            }}
          >
            <span className="guide-page-brand" style={{ color: `#${theme.accent}` }}>MASTERCLASS</span>
            <h3 className="guide-page-title">{face.title}</h3>
            <div className="guide-page-body">
              {face.lines.map((width, line) => (
                <span key={`${face.theme}-${line}`} style={{ width: `${width}%`, background: `#${theme.foreground}` }} />
              ))}
            </div>
            <div className="guide-page-rule" style={{ background: `#${theme.accent}` }} />
            <footer className="guide-page-foot" style={{ color: `#${theme.muted}` }}>{face.page}</footer>
          </article>
        );
      })}
    </div>
  );
}
