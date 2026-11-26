/*
 * IELTS Writing Task 1 visuals for the IELTS dashboard (2026-11-26): line graphs, bar charts, pie charts, a table,
 * process diagrams and a map, each drawn as an SVG picture from its own data, so the picture, the objective questions
 * computed from it (lib/ielts/practice.ts) and the hand-written model answer all describe the same numbers.
 * The data is invented for practice ("Country A", "a city"), not official statistics.
 * Listening forms (the note-completion cards of the Listening drills) are drawn here too.
 */

type Series = { name: string; values: number[] };
type Base = { id: string; title: string; task: string; model: string };
export type LineChart = Base & { kind: "line"; unit: string; x: string[]; series: Series[]; projectedFrom?: number };
export type BarChart = Base & { kind: "bar"; unit: string; x: string[]; series: Series[] };
export type PieChart = Base & { kind: "pie"; pies: { label: string; slices: { name: string; value: number }[] }[] };
export type TableChart = Base & { kind: "table"; unit: string; columns: string[]; rows: Series[] };
/** Hand-written questions about a diagram: the question, the right option, three wrong ones and why. */
export type DiagramQuestion = { q: string; right: string; wrong: [string, string, string]; why: string };
export type ProcessChart = Base & { kind: "process"; steps: string[]; cycle: boolean; questions: DiagramQuestion[] };
/** A map feature on a 6 × 4 grid: [column, row, width, height]. */
type Feature = { name: string; at: [number, number, number, number]; fill: string };
export type MapChart = Base & { kind: "map"; before: { label: string; features: Feature[] }; after: { label: string; features: Feature[] }; questions: DiagramQuestion[] };
export type Task1Chart = LineChart | BarChart | PieChart | TableChart | ProcessChart | MapChart;

const PROMPT = "Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.";
const ROAD = "#cfcac0", RIVER = "#9cc8e8", GREEN = "#b9d9a3", BUILDING = "#efd9b4", HOMES = "#e8c4b4", CIVIC = "#c9c2e6";

