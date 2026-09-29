import type { AwsHighlight } from "../aws-highlights";
import { forClass } from "./maths";

/**
 * Classes 6 to 10 have no separate Physics book: the physics strand lives
 * inside NCERT Science. These lists take that strand — motion, light, sound,
 * electricity, magnetism, energy — and leave the chemistry and biology
 * chapters to their own subjects, so a reader browsing "Physics · Class 8"
 * sees physics and nothing else.
 */
export const PHYSICS_6: AwsHighlight[] = forClass("Class 6", [
  ["Motion and Measurement of Distances", [
    ["Story of transport", "Trace how modes of transport developed over time."],
    ["Need for standard units", "See why handspans and footsteps give inconsistent measurements."],
    ["SI units of length", "Use the metre and its multiples and sub-multiples."],
    ["Correct use of a measuring scale", "Avoid broken-end and parallax errors when measuring."],
    ["Measuring curved lines", "Use a thread to measure a curved path."],
    ["Types of motion", "Distinguish rectilinear, circular and periodic motion."],
  ]],
  ["Light, Shadows and Reflections", [
    ["Luminous and non-luminous objects", "Separate sources of light from objects that only reflect it."],
    ["Transparent, translucent and opaque", "Classify materials by how much light they let through."],
    ["Formation of shadows", "Relate shadow to an opaque object blocking light."],
    ["Pinhole camera", "Explain the inverted image formed through a tiny aperture."],
    ["Light travels in a straight line", "Demonstrate rectilinear propagation with aligned pipes."],
    ["Reflection from a mirror", "Observe how a plane mirror returns a beam of light."],
  ]],
  ["Electricity and Circuits", [
    ["Electric cell", "Identify the terminals and the chemical source of current."],
    ["A simple electric circuit", "Connect a bulb, cell and wires into a closed loop."],
    ["Electric switch", "Explain how a switch opens and closes a circuit."],
    ["Conductors and insulators", "Test materials for whether they allow current."],
  ]],
  ["Fun with Magnets", [
    ["Magnetic and non-magnetic materials", "Sort materials by attraction to a magnet."],
    ["Poles of a magnet", "Locate the two poles and where attraction is strongest."],
    ["Finding directions", "Use a freely suspended magnet as a compass."],
    ["Attraction and repulsion", "Apply the rule that like poles repel and unlike attract."],
  ]],
]);

export const PHYSICS_7: AwsHighlight[] = forClass("Class 7", [
  ["Heat", [
    ["Hot and cold", "Explain why touch is an unreliable judge of temperature."],
    ["Measuring temperature", "Read a clinical and a laboratory thermometer correctly."],
    ["Conduction, convection and radiation", "Distinguish the three modes of heat transfer."],
    ["Conductors and insulators of heat", "Relate material choice to everyday objects."],
    ["Dark and light coloured clothes", "Link absorption of radiation to seasonal clothing."],
  ]],
  ["Motion and Time", [
    ["Slow and fast motion", "Compare motion by the distance covered in a given time."],
    ["Speed and its units", "Compute speed as distance over time in m/s and km/h."],
    ["Measurement of time", "Use periodic motion, from pendulums to clocks."],
    ["Simple pendulum and time period", "Measure the time period and see what it depends on."],
    ["Distance-time graphs", "Read uniform and non-uniform motion from a graph's slope."],
  ]],
  ["Electric Current and Its Effects", [
    ["Symbols of electric components", "Draw a circuit diagram using standard symbols."],
    ["Heating effect of current", "Relate heat produced to the resistance of the wire."],
    ["Electric fuse", "Explain how a fuse protects a circuit from overload."],
    ["Magnetic effect of current", "Show that a current-carrying wire deflects a compass."],
    ["Electromagnet", "Build a temporary magnet from a coil and a soft iron core."],
    ["Electric bell", "Trace how an electromagnet makes the hammer strike repeatedly."],
  ]],
  ["Light", [
    ["Reflection of light", "State and verify the laws of reflection."],
    ["Images formed by a plane mirror", "Describe the virtual, erect, laterally inverted image."],
    ["Spherical mirrors", "Distinguish concave and convex mirrors and their images."],
    ["Lenses", "Compare converging and diverging lenses and the images they form."],
    ["Sunlight: white or coloured", "Split white light into a spectrum with a prism."],
  ]],
]);

