import { obj, pack, sub, type Objective, type Pack } from "./types";

/* NDA (National Defence Academy): General Ability Test questions and SSB interview questions, hand-authored. */
const hand = pack("nda", [
  obj("General Science", 5, "NDA (recurring)", "What is the SI unit of force?", ["Joule", "Newton", "Watt", "Pascal"], 1, "Force is measured in newtons (1 N = 1 kg m/s²)."),
  obj("General Science", 5, "NDA (recurring)", "Which mirror is used as a rear-view mirror in vehicles?", ["Concave mirror", "Plane mirror", "Convex mirror", "Cylindrical mirror"], 2, "A convex mirror gives an erect, diminished image and a wide field of view."),
  obj("General Science", 4, "NDA (recurring)", "The speed of sound is greatest in", ["Air", "Water", "Steel", "Vacuum"], 2, "Sound travels fastest in solids; it cannot travel through a vacuum."),
  obj("General Science", 4, "NDA (recurring)", "Which gas is most abundant in the Earth's atmosphere?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], 1, "Nitrogen makes up about 78% of the atmosphere."),
  obj("General Science", 4, "NDA (recurring)", "The pH of pure water at 25 °C is", ["0", "5", "7", "14"], 2, "Pure water is neutral, with pH 7."),
  obj("General Science", 4, "NDA (recurring)", "Which vitamin is produced in the skin in sunlight?", ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], 3, "Ultraviolet light helps the skin make vitamin D."),
  obj("General Science", 3, "NDA (recurring)", "The unit of electrical resistance is the", ["Ampere", "Volt", "Ohm", "Coulomb"], 2, "Resistance is measured in ohms (Ω)."),
  obj("History", 5, "NDA (recurring)", "In which year did the Revolt of 1857 begin?", ["1847", "1857", "1867", "1877"], 1, "The revolt began at Meerut on 10 May 1857."),
  obj("History", 4, "NDA (recurring)", "Who founded the Maurya Empire?", ["Ashoka", "Bindusara", "Chandragupta Maurya", "Bimbisara"], 2, "Chandragupta Maurya founded the empire around 321 BCE, guided by Chanakya."),
  obj("History", 4, "NDA (recurring)", "The Dandi March of 1930 was a protest against the tax on", ["Salt", "Land", "Cotton", "Indigo"], 0, "Gandhi's Salt Satyagraha protested the British salt tax."),
  obj("History", 4, "NDA (recurring)", "Who was the first Governor-General of independent India?", ["C. Rajagopalachari", "Lord Mountbatten", "Jawaharlal Nehru", "Rajendra Prasad"], 1, "Lord Mountbatten was the first; C. Rajagopalachari was the first (and only) Indian Governor-General."),
  obj("Geography", 5, "NDA (recurring)", "Which is the longest river in India?", ["Yamuna", "Godavari", "Ganga", "Brahmaputra"], 2, "The Ganga is the longest river flowing within India (about 2,525 km)."),
  obj("Geography", 4, "NDA (recurring)", "The Tropic of Cancer does NOT pass through which state?", ["Gujarat", "Rajasthan", "Odisha", "Mizoram"], 2, "It passes through eight states, including Gujarat, Rajasthan and Mizoram, but not Odisha."),
  obj("Geography", 4, "NDA (recurring)", "Which is the highest peak in India?", ["Nanda Devi", "Kangchenjunga", "K2 (Godwin-Austen)", "Kamet"], 2, "K2, in Ladakh (in territory India claims), is the highest; Kangchenjunga is the highest wholly within present Indian administration."),
  obj("Polity", 5, "NDA (recurring)", "Who is the Supreme Commander of the Indian Armed Forces?", ["The Prime Minister", "The Defence Minister", "The President", "The Chief of Defence Staff"], 2, "Article 53 vests the supreme command of the Defence Forces in the President."),
  obj("Polity", 4, "NDA (recurring)", "Fundamental Rights are given in which part of the Constitution?", ["Part II", "Part III", "Part IV", "Part V"], 1, "Part III (Articles 12 to 35) contains the Fundamental Rights."),
  obj("Defence", 4, "NDA (recurring)", "Where is the National Defence Academy located?", ["Dehradun", "Khadakwasla, Pune", "Ezhimala", "Hyderabad"], 1, "The NDA is at Khadakwasla, near Pune."),
  obj("Defence", 4, "NDA (recurring)", "The Indian Military Academy is located at", ["Pune", "Dehradun", "Chennai", "Gwalior"], 1, "The IMA is in Dehradun."),
  obj("English", 4, "NDA (recurring)", "Choose the word closest in meaning to 'gallant'.", ["Cowardly", "Brave", "Careless", "Quiet"], 1, "'Gallant' means brave or heroic."),
  obj("English", 3, "NDA (recurring)", "Choose the correct spelling.", ["Accomodation", "Acommodation", "Accommodation", "Acomodation"], 2, "'Accommodation' has double c and double m."),
], [
  sub("SSB Interview", 5, "SSB interview (most boards)", "Why do you want to join the armed forces?", ["Give a personal, honest reason (a family member, an experience, a value you hold).", "Link it to qualities the forces need: leadership, discipline, service.", "Show you understand the life: postings, hardship, responsibility.", "Avoid saying 'for the salary' or 'job security' as the main reason."]),
  sub("SSB Interview", 5, "SSB interview (most boards)", "Tell me about yourself.", ["Start with education and family briefly.", "Mention achievements, sports and responsibilities with examples.", "Show interests and how you spend free time.", "Keep it to about two minutes and be consistent with your PIQ form."]),
  sub("SSB Interview", 4, "SSB interview (most boards)", "What are your strengths and weaknesses?", ["Give two or three strengths, each with a real example.", "Give one genuine weakness and what you are doing to improve it.", "Do not present a strength as a weakness ('I work too hard').", "Show self-awareness, not perfection."]),
  sub("SSB Interview", 4, "SSB interview (most boards)", "Describe a time you led a team.", ["Situation: what the task was and who was in the team.", "Action: how you planned, divided work and motivated people.", "Result: what was achieved, with a number if possible.", "Learning: what you would do differently next time."]),
  sub("Lecturette", 4, "SSB GTO lecturette", "Give a three-minute lecturette on 'Women in the armed forces'.", ["Opening: why the topic matters now.", "History: entry through short service, then permanent commission and NDA entry.", "Arguments: equal opportunity, capability, operational considerations.", "Conclusion: a balanced view and the way forward."]),
  sub("Current Affairs", 3, "SSB interview (most boards)", "What do you know about the Agnipath scheme?", ["A recruitment scheme for soldiers, sailors and airmen (Agniveers) for four years, introduced in 2022.", "About a quarter may be retained for regular service after four years.", "Aims: a younger profile and wider recruitment.", "Debate: continuity, training time and post-service opportunities."]),
]);