export const TASK1_CHARTS: Task1Chart[] = [
  { kind: "line", id: "internet", title: "Households with internet access, 2000–2020", unit: "% of households",
    task: `The line graph shows the percentage of households with internet access in three countries between 2000 and 2020. ${PROMPT}`,
    x: ["2000", "2005", "2010", "2015", "2020"],
    series: [{ name: "Country A", values: [18, 42, 68, 84, 95] }, { name: "Country B", values: [5, 14, 35, 61, 82] }, { name: "Country C", values: [40, 55, 63, 70, 74] }],
    model: "The line graph compares the proportion of households with internet access in three countries between 2000 and 2020, measured every five years.\n\nOverall, access rose in all three countries, but growth was fastest in Country B, while Country C, which started highest, ended lowest.\n\nIn 2000, Country C had the greatest level of access at 40%, compared with 18% in Country A and just 5% in Country B. Over the next two decades, Country A grew rapidly, overtaking Country C by 2010 (68% against 63%) and reaching 95% in 2020.\n\nCountry B followed a similar upward path from a much lower base, climbing steadily to 61% in 2015 and 82% by the end of the period. Country C, by contrast, grew only gradually, adding 34 percentage points to finish at 74%, the lowest figure of the three." },
  { kind: "line", id: "museums", title: "Visitors to three museums, 2016–2024", unit: "thousands of visitors",
    task: `The graph below shows the number of visitors to three museums in one city between 2016 and 2024. ${PROMPT}`,
    x: ["2016", "2018", "2020", "2022", "2024"],
    series: [{ name: "Science Museum", values: [520, 560, 210, 480, 610] }, { name: "Art Gallery", values: [340, 380, 150, 390, 450] }, { name: "History Museum", values: [410, 400, 120, 260, 300] }],
    model: "The line graph shows how many people visited three museums between 2016 and 2024.\n\nOverall, visitor numbers at all three fell sharply in 2020 before recovering, and the Science Museum remained the most popular throughout. However, only the History Museum failed to return to its earlier level.\n\nIn 2016, the Science Museum attracted 520,000 visitors, ahead of the History Museum (410,000) and the Art Gallery (340,000). Over the next two years, numbers at the Science Museum and the Art Gallery rose slightly, to 560,000 and 380,000, while the History Museum dipped marginally to 400,000. In 2020, attendance collapsed to 210,000, 150,000 and 120,000 for the Science Museum, the Art Gallery and the History Museum respectively.\n\nBy 2024, the Science Museum had reached a peak of 610,000 and the Art Gallery 450,000, both above their 2016 figures. In contrast, the History Museum recovered only to 300,000, roughly a quarter below its starting point." },
  { kind: "line", id: "electricity", title: "Electricity generation by source, 1990–2030", unit: "terawatt hours (TWh)", projectedFrom: 4,
    task: `The graph below shows electricity generation from three sources in Country X from 1990 to 2020, with projections to 2030. ${PROMPT}`,
    x: ["1990", "2000", "2010", "2020", "2030*"],
    series: [{ name: "Coal", values: [120, 135, 140, 95, 40] }, { name: "Gas", values: [30, 60, 85, 90, 70] }, { name: "Renewables", values: [5, 10, 30, 75, 150] }],
    model: "The line graph illustrates electricity generation from coal, gas and renewable sources in Country X from 1990 to 2020, with projections to 2030.\n\nOverall, coal is expected to move from being the main source of electricity to the smallest, while renewables are predicted to become dominant.\n\nIn 1990, coal produced 120 terawatt hours (TWh), far more than gas (30 TWh) and renewables (5 TWh). Coal output rose slightly to a peak of 140 TWh in 2010, then dropped to 95 TWh in 2020, and it is forecast to fall to just 40 TWh by 2030. Gas generation tripled to 90 TWh by 2020, but it is expected to decline to 70 TWh.\n\nRenewables grew slowly at first, reaching only 10 TWh in 2000, before rising sharply to 75 TWh in 2020. They are projected to double to 150 TWh by 2030, overtaking both fossil fuels." },
  { kind: "bar", id: "exercise", title: "Adults who exercise regularly, by age and gender", unit: "% of adults",
    task: `The bar chart shows the percentage of men and women in one country who exercise regularly, by age group. ${PROMPT}`,
    x: ["18–29", "30–44", "45–59", "60+"],
    series: [{ name: "Men", values: [62, 51, 44, 38] }, { name: "Women", values: [58, 49, 47, 41] }],
    model: "The bar chart compares the percentage of men and women who exercise regularly across four age groups.\n\nOverall, participation declines with age for both genders. Men are more active than women in the two younger groups, whereas the pattern reverses from the age of 45.\n\nAmong 18–29-year-olds, 62% of men and 58% of women exercise regularly, the highest figures in the chart. These fall to 51% and 49% respectively for those aged 30–44.\n\nIn the 45–59 group, the proportion of women (47%) is slightly higher than that of men (44%). The lowest rates are seen in people aged 60 and over, where 41% of women and only 38% of men take regular exercise. The gap between the genders is never more than four percentage points." },
  { kind: "bar", id: "student-time", title: "Students' weekly hours on five activities, 2005 and 2025", unit: "hours per week",
    task: `The chart below shows the average number of hours per week that university students spent on five activities in 2005 and 2025. ${PROMPT}`,
    x: ["Studying", "Social media", "Sport", "Part-time work", "Reading"],
    series: [{ name: "2005", values: [14, 2, 6, 8, 5] }, { name: "2025", values: [12, 11, 4, 7, 2] }],
    model: "The bar chart compares how many hours per week students spent on five activities in 2005 and 2025.\n\nOverall, time spent on social media rose dramatically, while every other activity declined, and studying remained the most time-consuming activity in both years.\n\nIn 2005, students studied for 14 hours a week, compared with 8 hours of part-time work, 6 hours of sport and 5 hours of reading for pleasure; social media took up only 2 hours.\n\nBy 2025, social media use had increased more than fivefold to 11 hours, almost matching studying, which fell slightly to 12 hours. Meanwhile, part-time work dipped to 7 hours and sport to 4 hours. Reading for pleasure saw the steepest proportional fall, dropping to just 2 hours per week." },
  { kind: "bar", id: "intl-students", title: "International students in four countries, 2015 and 2025", unit: "thousands of students",
    task: `The bar chart shows the number of international students at universities in four countries in 2015 and 2025. ${PROMPT}`,
    x: ["Country A", "Country B", "Country C", "Country D"],
    series: [{ name: "2015", values: [120, 95, 60, 140] }, { name: "2025", values: [210, 130, 150, 125] }],
    model: "The bar chart shows the number of international students at universities in four countries in 2015 and 2025.\n\nOverall, three of the four countries attracted more international students over the decade, with Country C showing the most dramatic growth, while Country D was the only one to see a decline.\n\nIn 2015, Country D had the most international students, at 140,000, followed by Country A (120,000), Country B (95,000) and Country C (60,000).\n\nTen years later, Country A had become the leading destination with 210,000 students, an increase of 90,000. Country C's figure more than doubled to 150,000, moving it into second place, and Country B grew more modestly to 130,000. In contrast, numbers in Country D fell slightly to 125,000, leaving it with the smallest number of the four." },
  { kind: "pie", id: "spending", title: "Household spending in Country X, 1990 and 2020",
    task: `The pie charts show how households in Country X spent their money in 1990 and 2020. ${PROMPT}`,
    pies: [
      { label: "1990", slices: [{ name: "Housing", value: 22 }, { name: "Food", value: 31 }, { name: "Transport", value: 14 }, { name: "Leisure", value: 8 }, { name: "Clothing", value: 13 }, { name: "Other", value: 12 }] },
      { label: "2020", slices: [{ name: "Housing", value: 34 }, { name: "Food", value: 17 }, { name: "Transport", value: 15 }, { name: "Leisure", value: 16 }, { name: "Clothing", value: 6 }, { name: "Other", value: 12 }] },
    ],
    model: "The pie charts compare how households in Country X divided their spending between six categories in 1990 and 2020.\n\nOverall, housing replaced food as the largest expense, and the share spent on leisure doubled, while spending on clothing fell considerably.\n\nIn 1990, food accounted for the biggest proportion of spending at 31%, followed by housing at 22%. Transport and clothing made up 14% and 13% respectively, while leisure took only 8%.\n\nBy 2020, housing had risen to over a third of the total (34%), whereas food dropped to 17%. Leisure spending doubled to 16%, overtaking transport, which changed little at 15%. Clothing fell by more than half to 6%. The 'other' category remained unchanged at 12% in both years." },
  { kind: "pie", id: "waste", title: "How a city treated its waste, 2004 and 2024",
    task: `The pie charts show the methods a city used to deal with its household waste in 2004 and 2024. ${PROMPT}`,
    pies: [
      { label: "2004", slices: [{ name: "Landfill", value: 72 }, { name: "Recycling", value: 10 }, { name: "Composting", value: 3 }, { name: "Incineration", value: 15 }] },
      { label: "2024", slices: [{ name: "Landfill", value: 38 }, { name: "Recycling", value: 29 }, { name: "Composting", value: 15 }, { name: "Incineration", value: 18 }] },
    ],
    model: "The pie charts show how a city treated its household waste in 2004 and 2024.\n\nOverall, the city relied far less on landfill by 2024, with recycling and composting together taking a much larger share.\n\nIn 2004, almost three quarters of waste (72%) went to landfill. Incineration accounted for 15%, while recycling and composting were minor methods at 10% and 3% respectively.\n\nTwenty years later, landfill was still the most common method, but its share had almost halved to 38%. Recycling nearly tripled to 29%, and composting rose fivefold to 15%. Incineration increased only slightly, to 18%." },
  { kind: "table", id: "commute", title: "Average journey time to work (minutes)", unit: "minutes",
    task: `The table below shows the average time it takes commuters in four cities to travel to work by different modes of transport. ${PROMPT}`,
    columns: ["Car", "Bus", "Train", "Bicycle"],
    rows: [{ name: "City A", values: [32, 45, 28, 20] }, { name: "City B", values: [41, 38, 25, 30] }, { name: "City C", values: [25, 50, 35, 18] }, { name: "City D", values: [38, 42, 30, 24] }],
    model: "The table shows the average time, in minutes, that commuters in four cities spend travelling to work by car, bus, train and bicycle.\n\nOverall, cycling was the quickest way to get to work in three of the four cities, while the bus was the slowest option in three cities.\n\nBus journeys took longest in City C, at 50 minutes, followed by City A (45 minutes) and City D (42 minutes). City B was the exception, as driving there took 41 minutes, slightly longer than the bus (38 minutes). Train journeys were relatively consistent, ranging from 25 minutes in City B to 35 minutes in City C.\n\nCycling was fastest in City C, at only 18 minutes, as well as in City A (20 minutes) and City D (24 minutes). In City B, however, the train (25 minutes) beat the bicycle, which took 30 minutes." },
  { kind: "process", id: "tea", title: "How black tea is produced", cycle: false,
    task: `The diagram below shows the stages in the production of black tea. ${PROMPT}`,
    steps: ["Leaves picked by hand", "Withered on racks (12–18 hours)", "Rolled to break the leaf cells", "Oxidised in a cool, humid room", "Dried with hot air at 120 °C", "Sorted and graded by size", "Packed and shipped"],
    questions: [
      { q: "What happens to the leaves immediately after withering?", right: "They are rolled", wrong: ["They are dried", "They are sorted", "They are oxidised"], why: "Stage 2 is withering and stage 3 is rolling to break the leaf cells." },
      { q: "At what temperature are the leaves dried?", right: "120 °C", wrong: ["12 °C", "18 °C", "100 °C"], why: "Stage 5: dried with hot air at 120 °C. 12 and 18 are the withering hours." },
      { q: "How many stages does the diagram show?", right: "Seven", wrong: ["Five", "Six", "Eight"], why: "Picking, withering, rolling, oxidising, drying, sorting and packing: seven stages." },
    ],
    model: "The diagram illustrates the stages in the production of black tea, from picking the leaves to shipping the finished product.\n\nOverall, there are seven stages, beginning with harvesting and ending with packing, and most of the process involves changing the moisture and structure of the leaves.\n\nFirst, tea leaves are picked by hand. They are then spread out on racks and left to wither for between 12 and 18 hours, which softens them. Next, the leaves are rolled to break their cells, after which they are oxidised in a cool, humid room, which gives the tea its dark colour and flavour.\n\nFollowing this, the leaves are dried with hot air at 120°C. Finally, the dried tea is sorted and graded according to size, before being packed and shipped to customers." },
  { kind: "process", id: "glass", title: "How glass bottles are recycled", cycle: true,
    task: `The diagram below shows how glass bottles are recycled. ${PROMPT}`,
    steps: ["Bottles put in recycling bins", "Taken by lorry to a plant", "Sorted by colour", "Washed to remove labels", "Crushed into cullet", "Melted with sand at 1,500 °C", "Moulded into new bottles", "Filled and sold in shops"],
    questions: [
      { q: "What is the crushed glass called in the diagram?", right: "Cullet", wrong: ["Sand", "Moulds", "Labels"], why: "Stage 5: the glass is crushed into small pieces called cullet." },
      { q: "Which stage comes directly before washing?", right: "Sorting by colour", wrong: ["Crushing", "Melting", "Transport to the plant"], why: "Stage 3 is sorting by colour and stage 4 is washing." },
      { q: "What is the glass melted with?", right: "Sand", wrong: ["Water", "Labels", "Coal"], why: "Stage 6: the cullet is melted with sand at 1,500 °C." },
    ],
    model: "The diagram shows how used glass bottles are recycled.\n\nOverall, the process is a cycle of eight stages in which old bottles are collected, processed into raw material and turned into new bottles that return to the shops.\n\nTo begin with, used bottles are placed in recycling bins and then transported by lorry to a recycling plant. There, they are sorted by colour and washed to remove labels and dirt. The clean glass is then crushed into small pieces known as cullet.\n\nThese pieces are melted together with sand at a temperature of 1,500°C, and the molten glass is moulded into new bottles. Finally, the new bottles are filled and sold in shops, after which they can be collected and recycled once again." },
  { kind: "map", id: "town-centre", title: "Changes to a town centre: 2000 and today",
    task: `The maps below show the centre of a town in 2000 and today. ${PROMPT}`,
    before: { label: "2000", features: [
      { name: "Main Road", at: [0, 0, 6, 0.6], fill: ROAD }, { name: "Factory", at: [0, 0.8, 2, 2], fill: "#d4d0c8" }, { name: "Car park", at: [2.2, 0.8, 1.8, 0.9], fill: ROAD },
      { name: "Shops", at: [2.2, 1.9, 1.8, 0.9], fill: BUILDING }, { name: "Bus station", at: [4.2, 0.8, 1.8, 0.9], fill: "#d8d8d8" }, { name: "Park", at: [4.2, 1.9, 1.8, 1.5], fill: GREEN },
      { name: "Houses", at: [0, 3, 4, 0.5], fill: HOMES }, { name: "River", at: [0, 3.6, 6, 0.4], fill: RIVER }] },
    after: { label: "Today", features: [
      { name: "Main Road", at: [0, 0, 6, 0.6], fill: ROAD }, { name: "Apartments", at: [0, 0.8, 2, 2], fill: HOMES }, { name: "Shopping centre", at: [2.2, 0.8, 1.8, 2], fill: BUILDING },
      { name: "Library", at: [4.2, 0.8, 1.8, 0.9], fill: CIVIC }, { name: "Park", at: [4.2, 1.9, 1.8, 1.5], fill: GREEN },
      { name: "Houses", at: [0, 3, 4, 0.28], fill: HOMES }, { name: "Riverside walk", at: [0, 3.31, 6, 0.27], fill: "#e9e1c9" }, { name: "River", at: [0, 3.6, 6, 0.4], fill: RIVER }] },
    questions: [
      { q: "What has replaced the factory?", right: "Apartments", wrong: ["A library", "A shopping centre", "A car park"], why: "The factory in the west of the 2000 map is apartments on today's map." },
      { q: "What happened to the car park and the shops?", right: "They were combined into a shopping centre", wrong: ["They were turned into a park", "They became a bus station", "They were left unchanged"], why: "Today one shopping centre covers the area of both." },
      { q: "Which feature has not changed?", right: "The park", wrong: ["The bus station", "The factory", "The car park"], why: "The park is the same size and in the same place on both maps." },
    ],
    model: "The maps illustrate the changes made to a town centre between 2000 and today.\n\nOverall, the centre has been transformed from an industrial and transport area into one focused on housing, shopping and leisure, although the main road, the park and the housing area remain.\n\nIn 2000, a factory occupied the west of the centre, just south of the main road. To its east were a car park and a row of shops, while a bus station stood in the north-east corner, with a park below it. Houses lined the south of the area, beside the river.\n\nToday, the factory has been demolished and replaced by apartments. The car park and shops have been combined into a single shopping centre, and the bus station has been converted into a library. The park has been kept, and a new riverside walk has been built along the southern edge of the town, next to the river." },
];