export const PHYSICS_8: AwsHighlight[] = forClass("Class 8", [
  ["Force and Pressure", [
    ["Force as a push or pull", "Describe force by its magnitude and direction."],
    ["Contact and non-contact forces", "Separate muscular and friction forces from magnetic and gravitational."],
    ["Effects of force", "Change the state of motion, direction or shape of an object."],
    ["Pressure and its formula", "Apply pressure as force per unit area."],
    ["Pressure exerted by liquids and gases", "Explain pressure acting in all directions in a fluid."],
    ["Atmospheric pressure", "Relate the weight of air above to everyday demonstrations."],
  ]],
  ["Friction", [
    ["Force of friction", "Recognise friction as opposing relative motion."],
    ["Factors affecting friction", "Relate friction to surface roughness and pressing force."],
    ["Static, sliding and rolling friction", "Order the three kinds by magnitude."],
    ["Friction: friend and foe", "Weigh the usefulness of friction against the wear it causes."],
    ["Increasing and reducing friction", "Use treads, lubricants and ball bearings deliberately."],
    ["Fluid friction and streamlining", "Explain drag and the shapes that reduce it."],
  ]],
  ["Sound", [
    ["Sound produced by vibration", "Trace every sound back to a vibrating body."],
    ["Human voice and the larynx", "Explain how vocal cords produce speech."],
    ["Sound needs a medium", "Show that sound cannot travel through vacuum."],
    ["Amplitude, frequency and time period", "Define each and link them to a waveform."],
    ["Loudness and pitch", "Relate loudness to amplitude and pitch to frequency."],
    ["Audible and inaudible sound", "State the 20 Hz to 20 kHz human range."],
    ["Noise pollution", "Identify sources, harms and measures against noise."],
  ]],
  ["Chemical Effects of Electric Current", [
    ["Conduction of electricity in liquids", "Test which liquids conduct using a tester."],
    ["Electrolysis and chemical effects", "Observe gas bubbles and colour changes at electrodes."],
    ["Electroplating", "Explain depositing a metal layer using current."],
  ]],
  ["Some Natural Phenomena", [
    ["Charging by rubbing", "Produce static charge and identify its two kinds."],
    ["Transfer of charge and earthing", "Explain electroscopes and the purpose of earthing."],
    ["Lightning and safety", "Relate lightning to charge build-up and describe lightning conductors."],
    ["Earthquakes", "Link seismic waves to plate boundaries and describe protection measures."],
  ]],
  ["Light", [
    ["Laws of reflection", "Apply the equal-angle law and the single-plane condition."],
    ["Regular and diffused reflection", "Explain why rough surfaces scatter light."],
    ["Multiple reflection", "Trace images in mirrors placed at an angle, as in a kaleidoscope."],
    ["Dispersion of light", "Split white light and name the spectrum."],
    ["The human eye", "Label the parts and describe how the image forms on the retina."],
    ["Care of the eyes and Braille", "Describe eye care and how visually impaired people read."],
  ]],
  ["Stars and the Solar System", [
    ["Phases of the moon", "Explain the monthly cycle from the moon's orbit."],
    ["Stars and constellations", "Identify Ursa Major, Orion and Cassiopeia."],
    ["The solar system", "Order the planets and describe their basic properties."],
    ["Artificial satellites", "Distinguish natural from artificial satellites and list their uses."],
  ]],
]);

