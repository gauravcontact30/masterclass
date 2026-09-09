/*
 * Campus band artwork: four scenes, one per slide. Drawn rather than
 * photographed — stylised figures, so nothing here claims to picture a real
 * student — but the document on every screen is not abstract: it is a small,
 * legible facsimile of an actual generated MasterClass page (see
 * lib/generation/render.ts and components/guide-stack.tsx), with the same
 * violet-and-gold head rule, brand label, title bar and page counter.
 *
 * Each scene is a different campus location at a different hour, with exactly
 * one warm light source. That single rule is what makes four very different
 * places read as one set.
 */
import type { JSX } from "react";

const INK = "#17102F", DUSK = "#2E2160", LILAC = "#7B67D6", BRASS = "#E0A94A", SAND = "#C97B4E", MINT = "#5FD3B4";
const PAPER = "#F8F9FE", VIOLET = "#6650C8";

export type HeroScene = "library" | "lawn" | "lab" | "steps";

/** Seated figure seen from behind: head, shoulders, and a brass rim where the light lands. */
function Seated({ x, y, s = 1, rim = "right" }: { x: number; y: number; s?: number; rim?: "left" | "right" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-17 34c0-13 7-21 17-21s17 8 17 21z" fill={INK} />
      <circle cx="0" cy="2" r="10" fill={INK} />
      <path d={rim === "right" ? "M8 -5a10 10 0 0 1 1 13" : "M-8 -5a10 10 0 0 0-1 13"} stroke={BRASS} strokeWidth="1.6" fill="none" opacity=".7" />
    </g>
  );
}

/**
 * A miniature, legible facsimile of a generated MasterClass page: the same
 * two-tone violet/gold rule, brand label, title bar, body lines and page
 * counter that lib/generation/render.ts actually prints. Authored in a local
 * w×h space so it drops into a laptop screen or a tablet at any size.
 */
function DocPage({ w, h, title = true }: { w: number; h: number; title?: boolean }) {
  const rule = h * 0.11;
  return (
    <>
      <rect width={w} height={h} rx={h * 0.05} fill={PAPER} />
      <rect width={w} height={rule} fill={VIOLET} />
      <rect width={w * 0.56} height={rule} fill={BRASS} />
      <text x={w * 0.055} y={rule * 0.68} fontSize={rule * 0.62} fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="1" opacity=".95">MASTERCLASS</text>
      {title && <rect x={w * 0.055} y={h * 0.26} width={w * 0.66} height={h * 0.1} rx={h * 0.02} fill={INK} opacity=".88" />}
      {[0.46, 0.58, 0.7].map((t, i) => <rect key={t} x={w * 0.055} y={h * t} width={w * (0.8 - i * 0.13)} height={h * 0.05} rx={h * 0.02} fill={INK} opacity=".26" />)}
      <text x={w * 0.94} y={h * 0.94} fontSize={h * 0.055} fill={INK} opacity=".45" textAnchor="end" fontFamily="Arial, sans-serif">{Math.floor(w) % 9 + 4} / 28</text>
    </>
  );
}

/** A laptop, anchored at the screen's top-left corner; the base sits below. */
function Laptop({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const bezel = w * 0.045;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-bezel} y={-bezel} width={w + bezel * 2} height={h + bezel * 2} rx={bezel} fill={INK} />
      <DocPage w={w} h={h} />
      <path d={`M${-bezel - w * 0.09} ${h + bezel} h${w + bezel * 2 + w * 0.18} l${-w * 0.07} ${h * 0.11} h${-(w + bezel * 2 + w * 0.02)} z`} fill={DUSK} />
    </g>
  );
}

/** A tablet, anchored at its own top-left corner and optionally tilted, as if held. */
function Tablet({ x, y, w, h, tilt = 0 }: { x: number; y: number; w: number; h: number; tilt?: number }) {
  const bezel = w * 0.06;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <rect x={-bezel} y={-bezel} width={w + bezel * 2} height={h + bezel * 2} rx={bezel * 1.4} fill={INK} />
      <DocPage w={w} h={h} title={false} />
    </g>
  );
}