/* ---------- SVG drawing ---------- */
const W = 640, H = 400;
const PALETTE = ["#2f6fb0", "#c96442", "#2f7d5b", "#b7791f", "#7a5ea8", "#6b7280"];
const INK = "#262624", MUTED = "#5e5d59", RULE = "#e6e2d6";
const FONT = "font-family=\"system-ui, -apple-system, Segoe UI, Roboto, sans-serif\"";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const text = (x: number, y: number, s: string, opt: { size?: number; anchor?: "start" | "middle" | "end"; fill?: string; weight?: number } = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${opt.size ?? 12}" text-anchor="${opt.anchor ?? "start"}" fill="${opt.fill ?? INK}"${opt.weight ? ` font-weight="${opt.weight}"` : ""}>${esc(s)}</text>`;
const frame = (title: string, body: string, height = H) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" ${FONT}><rect width="${W}" height="${height}" fill="#ffffff"/>${text(W / 2, 28, title, { size: 15, anchor: "middle", weight: 600 })}${body}</svg>`;
/** A round axis maximum: the next 1, 2, 2.5 or 5 × 10ⁿ step above the data, in five gridlines. */
function niceMax(max: number) {
  const raw = max / 5, pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw)!;
  return { top: Math.ceil(max / step) * step, step };
}
function legend(names: string[], y: number) {
  const widths = names.map(n => 26 + n.length * 7);
  let x = (W - widths.reduce((a, b) => a + b + 14, -14)) / 2;
  return names.map((n, i) => { const out = `<rect x="${x.toFixed(1)}" y="${y - 9}" width="14" height="10" rx="2" fill="${PALETTE[i]}"/>${text(x + 19, y, n, { size: 12, fill: MUTED })}`; x += widths[i] + 14; return out; }).join("");
}
function axes(unit: string, max: number, left: number, top: number, width: number, height: number) {
  const { top: peak, step } = niceMax(max); let out = "";
  for (let v = 0; v <= peak + 1e-9; v += step) {
    const y = top + height - (v / peak) * height;
    out += `<line x1="${left}" x2="${left + width}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${RULE}"/>${text(left - 8, y + 4, String(Math.round(v * 10) / 10), { size: 11, anchor: "end", fill: MUTED })}`;
  }
  out += `<line x1="${left}" x2="${left + width}" y1="${top + height}" y2="${top + height}" stroke="${MUTED}"/>`;
  out += `<text transform="translate(16 ${top + height / 2}) rotate(-90)" font-size="11" text-anchor="middle" fill="${MUTED}">${esc(unit)}</text>`;
  return { out, peak };
}