export const PHYSICS_9: AwsHighlight[] = forClass("Class 9", [
  ["Motion", [
    ["Distance and displacement", "Separate path length from the straight-line change in position."],
    ["Uniform and non-uniform motion", "Decide from equal distances in equal intervals."],
    ["Speed and velocity", "Distinguish scalar speed from vector velocity."],
    ["Acceleration", "Compute the rate of change of velocity, including negative values."],
    ["Distance-time and velocity-time graphs", "Read displacement from area and acceleration from slope."],
    ["Equations of motion", "Derive and apply v = u + at, s = ut + ½at² and v² = u² + 2as."],
    ["Uniform circular motion", "Explain why constant-speed circular motion is still accelerated."],
  ]],
  ["Force and Laws of Motion", [
    ["Balanced and unbalanced forces", "Predict motion from the net force."],
    ["Newton's first law and inertia", "Relate inertia to mass with everyday examples."],
    ["Momentum", "Define p = mv and use it to compare moving bodies."],
    ["Newton's second law", "Derive F = ma from the rate of change of momentum."],
    ["Newton's third law", "Identify action-reaction pairs acting on different bodies."],
    ["Conservation of momentum", "Apply it to collisions and recoil."],
  ]],
  ["Gravitation", [
    ["Universal law of gravitation", "Apply F = Gm₁m₂/r² and interpret G."],
    ["Free fall and acceleration due to gravity", "Distinguish g from G and use g = 9.8 m/s²."],
    ["Mass and weight", "Separate the invariant mass from the location-dependent weight."],
    ["Thrust and pressure", "Apply pressure as thrust per unit area."],
    ["Buoyancy and Archimedes' principle", "Explain upthrust and predict floating or sinking."],
    ["Relative density", "Compare a substance's density with that of water."],
  ]],
  ["Work and Energy", [
    ["Work done by a force", "Apply W = F s cos θ, including zero and negative work."],
    ["Kinetic energy", "Derive and apply ½mv²."],
    ["Potential energy", "Apply mgh and recognise it as configuration-dependent."],
    ["Law of conservation of energy", "Track transformation between kinetic and potential energy."],
    ["Power and commercial units of energy", "Apply P = W/t and convert to kilowatt-hours."],
  ]],
  ["Sound", [
    ["Production and propagation of sound", "Trace a compression-rarefaction wave through a medium."],
    ["Characteristics of a sound wave", "Define wavelength, frequency, amplitude and speed."],
    ["Reflection of sound and echo", "Compute the minimum distance for a distinguishable echo."],
    ["Reverberation", "Explain persistence of sound in a hall and how to reduce it."],
    ["Range of hearing", "Compare infrasound, audible sound and ultrasound."],
    ["Applications of ultrasound and SONAR", "Describe medical imaging and depth-finding."],
  ]],
]);

