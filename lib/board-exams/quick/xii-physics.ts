import { quick } from "@/lib/quick-qa";

/* Class 12 Physics: quick questions with short answers. */
export default quick("xii-physics", `
# Electric Charges and Fields
What is the SI unit of charge? | Coulomb (C).
State the quantisation of charge. | q = ne, where n is an integer and e = 1.6 × 10⁻¹⁹ C.
State the conservation of charge. | The total charge of an isolated system stays constant.
State Coulomb's law. | F = kq₁q₂/r², where k = 1/4πε₀ = 9 × 10⁹ N m²/C².
What is the value of ε₀? | 8.85 × 10⁻¹² C²/N m².
What is electric field intensity? | The force per unit positive test charge: E = F/q.
What is the SI unit of electric field? | N/C or V/m.
What is the electric field due to a point charge? | E = kq/r².
Can two electric field lines intersect? | No, since the field would then have two directions at one point.
What is an electric dipole? | Two equal and opposite charges separated by a small distance.
What is the dipole moment? | p = q × 2a, directed from the negative to the positive charge.
What is the SI unit of dipole moment? | Coulomb metre (C m).
What is the torque on a dipole in a uniform field? | τ = pE sin θ.
What is the field on the axial line of a short dipole? | E = 2kp/r³.
What is the field on the equatorial line of a short dipole? | E = kp/r³.
What is electric flux? | φ = E · A = EA cos θ.
What is the SI unit of electric flux? | N m²/C.
State Gauss's law. | The total flux through a closed surface is q/ε₀.
What is the field due to an infinite line charge? | E = λ/2πε₀r.
What is the field due to an infinite plane sheet of charge? | E = σ/2ε₀.
What is the field inside a charged spherical shell? | Zero.
What is the net force on a dipole in a uniform field? | Zero.
What is the dielectric constant? | The ratio of the permittivity of a medium to that of free space.

# Electrostatic Potential and Capacitance
What is electric potential? | The work done per unit charge in bringing a positive charge from infinity to a point.
What is the SI unit of potential? | Volt (V).
What is the potential due to a point charge? | V = kq/r.
How are electric field and potential related? | E = −dV/dr.
What is an equipotential surface? | A surface on which the potential is the same at every point.
How much work is done in moving a charge on an equipotential surface? | Zero.
What is the potential energy of two point charges? | U = kq₁q₂/r.
What is the potential energy of a dipole in a field? | U = −pE cos θ.
What is capacitance? | The ratio of charge to potential: C = Q/V.
What is the SI unit of capacitance? | Farad (F).
What is the capacitance of a parallel-plate capacitor? | C = ε₀A/d.
What happens to capacitance when a dielectric is inserted? | It becomes K times.
What is the equivalent capacitance in series? | 1/C = 1/C₁ + 1/C₂ + …
What is the equivalent capacitance in parallel? | C = C₁ + C₂ + …
What is the energy stored in a capacitor? | U = ½CV² = Q²/2C = ½QV.
What is the energy density of an electric field? | ½ε₀E².
What is the electric field inside a conductor? | Zero.
What is electrostatic shielding? | Protecting a region from external fields by enclosing it in a conductor.
What is the potential inside a charged spherical shell? | Constant and equal to that on the surface.
What is the capacitance of an isolated sphere? | C = 4πε₀R.

# Current Electricity
What is electric current? | The rate of flow of charge: I = dq/dt.
What is drift velocity? | The average velocity of free electrons in a conductor under an electric field.
How is current related to drift velocity? | I = neAv(d).
State Ohm's law. | V = IR, at constant temperature.
What is resistivity? | The resistance of a conductor of unit length and unit area: ρ = RA/l.
What is conductivity? | The reciprocal of resistivity.
What is mobility? | Drift velocity per unit electric field.
How does the resistance of a metal change with temperature? | It increases.
How does the resistance of a semiconductor change with temperature? | It decreases.
What is the emf of a cell? | The potential difference across its terminals when no current is drawn.
What is internal resistance? | The resistance offered by the electrolyte of a cell.
Write the terminal voltage of a cell delivering current. | V = E − Ir.
State Kirchhoff's junction law. | The sum of currents entering a junction equals the sum leaving it.
State Kirchhoff's loop law. | The algebraic sum of potential changes round a closed loop is zero.
State the Wheatstone bridge condition. | P/Q = R/S.
What is a metre bridge used for? | To measure an unknown resistance.
What is a potentiometer used for? | To compare emfs and to measure the internal resistance of a cell.
Why is a potentiometer better than a voltmeter? | It draws no current at the null point, so it measures the true emf.
What is electrical power? | P = VI = I²R = V²/R.
What is the SI unit of resistivity? | Ohm metre.
What is the current density? | Current per unit area: J = I/A.
What is the relation between J and E? | J = σE.

# Moving Charges and Magnetism
What is the force on a charge moving in a magnetic field? | F = qvB sin θ.
What is the Lorentz force? | F = q(E + v × B).
What is the SI unit of magnetic field? | Tesla (T).
State the Biot–Savart law. | dB = (μ₀/4π) I dl sin θ / r².
What is the value of μ₀? | 4π × 10⁻⁷ T m/A.
What is the field at the centre of a circular coil? | B = μ₀NI/2R.
State Ampere's circuital law. | The line integral of B round a closed path equals μ₀ times the current enclosed.
What is the field due to a long straight wire? | B = μ₀I/2πr.
What is the field inside a long solenoid? | B = μ₀nI.
What is the path of a charge moving perpendicular to a uniform magnetic field? | A circle.
What is the radius of that circular path? | r = mv/qB.
What is the cyclotron frequency? | f = qB/2πm.
What is the force on a current-carrying conductor in a field? | F = BIl sin θ.
What is the force per unit length between two parallel currents? | F/l = μ₀I₁I₂/2πd.
When do two parallel currents attract? | When they flow in the same direction.
What is the torque on a current loop in a field? | τ = NIAB sin θ.
What is the principle of a moving-coil galvanometer? | A current-carrying coil in a magnetic field experiences a torque.
How is a galvanometer converted into an ammeter? | By connecting a low resistance (shunt) in parallel.
How is a galvanometer converted into a voltmeter? | By connecting a high resistance in series.
What is the magnetic moment of a current loop? | M = NIA.
Does a magnetic field do work on a moving charge? | No, the force is always perpendicular to the velocity.

# Magnetism and Matter
What is a magnetic dipole? | A system of two equal and opposite magnetic poles separated by a distance.
Do magnetic monopoles exist? | No; magnetic field lines are closed loops.
State Gauss's law for magnetism. | The net magnetic flux through any closed surface is zero.
What are diamagnetic substances? | Substances weakly repelled by a magnet, such as bismuth and copper.
What are paramagnetic substances? | Substances weakly attracted by a magnet, such as aluminium.
What are ferromagnetic substances? | Substances strongly attracted by a magnet, such as iron, cobalt and nickel.
What is the Curie temperature? | The temperature above which a ferromagnet becomes paramagnetic.
What is magnetic susceptibility? | The ratio of intensity of magnetisation to magnetising field.
What is the susceptibility of a diamagnetic material? | Small and negative.
Name the three elements of the Earth's magnetic field. | Declination, dip and horizontal component.
What is the angle of dip at the magnetic equator? | Zero.
What is the angle of dip at the magnetic poles? | 90°.
What is hysteresis? | The lagging of magnetisation behind the magnetising field.
Which material is used for electromagnets? | Soft iron.

# Electromagnetic Induction
What is magnetic flux? | φ = BA cos θ.
What is the SI unit of magnetic flux? | Weber (Wb).
State Faraday's law of induction. | The induced emf equals the rate of change of magnetic flux: e = −dφ/dt.
State Lenz's law. | The induced current opposes the change in flux that produces it.
Lenz's law follows from which conservation law? | Conservation of energy.
What is motional emf? | e = Blv, for a conductor of length l moving at speed v across a field B.
What are eddy currents? | Currents induced in the body of a conductor when the flux through it changes.
Give one use of eddy currents. | Magnetic braking, induction furnaces and speedometers.
What is self-inductance? | The property of a coil that opposes a change of current in itself.
What is the SI unit of inductance? | Henry (H).
What is the self-inductance of a solenoid? | L = μ₀n²Al.
What is the energy stored in an inductor? | ½LI².
What is mutual inductance? | The property by which a changing current in one coil induces an emf in a neighbouring coil.
What is the emf induced in a rotating coil? | e = NBAω sin ωt.

# Alternating Current
What is alternating current? | A current whose magnitude changes continuously and direction reverses periodically.
What is the rms value of AC? | I(rms) = I₀/√2.
What is the average value of AC over a full cycle? | Zero.
What is the phase relation in a pure resistor? | Current and voltage are in phase.
What is the phase relation in a pure inductor? | Current lags the voltage by π/2.
What is the phase relation in a pure capacitor? | Current leads the voltage by π/2.
What is inductive reactance? | X(L) = ωL.
What is capacitive reactance? | X(C) = 1/ωC.
What is the impedance of a series LCR circuit? | Z = √[R² + (X(L) − X(C))²].
What is the resonant frequency of an LCR circuit? | f = 1/[2π√(LC)].
What is the impedance at resonance? | Z = R, its minimum value.
What is the power factor? | cos φ = R/Z.
What is the average power in an AC circuit? | P = V(rms) I(rms) cos φ.
What is wattless current? | Current in a pure inductor or capacitor, which consumes no power.
What is the quality factor? | Q = ω₀L/R.
What is the principle of a transformer? | Mutual induction.
Write the transformer ratio. | V(s)/V(p) = N(s)/N(p).
What does a step-up transformer do? | It increases voltage and decreases current.
Why is the core of a transformer laminated? | To reduce eddy-current losses.
Why is AC transmitted at high voltage? | To reduce the I²R power loss in the lines.
Does a transformer work on DC? | No.

# Electromagnetic Waves
What is displacement current? | I(d) = ε₀ dφ(E)/dt, due to a changing electric field.
Who predicted electromagnetic waves? | James Clerk Maxwell.
Who first produced electromagnetic waves? | Heinrich Hertz.
What is the speed of electromagnetic waves in vacuum? | c = 1/√(μ₀ε₀) = 3 × 10⁸ m/s.
Are electromagnetic waves transverse or longitudinal? | Transverse.
What is the relation between E and B in an electromagnetic wave? | E/B = c.
Which electromagnetic waves have the longest wavelength? | Radio waves.
Which electromagnetic waves have the highest frequency? | Gamma rays.
Which waves are used in radar? | Microwaves.
Which waves are used in remote controls? | Infrared.
Which waves are absorbed by the ozone layer? | Ultraviolet.
Which waves are used to study crystal structure? | X-rays.
Do electromagnetic waves need a medium? | No.
What is the wavelength range of visible light? | About 400 nm to 700 nm.

# Ray Optics
Write the mirror formula. | 1/v + 1/u = 1/f.
What is the relation between f and R for a spherical mirror? | f = R/2.
State Snell's law. | n₁ sin i = n₂ sin r.
What is total internal reflection? | Complete reflection of light going from a denser to a rarer medium at an angle greater than the critical angle.
What is the critical angle? | sin C = 1/n.
Give two applications of total internal reflection. | Optical fibres and the brilliance of diamond.
Write the lens-maker's formula. | 1/f = (n − 1)(1/R₁ − 1/R₂).
Write the thin-lens formula. | 1/v − 1/u = 1/f.
What is the power of a lens? | P = 1/f (in metres), in dioptres.
What is the focal length of two thin lenses in contact? | 1/f = 1/f₁ + 1/f₂.
Write the prism formula. | n = sin[(A + δ(m))/2] / sin(A/2).
What is dispersion? | The splitting of white light into its component colours.
What is the magnifying power of a simple microscope? | M = 1 + D/f.
What is the magnifying power of a compound microscope? | M = (L/f(o)) × (D/f(e)) when the final image is at infinity.
What is the magnifying power of an astronomical telescope in normal adjustment? | M = f(o)/f(e).
What is the length of a telescope in normal adjustment? | f(o) + f(e).
What is the advantage of a reflecting telescope? | No chromatic aberration, and a large mirror is easier to make and support.
Why does the sky appear blue? | Rayleigh scattering is proportional to 1/λ⁴, so blue is scattered most.
What is the least distance of distinct vision? | 25 cm.

# Wave Optics
What is a wavefront? | The locus of points vibrating in the same phase.
State Huygens' principle. | Every point on a wavefront is a source of secondary wavelets; their envelope is the new wavefront.
What is interference? | The redistribution of light energy when two coherent waves superpose.
What are coherent sources? | Sources with a constant phase difference and the same frequency.
What is the condition for constructive interference? | Path difference = nλ.
What is the condition for destructive interference? | Path difference = (2n + 1)λ/2.
What is the fringe width in Young's experiment? | β = λD/d.
What is diffraction? | The bending of light round the edges of an obstacle or aperture.
What is the width of the central maximum in single-slit diffraction? | 2λD/a.
What is polarisation? | Restricting the vibrations of light to one plane.
Which phenomenon proves that light is a transverse wave? | Polarisation.
State Brewster's law. | tan i(p) = n.
State Malus's law. | I = I₀ cos²θ.
What happens to fringe width if the apparatus is dipped in water? | It decreases.

# Dual Nature of Radiation and Matter
What is the photoelectric effect? | Emission of electrons from a metal surface when light of suitable frequency falls on it.
What is the work function? | The minimum energy needed to remove an electron from a metal surface.
What is the threshold frequency? | The minimum frequency of light that can cause photoemission.
Write Einstein's photoelectric equation. | hν = φ₀ + K(max).
What is the stopping potential? | The negative potential at which the photocurrent becomes zero: eV₀ = K(max).
On what does the photocurrent depend? | On the intensity of light.
On what does the maximum kinetic energy of photoelectrons depend? | On the frequency of light.
What is the energy of a photon? | E = hν = hc/λ.
What is the value of Planck's constant? | 6.63 × 10⁻³⁴ J s.
What is the momentum of a photon? | p = h/λ.
Write the de Broglie relation. | λ = h/mv.
What is the de Broglie wavelength of an electron accelerated through V volts? | λ = 1.227/√V nm.
Which experiment confirmed the wave nature of electrons? | The Davisson–Germer experiment.
What is the rest mass of a photon? | Zero.

# Atoms and Nuclei
Who discovered the nucleus? | Ernest Rutherford, by the alpha-scattering experiment.
State Bohr's quantisation condition. | mvr = nh/2π.
What is the energy of the nth orbit of hydrogen? | Eₙ = −13.6/n² eV.
What is the radius of the nth Bohr orbit? | rₙ = 0.53 n² Å.
What is the ionisation energy of hydrogen? | 13.6 eV.
Which series of hydrogen lies in the visible region? | The Balmer series.
Which series of hydrogen lies in the ultraviolet region? | The Lyman series.
What is the size of a nucleus? | R = R₀A^(1/3), with R₀ = 1.2 fm.
What are isotopes? | Nuclei with the same atomic number but different mass numbers.
What are isobars? | Nuclei with the same mass number but different atomic numbers.
What is the mass defect? | The difference between the mass of the nucleons and the mass of the nucleus.
What is binding energy? | The energy needed to separate a nucleus into its nucleons: Δm c².
What is the energy equivalent of 1 u? | 931.5 MeV.
Which nucleus has the highest binding energy per nucleon? | Iron-56.
What is nuclear fission? | The splitting of a heavy nucleus into two lighter nuclei with release of energy.
What is nuclear fusion? | The combining of light nuclei into a heavier nucleus with release of energy.
State the law of radioactive decay. | N = N₀e^(−λt).
What is half-life? | T = 0.693/λ.
What is a moderator in a reactor? | A material, such as heavy water or graphite, that slows down neutrons.
What are control rods made of? | Cadmium or boron.

# Semiconductors
What is an intrinsic semiconductor? | A pure semiconductor, such as silicon or germanium.
What is doping? | Adding a controlled impurity to a semiconductor to raise its conductivity.
What is an n-type semiconductor? | One doped with a pentavalent impurity; electrons are the majority carriers.
What is a p-type semiconductor? | One doped with a trivalent impurity; holes are the majority carriers.
What is the energy gap of silicon? | About 1.1 eV.
What is the depletion region? | The layer at a p-n junction that has no free charge carriers.
What happens in forward bias? | The barrier falls and current flows.
What happens in reverse bias? | The barrier rises and only a tiny current flows.
What is a rectifier? | A circuit that converts AC into DC.
How many diodes does a full-wave bridge rectifier use? | Four.
What is a Zener diode used for? | Voltage regulation.
What is an LED? | A forward-biased diode that emits light.
What is a photodiode? | A reverse-biased diode whose current depends on the light falling on it.
What is a solar cell? | A p-n junction that converts light energy into electrical energy.
Which gate gives output 1 only when all inputs are 1? | AND gate.
Which gates are called universal gates? | NAND and NOR.
What is the output of a NOT gate for input 1? | 0.
What is the knee voltage of a silicon diode? | About 0.7 V.
`);
