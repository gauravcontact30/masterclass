import type { ClassId, SubjectId } from "../types";
import { Bank, frac, int, num, pick, rng, shuffle, term, type Generated } from "./util";

/*
 * Generated practice for the chapters the first banks barely covered (Polynomials, Triangles, Circles, Heights and
 * Distances, Human Eye, Metals and Non-metals, Vectors, 3-D Geometry, Wave Optics, Semiconductors, d-block and more).
 * As in the other banks, every answer is computed from the question's own numbers or read from a hand-checked table,
 * and a fixed seed keeps the same questions and ids on every visit.
 */
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29]];
const s = (x: number) => num(x);

function math10(b: Bank, r: () => number) {
  // Polynomials: zeros, their sum and product, and the quadratic with given zeros.
  b.repeat(40, () => {
    const p = int(r, -8, 9), q = int(r, -8, 9); if (!p || !q || p === q) return false;
    const poly = `x²${term(-(p + q), "x")}${term(p * q, "")}`;
    return b.mcq("Polynomials", `What is the sum of the zeros of the polynomial ${poly}?`, s(p + q), [s(-(p + q)), s(p * q), s(p - q), s(p + q + 1)], `For ax² + bx + c the sum of the zeros is −b/a = ${s(p + q)} (the zeros are ${s(p)} and ${s(q)}).`);
  });
  b.repeat(30, () => {
    const p = int(r, -8, 9), q = int(r, -8, 9); if (!p || !q || p === q) return false;
    const poly = `x²${term(-(p + q), "x")}${term(p * q, "")}`;
    return b.mcq("Polynomials", `What is the product of the zeros of the polynomial ${poly}?`, s(p * q), [s(-(p * q)), s(p + q), s(-(p + q)), s(p * q + 1)], `The product of the zeros is c/a = ${s(p * q)}.`);
  });
  b.repeat(30, () => {
    const p = int(r, -7, 8), q = int(r, -7, 8); if (!p || !q || p === q) return false;
    const poly = `x²${term(-(p + q), "x")}${term(p * q, "")}`;
    return b.solved("Polynomials", `Find the zeros of ${poly} and verify the relationship between the zeros and the coefficients.`, `Zeros: ${s(Math.min(p, q))} and ${s(Math.max(p, q))}`,
      ["// Split the middle term", `${poly} = (x ${p < 0 ? "+" : "−"} ${Math.abs(p)})(x ${q < 0 ? "+" : "−"} ${Math.abs(q)})`, `Zeros: x = ${s(p)}, x = ${s(q)}`, "// Verify: sum = −b/a and product = c/a",
        `Sum = ${s(p)} + ${s(q)} = ${s(p + q)} = −(${s(-(p + q))})/1`, `Product = ${s(p)} × ${s(q)} = ${s(p * q)} = ${s(p * q)}/1`, "∴ The relationship is verified"], 3);
  });
  b.repeat(25, () => {
    const sum = int(r, -9, 9), prod = int(r, -12, 12); if (!prod) return false;
    return b.bank("Polynomials", `Find a quadratic polynomial whose sum of zeros is ${s(sum)} and product of zeros is ${s(prod)}.`, `x²${term(-sum, "x")}${term(prod, "")} (or any non-zero multiple of it)`, 2);
  });
  // Triangles: basic proportionality and areas of similar triangles.
  b.repeat(35, () => {
    const ad = int(r, 2, 9), db = int(r, 2, 9), ae = ad * int(r, 1, 3); const ec = ae * db / ad; if (ad === db) return false;
    return b.mcq("Triangles", `In △ABC, DE ∥ BC with D on AB and E on AC. If AD = ${ad} cm, DB = ${db} cm and AE = ${ae} cm, find EC.`, `${s(ec)} cm`, [`${s(ae * ad / db)} cm`, `${s(ec + 1)} cm`, `${s(ae + db - ad)} cm`, `${s(ec * 2)} cm`], `By the basic proportionality theorem AD/DB = AE/EC, so EC = AE × DB / AD = ${ae} × ${db} / ${ad} = ${s(ec)} cm.`);
  });
  b.repeat(35, () => {
    const a = int(r, 2, 9), c = int(r, 2, 9); if (a === c) return false;
    return b.mcq("Triangles", `Two similar triangles have corresponding sides in the ratio ${a} : ${c}. What is the ratio of their areas?`, `${a * a} : ${c * c}`, [`${a} : ${c}`, `${a * a * a} : ${c * c * c}`, `${c * c} : ${a * a}`, `${2 * a} : ${2 * c + 1}`], `The ratio of the areas of similar triangles is the square of the ratio of corresponding sides: ${a}² : ${c}² = ${a * a} : ${c * c}.`);
  });
  b.repeat(25, () => {
    const [p, q, h] = pick(r, TRIPLES); const k = int(r, 1, 3);
    return b.solved("Triangles", `A ladder ${h * k} m long reaches a window ${q * k} m above the ground. How far is the foot of the ladder from the wall?`, `${p * k} m`,
      ["// The wall, the ground and the ladder form a right triangle", "// Pythagoras theorem: (hypotenuse)² = (base)² + (height)²", `${h * k}² = x² + ${q * k}²`, `x² = ${(h * k) ** 2} − ${(q * k) ** 2} = ${(p * k) ** 2}`, `∴ x = ${p * k} m`], 3);
  });
  // Circles: length of a tangent.
  b.repeat(35, () => {
    const [p, q, h] = pick(r, TRIPLES); const k = int(r, 1, 2);
    return b.mcq("Circles", `From a point Q, the length of the tangent to a circle is ${q * k} cm and the distance of Q from the centre is ${h * k} cm. Find the radius of the circle.`, `${p * k} cm`, [`${q * k} cm`, `${(h - q) * k} cm`, `${(p + 1) * k} cm`, `${h * k - 1} cm`], `The radius is perpendicular to the tangent at the point of contact, so r = √(${h * k}² − ${q * k}²) = ${p * k} cm.`);
  });
  b.repeat(20, () => {
    const [p, q, h] = pick(r, TRIPLES); const k = int(r, 1, 2);
    return b.solved("Circles", `The radius of a circle is ${p * k} cm and a point P is ${h * k} cm from its centre. Find the length of the tangent drawn from P.`, `${q * k} cm`,
      ["// The tangent at any point is perpendicular to the radius through it", "// So the radius, the tangent and OP form a right triangle", `PT² = OP² − OT² = ${(h * k) ** 2} − ${(p * k) ** 2} = ${(q * k) ** 2}`, `∴ PT = ${q * k} cm`], 3);
  });
  // Heights and distances.
  b.repeat(40, () => {
    const angle = pick(r, [30, 45, 60]); const d = angle === 30 ? 3 * int(r, 3, 20) : int(r, 5, 60);
    const h = angle === 45 ? `${d} m` : angle === 60 ? `${d}√3 m` : `${d / 3}√3 m`;
    const wrong = angle === 45 ? [`${d}√3 m`, `${d}/√3 m`, `${2 * d} m`, `${d}√2 m`] : angle === 60 ? [`${d} m`, `${d}/√3 m`, `${2 * d} m`, `${d}√2 m`] : [`${d}√3 m`, `${d} m`, `${2 * d} m`, `${d / 3} m`];
    return b.mcq("Heights and Distances", `The angle of elevation of the top of a tower from a point ${d} m away from its foot is ${angle}°. Find the height of the tower.`, h, wrong, `tan ${angle}° = height / ${d}, so height = ${d} × tan ${angle}° = ${h}.`);
  });
  b.repeat(20, () => {
    const h = int(r, 10, 80);
    return b.solved("Heights and Distances", `A pole ${h} m high casts a shadow of length ${h}√3 m on the ground. Find the angle of elevation of the Sun.`, "30°",
      ["// Let θ be the angle of elevation of the Sun", "tan θ = height of pole / length of shadow", `tan θ = ${h} / ${h}√3 = 1/√3`, "// tan 30° = 1/√3", "∴ θ = 30°"], 3);
  });
  // Areas related to circles (π = 22/7).
  b.repeat(40, () => {
    const radius = 7 * int(r, 1, 4), angle = pick(r, [30, 45, 60, 90, 120, 180, 270]);
    const area = angle / 360 * 22 / 7 * radius * radius;
    return b.mcq("Areas Related to Circles", `Find the area of a sector of a circle of radius ${radius} cm with central angle ${angle}°. (Use π = 22/7)`, `${s(area)} cm²`, [`${s(area * 2)} cm²`, `${s(angle / 360 * 2 * 22 / 7 * radius)} cm²`, `${s(22 / 7 * radius * radius)} cm²`, `${s(area / 2)} cm²`], `Area of sector = (θ/360°) × πr² = (${angle}/360) × 22/7 × ${radius}² = ${s(area)} cm².`);
  });
  b.repeat(25, () => {
    const radius = 7 * int(r, 1, 4), angle = pick(r, [30, 45, 60, 90, 120, 180]);
    const arc = angle / 360 * 2 * 22 / 7 * radius;
    return b.mcq("Areas Related to Circles", `Find the length of the arc of a circle of radius ${radius} cm that subtends an angle of ${angle}° at the centre. (Use π = 22/7)`, `${s(arc)} cm`, [`${s(arc * 2)} cm`, `${s(angle / 360 * 22 / 7 * radius * radius)} cm`, `${s(arc / 2)} cm`, `${s(arc + radius)} cm`], `Arc length = (θ/360°) × 2πr = (${angle}/360) × 2 × 22/7 × ${radius} = ${s(arc)} cm.`);
  });
  // Statistics: mean, and the empirical relationship.
  b.repeat(30, () => {
    const values = Array.from({ length: 5 }, () => int(r, 2, 40)); const total = values.reduce((a, v) => a + v, 0); if (total % 5) return false;
    return b.mcq("Statistics", `Find the mean of ${values.join(", ")}.`, s(total / 5), [s(total / 5 + 1), s(total / 4), s([...values].sort((x, y) => x - y)[2]), s(total / 5 - 2)], `Mean = sum / number of values = ${total} / 5 = ${s(total / 5)}.`);
  });
  b.repeat(25, () => {
    const median = int(r, 20, 60), mean = int(r, 20, 60); if (median === mean) return false;
    return b.mcq("Statistics", `For a distribution, the median is ${median} and the mean is ${mean}. Using the empirical relationship, find the mode.`, s(3 * median - 2 * mean), [s(3 * mean - 2 * median), s(2 * median - mean), s(median + mean), s(3 * median + 2 * mean)], `Mode = 3 Median − 2 Mean = 3 × ${median} − 2 × ${mean} = ${s(3 * median - 2 * mean)}.`);
  });
}