function Library() {
  const spine = (x: number, y: number, h: number, fill: string) => <rect key={`${x}-${y}`} x={x} y={y - h} width="4" height={h} rx="1" fill={fill} opacity=".85" />;
  const shelf = (y: number) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => spine(22 + i * 7, y, 12 + ((i * 5 + y) % 9), [SAND, LILAC, MINT, BRASS][(i + y) % 4]));
  return (
    <>
      <rect width="384" height="216" fill="url(#lib-wall)" />
      {/* Arched reading-room window — the only light in the room. */}
      <path d="M262 172V86a34 34 0 0 1 68 0v86z" fill="url(#lib-win)" />
      <path d="M296 52v120M262 108h68" stroke={INK} strokeWidth="3" opacity=".5" />
      <path d="M262 60 96 216h74L296 60z" fill={BRASS} opacity=".07" />
      <path d="M310 74 214 216h34l78-142z" fill={BRASS} opacity=".05" />
      {/* Stacks. */}
      <rect x="14" y="28" width="98" height="132" rx="3" fill={INK} opacity=".72" />
      {[60, 92, 124, 156].map(y => <g key={y}>{shelf(y)}<rect x="14" y={y} width="98" height="3" fill={DUSK} /></g>)}
      {/* A second student browsing the stacks, for depth. */}
      <ellipse cx="122" cy="176" rx="20" ry="7" fill={INK} opacity=".25" />
      <path d="M110 172c0-13 5-21 13-21s13 8 13 21z" fill={INK} opacity=".7" />
      <circle cx="123" cy="145" r="8" fill={INK} opacity=".7" />
      {/* Reading table, lamp, and the foreground student's own laptop. */}
      <ellipse cx="243" cy="150" rx="52" ry="30" fill="url(#lib-lamp)" />
      <rect x="-4" y="160" width="292" height="9" rx="2" fill="#3A2A72" />
      <rect x="-4" y="169" width="292" height="47" fill={INK} opacity=".55" />
      <Seated x={196} y={122} s={1.05} />
      <path d="M231 138h24l-6-11h-12z" fill={BRASS} />
      <Laptop x={196} y={112} w={72} h={46} />
    </>
  );
}

function Lawn() {
  const canopy = [[126, 34, 54, 30], [186, 18, 62, 34], [252, 30, 58, 32], [312, 20, 56, 30], [216, 56, 66, 26], [154, 62, 48, 22], [300, 60, 50, 22]] as const;
  return (
    <>
      <rect width="384" height="216" fill="url(#lawn-sky)" />
      <circle cx="70" cy="86" r="46" fill={BRASS} opacity=".16" />
      <circle cx="70" cy="86" r="18" fill="#F6DCA4" opacity=".5" />
      {/* Campus block on the far side of the quad. */}
      <path d="M0 132V104h30V92h8v12h34v28z" fill={DUSK} opacity=".8" />
      <path d="M96 132v-22a14 14 0 0 1 28 0v22z" fill={DUSK} opacity=".8" />
      <rect width="384" height="84" y="132" fill="url(#lawn-grass)" />
      {/* Banyan: canopy, trunk, aerial roots. */}
      {canopy.map(([cx, cy, rx, ry]) => <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} opacity=".92" />)}
      {[196, 214, 238, 262, 286, 310, 336].map((x, i) => <path key={x} d={`M${x} ${70 + (i % 3) * 6}v${34 + (i % 4) * 9}`} stroke={INK} strokeWidth={i % 2 ? 1.6 : 2.4} opacity=".8" />)}
      <path d="M292 62c6 26 4 48-6 70h26c-8-24-8-46-4-70z" fill={INK} />
      {[[120, 150], [170, 168], [240, 158], [316, 176], [86, 172], [206, 186]].map(([cx, cy]) => <ellipse key={cx} cx={cx} cy={cy} rx="14" ry="5" fill={BRASS} opacity=".13" />)}
      {/* A third student, cross-legged on a picnic blanket with a laptop. */}
      <ellipse cx="292" cy="204" rx="44" ry="8" fill={INK} opacity=".22" />
      <path d="M264 196h56l-6-6h-44z" fill={SAND} opacity=".55" />
      <path d="M270 188c0-13 6-21 16-21s16 8 16 21z" fill={INK} opacity=".85" />
      <circle cx="286" cy="160" r="9" fill={INK} opacity=".85" />
      <Laptop x={266} y={172} w={44} h={28} />
      {/* Two students on the grass, one holding a tablet with a MasterClass page open. */}
      <ellipse cx="150" cy="196" rx="46" ry="8" fill={INK} opacity=".28" />
      <path d="M118 192c0-18 8-28 20-28s20 10 20 28z" fill={INK} />
      <circle cx="138" cy="158" r="11" fill={INK} />
      <path d="M146 150a11 11 0 0 1 1 15" stroke={BRASS} strokeWidth="1.6" fill="none" opacity=".65" />
      <path d="M156 190c0-16 7-25 18-25s18 9 18 25z" fill={INK} opacity=".92" />
      <circle cx="174" cy="160" r="10" fill={INK} opacity=".92" />
      <Tablet x={152} y={168} w={30} h={20} tilt={-12} />
      <path d="M190 192h22l-4-14h-14z" fill={SAND} opacity=".7" />
    </>
  );
}

