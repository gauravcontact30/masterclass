import type { ClassId } from "../types";
import { Bank, int, num, pick, rng, sci, type Generated, type Rand } from "./util";

/*
 * Generated Physics numericals: each problem is computed from its own values, then offered both as a multiple-choice
 * question (wrong options are the usual slips: wrong formula, wrong unit, inverted ratio) and as a worked solution.
 */
type Problem = { ch: string; q: string; a: string; steps: string[]; wrong: string[]; why: string; marks?: number };

/** `count` multiple-choice questions and about half as many worked solutions, each from freshly drawn values. */
function both(b: Bank, count: number, make: () => Problem | null) {
  b.repeat(count, () => { const p = make(); return !!p && b.mcq(p.ch, p.q, p.a, p.wrong, p.why); });
  b.repeat(Math.ceil(count * 0.75), () => { const p = make(); return !!p && b.solved(p.ch, p.q, p.a, p.steps, p.marks ?? 3); });
}

function classTen(b: Bank, r: Rand) {
  // Electricity
  both(b, 110, () => {
    const R = pick(r, [2, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 50]), I = pick(r, [0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4]); const V = R * I; const ask = pick(r, ["V", "I", "R"] as const);
    if (ask === "V") return { ch: "Electricity", q: `A current of ${I} A flows through a resistor of ${R} Ω. Find the potential difference across it.`, a: `${num(V)} V`, steps: ["// Ohm's law", "V = IR", `V = ${I} × ${R}`, `∴ V = ${num(V)} V`], wrong: [`${num(R / I)} V`, `${num(I / R, 3)} V`, `${num(V * 2)} V`, `${num(V + R)} V`], why: `V = IR = ${I} × ${R} = ${num(V)} V.` };
    if (ask === "I") return { ch: "Electricity", q: `A potential difference of ${num(V)} V is applied across a ${R} Ω resistor. What current flows?`, a: `${num(I)} A`, steps: ["// Ohm's law, rearranged", "I = V / R", `I = ${num(V)} / ${R}`, `∴ I = ${num(I)} A`], wrong: [`${num(V * R)} A`, `${num(R / V, 3)} A`, `${num(I * 2)} A`, `${num(I / 2, 3)} A`], why: `I = V/R = ${num(V)}/${R} = ${num(I)} A.` };
    return { ch: "Electricity", q: `A current of ${I} A flows when ${num(V)} V is applied across a conductor. Find its resistance.`, a: `${R} Ω`, steps: ["// Ohm's law, rearranged", "R = V / I", `R = ${num(V)} / ${I}`, `∴ R = ${R} Ω`], wrong: [`${num(V * I)} Ω`, `${num(I / V, 3)} Ω`, `${R * 2} Ω`, `${num(R / 2)} Ω`], why: `R = V/I = ${num(V)}/${I} = ${R} Ω.` };
  });
  const PAIRS: [number, number, number][] = [[3, 6, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [20, 30, 12], [12, 12, 6], [6, 3, 2], [8, 8, 4], [12, 24, 8], [5, 20, 4], [30, 60, 20], [9, 18, 6], [40, 10, 8], [15, 30, 10], [24, 8, 6]];
  both(b, 30, () => {
    const [x, y, p] = pick(r, PAIRS); const series = r() < 0.5;
    return series ? { ch: "Electricity", q: `Resistors of ${x} Ω and ${y} Ω are connected in series. Find the equivalent resistance.`, a: `${x + y} Ω`, steps: ["// In series, resistances add", "Rₛ = R₁ + R₂", `Rₛ = ${x} + ${y}`, `∴ Rₛ = ${x + y} Ω`], wrong: [`${p} Ω`, `${x * y} Ω`, `${Math.abs(x - y) || x / 2} Ω`, `${num((x + y) / 2)} Ω`], why: `In series Rₛ = R₁ + R₂ = ${x + y} Ω.` }
      : { ch: "Electricity", q: `Resistors of ${x} Ω and ${y} Ω are connected in parallel. Find the equivalent resistance.`, a: `${p} Ω`, steps: ["// In parallel, reciprocals add", "1/Rₚ = 1/R₁ + 1/R₂", `1/Rₚ = 1/${x} + 1/${y}`, `Rₚ = (${x} × ${y}) / (${x} + ${y}) = ${x * y}/${x + y}`, `∴ Rₚ = ${p} Ω`], wrong: [`${x + y} Ω`, `${x * y} Ω`, `${num((x + y) / 2)} Ω`, `${p * 2} Ω`], why: `Rₚ = R₁R₂/(R₁ + R₂) = ${x * y}/${x + y} = ${p} Ω.` };
  });
  both(b, 90, () => {
    const V = pick(r, [6, 12, 24, 110, 220, 230]), R = pick(r, [2, 4, 6, 10, 12, 20, 22, 44, 55, 110, 220, 440]); const P = V * V / R; if (!Number.isInteger(P * 10)) return null;
    if (r() < 0.5) return { ch: "Electricity", q: `An appliance of resistance ${R} Ω is connected to a ${V} V supply. Find the power it uses.`, a: `${num(P)} W`, steps: ["// Power in terms of V and R", "P = V² / R", `P = ${V}² / ${R} = ${V * V} / ${R}`, `∴ P = ${num(P)} W`], wrong: [`${num(V * R)} W`, `${num(V / R, 3)} W`, `${num(P / 2)} W`, `${num(V * V)} W`], why: `P = V²/R = ${V * V}/${R} = ${num(P)} W.` };
    const I = V / R; return { ch: "Electricity", q: `A current of ${num(I, 3)} A flows through a ${R} Ω heater. Find the power dissipated.`, a: `${num(P)} W`, steps: ["// Power in terms of I and R", "P = I²R", `P = (${num(I, 3)})² × ${R}`, `∴ P = ${num(P)} W`], wrong: [`${num(I * R)} W`, `${num(I * I)} W`, `${num(P * 2)} W`, `${num(P / R, 3)} W`], why: `P = I²R = ${num(I * I, 4)} × ${R} = ${num(P)} W.` };
  });
  both(b, 80, () => {
    const watts = pick(r, [40, 60, 100, 200, 500, 750, 1000, 1500, 2000]), hours = pick(r, [2, 3, 4, 5, 6, 8, 10]), days = pick(r, [10, 15, 30]), rate = pick(r, [4, 5, 6, 7, 8]);
    const units = watts * hours * days / 1000; const cost = units * rate;
    return { ch: "Electricity", q: `A ${watts} W appliance runs for ${hours} hours a day for ${days} days. If electricity costs ₹${rate} per unit (kWh), find the cost.`, a: `₹${num(cost)}`, steps: ["// Energy in kilowatt-hours", "E = P × t", `E = ${watts} W × ${hours} h × ${days} = ${watts * hours * days} Wh`, `E = ${num(units)} kWh (units)`, "// Multiply by the rate", `Cost = ${num(units)} × ₹${rate}`, `∴ Cost = ₹${num(cost)}`], wrong: [`₹${num(cost * 1000)}`, `₹${num(units)}`, `₹${num(cost / days)}`, `₹${num(cost * 2)}`], why: `E = ${watts} × ${hours} × ${days} / 1000 = ${num(units)} kWh; cost = ${num(units)} × ${rate} = ₹${num(cost)}.` };
  });
  both(b, 50, () => {
    const I = pick(r, [1, 2, 3, 4, 5]), R = pick(r, [5, 10, 20, 25, 50]), t = pick(r, [10, 30, 60, 120, 300]); const H = I * I * R * t;
    return { ch: "Electricity", q: `A current of ${I} A passes through a ${R} Ω wire for ${t} s. How much heat is produced?`, a: `${sci(H)} J`, steps: ["// Joule's law of heating", "H = I²Rt", `H = ${I}² × ${R} × ${t}`, `∴ H = ${sci(H)} J`], wrong: [`${sci(I * R * t)} J`, `${sci(H / t)} J`, `${sci(I * R * R * t)} J`, `${sci(H * 2)} J`], why: `H = I²Rt = ${I * I} × ${R} × ${t} = ${sci(H)} J.` };
  });
  // Light: mirrors and lenses (Cartesian sign convention, distances in cm)
  both(b, 70, () => {
    const f = pick(r, [-10, -12, -15, -20, -24, -30]), u = pick(r, [-15, -18, -20, -25, -30, -36, -40, -45, -60]); if (u === f) return null;
    const v = 1 / (1 / f - 1 / u); if (Math.abs(v * 2 - Math.round(v * 2)) > 1e-9) return null; const m = -v / u;
    return { ch: "Light: Reflection", q: `An object is placed ${-u} cm in front of a concave mirror of focal length ${-f} cm. Find the image distance and the magnification.`, a: `v = ${num(v)} cm, m = ${num(m)}`, steps: ["// Mirror formula (u and f are negative for a concave mirror)", "1/v + 1/u = 1/f", `1/v = 1/(${f}) − 1/(${u})`.replace(/\(-/g, "(−"), `v = ${num(v)} cm`, "// Magnification", `m = −v/u = −(${num(v)})/(${num(u)})`, `∴ v = ${num(v)} cm, m = ${num(m)} (${v < 0 ? "real, inverted" : "virtual, erect"})`], wrong: [`v = ${num(-v)} cm, m = ${num(-m)}`, `v = ${num(u * f / (u + f))} cm, m = ${num(m * 2)}`, `v = ${num(v * 2)} cm, m = ${num(m)}`, `v = ${num(v)} cm, m = ${num(-m)}`], why: `1/v = 1/f − 1/u gives v = ${num(v)} cm; m = −v/u = ${num(m)}.`, marks: 4 };
  });
  both(b, 70, () => {
    const f = pick(r, [10, 12, 15, 20, 25, 30]), u = pick(r, [-15, -20, -24, -30, -36, -40, -45, -50, -60]); if (-u === f) return null;
    const v = 1 / (1 / f + 1 / u); if (Math.abs(v * 2 - Math.round(v * 2)) > 1e-9) return null; const m = v / u;
    return { ch: "Light: Refraction", q: `An object is placed ${-u} cm from a convex lens of focal length ${f} cm. Find the position of the image and the magnification.`, a: `v = ${num(v)} cm, m = ${num(m)}`, steps: ["// Lens formula", "1/v − 1/u = 1/f", `1/v = 1/${f} + 1/(${u})`.replace(/\(-/g, "(−"), `v = ${num(v)} cm`, "// Magnification for a lens", `m = v/u = ${num(v)}/(${num(u)})`, `∴ v = ${num(v)} cm, m = ${num(m)} (${v > 0 ? "real, inverted" : "virtual, erect"})`], wrong: [`v = ${num(-v)} cm, m = ${num(-m)}`, `v = ${num(v * 2)} cm, m = ${num(m * 2)}`, `v = ${num(v)} cm, m = ${num(-m)}`, `v = ${num(f - u)} cm, m = ${num(m)}`], why: `1/v = 1/f + 1/u gives v = ${num(v)} cm; m = v/u = ${num(m)}.`, marks: 4 };
  });
  both(b, 30, () => {
    const f = pick(r, [10, 20, 25, 40, 50, 80, 100, -10, -20, -25, -40, -50, -100]); const P = 100 / f;
    return { ch: "Light: Refraction", q: `Find the power of a ${f > 0 ? "convex" : "concave"} lens of focal length ${Math.abs(f)} cm.`, a: `${num(P)} D`, steps: ["// Power is the reciprocal of focal length in metres", `f = ${num(f / 100)} m`, "P = 1/f", `∴ P = ${num(P)} D`], wrong: [`${num(-P)} D`, `${num(f / 100)} D`, `${num(P * 10)} D`, `${num(1 / f, 3)} D`], why: `P = 1/f(m) = 1/${num(f / 100)} = ${num(P)} D; ${f > 0 ? "positive for a convex" : "negative for a concave"} lens.` };
  });
  both(b, 20, () => {
    const [medium, n] = pick(r, [["water", 1.33], ["glass", 1.5], ["diamond", 2.42], ["kerosene", 1.44], ["crown glass", 1.52], ["ice", 1.31]] as const); const v = 3e8 / n;
    return { ch: "Light: Refraction", q: `The refractive index of ${medium} is ${n}. Find the speed of light in it (c = 3 × 10⁸ m/s).`, a: `${sci(v)} m/s`, steps: ["// n = c / v", "v = c / n", `v = 3 × 10⁸ / ${n}`, `∴ v = ${sci(v)} m/s`], wrong: [`${sci(3e8 * n)} m/s`, `${sci(v / 10)} m/s`, `${sci(3e8)} m/s`, `${sci(v * 1.5)} m/s`], why: `v = c/n = 3 × 10⁸ / ${n} = ${sci(v)} m/s.` };
  });
  // More Class 10 electricity: charge, work and resistivity; image height from magnification.
  both(b, 60, () => {
    const Q = pick(r, [2, 5, 10, 12, 20, 30, 50, 60, 100, 120, 300]), t = pick(r, [2, 4, 5, 10, 20, 30, 60]); const I = Q / t;
    return { ch: "Electricity", q: `A charge of ${Q} C flows through a wire in ${t} s. Find the current.`, a: `${num(I, 3)} A`, steps: ["// Current is the rate of flow of charge", "I = Q / t", `I = ${Q} / ${t}`, `∴ I = ${num(I, 3)} A`], wrong: [`${num(Q * t)} A`, `${num(t / Q, 3)} A`, `${num(I * 2, 3)} A`, `${num(Q + t)} A`], why: `I = Q/t = ${Q}/${t} = ${num(I, 3)} A.` };
  });
  both(b, 60, () => {
    const V = pick(r, [1.5, 3, 6, 9, 12, 24, 220]), Q = pick(r, [2, 4, 5, 10, 20, 50]); const W = V * Q;
    return { ch: "Electricity", q: `How much work is done in moving a charge of ${Q} C across a potential difference of ${V} V?`, a: `${num(W)} J`, steps: ["// Potential difference is work per unit charge", "W = VQ", `W = ${V} × ${Q}`, `∴ W = ${num(W)} J`], wrong: [`${num(V / Q, 3)} J`, `${num(Q / V, 3)} J`, `${num(W * 2)} J`, `${num(V + Q)} J`], why: `W = VQ = ${V} × ${Q} = ${num(W)} J.` };
  });
  both(b, 50, () => {
    const rho = pick(r, [1.6e-8, 1.7e-8, 2.6e-8, 5.2e-8, 1e-6, 4.4e-7]), L = pick(r, [1, 2, 5, 10, 20]), A = pick(r, [1e-6, 2e-6, 5e-7, 1e-7]); const R = rho * L / A;
    return { ch: "Electricity", q: `A wire ${L} m long with a cross-sectional area of ${sci(A)} m² is made of a material of resistivity ${sci(rho)} Ω m. Find its resistance.`, a: `${sci(R)} Ω`, steps: ["// Resistance from resistivity", "R = ρL / A", `R = ${sci(rho)} × ${L} / ${sci(A)}`, `∴ R = ${sci(R)} Ω`], wrong: [`${sci(rho * A / L)} Ω`, `${sci(R * 10)} Ω`, `${sci(rho * L)} Ω`, `${sci(R / 2)} Ω`], why: `R = ρL/A = ${sci(R)} Ω.` };
  });
  both(b, 40, () => {
    const h = pick(r, [1, 2, 3, 4, 5, 6]), m = pick(r, [-3, -2, -1.5, -0.5, 2, 3, 0.5]); const hi = h * m;
    return { ch: "Light: Reflection", q: `An object ${h} cm tall forms an image with magnification ${num(m)}. Find the height of the image and say whether it is erect or inverted.`, a: `${num(hi)} cm, ${m < 0 ? "inverted" : "erect"}`, steps: ["// Magnification m = h′/h", "h′ = m × h", `h′ = ${num(m)} × ${h}`, `∴ h′ = ${num(hi)} cm (${m < 0 ? "negative, so inverted and real" : "positive, so erect and virtual"})`], wrong: [`${num(-hi)} cm, ${m < 0 ? "erect" : "inverted"}`, `${num(h / m)} cm, ${m < 0 ? "inverted" : "erect"}`, `${num(hi * 2)} cm, ${m < 0 ? "inverted" : "erect"}`, `${num(hi)} cm, ${m < 0 ? "erect" : "inverted"}`], why: `h′ = m × h = ${num(hi)} cm; the sign of m gives the orientation.` };
  });
}

function classTwelve(b: Bank, r: Rand) {
  const K = 9e9;
  both(b, 85, () => {
    const q1 = pick(r, [1, 2, 3, 4, 5, 6]), q2 = pick(r, [1, 2, 3, 4, 5, 8]), d = pick(r, [10, 20, 30, 50]); const F = K * q1 * 1e-6 * q2 * 1e-6 / (d / 100) ** 2;
    return { ch: "Electric Charges and Fields", q: `Two point charges of ${q1} μC and ${q2} μC are ${d} cm apart in vacuum. Find the force between them.`, a: `${sci(F)} N`, steps: ["// Coulomb's law", "F = k q₁q₂ / r², k = 9 × 10⁹ N m² C⁻²", `F = 9 × 10⁹ × ${q1} × 10⁻⁶ × ${q2} × 10⁻⁶ / (${num(d / 100)})²`, `∴ F = ${sci(F)} N`], wrong: [`${sci(F * 100)} N`, `${sci(F / 2)} N`, `${sci(K * q1 * q2 * 1e-12 / (d / 100))} N`, `${sci(F * 4)} N`], why: `F = kq₁q₂/r² = ${sci(F)} N (r in metres: ${num(d / 100)} m).` };
  });
  both(b, 60, () => {
    const q = pick(r, [1, 2, 4, 5, 8]), d = pick(r, [10, 20, 30, 50, 100]); const E = K * q * 1e-9 / (d / 100) ** 2;
    return { ch: "Electric Charges and Fields", q: `Find the electric field at ${d} cm from a point charge of ${q} nC.`, a: `${sci(E)} N/C`, steps: ["// Field of a point charge", "E = kq / r²", `E = 9 × 10⁹ × ${q} × 10⁻⁹ / (${num(d / 100)})²`, `∴ E = ${sci(E)} N/C`], wrong: [`${sci(E * (d / 100))} N/C`, `${sci(E / 100)} N/C`, `${sci(E * 2)} N/C`, `${sci(K * q * 1e-9)} N/C`], why: `E = kq/r² = ${sci(E)} N/C.` };
  });
  both(b, 45, () => {
    const c1 = pick(r, [2, 3, 4, 6, 8, 12]), c2 = pick(r, [2, 3, 4, 6, 12, 24]); const series = r() < 0.5; const Cs = c1 * c2 / (c1 + c2), Cp = c1 + c2;
    return series ? { ch: "Electrostatic Potential and Capacitance", q: `Capacitors of ${c1} μF and ${c2} μF are connected in series. Find the equivalent capacitance.`, a: `${num(Cs)} μF`, steps: ["// In series, reciprocals add", "1/C = 1/C₁ + 1/C₂", `C = (${c1} × ${c2}) / (${c1} + ${c2})`, `∴ C = ${num(Cs)} μF`], wrong: [`${Cp} μF`, `${c1 * c2} μF`, `${num(Cp / 2)} μF`, `${num(Cs * 2)} μF`], why: `Series: C = C₁C₂/(C₁ + C₂) = ${num(Cs)} μF.` }
      : { ch: "Electrostatic Potential and Capacitance", q: `Capacitors of ${c1} μF and ${c2} μF are connected in parallel. Find the equivalent capacitance.`, a: `${Cp} μF`, steps: ["// In parallel, capacitances add", "C = C₁ + C₂", `C = ${c1} + ${c2}`, `∴ C = ${Cp} μF`], wrong: [`${num(Cs)} μF`, `${c1 * c2} μF`, `${num(Cp / 2)} μF`, `${Cp * 2} μF`], why: `Parallel: C = C₁ + C₂ = ${Cp} μF.` };
  });
  both(b, 35, () => {
    const C = pick(r, [2, 4, 5, 10, 20, 50]), V = pick(r, [10, 20, 50, 100, 200]); const U = 0.5 * C * 1e-6 * V * V;
    return { ch: "Electrostatic Potential and Capacitance", q: `A ${C} μF capacitor is charged to ${V} V. Find the energy stored.`, a: `${sci(U)} J`, steps: ["// Energy stored in a capacitor", "U = ½ CV²", `U = ½ × ${C} × 10⁻⁶ × ${V}²`, `∴ U = ${sci(U)} J`], wrong: [`${sci(U * 2)} J`, `${sci(C * 1e-6 * V)} J`, `${sci(U / V)} J`, `${sci(U * 1e6)} J`], why: `U = ½CV² = ${sci(U)} J.` };
  });
  both(b, 40, () => {
    const I = pick(r, [1, 2, 4, 5, 10, 20]), d = pick(r, [1, 2, 4, 5, 10, 20]); const B = 2e-7 * I / (d / 100);
    return { ch: "Moving Charges and Magnetism", q: `Find the magnetic field at ${d} cm from a long straight wire carrying ${I} A.`, a: `${sci(B)} T`, steps: ["// Field of a long straight conductor", "B = μ₀I / 2πr = 2 × 10⁻⁷ × I / r", `B = 2 × 10⁻⁷ × ${I} / ${num(d / 100)}`, `∴ B = ${sci(B)} T`], wrong: [`${sci(B * 100)} T`, `${sci(B / 2)} T`, `${sci(4e-7 * Math.PI * I / (d / 100))} T`, `${sci(B * 2)} T`], why: `B = 2 × 10⁻⁷ I/r = ${sci(B)} T.` };
  });
  both(b, 70, () => {
    const B = pick(r, [0.1, 0.2, 0.4, 0.5, 1]), l = pick(r, [0.2, 0.5, 1, 1.5, 2]), v = pick(r, [2, 4, 5, 10, 20]); const e = B * l * v;
    return { ch: "Electromagnetic Induction", q: `A ${l} m rod moves at ${v} m/s perpendicular to a ${B} T magnetic field. Find the induced emf.`, a: `${num(e, 3)} V`, steps: ["// Motional emf", "e = Blv", `e = ${B} × ${l} × ${v}`, `∴ e = ${num(e, 3)} V`], wrong: [`${num(B * v, 3)} V`, `${num(B * l / v, 3)} V`, `${num(e * 2, 3)} V`, `${num(l * v, 3)} V`], why: `e = Blv = ${num(e, 3)} V.` };
  });
  both(b, 35, () => {
    const V0 = pick(r, [10, 20, 50, 100, 141.4, 200, 311]), rms = V0 / Math.SQRT2;
    return { ch: "Alternating Current", q: `The peak value of an alternating voltage is ${V0} V. Find its rms value.`, a: `${num(rms)} V`, steps: ["// rms value of a sinusoidal voltage", "V_rms = V₀ / √2", `V_rms = ${V0} / 1.414`, `∴ V_rms = ${num(rms)} V`], wrong: [`${num(V0 * Math.SQRT2)} V`, `${num(V0 / 2)} V`, `${V0} V`, `${num(rms / 2)} V`], why: `V_rms = V₀/√2 = ${num(rms)} V.` };
  });
  both(b, 35, () => {
    const f = pick(r, [50, 60, 100]), L = pick(r, [0.1, 0.2, 0.5, 1]); const XL = 2 * Math.PI * f * L;
    return { ch: "Alternating Current", q: `Find the inductive reactance of a ${L} H inductor at ${f} Hz.`, a: `${num(XL, 1)} Ω`, steps: ["// Inductive reactance", "X_L = 2πfL", `X_L = 2 × 3.14 × ${f} × ${L}`, `∴ X_L ≈ ${num(XL, 1)} Ω`], wrong: [`${num(1 / XL, 4)} Ω`, `${num(f * L, 1)} Ω`, `${num(XL * 2, 1)} Ω`, `${num(XL / Math.PI, 1)} Ω`], why: `X_L = 2πfL = ${num(XL, 1)} Ω.` };
  });
  both(b, 60, () => {
    const lambda = pick(r, [124, 155, 200, 248, 310, 400, 496, 620]), phi = pick(r, [1.8, 2, 2.14, 2.3, 2.5, 3, 4.2]); const E = 1240 / lambda; const K = E - phi;
    if (K <= 0) return { ch: "Dual Nature of Radiation and Matter", q: `Light of wavelength ${lambda} nm falls on a metal of work function ${phi} eV. Will photoelectrons be emitted?`, a: `No: photon energy ${num(E)} eV is less than ${phi} eV`, steps: ["// Photon energy in eV", "E = 1240 / λ(nm)", `E = 1240 / ${lambda} = ${num(E)} eV`, "// Compare with the work function", `${num(E)} eV < ${phi} eV`, "∴ No photoelectrons are emitted"], wrong: [`Yes, with ${num(Math.abs(K))} eV of kinetic energy`, `Yes, with ${num(E)} eV of kinetic energy`, "Yes, but only at high intensity", `Yes, with ${phi} eV of kinetic energy`], why: `E = ${num(E)} eV is below the work function, so no emission at any intensity.` };
    return { ch: "Dual Nature of Radiation and Matter", q: `Light of wavelength ${lambda} nm falls on a metal of work function ${phi} eV. Find the maximum kinetic energy of the photoelectrons.`, a: `${num(K)} eV`, steps: ["// Photon energy in eV", "E = hc/λ = 1240 / λ(nm)", `E = 1240 / ${lambda} = ${num(E)} eV`, "// Einstein's photoelectric equation", `K_max = E − φ = ${num(E)} − ${phi}`, `∴ K_max = ${num(K)} eV (stopping potential ${num(K)} V)`], wrong: [`${num(E + phi)} eV`, `${num(E)} eV`, `${num(phi)} eV`, `${num(K * 2)} eV`], why: `K_max = 1240/λ − φ = ${num(E)} − ${phi} = ${num(K)} eV.` };
  });
  both(b, 30, () => {
    const V = pick(r, [25, 49, 81, 100, 144, 400, 900, 10000]); const lam = 1.227 / Math.sqrt(V);
    return { ch: "Dual Nature of Radiation and Matter", q: `Find the de Broglie wavelength of an electron accelerated through ${V} V.`, a: `${num(lam, 4)} nm`, steps: ["// For an electron accelerated through V volts", "λ = 1.227 / √V nm", `λ = 1.227 / √${V} = 1.227 / ${num(Math.sqrt(V))}`, `∴ λ = ${num(lam, 4)} nm`], wrong: [`${num(1.227 / V, 5)} nm`, `${num(1.227 * Math.sqrt(V), 2)} nm`, `${num(lam * 10, 4)} nm`, `${num(lam / 2, 4)} nm`], why: `λ = 1.227/√V nm = ${num(lam, 4)} nm.` };
  });
  both(b, 40, () => {
    const hi = int(r, 2, 6), lo = int(r, 1, hi - 1); const E = 13.6 * (1 / (lo * lo) - 1 / (hi * hi)); const lam = 1240 / E;
    return { ch: "Atoms", q: `An electron in a hydrogen atom jumps from n = ${hi} to n = ${lo}. Find the energy of the photon emitted.`, a: `${num(E)} eV (λ ≈ ${num(lam, 0)} nm)`, steps: ["// Energy levels of hydrogen", "Eₙ = −13.6 / n² eV", `E${hi} = ${num(-13.6 / (hi * hi))} eV, E${lo} = ${num(-13.6 / (lo * lo))} eV`, "// Photon energy is the difference", `ΔE = ${num(-13.6 / (hi * hi))} − (${num(-13.6 / (lo * lo))})`, `∴ ΔE = ${num(E)} eV, λ = 1240/ΔE ≈ ${num(lam, 0)} nm`], wrong: [`${num(13.6 / (hi * hi))} eV (λ ≈ ${num(1240 * hi * hi / 13.6, 0)} nm)`, `${num(13.6 / (lo * lo))} eV (λ ≈ ${num(1240 * lo * lo / 13.6, 0)} nm)`, `${num(13.6 * (1 / lo - 1 / hi))} eV (λ ≈ ${num(1240 / (13.6 * (1 / lo - 1 / hi)), 0)} nm)`, `${num(E * 2)} eV (λ ≈ ${num(lam / 2, 0)} nm)`], why: `ΔE = 13.6(1/${lo}² − 1/${hi}²) = ${num(E)} eV.`, marks: 4 };
  });
  both(b, 70, () => {
    const T = pick(r, [2, 5, 8, 10, 12, 30]), k = int(r, 1, 5), N0 = pick(r, [800, 1000, 1600, 3200, 6400]); const N = N0 / 2 ** k;
    return { ch: "Nuclei", q: `A radioactive sample has a half-life of ${T} days. Starting with ${N0} nuclei, how many remain after ${T * k} days?`, a: `${num(N)}`, steps: ["// Number of half-lives", `n = t / T½ = ${T * k} / ${T} = ${k}`, "// Each half-life halves the sample", `N = N₀ (1/2)ⁿ = ${N0} × (1/2)^${k}`, `∴ N = ${num(N)}`], wrong: [num(N0 - N), num(N * 2), num(N0 / (2 * k)), num(N / 2)], why: `${k} half-lives: N = ${N0}/2^${k} = ${num(N)}.` };
  });
  both(b, 50, () => {
    const rho = pick(r, [1.7e-8, 2.8e-8, 1e-6, 5e-7]), L = pick(r, [1, 2, 5, 10, 50]), A = pick(r, [1e-6, 2e-6, 5e-7, 1e-7]); const R = rho * L / A;
    return { ch: "Current Electricity", q: `A wire of length ${L} m and cross-section ${sci(A)} m² has resistivity ${sci(rho)} Ω m. Find its resistance.`, a: `${sci(R)} Ω`, steps: ["// Resistance from resistivity", "R = ρL / A", `R = ${sci(rho)} × ${L} / ${sci(A)}`, `∴ R = ${sci(R)} Ω`], wrong: [`${sci(rho * A / L)} Ω`, `${sci(R * 10)} Ω`, `${sci(rho * L)} Ω`, `${sci(R / 2)} Ω`], why: `R = ρL/A = ${sci(R)} Ω.` };
  });
  // More Class 12: internal resistance, reactance, optics and photons.
  both(b, 70, () => {
    const E = pick(r, [1.5, 2, 3, 6, 9, 12, 24]), rr = pick(r, [0.5, 1, 1.5, 2, 3]), R = pick(r, [2, 4, 5, 9, 10, 12, 20]); const I = E / (R + rr); const V = I * R;
    return { ch: "Current Electricity", q: `A cell of emf ${E} V and internal resistance ${rr} Ω is connected to a ${R} Ω resistor. Find the current and the terminal voltage.`, a: `I = ${num(I, 3)} A, V = ${num(V, 3)} V`, steps: ["// Current in the circuit", "I = E / (R + r)", `I = ${E} / (${R} + ${rr}) = ${num(I, 3)} A`, "// Terminal voltage", "V = IR = E − Ir", `∴ I = ${num(I, 3)} A, V = ${num(V, 3)} V`], wrong: [`I = ${num(E / R, 3)} A, V = ${E} V`, `I = ${num(I, 3)} A, V = ${E} V`, `I = ${num(E / rr, 3)} A, V = ${num(V, 3)} V`, `I = ${num(I * 2, 3)} A, V = ${num(V / 2, 3)} V`], why: `I = E/(R + r) = ${num(I, 3)} A; V = IR = ${num(V, 3)} V, less than the emf.` };
  });
  both(b, 40, () => {
    const f = pick(r, [50, 60, 100, 1000]), C = pick(r, [1, 2, 5, 10, 20, 50, 100]); const XC = 1 / (2 * Math.PI * f * C * 1e-6);
    return { ch: "Alternating Current", q: `Find the capacitive reactance of a ${C} μF capacitor at ${f} Hz.`, a: `${num(XC, 1)} Ω`, steps: ["// Capacitive reactance", "X_C = 1 / (2πfC)", `X_C = 1 / (2 × 3.14 × ${f} × ${C} × 10⁻⁶)`, `∴ X_C ≈ ${num(XC, 1)} Ω`], wrong: [`${num(2 * Math.PI * f * C * 1e-6, 5)} Ω`, `${num(XC * 2, 1)} Ω`, `${num(XC / 1000, 3)} Ω`, `${num(1 / (f * C * 1e-6), 1)} Ω`], why: `X_C = 1/(2πfC) = ${num(XC, 1)} Ω.` };
  });
  both(b, 30, () => {
    const p1 = pick(r, [2, 2.5, 4, 5, 10, -2, -2.5, -4]), p2 = pick(r, [1, 2, 4, 5, -1, -2, -5]); const P = p1 + p2; if (!P) return null; const f = 100 / P;
    return { ch: "Ray Optics and Optical Instruments", q: `Two thin lenses of power ${num(p1)} D and ${num(p2)} D are placed in contact. Find the power and focal length of the combination.`, a: `P = ${num(P)} D, f = ${num(f)} cm`, steps: ["// Powers of thin lenses in contact add", "P = P₁ + P₂", `P = ${num(p1)} + (${num(p2)}) = ${num(P)} D`, "f = 1/P (in metres)", `∴ f = ${num(f / 100, 4)} m = ${num(f)} cm`], wrong: [`P = ${num(p1 * p2)} D, f = ${num(100 / (p1 * p2))} cm`, `P = ${num(p1 - p2)} D, f = ${num(100 / (p1 - p2 || 1))} cm`, `P = ${num(P)} D, f = ${num(P)} cm`, `P = ${num(-P)} D, f = ${num(-f)} cm`], why: `P = P₁ + P₂ = ${num(P)} D, so f = 1/P = ${num(f)} cm.` };
  });
  for (const [medium, n] of [["water", 1.33], ["glass", 1.5], ["diamond", 2.42], ["crown glass", 1.52], ["dense flint glass", 1.65], ["ice", 1.31]] as const) {
    const C = Math.asin(1 / n) * 180 / Math.PI;
    b.mcq("Ray Optics and Optical Instruments", `The refractive index of ${medium} is ${n}. What is its critical angle (with air)?`, `${num(C, 1)}°`, [num(90 - C, 1), num(C * 1.5, 1), num(Math.asin(1 / (n + 0.3)) * 180 / Math.PI, 1), num(Math.acos(1 / n) * 180 / Math.PI + 5, 1)].map(x => `${x}°`), `sin C = 1/n = ${num(1 / n, 3)}, so C ≈ ${num(C, 1)}°.`);
    b.solved("Ray Optics and Optical Instruments", `Find the critical angle for ${medium} (n = ${n}) in contact with air.`, `≈ ${num(C, 1)}°`, ["// Total internal reflection begins at the critical angle", "sin C = 1 / n", `sin C = 1 / ${n} = ${num(1 / n, 4)}`, `∴ C ≈ ${num(C, 1)}°`], 2);
  }
  both(b, 60, () => {
    const f = pick(r, [10, 12, 15, 20, 25, 30]), u = pick(r, [-15, -20, -24, -30, -36, -40, -45, -50, -60, -75]); if (-u === f) return null;
    const v = 1 / (1 / f + 1 / u); if (Math.abs(v * 2 - Math.round(v * 2)) > 1e-9) return null;
    return { ch: "Ray Optics and Optical Instruments", q: `An object is ${-u} cm from a convex lens of focal length ${f} cm. Find the image distance.`, a: `${num(v)} cm`, steps: ["// Thin lens formula", "1/v − 1/u = 1/f", `1/v = 1/${f} + 1/(−${-u})`, `∴ v = ${num(v)} cm`], wrong: [`${num(-v)} cm`, `${num(v * 2)} cm`, `${num(f - u)} cm`, `${num(1 / (1 / f - 1 / u))} cm`], why: `1/v = 1/f + 1/u gives v = ${num(v)} cm.` };
  });
  both(b, 30, () => {
    const lambda = pick(r, [124, 200, 248, 310, 400, 450, 500, 550, 620, 700, 1240]); const E = 1240 / lambda;
    return { ch: "Dual Nature of Radiation and Matter", q: `Find the energy of a photon of wavelength ${lambda} nm, in electron volts.`, a: `${num(E, 2)} eV`, steps: ["// E = hc/λ, with hc = 1240 eV nm", "E = 1240 / λ(nm)", `E = 1240 / ${lambda}`, `∴ E = ${num(E, 2)} eV`], wrong: [`${num(lambda / 1240, 3)} eV`, `${num(E * 2, 2)} eV`, `${num(E / 10, 3)} eV`, `${num(1240 * lambda)} eV`], why: `E = 1240/λ = ${num(E, 2)} eV.` };
  });

}

export function generatePhysics(cls: ClassId): Generated {
  const r = rng(cls === "10" ? 2010 : 2212);
  const b = new Bank(`g${cls}-physics`, r);
  if (cls === "10") classTen(b, r); else classTwelve(b, r);
  return { items: b.items, mcqs: b.mcqs };
}