/* NDA Mathematics, computed: number systems, quadratics, sequences, combinations, determinants and logarithms. */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mathematics(count: number): Objective[] {
  const r = rng(424242); const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1)); const out: Objective[] = []; const seen = new Set<string>();
  const neg = (n: number) => String(n).replace("-", "−");
  const C = (n: number, k: number) => { let v = 1; for (let i = 1; i <= k; i++) v = (v * (n - k + i)) / i; return Math.round(v); };
  const makers: (() => [string, string, string[], string, 3 | 4 | 5] | null)[] = [
    () => { const n = int(5, 200); const bin = n.toString(2); return [`What is the binary representation of the decimal number ${n}?`, bin, [(n + 1).toString(2), (n - 1).toString(2), bin.split("").reverse().join("") === bin ? (n + 2).toString(2) : bin.split("").reverse().join("")], `Divide by 2 repeatedly and read the remainders upwards: ${n} = ${bin}₂.`, 4]; },
    () => { const n = int(5, 255); const bin = n.toString(2); return [`What is the decimal value of the binary number ${bin}?`, String(n), [String(n + 1), String(n - 1), String(n * 2)], `Sum of powers of 2: ${bin}₂ = ${n}.`, 4]; },
    () => { const a = int(1, 5), b = int(-12, 12), c = int(-12, 12); if (!b || !c) return null; return [`If α and β are the roots of ${a === 1 ? "" : a}x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} = 0, what is α + β?`, a === 1 ? neg(-b) : `${neg(-b)}/${a}`, [a === 1 ? neg(b) : `${neg(b)}/${a}`, a === 1 ? neg(c) : `${neg(c)}/${a}`, a === 1 ? neg(-c) : `${neg(-c)}/${a}`], `Sum of roots = −b/a = ${a === 1 ? neg(-b) : `${neg(-b)}/${a}`}.`, 5]; },
    () => { const a = int(1, 5), b = int(-12, 12), c = int(-12, 12); if (!b || !c) return null; return [`If α and β are the roots of ${a === 1 ? "" : a}x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} = 0, what is αβ?`, a === 1 ? neg(c) : `${neg(c)}/${a}`, [a === 1 ? neg(-c) : `${neg(-c)}/${a}`, a === 1 ? neg(-b) : `${neg(-b)}/${a}`, a === 1 ? neg(b) : `${neg(b)}/${a}`], `Product of roots = c/a = ${a === 1 ? neg(c) : `${neg(c)}/${a}`}.`, 5]; },
    () => { const a = int(1, 6), q = int(2, 3), n = int(4, 8); const t = a * q ** (n - 1); return [`What is the ${n}th term of the GP ${a}, ${a * q}, ${a * q * q}, …?`, String(t), [String(a * q ** n), String(a * q ** (n - 2)), String(a + (n - 1) * q)], `aₙ = a rⁿ⁻¹ = ${a} × ${q}^${n - 1} = ${t}.`, 4]; },
    () => { const n = int(5, 12), k = int(2, 4); return [`What is the value of ${n}C${k}?`, String(C(n, k)), [String(C(n, k - 1)), String(C(n, k) * k), String(n * k)], `ⁿCᵣ = n!/(r!(n − r)!) = ${C(n, k)}.`, 4]; },
    () => { const m = [int(-5, 9), int(-5, 9), int(-5, 9), int(-5, 9)]; const d = m[0] * m[3] - m[1] * m[2]; return [`Find the value of the determinant |${m[0]} ${m[1]}; ${m[2]} ${m[3]}|.`.replace(/-/g, "−"), neg(d), [neg(m[0] * m[3] + m[1] * m[2]), neg(-d || 7), neg(d + 1)], `ad − bc = ${neg(m[0] * m[3])} − (${neg(m[1] * m[2])}) = ${neg(d)}.`, 4]; },
    () => { const base = [2, 3, 5, 10][int(0, 3)], k = int(2, 5); return [`What is the value of log${base === 10 ? "" : `_${base}`} ${base ** k}?`, String(k), [String(k + 1), String(base ** (k - 1)), String(k * base)], `${base}^${k} = ${base ** k}, so the logarithm is ${k}.`, 3]; },
    () => { const a = int(-10, 20), d = int(2, 9), n = int(10, 40); const S = (n * (2 * a + (n - 1) * d)) / 2; return [`What is the sum of the first ${n} terms of the AP with first term ${neg(a)} and common difference ${d}?`, neg(S), [neg(S + d), neg(n * (a + (n - 1) * d)), neg(S - n)], `Sₙ = n/2 [2a + (n − 1)d] = ${neg(S)}.`, 4]; },
  ];
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    const made = makers[out.length % makers.length](); if (!made) continue;
    const [q, a, wrong, why, stars] = made; const w = [...new Set(wrong.filter(x => x !== a))]; if (w.length < 3 || seen.has(q)) continue; seen.add(q);
    const options = [a, ...w.slice(0, 3)].sort(() => r() - 0.5);
    out.push({ id: `nda-m${out.length + 1}`, subject: "Mathematics", q, options, correct: options.indexOf(a), why, stars, asked: "NDA Mathematics (recurring type, asked most years)" });
  }
  return out;
}

const NDA: Pack = { objective: [...hand.objective, ...mathematics(45)], subjective: hand.subjective };
export default NDA;