function Lab() {
  const monitor = (x: number, fill: string, line: string, id: string) => (
    <g key={id} opacity=".82">
      <ellipse cx={x + 38} cy="146" rx="46" ry="9" fill={fill} opacity=".2" />
      <rect x={x} y="86" width="76" height="52" rx="4" fill={INK} />
      <rect x={x + 3} y="89" width="70" height="46" rx="2" fill={fill} />
      {[8, 16, 24, 32].map(dy => <rect key={dy} x={x + 9} y={89 + dy} width={dy === 24 ? 34 : 56} height="3" rx="1.5" fill={line} opacity=".5" />)}
      <rect x={x + 32} y="138" width="12" height="7" fill={INK} />
      <rect x={x + 22} y="144" width="32" height="4" rx="2" fill={INK} />
    </g>
  );
  return (
    <>
      <rect width="384" height="216" fill={INK} />
      <rect width="384" height="150" fill="#221845" />
      {[26, 44].map(y => <g key={y}><rect x="70" y={y} width="290" height="3" rx="1.5" fill={BRASS} opacity=".55" /><rect x="70" y={y - 4} width="290" height="11" rx="5" fill={BRASS} opacity=".08" /></g>)}
      {/* Window blinds, late-afternoon. */}
      <rect x="322" y="60" width="62" height="88" fill={BRASS} opacity=".12" />
      {[66, 74, 82, 90, 98, 106, 114, 122, 130, 138].map(y => <rect key={y} x="322" y={y} width="62" height="2" fill={BRASS} opacity=".22" />)}
      {/* Three background terminals, softened so the foreground reads first. */}
      {monitor(96, "#DCEDE6", MINT, "minimal")}
      {monitor(186, "#F2E6CB", SAND, "corporate")}
      {monitor(276, "#3A1E52", "#FF6FD8", "cyber")}
      <rect x="0" y="148" width="384" height="8" fill={DUSK} />
      <rect x="0" y="156" width="384" height="60" fill={INK} />
      {/* Foreground student, rim-lit by the screens, with their own laptop open. */}
      <path d="M-30 216c0-48 24-74 58-74s58 26 58 74z" fill={INK} />
      <circle cx="28" cy="118" r="25" fill={INK} />
      <path d="M50 104a25 25 0 0 1 3 31" stroke={MINT} strokeWidth="2" fill="none" opacity=".55" />
      <Laptop x={66} y={140} w={98} h={62} />
    </>
  );
}