export const PHYSICS_10: AwsHighlight[] = forClass("Class 10", [
  ["Light: Reflection and Refraction", [
    ["Laws of reflection and plane mirrors", "Apply the reflection laws and describe the virtual image."],
    ["Spherical mirrors: terms", "Define pole, centre of curvature, principal axis and focal length."],
    ["Image formation by concave and convex mirrors", "Use ray diagrams for all object positions."],
    ["Mirror formula and magnification", "Apply 1/v + 1/u = 1/f with the sign convention."],
    ["Refraction and its laws", "Apply Snell's law and define refractive index."],
    ["Refraction through a glass slab", "Trace the lateral shift of an emergent ray."],
    ["Image formation by lenses", "Draw ray diagrams for convex and concave lenses."],
    ["Lens formula and power", "Apply 1/v − 1/u = 1/f and P = 1/f in dioptres."],
  ]],
  ["The Human Eye and the Colourful World", [
    ["Structure and working of the eye", "Label the parts and explain accommodation."],
    ["Defects of vision and correction", "Correct myopia, hypermetropia and presbyopia with lenses."],
    ["Dispersion through a prism", "Explain the spectrum and the recombination of colours."],
    ["Atmospheric refraction", "Explain twinkling of stars and the advance sunrise."],
    ["Scattering of light", "Use Tyndall scattering to explain the blue sky and red sunset."],
  ]],
  ["Electricity", [
    ["Electric current and circuit", "Define current as rate of flow of charge."],
    ["Electric potential difference", "Define the volt as joule per coulomb."],
    ["Ohm's law", "Relate V, I and R and verify the law experimentally."],
    ["Factors affecting resistance", "Relate resistance to length, area and resistivity."],
    ["Resistors in series and parallel", "Compute equivalent resistance in both arrangements."],
    ["Heating effect of electric current", "Apply H = I²Rt and describe its applications."],
    ["Electric power", "Apply P = VI and its variants, and compute energy consumption."],
  ]],
  ["Magnetic Effects of Electric Current", [
    ["Magnetic field and field lines", "Draw field lines and state their properties."],
    ["Field due to a current-carrying conductor", "Apply the right-hand thumb rule for straight wires and loops."],
    ["Solenoid and electromagnet", "Describe the uniform field inside a solenoid."],
    ["Force on a current-carrying conductor", "Apply Fleming's left-hand rule."],
    ["Electric motor", "Explain how the commutator reverses current every half turn."],
    ["Electromagnetic induction", "Apply Fleming's right-hand rule and Faraday's observation."],
    ["Electric generator", "Distinguish AC and DC generators."],
    ["Domestic electric circuits", "Describe live, neutral and earth wires and safety devices."],
  ]],
  ["Sources of Energy", [
    ["Conventional sources of energy", "Compare fossil fuels, thermal and hydro power."],
    ["Non-conventional sources", "Describe solar, wind, tidal, geothermal and biomass energy."],
    ["Nuclear energy", "Outline fission, fusion and the hazards involved."],
    ["Environmental consequences", "Weigh energy choices against their environmental cost."],
  ]],
]);