function drawLine(c: LineChart) {
  const left = 64, top = 64, width = W - left - 28, height = H - top - 64;
  const { out, peak } = axes(c.unit, Math.max(...c.series.flatMap(s => s.values)), left, top, width, height);
  const xAt = (i: number) => left + (i / (c.x.length - 1)) * width, yAt = (v: number) => top + height - (v / peak) * height;
  let body = out + c.x.map((label, i) => text(xAt(i), top + height + 18, label, { size: 11.5, anchor: "middle", fill: MUTED })).join("");
  if (c.projectedFrom !== undefined) body += `<rect x="${xAt(c.projectedFrom - 1)}" y="${top}" width="${xAt(c.projectedFrom) - xAt(c.projectedFrom - 1)}" height="${height}" fill="#f5f4ed" opacity=".7"/>${text(xAt(c.projectedFrom) - 4, top + 14, "* projected", { size: 10.5, anchor: "end", fill: MUTED })}`;
  c.series.forEach((s, k) => {
    const pts = s.values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`);
    body += `<polyline points="${pts.join(" ")}" fill="none" stroke="${PALETTE[k]}" stroke-width="2.5"/>`;
    body += s.values.map((v, i) => `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(v).toFixed(1)}" r="3.5" fill="#fff" stroke="${PALETTE[k]}" stroke-width="2"/>`).join("");
  });
  return frame(c.title, body + legend(c.series.map(s => s.name), H - 14));
}

