"use client";
import { Bar, BarChart, CartesianGrid, LabelList, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import styles from "./super-admin-week.module.css";

/*
 * The "Last 7 days" charts (Recharts, loaded only on the Super Admin Overview: components/super-admin-week.tsx).
 * Colours are the data-viz reference palette's eight categorical slots in their fixed order (validated: adjacent
 * pairs pass the colour-vision checks). Three slots sit under 3:1 contrast, so every chart also prints its values.
 */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const OTHER = "#a3a29b";
const INK = "#3d3d3a", MUTED = "#73726c", GRID = "#ebe9e1";

export type Slice = { name: string; value: number };

const share = (value: number, total: number) => total ? `${Math.round((value / total) * 1000) / 10}%` : "0%";

/** A donut with a legend that names every slice with its value and share; slices keep their order (fixed colours). */
export function Donut({ title, unit, data, center }: Readonly<{ title: string; unit: string; data: Slice[]; center?: string }>) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const filled = data.map((slice, index) => ({ ...slice, fill: slice.name === "Other" ? OTHER : SERIES[index % SERIES.length] }));
  return <figure className={styles.donut}>
    <figcaption>{title}</figcaption>
    {total === 0 ? <p className={styles.empty}>No {unit} in these 7 days.</p> : <>
      <div className={styles.donutPlot}>
        <PieChart responsive style={{ width: "100%", height: 190 }} accessibilityLayer>
          {/* A 2px surface-coloured edge separates neighbouring slices. */}
          <Pie data={filled} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="92%" stroke="#fff" strokeWidth={2} isAnimationActive={false} />
          <Tooltip formatter={(value) => [`${Number(value).toLocaleString("en-IN")} ${unit} · ${share(Number(value), total)}`, ""]} separator="" />
        </PieChart>
        <span className={styles.donutCenter} aria-hidden="true"><strong>{total.toLocaleString("en-IN")}</strong><small>{center ?? unit}</small></span>
      </div>
      <ul className={styles.legend}>{filled.map(slice => <li key={slice.name}>
        <i style={{ background: slice.fill }} aria-hidden="true" /><span title={slice.name}>{slice.name}</span>
        <b>{slice.value.toLocaleString("en-IN")}</b><small>{share(slice.value, total)}</small>
      </li>)}</ul>
    </>}
  </figure>;
}

export type DayBar = { label: string; visitors: number; views: number; rank: number; partial: boolean };

/** Visitors per day, oldest to newest, each bar labelled with its count and the three busiest with their rank. */
export function DayBars({ data }: Readonly<{ data: DayBar[] }>) {
  const rows = data.map(day => ({ ...day, tag: day.rank <= 3 ? `#${day.rank} · ${day.visitors}` : String(day.visitors) }));
  return <BarChart responsive style={{ width: "100%", height: 260 }} data={rows} margin={{ top: 26, right: 8, bottom: 4, left: -18 }} barCategoryGap="22%" accessibilityLayer>
    <CartesianGrid vertical={false} stroke={GRID} />
    <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} interval={0} />
    <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={false} />
    <Tooltip cursor={{ fill: "rgba(42,120,214,.07)" }} formatter={(value, name) => [Number(value).toLocaleString("en-IN"), name === "visitors" ? "Visitors" : "Page views"]}
      labelFormatter={(label, payload) => { const day = payload?.[0]?.payload as DayBar | undefined; return day ? `${label} · rank #${day.rank}${day.partial ? " · today, so far" : ""}` : String(label); }} />
    <Bar dataKey="visitors" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={46} isAnimationActive={false}>
      <LabelList dataKey="tag" position="top" fill={INK} fontSize={11} fontWeight={600} />
    </Bar>
  </BarChart>;
}