function physics10(b: Bank, r: () => number) {
  // Human eye: power of a lens and correction of defects.
  b.repeat(35, () => {
    const cm = pick(r, [10, 20, 25, 40, 50, 80, 100, 200]); const sign = pick(r, [1, -1]); const f = sign * cm;
    return b.mcq("Human Eye", `What is the power of a ${sign > 0 ? "convex" : "concave"} lens of focal length ${cm} cm?`, `${s(100 / f)} D`, [`${s(-100 / f)} D`, `${s(f / 100)} D`, `${s(100 / f * 2)} D`, `${s(1 / f)} D`], `P = 1/f (in metres) = 100/f (in cm) = 100/${s(f)} = ${s(100 / f)} D. A ${sign > 0 ? "convex lens has positive" : "concave lens has negative"} power.`);
  });
  b.repeat(30, () => {
    const far = pick(r, [50, 80, 100, 125, 150, 200, 250]);
    return b.solved("Human Eye", `A person with myopia cannot see objects beyond ${far} cm clearly. What kind of lens, and of what power, will correct the defect?`, `A concave lens of power ${s(-100 / far)} D`,
      ["// The lens must form a virtual image of a distant object at the far point", `u = −∞, v = −${far} cm`, "1/f = 1/v − 1/u = 1/(−" + far + ") − 0", `f = −${far} cm = −${s(far / 100)} m`, `P = 1/f = ${s(-100 / far)} D`, "∴ A concave (diverging) lens is needed"], 3);
  });
  b.repeat(20, () => {
    const near = pick(r, [50, 75, 100, 150]);
    const f = 1 / (1 / 25 - 1 / near); const power = 100 / f;
    return b.solved("Human Eye", `The near point of a hypermetropic eye is ${near} cm. What is the power of the lens needed to read at 25 cm?`, `A convex lens of power +${s(power)} D`,
      ["// The lens forms a virtual image at the near point of an object held at 25 cm", `u = −25 cm, v = −${near} cm`, "1/f = 1/v − 1/u", `1/f = −1/${near} + 1/25`, `f = ${s(f)} cm`, `P = 100/f = +${s(power)} D`, "∴ A convex (converging) lens is needed"], 4);
  });
  // Magnetic effects of current.
  b.repeat(30, () => {
    const B = pick(r, [0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1.2]), I = int(r, 1, 10), L = pick(r, [0.1, 0.2, 0.5, 1, 1.5, 2]);
    const F = B * I * L;
    return b.mcq("Magnetic Effects", `A straight wire ${L} m long carrying ${I} A is placed at right angles to a magnetic field of ${B} T. What force acts on it?`, `${s(F)} N`, [`${s(F * 2)} N`, `${s(B * I)} N`, `${s(I * L)} N`, `${s(F / 2)} N`], `F = BIL = ${B} × ${I} × ${L} = ${s(F)} N (maximum, as the wire is perpendicular to the field).`);
  });
  const FACTS: [string, string, string[], string][] = [
    ["Which rule gives the direction of force on a current-carrying conductor in a magnetic field?", "Fleming's left-hand rule", ["Fleming's right-hand rule", "Right-hand thumb rule", "Lenz's rule"], "Fleming's left-hand rule: forefinger along the field, middle finger along the current, thumb gives the force (motor rule)."],
    ["Which rule gives the direction of induced current in a conductor moving in a magnetic field?", "Fleming's right-hand rule", ["Fleming's left-hand rule", "Right-hand thumb rule", "Snell's rule"], "Fleming's right-hand rule (dynamo rule) gives the direction of the induced current."],
    ["The magnetic field lines inside a long current-carrying solenoid are", "parallel straight lines", ["concentric circles", "zero everywhere", "radial lines"], "Inside a long solenoid the field is uniform, so the lines are parallel and equally spaced."],
    ["Which device converts mechanical energy into electrical energy?", "Electric generator", ["Electric motor", "Galvanometer", "Electric fuse"], "A generator works on electromagnetic induction and converts mechanical energy to electrical energy."],
    ["Which device converts electrical energy into mechanical energy?", "Electric motor", ["Electric generator", "Transformer", "Ammeter"], "A motor uses the force on a current-carrying coil in a magnetic field."],
    ["The phenomenon of producing current in a coil by changing the magnetic field around it is", "electromagnetic induction", ["electrolysis", "magnetic hysteresis", "dispersion"], "Faraday discovered electromagnetic induction."],
    ["What is the frequency of AC mains supply in India?", "50 Hz", ["60 Hz", "100 Hz", "220 Hz"], "Domestic AC in India is 220 V at 50 Hz."],
    ["The wire with green insulation in domestic wiring is the", "earth wire", ["live wire", "neutral wire", "fuse wire"], "Live is red (or brown), neutral is black (or blue) and earth is green."],
    ["Which safety device melts and breaks the circuit when excess current flows?", "Fuse", ["Earth wire", "Switch", "Rheostat"], "A fuse wire has a low melting point and breaks the circuit on overloading or a short circuit."],
    ["The direction of magnetic field lines outside a bar magnet is", "from the north pole to the south pole", ["from the south pole to the north pole", "from the centre outwards", "parallel to the magnet's axis only"], "Outside the magnet the lines go from N to S; inside, from S to N."],
  ];
  for (const [q, a, w, why] of FACTS) b.mcq("Magnetic Effects", q, a, w.length >= 3 ? w : [...w, "None of these"], why);
  // Refraction: refractive index from speeds.
  b.repeat(25, () => {
    const n = pick(r, [1.25, 1.33, 1.5, 1.6, 2, 2.4]);
    return b.mcq("Light: Refraction", `The refractive index of a medium is ${n}. What is the speed of light in it? (c = 3 × 10⁸ m/s)`, `${s(3 / n)} × 10⁸ m/s`, [`${s(3 * n)} × 10⁸ m/s`, `${s(n)} × 10⁸ m/s`, `3 × 10⁸ m/s`, `${s(3 / n / 2)} × 10⁸ m/s`], `n = c/v, so v = c/n = 3 × 10⁸ / ${n} = ${s(3 / n)} × 10⁸ m/s.`);
  });
}