function drawBar(c: BarChart) {
  const left = 64, top = 64, width = W - left - 28, height = H - top - 70;
  const { out, peak } = axes(c.unit, Math.max(...c.series.flatMap(s => s.values)), left, top, width, height);
  const group = width / c.x.length, bar = Math.min(34, (group * 0.72) / c.series.length);
  let body = out;
  c.x.forEach((label, i) => {
    const start = left + i * group + (group - bar * c.series.length) / 2;
    c.series.forEach((s, k) => {
      const v = s.values[i], h = (v / peak) * height, x = start + k * bar;
      body += `<rect x="${x.toFixed(1)}" y="${(top + height - h).toFixed(1)}" width="${(bar - 3).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${PALETTE[k]}"/>${text(x + (bar - 3) / 2, top + height - h - 5, String(v), { size: 10.5, anchor: "middle", fill: MUTED })}`;
    });
    body += text(left + i * group + group / 2, top + height + 18, label, { size: 11.5, anchor: "middle", fill: MUTED });
  });
  return frame(c.title, body + legend(c.series.map(s => s.name), H - 14));
}

function drawPie(c: PieChart) {
  const names = c.pies[0].slices.map(s => s.name), r = 105, cy = 200;
  let body = "";
  c.pies.forEach((pie, p) => {
    const cx = c.pies.length === 1 ? W / 2 : W / 4 + p * (W / 2);
    const total = pie.slices.reduce((a, s) => a + s.value, 0); let angle = -Math.PI / 2;
    pie.slices.forEach(s => {
      const k = names.indexOf(s.name), sweep = (s.value / total) * Math.PI * 2, end = angle + sweep;
      const [x1, y1, x2, y2] = [cx + r * Math.cos(angle), cy + r * Math.sin(angle), cx + r * Math.cos(end), cy + r * Math.sin(end)];
      body += `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${PALETTE[k]}" stroke="#fff" stroke-width="2"/>`;
      const mid = angle + sweep / 2, lr = s.value < 7 ? r + 16 : r * 0.64;
      body += text(cx + lr * Math.cos(mid), cy + lr * Math.sin(mid) + 4, `${s.value}%`, { size: 12, anchor: "middle", fill: s.value < 7 ? INK : "#fff", weight: 600 });
      angle = end;
    });
    body += text(cx, cy + r + 30, pie.label, { size: 13.5, anchor: "middle", weight: 600 });
  });
  return frame(c.title, body + legend(names, H - 14));
}

