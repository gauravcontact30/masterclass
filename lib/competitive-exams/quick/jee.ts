import { quick } from "@/lib/quick-qa";

/* JEE Main and Advanced: quick questions with short answers. */
export default quick("jee", `
# Physics: Mechanics
Write the three equations of motion. | v = u + at, s = ut + ½at², v² = u² + 2as.
What is the maximum height of a projectile? | u² sin²θ / 2g.
What is the time of flight of a projectile? | 2u sin θ / g.
What is the horizontal range of a projectile? | u² sin 2θ / g.
At what angle is the range maximum? | 45°.
What is centripetal acceleration? | v²/r.
State Newton's second law. | F = dp/dt = ma.
What is impulse? | Force × time = change in momentum.
What is the limiting friction? | μₛN.
What is the acceleration of a block sliding down a rough incline? | g(sin θ − μ cos θ).
What is the angle of repose? | tan θ = μₛ.
State the work–energy theorem. | Work done by the net force equals the change in kinetic energy.
What is the potential energy of a spring? | ½kx².
What is power in terms of force and velocity? | P = F · v.
What is the coefficient of restitution for a perfectly elastic collision? | 1.
What is conserved in all collisions? | Linear momentum.
What is the centre of mass of two particles? | (m₁x₁ + m₂x₂)/(m₁ + m₂).
What is torque? | τ = r × F = Iα.
What is angular momentum? | L = Iω = r × p.
What is the moment of inertia of a ring about its axis? | MR².
What is the moment of inertia of a disc about its axis? | ½MR².
What is the moment of inertia of a solid sphere about a diameter? | ⅖MR².
What is the moment of inertia of a hollow sphere about a diameter? | ⅔MR².
What is the moment of inertia of a rod about its centre? | ML²/12.
State the parallel axis theorem. | I = I(cm) + Md².
State the perpendicular axis theorem. | I(z) = I(x) + I(y), for a lamina.
What is the kinetic energy of a rolling body? | ½mv² + ½Iω².
What is the condition for rolling without slipping? | v = Rω.
State Newton's law of gravitation. | F = Gm₁m₂/r².
What is the acceleration due to gravity at height h? | g(1 − 2h/R), for h much less than R.
What is the acceleration due to gravity at depth d? | g(1 − d/R).
What is the orbital speed of a satellite? | √(GM/r).
What is the escape speed? | √(2GM/R).
What is the gravitational potential energy? | −GMm/r.
What is the time period of a satellite? | 2π√(r³/GM).
What is the total energy of a satellite in orbit? | −GMm/2r.

# Physics: Properties of Matter, Heat and Waves
What is Young's modulus? | Stress / strain = FL/(AΔL).
What is the bulk modulus? | −ΔP/(ΔV/V).
What is the excess pressure inside a liquid drop? | 2T/R.
What is the excess pressure inside a soap bubble? | 4T/R.
What is the height of capillary rise? | 2T cos θ / (ρgr).
State the equation of continuity. | A₁v₁ = A₂v₂.
State Bernoulli's equation. | P + ½ρv² + ρgh = constant.
State Stokes' law. | F = 6πηrv.
What is terminal velocity? | 2r²(ρ − σ)g / 9η.
What is the ideal gas equation? | PV = nRT.
What is the rms speed of gas molecules? | √(3RT/M).
What is the average kinetic energy per molecule? | (3/2)kT.
State the law of equipartition of energy. | Each degree of freedom has energy ½kT.
What is Cₚ − Cᵥ for an ideal gas? | R.
What is γ for a monatomic gas? | 5/3.
What is γ for a diatomic gas? | 7/5.
What is the work done in an isothermal process? | nRT ln(V₂/V₁).
What is the adiabatic relation? | PV^γ = constant.
What is the efficiency of a Carnot engine? | 1 − T₂/T₁.
State Wien's displacement law. | λ(max) T = constant (2.9 × 10⁻³ m K).
State Stefan's law. | E = σT⁴.
State Newton's law of cooling. | Rate of cooling is proportional to the temperature difference.
What is the time period of a spring–mass system? | 2π√(m/k).
What is the time period of a simple pendulum? | 2π√(l/g).
What is the total energy in SHM? | ½mω²A².
What is the speed of a wave on a string? | √(T/μ).
What is the speed of sound in a gas? | √(γP/ρ).
What are the harmonics of an open pipe? | All harmonics: f, 2f, 3f.
What are the harmonics of a closed pipe? | Odd harmonics only: f, 3f, 5f.
What is the beat frequency? | |f₁ − f₂|.
Write the Doppler formula. | f′ = f (v ± v₀)/(v ∓ vₛ).

# Physics: Electricity and Magnetism
State Coulomb's law. | F = kq₁q₂/r².
What is the electric field of a point charge? | kq/r².
State Gauss's law. | Flux = q(enclosed)/ε₀.
What is the potential of a point charge? | kq/r.
What is the capacitance of a parallel-plate capacitor? | ε₀A/d.
What is the energy stored in a capacitor? | ½CV².
What is drift velocity in terms of current? | I/(neA).
What is resistivity's temperature relation? | ρ = ρ₀(1 + αΔT).
State the Wheatstone bridge condition. | P/Q = R/S.
What is the time constant of an RC circuit? | RC.
What is the force on a moving charge in a magnetic field? | qv × B.
What is the radius of a charged particle's path in a magnetic field? | mv/qB.
What is the field at the centre of a circular loop? | μ₀I/2R.
What is the field of a long straight wire? | μ₀I/2πr.
What is the field inside a solenoid? | μ₀nI.
State Faraday's law. | emf = −dφ/dt.
What is motional emf? | Blv.
What is the energy stored in an inductor? | ½LI².
What is the time constant of an LR circuit? | L/R.
What is the resonant frequency of an LCR circuit? | 1/[2π√(LC)].
What is the impedance of a series LCR circuit? | √[R² + (X(L) − X(C))²].
What is the rms value of an alternating current? | I₀/√2.
What is the power factor? | cos φ = R/Z.
What is the speed of electromagnetic waves? | 1/√(μ₀ε₀).

# Physics: Optics and Modern Physics
Write the mirror formula. | 1/v + 1/u = 1/f.
Write the lens-maker's formula. | 1/f = (n − 1)(1/R₁ − 1/R₂).
What is the critical angle? | sin C = 1/n.
What is the fringe width in Young's double-slit experiment? | λD/d.
What is the condition for minima in single-slit diffraction? | a sin θ = nλ.
State Brewster's law. | tan i = n.
State Malus's law. | I = I₀ cos²θ.
What is the resolving power of a telescope? | D/1.22λ.
Write Einstein's photoelectric equation. | hν = φ + K(max).
What is the de Broglie wavelength? | h/p.
What is the energy of the nth level of hydrogen? | −13.6/n² eV.
What is the radius of the nth Bohr orbit? | 0.529 n² Å.
Write the Rydberg formula. | 1/λ = R(1/n₁² − 1/n₂²).
State the radioactive decay law. | N = N₀e^(−λt).
What is the half-life? | 0.693/λ.
What is the mean life? | 1/λ.
What is the mass–energy relation? | E = mc².
What is the energy of 1 u? | 931.5 MeV.
What is the current gain β of a transistor? | I(C)/I(B).
Which gate is A·B complemented? | NAND.
What is Heisenberg's uncertainty principle? | Δx Δp ≥ h/4π.
What is the cut-off wavelength of X-rays? | hc/eV.

# Chemistry: Physical
What is the mole? | 6.022 × 10²³ particles.
What is molarity? | Moles of solute per litre of solution.
What is the limiting reagent? | The reactant that is used up first.
What are the four quantum numbers? | Principal, azimuthal, magnetic and spin.
State the Aufbau principle. | Electrons fill orbitals in order of increasing energy (n + l rule).
State Pauli's exclusion principle. | No two electrons in an atom have the same four quantum numbers.
State Hund's rule. | Electrons occupy degenerate orbitals singly before pairing.
What is the electronic configuration of chromium? | [Ar] 3d⁵ 4s¹.
What is the electronic configuration of copper? | [Ar] 3d¹⁰ 4s¹.
How many orbitals are there in a shell n? | n².
State Boyle's law. | PV = constant at constant temperature.
State Charles's law. | V/T = constant at constant pressure.
State Graham's law of diffusion. | Rate is inversely proportional to the square root of molar mass.
Write the van der Waals equation. | (P + an²/V²)(V − nb) = nRT.
What is the compressibility factor? | Z = PV/nRT.
State the first law of thermodynamics. | ΔU = q + w.
What is enthalpy? | H = U + PV.
State Hess's law. | The enthalpy change is the same whatever the path.
What is the Gibbs energy relation? | ΔG = ΔH − TΔS.
When is a process spontaneous? | When ΔG < 0.
How is ΔG° related to K? | ΔG° = −RT ln K.
State Le Chatelier's principle. | A system at equilibrium shifts to oppose any change imposed on it.
How are Kₚ and K꜀ related? | Kₚ = K꜀(RT)^Δn.
What is pH? | −log[H⁺].
What is the ionic product of water at 25 °C? | 10⁻¹⁴.
Write the Henderson equation. | pH = pKₐ + log([salt]/[acid]).
What is a buffer solution? | A solution that resists change in pH.
What is the solubility product? | The product of ion concentrations in a saturated solution.
Write the Nernst equation. | E = E° − (0.0591/n) log Q at 298 K.
State Faraday's first law. | m = ZIt.
What is the half-life of a first-order reaction? | 0.693/k.
Write the Arrhenius equation. | k = Ae^(−Eₐ/RT).
State Raoult's law. | p = x p°.
What is the depression of freezing point? | ΔT = K(f) m.
What is the van't Hoff factor? | Observed colligative property / calculated value.
What is the packing efficiency of fcc? | 74 per cent.
What is the oxidation number of oxygen in peroxides? | −1.
What is the number of atoms in a bcc unit cell? | 2.

# Chemistry: Inorganic
How does atomic radius change across a period? | It decreases.
How does ionisation enthalpy change down a group? | It decreases.
Which element has the highest electron gain enthalpy (most negative)? | Chlorine.
Which element is the most electronegative? | Fluorine.
What is the shape of methane? | Tetrahedral, 109.5°.
What is the shape of ammonia? | Trigonal pyramidal, 107°.
What is the shape of water? | Bent, 104.5°.
What is the shape of BF₃? | Trigonal planar.
What is the shape of PCl₅? | Trigonal bipyramidal.
What is the shape of SF₆? | Octahedral.
What is the shape of XeF₄? | Square planar.
What is the hybridisation of carbon in CO₂? | sp.
What is the bond order of O₂? | 2.
What is the bond order of N₂? | 3.
Why is O₂ paramagnetic? | It has two unpaired electrons in antibonding π orbitals.
What is the diagonal relationship? | Similarity of Li with Mg, Be with Al and B with Si.
What is the inert pair effect? | Reluctance of ns² electrons to take part in bonding in heavier p-block elements.
Which is the strongest acid among the hydrogen halides? | HI.
What is the formula of borax? | Na₂B₄O₇·10H₂O.
What is inorganic benzene? | Borazine, B₃N₃H₆.
What is the structure of diborane? | Two bridging hydrogen atoms with three-centre two-electron bonds.
Which process makes ammonia? | Haber's process.
Which process makes nitric acid? | Ostwald's process.
Which process makes sulphuric acid? | The contact process.
What is aqua regia? | Three parts HCl and one part HNO₃.
What is the lanthanoid contraction? | The steady fall in size across the lanthanoids due to poor shielding by 4f electrons.
What is the coordination number of [Fe(CN)₆]⁴⁻? | 6.
What is the spin-only magnetic moment? | √[n(n + 2)] BM.
Which ore is concentrated by froth flotation? | Sulphide ores.
What is the ore of aluminium? | Bauxite.
What is the Hall–Héroult process? | Electrolytic extraction of aluminium from alumina in cryolite.
What is zone refining used for? | Ultra-pure silicon and germanium.
What is the brown ring test for? | The nitrate ion.
What is Nessler's reagent used for? | Detecting ammonia.

# Chemistry: Organic
What is the hybridisation of carbon in ethane, ethene and ethyne? | sp³, sp² and sp.
What is the inductive effect? | Permanent shift of sigma electrons along a chain due to electronegativity difference.
What is resonance? | Delocalisation of pi electrons over several atoms.
What is hyperconjugation? | Delocalisation of C–H sigma electrons into an adjacent empty or pi orbital.
What is the order of carbocation stability? | Tertiary > secondary > primary > methyl.
State Markovnikov's rule. | In addition of HX, the hydrogen goes to the carbon with more hydrogens.
What is the peroxide effect? | Anti-Markovnikov addition of HBr in the presence of peroxide.
State Huckel's rule. | A planar cyclic conjugated system with (4n + 2) π electrons is aromatic.
What is the Wurtz reaction? | 2RX + 2Na gives R–R in dry ether.
What is the Friedel–Crafts reaction? | Alkylation or acylation of benzene with AlCl₃.
What is ozonolysis? | Cleavage of a C=C bond by ozone to give carbonyl compounds.
What does Baeyer's reagent test? | Unsaturation: cold dilute alkaline KMnO₄ is decolourised.
What is SN1? | Unimolecular substitution through a carbocation, giving racemisation.
What is SN2? | Bimolecular substitution in one step, giving inversion.
What is the Lucas test for? | Distinguishing primary, secondary and tertiary alcohols.
What is the Reimer–Tiemann reaction? | Phenol + CHCl₃ + NaOH gives salicylaldehyde.
What is Kolbe's reaction? | Sodium phenoxide + CO₂ gives salicylic acid.
What is the aldol condensation? | Aldehydes with α-hydrogen give β-hydroxy aldehydes in dilute base.
What is the Cannizzaro reaction? | Aldehydes without α-hydrogen disproportionate in concentrated base.
What is Tollens' test for? | Aldehydes, which give a silver mirror.
What is the iodoform test for? | The CH₃CO– or CH₃CH(OH)– group.
What is the Hoffmann bromamide reaction? | An amide gives an amine with one carbon less.
What is the carbylamine test for? | Primary amines.
What is the Sandmeyer reaction? | A diazonium salt gives aryl halide with CuX.
What is the Gattermann–Koch reaction? | Benzene + CO + HCl gives benzaldehyde.
What is Clemmensen reduction? | C=O to CH₂ with Zn–Hg and HCl.
What is the Wolff–Kishner reduction? | C=O to CH₂ with hydrazine and base.
What is the monomer of polythene? | Ethene.
What is the monomer of natural rubber? | Isoprene.
What are the monomers of nylon-6,6? | Hexamethylenediamine and adipic acid.
What is chirality? | Non-superimposability on the mirror image.
What are enantiomers? | Stereoisomers that are non-superimposable mirror images.

# Mathematics: Algebra
What is the sum of roots of ax² + bx + c = 0? | −b/a.
What is the discriminant? | b² − 4ac.
What is the nth term of an AP? | a + (n − 1)d.
What is the sum of n terms of a GP? | a(rⁿ − 1)/(r − 1).
What is the sum of an infinite GP? | a/(1 − r), for |r| < 1.
What is the relation between AM, GM and HM? | AM ≥ GM ≥ HM, and GM² = AM × HM for two numbers.
What is ⁿCᵣ? | n!/[r!(n − r)!].
What is ⁿPᵣ? | n!/(n − r)!.
What is the general term of (a + b)ⁿ? | ⁿCᵣ aⁿ⁻ʳ bʳ.
What is the sum of binomial coefficients? | 2ⁿ.
What is the modulus of a + ib? | √(a² + b²).
What is Euler's formula? | e^(iθ) = cos θ + i sin θ.
State De Moivre's theorem. | (cos θ + i sin θ)ⁿ = cos nθ + i sin nθ.
What are the cube roots of unity? | 1, ω and ω², with 1 + ω + ω² = 0.
What is |AB| for square matrices? | |A||B|.
What is the inverse of a matrix? | adj A / |A|.
What is log(ab)? | log a + log b.
What is the change of base formula? | logₐ b = log b / log a.
How many subsets does a set of n elements have? | 2ⁿ.
What is P(A ∪ B)? | P(A) + P(B) − P(A ∩ B).
State Bayes' theorem. | P(A|B) = P(B|A)P(A)/P(B).
What is the mean of a binomial distribution? | np.
What is the variance of a binomial distribution? | npq.

# Mathematics: Calculus and Coordinate Geometry
What is the limit of sin x / x as x tends to 0? | 1.
What is the limit of (1 + 1/n)ⁿ as n tends to infinity? | e.
What is the limit of (eˣ − 1)/x as x tends to 0? | 1.
State L'Hôpital's rule. | For 0/0 or ∞/∞ forms, the limit of f/g equals the limit of f′/g′.
What is the derivative of tan x? | sec²x.
What is the derivative of ln x? | 1/x.
What is the derivative of sin⁻¹x? | 1/√(1 − x²).
What is ∫sec²x dx? | tan x + C.
What is ∫dx/(a² + x²)? | (1/a) tan⁻¹(x/a) + C.
What is ∫eˣ[f(x) + f′(x)] dx? | eˣf(x) + C.
What is the condition for a maximum? | f′(x) = 0 and f″(x) < 0.
What is the integrating factor of dy/dx + Py = Q? | e^(∫P dx).
What is the slope of the line ax + by + c = 0? | −a/b.
What is the distance of a point from a line? | |ax₁ + by₁ + c| / √(a² + b²).
What is the angle between two lines of slopes m₁ and m₂? | tan θ = |(m₁ − m₂)/(1 + m₁m₂)|.
What is the equation of a circle? | (x − h)² + (y − k)² = r².
What is the standard parabola and its focus? | y² = 4ax, focus (a, 0).
What is the eccentricity of an ellipse? | √(1 − b²/a²).
What is the eccentricity of a hyperbola? | √(1 + b²/a²).
What is the eccentricity of a parabola? | 1.
What is the length of the latus rectum of y² = 4ax? | 4a.
What is the condition for y = mx + c to touch y² = 4ax? | c = a/m.
What is the dot product of two vectors? | |a||b| cos θ.
What is the cross product's magnitude? | |a||b| sin θ.
What is sin 2A? | 2 sin A cos A.
What is cos 2A? | cos²A − sin²A.
What is sin(A + B)? | sin A cos B + cos A sin B.
State the sine rule. | a/sin A = b/sin B = c/sin C = 2R.
State the cosine rule. | cos A = (b² + c² − a²)/2bc.
What is the general solution of sin x = 0? | x = nπ.
`);
