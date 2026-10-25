/*
 * Country flags as small inline SVGs. Flag emoji are not drawn on Windows (they show as "US", "IN"), so the language
 * switcher draws its own: simplified but recognisable at 20px, with a hairline edge so white fields stay visible.
 */
const star = (cx: number, cy: number, r: number, turn = 0) => Array.from({ length: 10 }, (_, i) => {
  const angle = turn + (Math.PI / 5) * i - Math.PI / 2;
  const radius = i % 2 ? r * 0.382 : r;
  return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

const FLAGS: Record<string, React.ReactNode> = {
  US: <>
    <rect width="30" height="20" fill="#fff" />
    {Array.from({ length: 7 }, (_, i) => <rect key={i} y={i * 3.077} width="30" height="1.538" fill="#b22234" />)}
    <rect width="13" height="10.77" fill="#3c3b6e" />
    {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={2 + (i % 3) * 4.5} cy={2 + Math.floor(i / 3) * 3.4} r=".75" fill="#fff" />)}
  </>,
  IN: <>
    <rect width="30" height="6.67" fill="#ff9933" />
    <rect y="6.67" width="30" height="6.66" fill="#fff" />
    <rect y="13.33" width="30" height="6.67" fill="#138808" />
    <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth=".7" />
    <circle cx="15" cy="10" r=".6" fill="#000080" />
  </>,
  ES: <>
    <rect width="30" height="20" fill="#aa151b" />
    <rect y="5" width="30" height="10" fill="#f1bf00" />
  </>,
  JP: <>
    <rect width="30" height="20" fill="#fff" />
    <circle cx="15" cy="10" r="6" fill="#bc002d" />
  </>,
  DE: <>
    <rect width="30" height="6.67" fill="#000" />
    <rect y="6.67" width="30" height="6.66" fill="#dd0000" />
    <rect y="13.33" width="30" height="6.67" fill="#ffce00" />
  </>,
  FR: <>
    <rect width="10" height="20" fill="#002395" />
    <rect x="10" width="10" height="20" fill="#fff" />
    <rect x="20" width="10" height="20" fill="#ed2939" />
  </>,
  CN: <>
    <rect width="30" height="20" fill="#ee1c25" />
    <polygon points={star(5.5, 5.5, 3.2)} fill="#ffde00" />
    {[[10.5, 2.2], [12.5, 4.4], [12.5, 7.4], [10.5, 9.4]].map(([x, y]) => <polygon key={`${x}-${y}`} points={star(x, y, 1.05, 0.6)} fill="#ffde00" />)}
  </>,
};

export function FlagIcon({ country, size = 20, className }: Readonly<{ country: string; size?: number; className?: string }>) {
  const flag = FLAGS[country.toUpperCase()];
  return <svg viewBox="0 0 30 20" width={size} height={Math.round(size * 2 / 3)} className={className} aria-hidden="true" focusable="false" style={{ borderRadius: 3, flexShrink: 0 }}>
    {flag ?? <rect width="30" height="20" fill="#d1cfc5" />}
    <rect x=".5" y=".5" width="29" height="19" rx="2.5" fill="none" stroke="rgba(20,20,19,.18)" />
  </svg>;
}