function drawTable(c: TableChart) {
  const left = 40, top = 60, rowH = 52, colW = (W - left * 2) / (c.columns.length + 1), height = top + rowH * (c.rows.length + 1) + 30;
  let body = `<rect x="${left}" y="${top}" width="${W - left * 2}" height="${rowH}" fill="#f5f4ed"/>`;
  c.columns.forEach((col, i) => { body += text(left + colW * (i + 1.5), top + rowH / 2 + 5, col, { size: 13, anchor: "middle", weight: 600 }); });
  c.rows.forEach((row, r) => {
    const y = top + rowH * (r + 1);
    body += `<line x1="${left}" x2="${W - left}" y1="${y}" y2="${y}" stroke="${RULE}"/>${text(left + 14, y + rowH / 2 + 5, row.name, { size: 13, weight: 600 })}`;
    row.values.forEach((v, i) => { body += text(left + colW * (i + 1.5), y + rowH / 2 + 5, String(v), { size: 13, anchor: "middle" }); });
  });
  body += `<rect x="${left}" y="${top}" width="${W - left * 2}" height="${rowH * (c.rows.length + 1)}" fill="none" stroke="${MUTED}"/>`;
  body += text(W / 2, height - 12, `Figures are average times in ${c.unit}.`, { size: 11, anchor: "middle", fill: MUTED });
  return frame(c.title, body, height);
}