function inorganic10(b: Bank) {
  const ORES: [string, string][] = [["Bauxite", "Aluminium"], ["Haematite", "Iron"], ["Cinnabar", "Mercury"], ["Zinc blende", "Zinc"], ["Galena", "Lead"], ["Copper pyrites", "Copper"], ["Rock salt", "Sodium"], ["Magnetite", "Iron"], ["Calamine", "Zinc"]];
  const metals = [...new Set(ORES.map(([, m]) => m))];
  for (const [ore, metal] of ORES) b.mcq("Metals and Non-metals", `${ore} is an ore of which metal?`, metal, metals.filter(m => m !== metal), `${ore} is the common ore of ${metal.toLowerCase()}.`);
  const ALLOYS: [string, string][] = [["Brass", "Copper and zinc"], ["Bronze", "Copper and tin"], ["Solder", "Lead and tin"], ["Stainless steel", "Iron, chromium and nickel (with a little carbon)"], ["Duralumin", "Aluminium, copper, magnesium and manganese"]];
  for (const [alloy, parts] of ALLOYS) b.mcq("Metals and Non-metals", `What is ${alloy.toLowerCase()} made of?`, parts, ALLOYS.map(([, p]) => p).filter(p => p !== parts), `${alloy} is an alloy of ${parts.toLowerCase()}.`);
  // Reactivity series: K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Hg > Ag > Au.
  const SERIES = ["Potassium", "Sodium", "Calcium", "Magnesium", "Aluminium", "Zinc", "Iron", "Lead", "Copper", "Mercury", "Silver", "Gold"];
  const SALT: Record<string, string> = { Zinc: "zinc sulphate", Iron: "iron sulphate", Copper: "copper sulphate", Lead: "lead nitrate", Silver: "silver nitrate", Magnesium: "magnesium sulphate", Aluminium: "aluminium sulphate", Mercury: "mercuric chloride", Gold: "gold chloride" };
  const solids = ["Magnesium", "Aluminium", "Zinc", "Iron", "Lead", "Copper", "Silver"];
  for (const metal of solids) for (const [other, salt] of Object.entries(SALT)) {
    if (other === metal) continue;
    const yes = SERIES.indexOf(metal) < SERIES.indexOf(other);
    b.mcq("Metals and Non-metals", `Will a reaction occur when a strip of ${metal.toLowerCase()} is placed in ${salt} solution?`, yes ? `Yes, ${metal.toLowerCase()} displaces ${other.toLowerCase()}` : "No reaction occurs",
      [yes ? "No reaction occurs" : `Yes, ${metal.toLowerCase()} displaces ${other.toLowerCase()}`, "Only hydrogen gas is evolved", "The solution freezes", "The strip dissolves without any displacement"],
      `${metal} is ${yes ? "more" : "less"} reactive than ${other.toLowerCase()} in the reactivity series, so it ${yes ? "displaces" : "cannot displace"} it from its salt.`);
  }
  const FACTS: [string, string, string[], string][] = [
    ["Which metal is liquid at room temperature?", "Mercury", ["Sodium", "Gallium only above 50 °C", "Lead"], "Mercury is the only metal that is liquid at room temperature."],
    ["Which non-metal is a good conductor of electricity?", "Graphite", ["Diamond", "Sulphur", "Phosphorus"], "Graphite, a form of carbon, conducts electricity because of its free electrons."],
    ["Which metals are stored under kerosene?", "Sodium and potassium", ["Gold and silver", "Copper and zinc", "Iron and aluminium"], "Sodium and potassium react vigorously with air and water, so they are kept under kerosene."],
    ["The process of coating iron with zinc to prevent rusting is called", "galvanisation", ["electroplating with tin", "calcination", "roasting"], "Galvanised iron has a protective zinc layer."],
    ["Heating a carbonate ore strongly in limited air is called", "calcination", ["roasting", "smelting", "refining"], "Calcination converts carbonate ores to oxides; roasting heats sulphide ores in excess air."],
    ["Heating a sulphide ore strongly in excess air is called", "roasting", ["calcination", "electrolysis", "sublimation"], "Roasting converts a sulphide ore to its oxide (e.g. 2ZnS + 3O₂ → 2ZnO + 2SO₂)."],
    ["Metals that are highly reactive, such as sodium and aluminium, are extracted by", "electrolytic reduction", ["heating with carbon", "heating alone", "displacement by copper"], "Their oxides are too stable to be reduced by carbon, so electrolysis of the molten compound is used."],
    ["The oxide of a metal is generally", "basic", ["acidic", "neutral always", "a salt"], "Metal oxides are basic; some, such as Al₂O₃ and ZnO, are amphoteric."],
    ["Which gas is produced when a metal reacts with a dilute acid?", "Hydrogen", ["Oxygen", "Carbon dioxide", "Nitrogen"], "Metal + dilute acid → salt + hydrogen gas."],
    ["Aluminium oxide and zinc oxide, which react with both acids and bases, are called", "amphoteric oxides", ["neutral oxides", "basic oxides only", "acidic oxides only"], "Amphoteric oxides show both acidic and basic behaviour."],
    ["Ionic compounds generally have", "high melting and boiling points", ["low melting points", "no electrical conductivity in solution", "covalent bonds"], "Strong electrostatic forces between ions need a lot of energy to break."],
    ["Aqua regia is a mixture of concentrated hydrochloric acid and concentrated nitric acid in the ratio", "3 : 1", ["1 : 3", "1 : 1", "2 : 1"], "Aqua regia (3 HCl : 1 HNO₃) dissolves gold and platinum."],
  ];
  for (const [q, a, w, why] of FACTS) b.mcq("Metals and Non-metals", q, a, w, why);
}

