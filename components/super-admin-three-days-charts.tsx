"use client";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

/** The three days' colours: older days quieter, today strongest (shared with the section's legend and table). */
export const DAY_COLOURS = ["#a8b3c4", "#2a78d6", "#eb6834"] as const;
const MUTED = "#73726c", GRID = "#ebe9e1";
export type HourRow = { hour: string; values: (number | null)[] };

/**
 * Hour by hour (IST) for the three days, as lines (the shape of each day) or grouped bars (exact hours side by side).
 * Today's hours that have not happened yet are null, so its line stops at the current hour instead of falling to zero.
 */
export function HourlyCompare({ rows, labels, mode, unit, nowHour }: Readonly<{ rows: HourRow[]; labels: string[]; mode: "lines" | "bars"; unit: string; nowHour: number }>) {
  const data = rows.map(row => Object.fromEntries([["hour", row.hour], ...row.values.map((value, i) => [`d${i}`, value])]));
  const tooltip = <Tooltip formatter={(value, name) => [value == null ? "not yet" : `${Number(value).toLocaleString("en-IN")} ${unit}`, labels[Number(String(name).slice(1))] ?? String(name)]} labelFormatter={label => `${label} IST`} />;
  const legend = <Legend formatter={(value: string) => labels[Number(value.slice(1))] ?? value} wrapperStyle={{ fontSize: 12 }} />;
  const axes = <>
    <CartesianGrid vertical={false} stroke={GRID} />
    <XAxis dataKey="hour" tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} interval={2} />
    <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={false} width={34} />
    <ReferenceLine x={rows[nowHour]?.hour} stroke="#eb6834" strokeDasharray="4 4" label={{ value: "now", fill: "#eb6834", fontSize: 11, position: "top" }} />
  </>;
  return mode === "lines"
    ? <LineChart responsive style={{ width: "100%", height: 300 }} data={data} margin={{ top: 22, right: 12, bottom: 4, left: 0 }} accessibilityLayer>
        {axes}{tooltip}{legend}
        {labels.map((_, i) => <Line key={i} type="monotone" dataKey={`d${i}`} stroke={DAY_COLOURS[i]} strokeWidth={i === 2 ? 3 : 2} dot={i === 2 ? { r: 2.5 } : false} connectNulls={false} isAnimationActive={false} />)}
      </LineChart>
    : <BarChart responsive style={{ width: "100%", height: 300 }} data={data} margin={{ top: 22, right: 12, bottom: 4, left: 0 }} barCategoryGap="18%" accessibilityLayer>
        {axes}{tooltip}{legend}
        {labels.map((_, i) => <Bar key={i} dataKey={`d${i}`} fill={DAY_COLOURS[i]} radius={[3, 3, 0, 0]} isAnimationActive={false} />)}
      </BarChart>;
}