/** Wrap a label into lines of about `max` characters. */
function wrap(label: string, max: number) {
  const lines: string[] = []; let line = "";
  for (const word of label.split(" ")) { if ((line + " " + word).trim().length > max && line) { lines.push(line); line = word; } else line = (line + " " + word).trim(); }
  return [...lines, line];
}

function drawProcess(c: ProcessChart) {
  const perRow = 4, rows = Math.ceil(c.steps.length / perRow), boxW = 122, boxH = 70, gapX = (W - 40 - perRow * boxW) / (perRow - 1), top = 62, gapY = 46;
  const height = top + rows * boxH + (rows - 1) * gapY + (c.cycle ? 54 : 26);
  const pos = c.steps.map((_, i) => { const row = Math.floor(i / perRow), col = row % 2 === 0 ? i % perRow : perRow - 1 - (i % perRow); return { x: 20 + col * (boxW + gapX), y: top + row * (boxH + gapY) }; });
  let body = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MUTED}"/></marker></defs>`;
  pos.forEach((p, i) => {
    const next = pos[i + 1]; if (!next) return;
    const same = p.y === next.y;
    const [x1, y1, x2, y2] = same ? (next.x > p.x ? [p.x + boxW, p.y + boxH / 2, next.x - 2, next.y + boxH / 2] : [p.x, p.y + boxH / 2, next.x + boxW + 2, next.y + boxH / 2]) : [p.x + boxW / 2, p.y + boxH, next.x + boxW / 2, next.y - 2];
    body += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${MUTED}" stroke-width="1.8" marker-end="url(#ar)"/>`;
  });
  if (c.cycle) {
    const last = pos[pos.length - 1], first = pos[0], y = height - 22;
    body += `<path d="M${last.x + boxW / 2},${last.y + boxH} V${y} H${12} V${first.y + boxH / 2} H${first.x - 2}" fill="none" stroke="${MUTED}" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#ar)"/>${text(W / 2, y - 6, "collected again", { size: 11, anchor: "middle", fill: MUTED })}`;
  }
  c.steps.forEach((step, i) => {
    const { x, y } = pos[i], lines = wrap(step, 17);
    body += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="10" fill="#f8f6f0" stroke="${PALETTE[i % 3]}" stroke-width="1.6"/>`;
    body += `<circle cx="${x + 14}" cy="${y + 14}" r="10" fill="${PALETTE[i % 3]}"/>${text(x + 14, y + 18, String(i + 1), { size: 11, anchor: "middle", fill: "#fff", weight: 700 })}`;
    lines.forEach((line, k) => { body += text(x + boxW / 2 + 6, y + boxH / 2 + 5 + (k - (lines.length - 1) / 2) * 14, line, { size: 11.5, anchor: "middle" }); });
  });
  return frame(c.title, body, height);
}

function drawMap(c: MapChart) {
  const panelW = 290, cell = panelW / 6, top = 70, panelH = cell * 4;
  let body = "";
  [c.before, c.after].forEach((panel, p) => {
    const ox = 20 + p * (panelW + 20);
    body += `<rect x="${ox}" y="${top}" width="${panelW}" height="${panelH}" fill="#fbfaf6" stroke="${MUTED}"/>${text(ox + panelW / 2, top - 10, panel.label, { size: 14, anchor: "middle", weight: 600 })}`;
    panel.features.forEach(f => {
      const [cx, cy, cw, ch] = f.at, x = ox + cx * cell, y = top + cy * cell, w = cw * cell, h = ch * cell;
      body += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${f.fill}" stroke="#ffffff" stroke-width="1.5"/>`;
      if (h >= 12) body += text(x + w / 2, y + h / 2 + 4, f.name, { size: h < 18 ? 9.5 : 11, anchor: "middle" });
    });
    body += `<g transform="translate(${ox + panelW - 18} ${top + panelH + 22})">${text(0, 0, "N", { size: 11, anchor: "middle", weight: 700 })}<path d="M0,-22 L5,-12 L-5,-12 Z" fill="${INK}"/></g>`;
  });
  return frame(c.title, body, top + panelH + 34);
}

const dataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const cache = new Map<string, string>();
/** The chart's picture as an SVG data URI, for an <img>. */
export function chartImage(c: Task1Chart) {
  const hit = cache.get(c.id); if (hit) return hit;
  const svg = c.kind === "line" ? drawLine(c) : c.kind === "bar" ? drawBar(c) : c.kind === "pie" ? drawPie(c) : c.kind === "table" ? drawTable(c) : c.kind === "process" ? drawProcess(c) : drawMap(c);
  const uri = dataUri(svg); cache.set(c.id, uri); return uri;
}
const KIND: Record<Task1Chart["kind"], string> = { line: "Line graph", bar: "Bar chart", pie: "Pie charts", table: "Table", process: "Process diagram", map: "Maps" };
export const chartKind = (c: Task1Chart) => KIND[c.kind];
/** A text description of the picture, for screen readers. */
export function chartAlt(c: Task1Chart) {
  if (c.kind === "line" || c.kind === "bar") return `${KIND[c.kind]}: ${c.title} (${c.unit}). ${c.series.map(s => `${s.name}: ${s.values.map((v, i) => `${c.x[i]} ${v}`).join(", ")}`).join("; ")}.`;
  if (c.kind === "pie") return `${KIND.pie}: ${c.title}. ${c.pies.map(p => `${p.label}: ${p.slices.map(s => `${s.name} ${s.value}%`).join(", ")}`).join("; ")}.`;
  if (c.kind === "table") return `${KIND.table}: ${c.title}. Columns ${c.columns.join(", ")}. ${c.rows.map(r => `${r.name}: ${r.values.join(", ")}`).join("; ")}.`;
  if (c.kind === "process") return `${KIND.process}: ${c.title}. ${c.steps.map((s, i) => `${i + 1}. ${s}`).join(" ")}${c.cycle ? " Then the cycle repeats." : ""}`;
  const list = (f: Feature[]) => f.map(x => x.name).join(", ");
  return `${KIND.map}: ${c.title}. ${c.before.label}: ${list(c.before.features)}. ${c.after.label}: ${list(c.after.features)}.`;
}

/** A Listening note-completion card: the title and rows of label and text, with "(1)" style gaps. */
export type ListeningForm = { title: string; rows: [label: string, value: string][] };
export function formImage(form: ListeningForm) {
  const rowH = 36, top = 60, height = top + form.rows.length * rowH + 24;
  let body = `<rect x="40" y="${top - 12}" width="${W - 80}" height="${form.rows.length * rowH + 16}" rx="10" fill="#fbfaf6" stroke="${RULE}"/>`;
  form.rows.forEach(([label, value], i) => {
    const y = top + i * rowH + 18, gap = /^\(\d\)$/.test(value);
    body += text(64, y, label, { size: 13, fill: MUTED });
    body += gap ? `${text(270, y, value, { size: 13, weight: 700, fill: PALETTE[1] })}<line x1="296" x2="470" y1="${y + 3}" y2="${y + 3}" stroke="${INK}" stroke-dasharray="3 3"/>` : text(270, y, value, { size: 13 });
  });
  return dataUri(frame(form.title, body, height));
}