function math12(b: Bank, r: () => number) {
  // Relations and functions: counting.
  b.repeat(25, () => {
    const n = int(r, 2, 4);
    return b.mcq("Relations and Functions", `How many relations are possible on a set with ${n} elements?`, `2^${n * n} = ${2 ** (n * n)}`, [`${2 ** n}`, `${n * n}`, `2^${n * n - n} = ${2 ** (n * n - n)}`, `${2 ** (2 * n)}`], `A relation on A is any subset of A × A, which has ${n}² = ${n * n} elements, so there are 2^${n * n} relations.`);
  });
  b.repeat(30, () => {
    const m = int(r, 2, 4), n = int(r, m, 5);
    let oneOne = 1; for (let i = 0; i < m; i++) oneOne *= n - i;
    return b.mcq("Relations and Functions", `Set A has ${m} elements and set B has ${n} elements. How many one-one functions are there from A to B?`, String(oneOne), [String(n ** m), String(m ** n), String(oneOne / m || oneOne + 1), String(n * m)], `Each element of A must go to a different element of B: ${n}P${m} = ${oneOne}.`);
  });
  b.repeat(20, () => {
    const m = int(r, 2, 4), n = int(r, 2, 4);
    return b.mcq("Relations and Functions", `How many functions are there from a set with ${m} elements to a set with ${n} elements?`, String(n ** m), [String(m ** n), String(m * n), String(2 ** (m * n)), String(n ** m + 1)], `Each of the ${m} elements has ${n} choices, so ${n}^${m} = ${n ** m} functions.`);
  });
  // Inverse trigonometric functions: principal values.
  const PV: [string, string][] = [["sin⁻¹(1/2)", "π/6"], ["cos⁻¹(1/2)", "π/3"], ["tan⁻¹(1)", "π/4"], ["sin⁻¹(−1/2)", "−π/6"], ["cos⁻¹(−1/2)", "2π/3"], ["tan⁻¹(√3)", "π/3"], ["tan⁻¹(−1)", "−π/4"], ["cos⁻¹(0)", "π/2"], ["sin⁻¹(1)", "π/2"], ["cos⁻¹(−1)", "π"], ["sin⁻¹(√3/2)", "π/3"], ["cos⁻¹(√3/2)", "π/6"], ["tan⁻¹(1/√3)", "π/6"], ["cot⁻¹(1)", "π/4"], ["cosec⁻¹(2)", "π/6"], ["sec⁻¹(2)", "π/3"], ["cos⁻¹(−√3/2)", "5π/6"], ["cot⁻¹(−1)", "3π/4"]];
  const angles = ["π/6", "π/3", "π/4", "π/2", "2π/3", "5π/6", "−π/6", "−π/4", "π", "3π/4"];
  for (const [expr, value] of PV) b.mcq("Inverse Trigonometric Functions", `What is the principal value of ${expr}?`, value, angles.filter(a => a !== value), `${expr} = ${value}, which lies in the principal-value branch of the function.`);
  // Three-dimensional geometry.
  const DC: [number, number, number, number][] = [[2, 3, 6, 7], [1, 2, 2, 3], [2, 6, 9, 11], [3, 4, 12, 13], [4, 4, 7, 9], [1, 4, 8, 9], [2, 10, 11, 15], [6, 6, 7, 11]];
  b.repeat(30, () => {
    const [a, c, e, m] = pick(r, DC); const [x, y, z] = shuffle(r, [a, c, e]); const x1 = int(r, -4, 4), y1 = int(r, -4, 4), z1 = int(r, -4, 4);
    return b.mcq("Three-Dimensional Geometry", `Find the distance between the points (${s(x1)}, ${s(y1)}, ${s(z1)}) and (${s(x1 + x)}, ${s(y1 + y)}, ${s(z1 + z)}).`, String(m), [String(m + 1), String(x + y + z), String(m * m), String(m - 1)], `d = √(${x}² + ${y}² + ${z}²) = √${m * m} = ${m}.`);
  });
  b.repeat(25, () => {
    const [a, c, e, m] = pick(r, DC); const [x, y, z] = shuffle(r, [a, c, e]);
    return b.mcq("Three-Dimensional Geometry", `Find the direction cosines of the line with direction ratios ${x}, ${y}, ${z}.`, `${frac(x, m)}, ${frac(y, m)}, ${frac(z, m)}`, [`${x}, ${y}, ${z}`, `${frac(x, m + 1)}, ${frac(y, m + 1)}, ${frac(z, m + 1)}`, `${frac(m, x)}, ${frac(m, y)}, ${frac(m, z)}`, `${frac(x, x + y + z)}, ${frac(y, x + y + z)}, ${frac(z, x + y + z)}`], `Divide each ratio by √(${x}² + ${y}² + ${z}²) = ${m}.`);
  });
  // Differential equations: order and degree.
  const DE: [string, number, number][] = [["d²y/dx² + y = 0", 2, 1], ["(dy/dx)³ + y = x", 1, 3], ["d³y/dx³ + 2(d²y/dx²)² + y = 0", 3, 1], ["(d²y/dx²)² + (dy/dx)³ = 0", 2, 2], ["dy/dx = sin x", 1, 1], ["y d²y/dx² + (dy/dx)⁴ = 1", 2, 1], ["(d³y/dx³)² − x(dy/dx)⁵ = 0", 3, 2], ["dy/dx + y = eˣ", 1, 1]];
  for (const [eq, order, degree] of DE) {
    b.mcq("Differential Equations", `What are the order and degree of the differential equation ${eq}?`, `Order ${order}, degree ${degree}`, [`Order ${degree}, degree ${order}`, `Order ${order + 1}, degree ${degree}`, `Order ${order}, degree ${degree + 1}`, `Order ${order}, degree not defined`].filter(x => x !== `Order ${order}, degree ${degree}`), `The highest derivative is of order ${order}, and it appears with power ${degree} when the equation is polynomial in its derivatives.`);
  }
  b.repeat(25, () => {
    const k = int(r, 2, 9), c = int(r, -6, 6);
    return b.solved("Differential Equations", `Solve dy/dx = ${k}x, given that y = ${s(c)} when x = 0.`, `y = ${frac(k, 2)}x²${term(c, "")}`,
      ["// Separate the variables", `dy = ${k}x dx`, "// Integrate both sides", `y = ${frac(k, 2)}x² + C`, `// Use y(0) = ${s(c)}`, `C = ${s(c)}`, `∴ y = ${frac(k, 2)}x²${term(c, "")}`], 3);
  });
  // Linear programming: evaluate Z at the corner points.
  b.repeat(30, () => {
    const p = int(r, 1, 9), q = int(r, 1, 9), X = int(r, 3, 12), Y = int(r, 3, 12), mx = int(r, 1, X - 1), my = int(r, 1, Y - 1);
    const corners: [number, number][] = [[0, 0], [X, 0], [mx, my], [0, Y]]; const values = corners.map(([x, y]) => p * x + q * y); const best = Math.max(...values);
    return b.mcq("Linear Programming", `The corner points of the feasible region of an LPP are (0, 0), (${X}, 0), (${mx}, ${my}) and (0, ${Y}). What is the maximum of Z = ${p}x + ${q}y?`, String(best), [...new Set([...values.filter(v => v !== best), best + p, best - q])].map(String), `Z at the corners: ${corners.map(([x, y], i) => `(${x}, ${y}) → ${values[i]}`).join(", ")}. The largest is ${best}.`);
  });
  // Application of integrals.
  b.repeat(25, () => {
    const a = int(r, 1, 6);
    return b.mcq("Application of Integrals", `Find the area bounded by the curve y = x², the x-axis and the lines x = 0 and x = ${a}.`, `${frac(a ** 3, 3)} sq units`, [`${frac(a ** 2, 2)} sq units`, `${a ** 3} sq units`, `${frac(a ** 3, 2)} sq units`, `${frac(2 * a ** 3, 3)} sq units`], `Area = ∫₀^${a} x² dx = [x³/3]₀^${a} = ${frac(a ** 3, 3)} sq units.`);
  });
  b.repeat(15, () => {
    const radius = int(r, 2, 9);
    return b.mcq("Application of Integrals", `Find the area enclosed by the circle x² + y² = ${radius * radius}.`, `${radius * radius}π sq units`, [`${2 * radius}π sq units`, `${radius}π sq units`, `${radius * radius * 2}π sq units`, `${radius * radius} sq units`], `Area = 4 ∫₀^${radius} √(${radius * radius} − x²) dx = πr² = ${radius * radius}π sq units.`);
  });
}