export const PHYSICS_11: AwsHighlight[] = forClass("Class 11", [
  ["Physical World and Measurement", [
    ["Scope and excitement of physics", "Place physics among the sciences and its fundamental forces."],
    ["Units and dimensions", "Express a physical quantity in base and derived units."],
    ["Dimensional analysis", "Check equations and convert units using dimensions."],
    ["Significant figures", "Apply rules for counting and rounding significant digits."],
    ["Errors in measurement", "Combine absolute, relative and percentage errors."],
  ]],
  ["Kinematics", [
    ["Motion in a straight line", "Apply the equations of motion with calculus."],
    ["Relative velocity", "Compute velocity of one body with respect to another."],
    ["Scalars and vectors", "Add vectors by triangle, parallelogram and component methods."],
    ["Projectile motion", "Derive range, maximum height and time of flight."],
    ["Uniform circular motion", "Relate angular velocity, centripetal acceleration and period."],
  ]],
  ["Laws of Motion", [
    ["Newton's laws in vector form", "Apply the three laws to multi-body problems."],
    ["Free body diagrams", "Isolate a body and mark every force acting on it."],
    ["Friction", "Apply limiting friction, coefficients and motion on an inclined plane."],
    ["Circular motion dynamics", "Analyse banking of roads and the conical pendulum."],
    ["Impulse and conservation of momentum", "Apply impulse-momentum theorem to collisions."],
  ]],
  ["Work, Energy and Power", [
    ["Work done by a variable force", "Integrate force over displacement."],
    ["Work-energy theorem", "Relate net work to change in kinetic energy."],
    ["Conservative and non-conservative forces", "Identify potential energy functions."],
    ["Collisions", "Analyse elastic and inelastic collisions in one and two dimensions."],
    ["Power", "Compute instantaneous and average power."],
  ]],
  ["Motion of System of Particles and Rigid Body", [
    ["Centre of mass", "Locate it for discrete particles and simple rigid bodies."],
    ["Torque and angular momentum", "Define both and relate them to rotational motion."],
    ["Moment of inertia", "Apply standard results, the parallel and perpendicular axis theorems."],
    ["Rotational kinematics and dynamics", "Apply the rotational analogues of the linear equations."],
    ["Rolling motion", "Combine translation and rotation for a rolling body."],
  ]],
  ["Gravitation", [
    ["Kepler's laws", "State and apply the three planetary laws."],
    ["Gravitational potential energy", "Derive the −GMm/r expression."],
    ["Escape velocity", "Derive and compute escape speed for a planet."],
    ["Satellites and orbital velocity", "Relate orbital speed, period and radius."],
    ["Variation of g", "Explain how g changes with altitude, depth and latitude."],
  ]],
  ["Properties of Bulk Matter", [
    ["Elasticity and Hooke's law", "Define stress, strain and the elastic moduli."],
    ["Pressure in fluids and Pascal's law", "Apply hydraulic principles."],
    ["Viscosity and Stokes' law", "Compute terminal velocity in a viscous fluid."],
    ["Surface tension", "Explain capillarity, excess pressure and angle of contact."],
    ["Bernoulli's principle", "Apply energy conservation to streamline flow."],
    ["Thermal expansion", "Compute linear, areal and volumetric expansion."],
    ["Calorimetry and latent heat", "Apply the principle of mixtures and change of state."],
  ]],
  ["Thermodynamics", [
    ["Zeroth law and temperature", "Define thermal equilibrium."],
    ["First law of thermodynamics", "Apply ΔQ = ΔU + ΔW to gas processes."],
    ["Thermodynamic processes", "Analyse isothermal, adiabatic, isobaric and isochoric changes."],
    ["Second law and entropy", "State the Kelvin-Planck and Clausius formulations."],
    ["Heat engines and refrigerators", "Compute efficiency and coefficient of performance."],
  ]],
  ["Kinetic Theory of Gases", [
    ["Assumptions of kinetic theory", "State the molecular model of an ideal gas."],
    ["Pressure of an ideal gas", "Derive P = ⅓ρc̄²."],
    ["Kinetic interpretation of temperature", "Relate mean kinetic energy to absolute temperature."],
    ["Degrees of freedom and equipartition", "Apply equipartition to specific heats."],
    ["Mean free path", "Relate it to molecular size and number density."],
  ]],
  ["Oscillations and Waves", [
    ["Simple harmonic motion", "Write displacement, velocity and acceleration equations."],
    ["Energy in SHM", "Track the exchange between kinetic and potential energy."],
    ["Simple pendulum and spring-mass system", "Derive the time period for each."],
    ["Damped and forced oscillations", "Describe damping and resonance."],
    ["Wave motion", "Distinguish transverse and longitudinal waves."],
    ["Superposition and standing waves", "Locate nodes and antinodes in strings and pipes."],
    ["Beats and the Doppler effect", "Compute beat frequency and apparent frequency shift."],
  ]],
]);