function Steps() {
  const tread = (y: number, h: number, o: number) => <g key={y}><rect x="0" y={y} width="384" height="3" fill={LILAC} opacity={o + .18} /><rect x="0" y={y + 3} width="384" height={h} fill={DUSK} opacity={o} /></g>;
  return (
    <>
      <rect width="384" height="216" fill="url(#steps-sky)" />
      <circle cx="286" cy="100" r="34" fill={BRASS} opacity=".2" />
      <circle cx="286" cy="100" r="15" fill="#F7DFA8" />
      {/* Skyline: clock tower, dome, hall, trees. */}
      <path d="M48 108V56h4l6-10 6 10h4v52z" fill={INK} />
      <path d="M126 108V88a16 16 0 0 1 32 0v20z" fill={INK} />
      <path d="M142 72v-8" stroke={INK} strokeWidth="2" />
      <rect x="164" y="90" width="72" height="18" fill={INK} />
      {[[318, 96, 15], [344, 100, 12], [364, 97, 13]].map(([cx, cy, r]) => <circle key={cx} cx={cx} cy={cy} r={r} fill={INK} />)}
      <rect x="0" y="106" width="384" height="4" fill={INK} />
      {/* Amphitheatre steps, deepening toward the viewer. */}
      {tread(110, 9, .55)}{tread(122, 12, .66)}{tread(137, 16, .76)}{tread(156, 22, .86)}{tread(181, 35, 1)}
      {/* Strung lights along the top of the seating. */}
      <path d="M-6 26q96 40 198 22t198-30" stroke={BRASS} strokeWidth="1" fill="none" opacity=".45" />
      {[10, 52, 96, 140, 184, 226, 268, 310, 352].map((cx, i) => <circle key={cx} cx={cx} cy={[32, 42, 46, 46, 42, 36, 30, 25, 21][i]} r="2.6" fill={BRASS} opacity=".9" />)}
      {/* One student with a tablet propped on their knees; another a row down. */}
      <path d="M92 156c0-15 8-24 20-24s20 9 20 24z" fill={INK} />
      <circle cx="112" cy="126" r="10" fill={INK} />
      <path d="M120 118a10 10 0 0 1 1 14" stroke={BRASS} strokeWidth="1.6" fill="none" opacity=".75" />
      <Tablet x={98} y={140} w={30} h={20} tilt={8} />
      <path d="M236 190c0-19 10-30 24-30s24 11 24 30z" fill={INK} opacity=".95" />
      <circle cx="260" cy="152" r="12" fill={INK} opacity=".95" />
      <path d="M270 143a12 12 0 0 1 1 17" stroke={BRASS} strokeWidth="1.8" fill="none" opacity=".8" />
    </>
  );
}

const SCENES: Record<HeroScene, () => JSX.Element> = { library: Library, lawn: Lawn, lab: Lab, steps: Steps };

export function HeroArt({ scene, className }: { scene: HeroScene; className?: string }) {
  const Scene = SCENES[scene];
  return (
    <svg viewBox="0 0 384 216" className={className} role="presentation" aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="lib-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={DUSK} /><stop offset="1" stopColor={INK} /></linearGradient>
        <linearGradient id="lib-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F7E0AC" /><stop offset="1" stopColor={BRASS} /></linearGradient>
        <radialGradient id="lib-lamp"><stop offset="0" stopColor={BRASS} stopOpacity=".5" /><stop offset="1" stopColor={BRASS} stopOpacity="0" /></radialGradient>
        <linearGradient id="lawn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4B36A6" /><stop offset=".62" stopColor={LILAC} /><stop offset="1" stopColor="#EBC58B" /></linearGradient>
        <linearGradient id="lawn-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F5A57" /><stop offset="1" stopColor="#1D3540" /></linearGradient>
        <linearGradient id="steps-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#241A4D" /><stop offset=".5" stopColor="#6B4C9E" /><stop offset="1" stopColor="#E9B471" /></linearGradient>
      </defs>
      <Scene />
    </svg>
  );
}