function physics12(b: Bank, r: () => number) {
  // Wave optics: Young's double-slit experiment.
  b.repeat(40, () => {
    const lambda = pick(r, [400, 450, 500, 550, 600, 650, 700]), D = pick(r, [1, 1.2, 1.5, 2]), d = pick(r, [0.1, 0.2, 0.25, 0.5, 1]);
    const beta = lambda * 1e-9 * D / (d * 1e-3) * 1e3; // mm
    return b.mcq("Wave Optics", `In Young's double-slit experiment, λ = ${lambda} nm, the slit separation is ${d} mm and the screen is ${D} m away. Find the fringe width.`, `${s(beta)} mm`, [`${s(beta * 2)} mm`, `${s(beta / 2)} mm`, `${s(beta * 10)} mm`, `${s(beta + 1)} mm`], `β = λD/d = ${lambda} × 10⁻⁹ × ${D} / (${d} × 10⁻³) = ${s(beta)} mm.`);
  });
  const WAVE: [string, string, string[], string][] = [
    ["The phenomenon of bending of light around the corners of an obstacle is", "diffraction", ["interference", "polarisation", "total internal reflection"], "Diffraction is significant when the obstacle is comparable to the wavelength."],
    ["Which phenomenon shows that light waves are transverse?", "Polarisation", ["Interference", "Diffraction", "Refraction"], "Only transverse waves can be polarised."],
    ["Brewster's law relates the polarising angle to the refractive index by", "μ = tan iₚ", ["μ = sin iₚ", "μ = cos iₚ", "μ = 1/sin iₚ"], "At Brewster's angle the reflected light is completely plane polarised and μ = tan iₚ."],
    ["For sustained interference, the two sources must be", "coherent", ["of different frequencies", "very far apart", "of unequal wavelengths"], "Coherent sources keep a constant phase difference."],
    ["Huygens' principle treats every point on a wavefront as", "a source of secondary wavelets", ["a ray", "a node", "an absorber"], "The new wavefront is the envelope of the secondary wavelets."],
  ];
  for (const [q, a, w, why] of WAVE) b.mcq("Wave Optics", q, a, w, why);
  // Atoms: Bohr model of hydrogen.
  b.repeat(30, () => {
    const n1 = int(r, 1, 3), n2 = int(r, n1 + 1, 6); const e = 13.6 * (1 / (n1 * n1) - 1 / (n2 * n2));
    return b.mcq("Atoms", `Find the energy of the photon emitted when an electron in a hydrogen atom falls from n = ${n2} to n = ${n1}.`, `${s(e)} eV`, [`${s(13.6 / (n2 * n2))} eV`, `${s(13.6 / (n1 * n1))} eV`, `${s(e * 2)} eV`, `${s(13.6 * (1 / n1 - 1 / n2))} eV`], `E = 13.6 (1/${n1}² − 1/${n2}²) eV = ${s(e)} eV.`);
  });
  b.repeat(15, () => {
    const n = int(r, 1, 6);
    return b.mcq("Atoms", `What is the energy of the electron in the n = ${n} orbit of a hydrogen atom?`, `${s(-13.6 / (n * n))} eV`, [`${s(-13.6 / n)} eV`, `${s(13.6 / (n * n))} eV`, `${s(-13.6 * n * n)} eV`, `${s(-13.6 / (n * n) / 2)} eV`], `Eₙ = −13.6/n² eV = −13.6/${n * n} = ${s(-13.6 / (n * n))} eV.`);
  });
  // Semiconductors: logic gates.
  const GATES: Record<string, (a: number, c: number) => number> = { AND: (a, c) => a & c, OR: (a, c) => a | c, NAND: (a, c) => 1 - (a & c), NOR: (a, c) => 1 - (a | c), XOR: (a, c) => a ^ c };
  for (const [gate, fn] of Object.entries(GATES)) for (const a of [0, 1]) for (const c of [0, 1]) {
    const out = fn(a, c);
    b.mcq("Semiconductors", `What is the output of a two-input ${gate} gate when A = ${a} and B = ${c}?`, String(out), [String(1 - out), "Undefined", "Both 0 and 1", "Depends on the supply voltage"], `${gate} truth table: A = ${a}, B = ${c} gives Y = ${out}.`);
  }
  const SEMI: [string, string, string[], string][] = [
    ["An n-type semiconductor is made by doping silicon with", "a pentavalent impurity such as phosphorus", ["a trivalent impurity such as boron", "a noble gas", "a metal such as copper"], "Pentavalent atoms donate a free electron."],
    ["A p-type semiconductor is made by doping silicon with", "a trivalent impurity such as boron", ["a pentavalent impurity such as arsenic", "carbon", "nitrogen gas"], "Trivalent atoms create holes (acceptors)."],
    ["In a forward-biased p-n junction, the depletion layer", "becomes thinner", ["becomes thicker", "disappears permanently", "is unaffected"], "Forward bias opposes the barrier potential, narrowing the depletion region."],
    ["A Zener diode is mainly used as a", "voltage regulator", ["rectifier only", "amplifier", "light source"], "In reverse breakdown the Zener voltage stays nearly constant."],
    ["The majority charge carriers in a p-type semiconductor are", "holes", ["electrons", "protons", "neutrons"], "Acceptor impurities create holes."],
    ["Which device converts AC into pulsating DC?", "Rectifier", ["Oscillator", "Amplifier", "Transformer"], "A p-n junction diode rectifier allows current in one direction."],
    ["The energy gap of an insulator is typically", "more than 3 eV", ["zero", "about 0.7 eV", "negative"], "Insulators have a large forbidden gap; semiconductors have about 1 eV."],
  ];
  for (const [q, a, w, why] of SEMI) b.mcq("Semiconductors", q, a, w, why);
  // Electromagnetic waves.
  b.repeat(25, () => {
    const f = pick(r, [1, 2, 3, 5, 6, 10, 15, 30, 50, 100, 300]);
    return b.mcq("Electromagnetic Waves", `Find the wavelength of an electromagnetic wave of frequency ${f} MHz in vacuum.`, `${s(300 / f)} m`, [`${s(f / 300)} m`, `${s(3000 / f)} m`, `${s(30 / f)} m`, `${s(300 / f + 1)} m`], `λ = c/f = 3 × 10⁸ / (${f} × 10⁶) = ${s(300 / f)} m.`);
  });
  const EM = ["Radio waves", "Microwaves", "Infrared", "Visible light", "Ultraviolet", "X-rays", "Gamma rays"];
  const USE: [string, string][] = [["Radio waves", "radio and television broadcasting"], ["Microwaves", "radar and microwave ovens"], ["Infrared", "remote controls and heat lamps"], ["Ultraviolet", "sterilising water and killing germs"], ["X-rays", "seeing fractured bones"], ["Gamma rays", "treating cancer"]];
  for (const [wave, use] of USE) b.mcq("Electromagnetic Waves", `Which electromagnetic waves are used for ${use}?`, wave, EM.filter(x => x !== wave), `${wave} are used for ${use}.`);
  b.mcq("Electromagnetic Waves", "Which electromagnetic waves have the shortest wavelength?", "Gamma rays", ["Radio waves", "Infrared", "Ultraviolet"], "In order of decreasing wavelength: radio, micro, IR, visible, UV, X-rays, gamma.");
  // Ray optics: thin lens and combination.
  b.repeat(30, () => {
    const f1 = pick(r, [10, 20, 25, 40, 50]), f2 = pick(r, [-20, -25, -40, -50, 20, 40, 100]); const P = 100 / f1 + 100 / f2; if (Math.abs(P) < 0.01) return false;
    return b.mcq("Ray Optics and Optical Instruments", `Two thin lenses of focal lengths +${f1} cm and ${s(f2)} cm are placed in contact. What is the power of the combination?`, `${s(P)} D`, [`${s(100 / f1 - 100 / f2)} D`, `${s(100 / (f1 + f2) || 1)} D`, `${s(-P)} D`, `${s(P * 2)} D`], `P = P₁ + P₂ = 100/${f1} + 100/${s(f2)} = ${s(P)} D.`);
  });
}

