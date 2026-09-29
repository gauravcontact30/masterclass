import { useId } from "react";

/**
 * Cover artwork for a Class Room catalogue.
 *
 * The catalogue tabs already carry a 14px lucide glyph from
 * `search-section-icon.tsx`; this is the larger mark a card or panel header can
 * hold, where a glyph would read as an afterthought. The drawings are the
 * project's own, which is the point: a licensed photograph good enough for
 * "Physics" and consistent with one good enough for "Law" does not exist in the
 * CC0 pools, and a mixed set of stock photos would look like a scrapbook.
 *
 * Every scene shares the same 160x96 frame, a 2px stroke and a single tone, so
 * fifteen subjects read as one family. Tones come from `learning-diagram.tsx`
 * so a card and the diagram below it do not disagree about what blue is.
 */
const TONES = {
  blue: "#2563a6", green: "#237452", purple: "#7650a5",
  orange: "#a95719", rose: "#a8385c", teal: "#1d6f74", ink: "#303846",
} as const;

type Tone = keyof typeof TONES;

/** One scene: the tone it draws in, and the paths that make it. */
type Scene = { tone: Tone; label: string; draw: (stroke: string) => React.ReactNode };

const line = { fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const SCENES: Record<string, Scene> = {
  maths: {
    tone: "blue", label: "A coordinate grid with a plotted curve and a compass arc",
    draw: s => <>
      <path d="M28 76 H132 M40 84 V20" stroke={s} {...line} opacity="0.45" />
      <path d="M40 76 Q72 24 132 30" stroke={s} {...line} />
      <path d="M56 76 a24 24 0 0 1 24-24" stroke={s} {...line} opacity="0.7" strokeDasharray="4 5" />
      <circle cx="80" cy="52" r="3.5" fill={s} />
      <circle cx="132" cy="30" r="3.5" fill={s} />
    </>,
  },
  physics: {
    tone: "purple", label: "An atom with orbiting shells above a travelling wave",
    draw: s => <>
      <ellipse cx="80" cy="44" rx="34" ry="13" stroke={s} {...line} opacity="0.55" />
      <ellipse cx="80" cy="44" rx="34" ry="13" stroke={s} {...line} opacity="0.55" transform="rotate(60 80 44)" />
      <ellipse cx="80" cy="44" rx="34" ry="13" stroke={s} {...line} opacity="0.55" transform="rotate(-60 80 44)" />
      <circle cx="80" cy="44" r="5" fill={s} />
      <path d="M26 78 q13 -12 26 0 t26 0 t26 0 t26 0" stroke={s} {...line} />
    </>,
  },
  chemistry: {
    tone: "green", label: "A benzene ring beside a flask giving off bubbles",
    draw: s => <>
      <path d="M46 30 l18 10 v20 l-18 10 -18 -10 v-20 z" stroke={s} {...line} />
      <path d="M46 38 l11 6 v12 l-11 6 -11 -6 v-12 z" stroke={s} {...line} opacity="0.5" />
      <path d="M104 24 v16 l-14 30 a6 6 0 0 0 5 9 h26 a6 6 0 0 0 5 -9 l-14 -30 v-16" stroke={s} {...line} />
      <path d="M99 24 h16" stroke={s} {...line} />
      <path d="M94 62 h32" stroke={s} {...line} opacity="0.5" />
      <circle cx="104" cy="52" r="2.5" fill={s} opacity="0.7" />
      <circle cx="114" cy="44" r="2" fill={s} opacity="0.5" />
    </>,
  },
  english: {
    tone: "orange", label: "An open book with lines of text and a quotation mark",
    draw: s => <>
      <path d="M80 30 q-20 -8 -44 -4 v48 q24 -4 44 4 q20 -8 44 -4 v-48 q-24 -4 -44 4 z" stroke={s} {...line} />
      <path d="M80 30 v48" stroke={s} {...line} opacity="0.55" />
      <path d="M46 42 h22 M46 52 h22 M92 42 h22 M92 52 h22" stroke={s} {...line} opacity="0.4" />
      <path d="M58 20 q6 0 6 6 q0 5 -6 5 M70 20 q6 0 6 6 q0 5 -6 5" stroke={s} {...line} opacity="0.8" />
    </>,
  },
  "govt-defence": {
    tone: "ink", label: "A shield with service chevrons",
    draw: s => <>
      <path d="M80 18 l30 11 v22 q0 24 -30 37 q-30 -13 -30 -37 v-22 z" stroke={s} {...line} />
      <path d="M64 46 l16 -10 16 10 M64 60 l16 -10 16 10" stroke={s} {...line} opacity="0.75" />
    </>,
  },
  "diploma-polytechnic": {
    tone: "teal", label: "A gear meshed with a caliper",
    draw: s => <>
      <circle cx="66" cy="50" r="18" stroke={s} {...line} />
      <circle cx="66" cy="50" r="7" stroke={s} {...line} opacity="0.6" />
      <path d="M66 26 v-8 M66 82 v-8 M42 50 h-8 M98 50 h8 M49 33 l-6 -6 M83 67 l6 6 M83 33 l6 -6 M49 67 l-6 6" stroke={s} {...line} opacity="0.7" />
      <path d="M108 26 v44 M120 26 v44 M108 44 h12 M104 70 h20" stroke={s} {...line} opacity="0.8" />
    </>,
  },
  "talent-olympiads": {
    tone: "orange", label: "A trophy under a burst of stars",
    draw: s => <>
      <path d="M64 28 h32 v14 a16 16 0 0 1 -32 0 z" stroke={s} {...line} />
      <path d="M64 32 h-10 a10 10 0 0 0 10 12 M96 32 h10 a10 10 0 0 1 -10 12" stroke={s} {...line} opacity="0.7" />
      <path d="M80 58 v10 M68 76 h24 M72 68 h16 v8 h-16 z" stroke={s} {...line} />
      <path d="M116 26 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill={s} opacity="0.55" />
      <path d="M40 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill={s} opacity="0.4" />
    </>,
  },
  navodaya: {
    tone: "green", label: "A school building beneath a rising sun",
    draw: s => <>
      <path d="M34 78 h92" stroke={s} {...line} />
      <path d="M46 78 v-28 l34 -18 34 18 v28" stroke={s} {...line} />
      <path d="M70 78 v-18 h20 v18" stroke={s} {...line} opacity="0.75" />
      <path d="M56 54 h8 M96 54 h8" stroke={s} {...line} opacity="0.5" />
      <circle cx="80" cy="24" r="7" stroke={s} {...line} opacity="0.6" />
    </>,
  },
  engineering: {
    tone: "blue", label: "A truss bridge over a circuit trace",
    draw: s => <>
      <path d="M28 52 h104 M34 52 l14 -18 14 18 14 -18 14 18 14 -18 14 18" stroke={s} {...line} />
      <path d="M28 66 h26 a6 6 0 0 1 6 6 h18 a6 6 0 0 0 6 -6 h20 a6 6 0 0 1 6 6 h22" stroke={s} {...line} opacity="0.7" />
      <circle cx="60" cy="72" r="3" fill={s} opacity="0.8" />
      <circle cx="108" cy="72" r="3" fill={s} opacity="0.8" />
    </>,
  },
  "medical-sciences": {
    tone: "rose", label: "A DNA helix beside a heartbeat trace",
    draw: s => <>
      <path d="M52 22 q24 14 0 28 t0 28" stroke={s} {...line} />
      <path d="M84 22 q-24 14 0 28 t0 28" stroke={s} {...line} />
      <path d="M55 30 h26 M52 44 h32 M55 58 h26 M58 70 h20" stroke={s} {...line} opacity="0.5" />
      <path d="M98 50 h10 l5 -12 6 24 5 -12 h10" stroke={s} {...line} />
    </>,
  },
  "undergraduate-humanities": {
    tone: "purple", label: "A classical portico beside a globe",
    draw: s => <>
      <path d="M36 34 l24 -12 24 12 z" stroke={s} {...line} />
      <path d="M40 38 v32 M52 38 v32 M68 38 v32 M80 38 v32 M32 74 h56 M34 38 h52" stroke={s} {...line} />
      <circle cx="116" cy="52" r="18" stroke={s} {...line} opacity="0.75" />
      <path d="M98 52 h36 M116 34 q10 18 0 36 q-10 -18 0 -36" stroke={s} {...line} opacity="0.55" />
    </>,
  },
  law: {
    tone: "ink", label: "A balance scale above a gavel",
    draw: s => <>
      <path d="M80 22 v40 M60 70 h40 M72 70 q8 -8 16 0" stroke={s} {...line} />
      <path d="M46 34 h68" stroke={s} {...line} />
      <path d="M46 34 l-10 18 h20 z M114 34 l10 18 h-20 z" stroke={s} {...line} opacity="0.8" />
      <circle cx="80" cy="26" r="3" fill={s} />
    </>,
  },
  "design-architecture": {
    tone: "rose", label: "A bezier curve with handles over colour swatches",
    draw: s => <>
      <path d="M34 66 C56 26 100 26 122 62" stroke={s} {...line} />
      <path d="M34 66 l16 -12 M122 62 l-18 -10" stroke={s} {...line} opacity="0.5" />
      <rect x="28" y="60" width="9" height="9" rx="1.5" fill={s} />
      <rect x="118" y="56" width="9" height="9" rx="1.5" fill={s} />
      <rect x="54" y="74" width="14" height="10" rx="2" stroke={s} {...line} opacity="0.7" />
      <rect x="74" y="74" width="14" height="10" rx="2" stroke={s} {...line} opacity="0.5" />
      <rect x="94" y="74" width="14" height="10" rx="2" stroke={s} {...line} opacity="0.3" />
    </>,
  },
  "defence-government": {
    tone: "teal", label: "A winged star over rank chevrons",
    draw: s => <>
      <path d="M80 24 l5 12 13 1 -10 9 3 13 -11 -7 -11 7 3 -13 -10 -9 13 -1 z" stroke={s} {...line} />
      <path d="M52 40 q-16 4 -22 12 q14 -2 20 -4 M108 40 q16 4 22 12 q-14 -2 -20 -4" stroke={s} {...line} opacity="0.65" />
      <path d="M60 68 l20 -8 20 8 M60 80 l20 -8 20 8" stroke={s} {...line} opacity="0.8" />
    </>,
  },
  "professional-services": {
    tone: "blue", label: "A briefcase beside a rising bar chart",
    draw: s => <>
      <rect x="30" y="40" width="52" height="34" rx="5" stroke={s} {...line} />
      <path d="M46 40 v-6 a4 4 0 0 1 4 -4 h12 a4 4 0 0 1 4 4 v6 M30 55 h52" stroke={s} {...line} opacity="0.8" />
      <path d="M96 74 v-14 M110 74 v-24 M124 74 v-34" stroke={s} {...line} />
      <path d="M92 78 h36" stroke={s} {...line} opacity="0.5" />
    </>,
  },
};

/** Catalogue ids that share another catalogue's drawing. */
const ALIASES: Record<string, string> = { science: "physics", "exams": "talent-olympiads" };

/** Whether a catalogue id has cover artwork, so callers can branch before rendering. */
export function hasSubjectArtwork(id: string): boolean {
  return Boolean(SCENES[id] ?? SCENES[ALIASES[id] ?? ""]);
}

/**
 * The cover for one catalogue, or null when the id has no scene.
 *
 * Returning null rather than a placeholder lets the caller fall back to the
 * lucide glyph it would otherwise have shown, so an unmapped catalogue degrades
 * to the old look instead of a blank frame.
 */
export function SubjectArtwork({ id, className, title }: { id: string; className?: string; title?: string }) {
  const labelId = useId();
  const scene = SCENES[id] ?? SCENES[ALIASES[id] ?? ""];
  if (!scene) return null;
  const stroke = TONES[scene.tone];
  return <svg className={className} viewBox="0 0 160 96" role="img" aria-labelledby={labelId} preserveAspectRatio="xMidYMid meet">
    <title id={labelId}>{title ? `${title}: ${scene.label}` : scene.label}</title>
    <rect x="0" y="0" width="160" height="96" rx="10" fill={stroke} fillOpacity="0.06" />
    {scene.draw(stroke)}
  </svg>;
}