export const PHYSICS_12: AwsHighlight[] = forClass("Class 12", [
  ["Electrostatics", [
    ["Coulomb's law", "Apply the inverse square law for point charges."],
    ["Electric field and field lines", "Compute field due to point charges and dipoles."],
    ["Electric dipole and torque", "Find the dipole moment and torque in a uniform field."],
    ["Gauss's law", "Apply it to a line, sheet and shell of charge."],
    ["Electric potential and potential energy", "Relate potential to field and compute work done."],
    ["Capacitors and capacitance", "Find capacitance for parallel plates, in series and in parallel."],
    ["Dielectrics and energy stored", "Explain polarisation and compute energy in a capacitor."],
  ]],
  ["Current Electricity", [
    ["Drift velocity and mobility", "Relate microscopic motion to macroscopic current."],
    ["Ohm's law and resistivity", "Explain temperature dependence of resistivity."],
    ["EMF, terminal voltage and internal resistance", "Distinguish EMF from terminal potential difference."],
    ["Kirchhoff's laws", "Apply the junction and loop rules to networks."],
    ["Wheatstone bridge", "Derive the balance condition and its applications."],
    ["Potentiometer", "Compare EMFs and measure internal resistance."],
  ]],
  ["Magnetic Effects of Current and Magnetism", [
    ["Biot-Savart law", "Compute the field due to a current element."],
    ["Ampere's circuital law", "Find the field of a solenoid and toroid."],
    ["Force on a moving charge", "Apply the Lorentz force and analyse the cyclotron."],
    ["Force between parallel currents", "Derive the definition of the ampere."],
    ["Torque on a current loop and moving coil galvanometer", "Convert a galvanometer to an ammeter or voltmeter."],
    ["Magnetic dipole and earth's magnetism", "Define declination, dip and horizontal component."],
    ["Magnetic materials", "Compare dia-, para- and ferromagnetism and hysteresis."],
  ]],
  ["Electromagnetic Induction and Alternating Currents", [
    ["Faraday's laws and Lenz's law", "Compute induced EMF and determine its direction."],
    ["Motional EMF", "Derive EMF for a rod moving in a magnetic field."],
    ["Self and mutual inductance", "Compute inductance and energy stored in an inductor."],
    ["AC through resistor, inductor and capacitor", "Find reactance and phase relations."],
    ["LCR series circuit and resonance", "Compute impedance, resonant frequency and Q-factor."],
    ["Power in AC circuits", "Apply the power factor and wattless current."],
    ["Transformer and AC generator", "Explain step-up and step-down action and energy losses."],
  ]],
  ["Electromagnetic Waves", [
    ["Displacement current", "Explain Maxwell's correction to Ampere's law."],
    ["Properties of electromagnetic waves", "State transverse nature and the speed of light relation."],
    ["Electromagnetic spectrum", "Order the bands and give a use for each."],
  ]],
  ["Optics", [
    ["Reflection and refraction revisited", "Apply mirror and lens formulas with sign conventions."],
    ["Total internal reflection", "Compute critical angle and explain optical fibres."],
    ["Refraction through a prism", "Derive the relation for minimum deviation."],
    ["Optical instruments", "Compute magnification for microscope and telescope."],
    ["Huygens' principle", "Construct wavefronts to explain reflection and refraction."],
    ["Young's double slit experiment", "Derive fringe width and explain interference."],
    ["Diffraction at a single slit", "Locate minima and describe the central maximum."],
    ["Polarisation", "Apply Malus's law and Brewster's law."],
  ]],
  ["Dual Nature of Radiation and Matter", [
    ["Photoelectric effect", "State the observations and Einstein's equation."],
    ["Work function and threshold frequency", "Relate stopping potential to frequency."],
    ["de Broglie hypothesis", "Compute the matter wavelength of a particle."],
    ["Davisson-Germer experiment", "Describe the evidence for electron diffraction."],
  ]],
  ["Atoms and Nuclei", [
    ["Rutherford's scattering experiment", "Explain the nuclear model of the atom."],
    ["Bohr model of the atom", "Derive radius, energy and the hydrogen spectral series."],
    ["Composition and size of the nucleus", "Relate nuclear radius to mass number."],
    ["Mass defect and binding energy", "Compute binding energy per nucleon and read the curve."],
    ["Radioactivity", "Describe alpha, beta and gamma decay and the decay law."],
    ["Nuclear fission and fusion", "Compare the two and describe energy release."],
  ]],
  ["Electronic Devices", [
    ["Energy bands in solids", "Classify conductors, semiconductors and insulators."],
    ["Intrinsic and extrinsic semiconductors", "Explain n-type and p-type doping."],
    ["p-n junction and diode", "Describe depletion layer, forward and reverse bias."],
    ["Rectifiers", "Compare half-wave and full-wave rectification."],
    ["Special purpose diodes", "Describe Zener, LED, photodiode and solar cell."],
    ["Transistors and logic gates", "Describe transistor action and the basic gates."],
  ]],
]);

export const PHYSICS = [...PHYSICS_6, ...PHYSICS_7, ...PHYSICS_8, ...PHYSICS_9, ...PHYSICS_10, ...PHYSICS_11, ...PHYSICS_12];