function organic12(b: Bank) {
  const BIO: [string, string, string[], string][] = [
    ["Glucose is an example of", "an aldohexose", ["a ketohexose", "a disaccharide", "a polysaccharide"], "Glucose has six carbons and an aldehyde group."],
    ["Fructose is an example of", "a ketohexose", ["an aldohexose", "a disaccharide", "a protein"], "Fructose has six carbons and a ketone group."],
    ["Which of these sugars is non-reducing?", "Sucrose", ["Glucose", "Maltose", "Lactose"], "In sucrose the reducing groups of glucose and fructose are joined in the glycosidic bond."],
    ["Sucrose on hydrolysis gives", "glucose and fructose", ["only glucose", "glucose and galactose", "fructose and galactose"], "Sucrose → glucose + fructose (invert sugar)."],
    ["Lactose on hydrolysis gives", "glucose and galactose", ["glucose and fructose", "only glucose", "galactose and fructose"], "Lactose is milk sugar."],
    ["Starch is a polymer of", "α-D-glucose", ["β-D-glucose", "fructose", "amino acids"], "Starch (amylose and amylopectin) is made of α-glucose units."],
    ["Cellulose is a polymer of", "β-D-glucose", ["α-D-glucose", "fructose", "nucleotides"], "β-glycosidic links make cellulose a straight-chain polymer."],
    ["The bond joining amino acids in a protein is the", "peptide bond", ["glycosidic bond", "phosphodiester bond", "hydrogen bond"], "–CO–NH– links are peptide bonds."],
    ["Deficiency of vitamin C causes", "scurvy", ["rickets", "night blindness", "beriberi"], "Vitamin C (ascorbic acid) deficiency causes scurvy."],
    ["Deficiency of vitamin D causes", "rickets", ["scurvy", "pernicious anaemia", "xerophthalmia"], "Vitamin D is needed for calcium absorption."],
    ["Deficiency of vitamin A causes", "night blindness", ["rickets", "scurvy", "beriberi"], "Vitamin A deficiency causes night blindness and xerophthalmia."],
    ["Deficiency of vitamin B₁ causes", "beriberi", ["scurvy", "rickets", "night blindness"], "Thiamine (B₁) deficiency causes beriberi."],
    ["Which vitamins are fat-soluble?", "A, D, E and K", ["B and C", "Only C", "B₁ and B₂"], "Vitamins A, D, E and K dissolve in fat and are stored in the body."],
    ["The sugar present in RNA is", "ribose", ["deoxyribose", "glucose", "fructose"], "RNA has β-D-ribose; DNA has β-D-2-deoxyribose."],
    ["Which base is found in RNA but not in DNA?", "Uracil", ["Thymine", "Adenine", "Guanine"], "RNA has uracil in place of thymine."],
    ["Enzymes are mostly", "globular proteins", ["carbohydrates", "lipids", "vitamins"], "Enzymes are biological catalysts, mostly proteins."],
    ["Insulin is a hormone that regulates", "blood glucose level", ["blood pressure only", "bone growth", "eye sight"], "Insulin lowers the blood glucose level."],
    ["Denaturation of a protein destroys its", "secondary and tertiary structure", ["primary structure", "peptide bonds", "amino acid sequence"], "Heat or pH change disturbs hydrogen bonds; the sequence stays."],
  ];
  for (const [q, a, w, why] of BIO) b.mcq("Biomolecules", q, a, w, why);
  for (const [q, a, , why] of BIO) b.bank("Biomolecules", q.endsWith("?") ? q : `${q} …?`, `${a[0].toUpperCase()}${a.slice(1)}. ${why}`, 1);
}

function inorganic12(b: Bank, r: () => number) {
  // d-block: spin-only magnetic moment from the number of unpaired electrons.
  const IONS: [string, number][] = [["Sc³⁺", 0], ["Ti³⁺", 1], ["V³⁺", 2], ["Cr³⁺", 3], ["Mn²⁺", 5], ["Fe²⁺", 4], ["Fe³⁺", 5], ["Co²⁺", 3], ["Ni²⁺", 2], ["Cu²⁺", 1], ["Zn²⁺", 0], ["Mn³⁺", 4], ["Cr²⁺", 4], ["Cu⁺", 0], ["Ti⁴⁺", 0], ["V²⁺", 3]];
  const mu = (n: number) => num(Math.sqrt(n * (n + 2)), 2);
  for (const [ion, n] of IONS) {
    b.mcq("d- and f-Block Elements", `How many unpaired electrons does ${ion} have (gaseous ion)?`, String(n), [0, 1, 2, 3, 4, 5].filter(x => x !== n).map(String), `${ion} has ${n} unpaired d-electron${n === 1 ? "" : "s"}.`);
    b.mcq("d- and f-Block Elements", `What is the spin-only magnetic moment of ${ion}?`, `${mu(n)} BM`, [0, 1, 2, 3, 4, 5].filter(x => x !== n).map(x => `${mu(x)} BM`), `μ = √(n(n + 2)) BM with n = ${n}: √${n * (n + 2)} = ${mu(n)} BM.`);
  }
  const DF: [string, string, string[], string][] = [
    ["Zinc, cadmium and mercury are not regarded as typical transition elements because", "they have completely filled d-orbitals in the ground state and common oxidation states", ["they are gases", "they have no d-electrons at all", "they are radioactive"], "Their d¹⁰ configuration means no partly filled d-orbitals."],
    ["The gradual decrease in the size of lanthanoid atoms and ions with increasing atomic number is called", "lanthanoid contraction", ["actinoid expansion", "inert pair effect", "screening effect"], "Poor shielding by 4f electrons causes lanthanoid contraction."],
    ["The most common oxidation state of lanthanoids is", "+3", ["+2", "+4", "+1"], "Lanthanoids mainly show +3; Ce shows +4 and Eu, Yb show +2 too."],
    ["Transition metal ions are usually coloured because of", "d–d transitions of unpaired electrons", ["nuclear reactions", "their high density", "their metallic bonding"], "Light of a particular wavelength is absorbed to excite d-electrons."],
    ["KMnO₄ in acidic medium is reduced to", "Mn²⁺", ["MnO₂", "MnO₄²⁻", "Mn"], "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O."],
    ["The oxidation state of chromium in K₂Cr₂O₇ is", "+6", ["+3", "+7", "+2"], "2(+1) + 2x + 7(−2) = 0 gives x = +6."],
    ["The oxidation state of manganese in KMnO₄ is", "+7", ["+6", "+4", "+2"], "+1 + x + 4(−2) = 0 gives x = +7."],
    ["Transition metals and their compounds act as good catalysts mainly because they", "show variable oxidation states and form complexes", ["are very light", "are non-metals", "have no d-electrons"], "Variable valency and surface adsorption help catalysis."],
  ];
  for (const [q, a, w, why] of DF) b.mcq("d- and f-Block Elements", q, a, w, why);
  // Coordination compounds: oxidation state of the central metal.
  const COMPLEX: [string, number, string][] = [["[Co(NH₃)₆]Cl₃", 3, "NH₃ is neutral and 3 Cl⁻ balance +3"], ["K₄[Fe(CN)₆]", 2, "4(+1) + x + 6(−1) = 0"], ["K₃[Fe(CN)₆]", 3, "3(+1) + x + 6(−1) = 0"], ["[Ni(CO)₄]", 0, "CO is neutral"], ["[Cu(NH₃)₄]SO₄", 2, "SO₄²⁻ balances +2"], ["K₂[PtCl₆]", 4, "2(+1) + x + 6(−1) = 0"], ["[Cr(H₂O)₆]Cl₃", 3, "H₂O is neutral, 3 Cl⁻ balance +3"], ["K₃[Al(C₂O₄)₃]", 3, "3(+1) + x + 3(−2) = 0"], ["[Pt(NH₃)₂Cl₂]", 2, "2 NH₃ neutral, 2 Cl⁻ give −2"], ["Na₂[Zn(OH)₄]", 2, "2(+1) + x + 4(−1) = 0"]];
  for (const [formula, ox, why] of COMPLEX) b.mcq("Coordination Compounds", `What is the oxidation state of the central metal in ${formula}?`, ox ? `+${ox}` : "0", ["0", "+1", "+2", "+3", "+4", "+6"].filter(x => x !== (ox ? `+${ox}` : "0")), `${why}, so the metal is in the ${ox ? `+${ox}` : "0"} state.`);
  const CN: [string, number][] = [["[Co(NH₃)₆]³⁺", 6], ["[Ni(CO)₄]", 4], ["[Cu(NH₃)₄]²⁺", 4], ["[Fe(C₂O₄)₃]³⁻", 6], ["[Co(en)₃]³⁺", 6], ["[Ag(NH₃)₂]⁺", 2], ["[PtCl₄]²⁻", 4], ["[Cr(EDTA)]⁻", 6]];
  for (const [ion, cn] of CN) b.mcq("Coordination Compounds", `What is the coordination number of the metal in ${ion}?`, String(cn), ["2", "3", "4", "5", "6", "8"].filter(x => x !== String(cn)), `Count the donor atoms: ${cn} (en and C₂O₄²⁻ are bidentate, EDTA is hexadentate).`);
  // Chemical kinetics: half-life of a first-order reaction.
  b.repeat(25, () => {
    const k = pick(r, [0.0693, 0.00693, 0.693, 0.1386, 0.231, 0.0231]);
    return b.mcq("Chemical Kinetics", `The rate constant of a first-order reaction is ${k} min⁻¹. What is its half-life?`, `${s(0.693 / k)} min`, [`${s(0.693 * k)} min`, `${s(1 / k)} min`, `${s(0.693 / k * 2)} min`, `${s(0.693 / k / 2)} min`], `t½ = 0.693/k = 0.693/${k} = ${s(0.693 / k)} min.`);
  });
}

/** The extra generated questions for one class and subject. */
export function generateMore(cls: ClassId, subject: SubjectId): Generated {
  const seed = (cls === "10" ? 7100 : 7200) + ["math", "physics", "organic", "inorganic", "english"].indexOf(subject);
  const r = rng(seed); const b = new Bank(`${cls}-${subject}-x`, r);
  if (cls === "10" && subject === "math") math10(b, r);
  if (cls === "10" && subject === "physics") physics10(b, r);
  if (cls === "10" && subject === "inorganic") inorganic10(b);
  if (cls === "12" && subject === "math") math12(b, r);
  if (cls === "12" && subject === "physics") physics12(b, r);
  if (cls === "12" && subject === "organic") organic12(b);
  if (cls === "12" && subject === "inorganic") inorganic12(b, r);
  return { items: b.items, mcqs: b.mcqs };
}
