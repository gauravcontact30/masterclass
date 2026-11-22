import { quick } from "@/lib/quick-qa";

/* Class 12 Chemistry: quick questions with short answers. */
export default quick("xii-chemistry", `
# Solid State
What is a crystalline solid? | A solid with a regular, repeating arrangement of particles and a sharp melting point.
What is an amorphous solid? | A solid with no long-range order, such as glass and rubber.
What is a unit cell? | The smallest repeating unit of a crystal lattice.
How many atoms are there in a simple cubic unit cell? | 1.
How many atoms are there in a body-centred cubic unit cell? | 2.
How many atoms are there in a face-centred cubic unit cell? | 4.
What is the coordination number in bcc? | 8.
What is the coordination number in fcc and hcp? | 12.
What is the packing efficiency of fcc? | 74 per cent.
What is the packing efficiency of bcc? | 68 per cent.
What is the packing efficiency of simple cubic? | 52.4 per cent.
Write the formula for the density of a unit cell. | d = ZM / (a³Nₐ).
What is a Schottky defect? | Equal numbers of cations and anions missing from the lattice; density decreases.
What is a Frenkel defect? | An ion leaves its site and occupies an interstitial position; density is unchanged.
What are F-centres? | Anion vacancies occupied by electrons, which give colour to crystals.
How many crystal systems are there? | Seven.
How many Bravais lattices are there? | Fourteen.
What is the relation between radius and edge in fcc? | 4r = √2 a.
What is the relation between radius and edge in bcc? | 4r = √3 a.

# Solutions
What is molarity? | Moles of solute per litre of solution.
What is molality? | Moles of solute per kilogram of solvent.
Which is independent of temperature, molarity or molality? | Molality.
What is mole fraction? | Moles of a component divided by total moles.
State Henry's law. | The solubility of a gas in a liquid is proportional to its partial pressure: p = K(H) x.
State Raoult's law. | The partial vapour pressure of each volatile component equals its mole fraction times its pure vapour pressure.
What is an ideal solution? | A solution that obeys Raoult's law at all concentrations, with ΔH(mix) = 0 and ΔV(mix) = 0.
What is an azeotrope? | A liquid mixture that boils at a constant temperature without change in composition.
What are colligative properties? | Properties that depend only on the number of solute particles.
Name the four colligative properties. | Relative lowering of vapour pressure, elevation of boiling point, depression of freezing point and osmotic pressure.
Write the formula for elevation of boiling point. | ΔT(b) = K(b) m.
Write the formula for depression of freezing point. | ΔT(f) = K(f) m.
Write the formula for osmotic pressure. | π = CRT.
What is osmosis? | The flow of solvent through a semipermeable membrane from a dilute to a concentrated solution.
What is reverse osmosis? | Flow of solvent from solution to pure solvent under pressure greater than the osmotic pressure.
What is the van't Hoff factor? | i = observed colligative property / calculated colligative property.
What is the van't Hoff factor of NaCl on complete dissociation? | 2.
What are isotonic solutions? | Solutions with the same osmotic pressure.
What kind of deviation does ethanol and water show? | Positive deviation from Raoult's law.
What is the unit of molality? | mol/kg.

# Electrochemistry
What is an electrochemical cell? | A device that converts chemical energy into electrical energy.
In a galvanic cell, where does oxidation take place? | At the anode.
What is the function of a salt bridge? | It completes the circuit and keeps the solutions electrically neutral.
What is the standard hydrogen electrode potential? | Zero volt.
Write the formula for the emf of a cell. | E(cell) = E(cathode) − E(anode).
Write the Nernst equation at 298 K. | E = E° − (0.0591/n) log Q.
How is ΔG° related to cell emf? | ΔG° = −nFE°.
What is the value of one faraday? | 96500 C/mol.
What is conductivity? | The conductance of a solution of unit length and unit area of cross-section.
What is molar conductivity? | Λ(m) = κ × 1000 / M.
How does molar conductivity change with dilution? | It increases.
State Kohlrausch's law. | The limiting molar conductivity of an electrolyte is the sum of the contributions of its ions.
State Faraday's first law. | The mass deposited is proportional to the charge passed: m = ZIt.
State Faraday's second law. | For the same charge, masses deposited are proportional to equivalent masses.
What is a primary cell? | A cell that cannot be recharged, such as a dry cell.
What is a secondary cell? | A rechargeable cell, such as the lead storage battery.
What is a fuel cell? | A cell that converts the energy of combustion of a fuel directly into electricity.
What is corrosion? | The slow oxidation of a metal by its surroundings; it is an electrochemical process.
What is the electrolyte in a lead storage battery? | Dilute sulphuric acid (about 38 per cent).
What is the relation between E° and the equilibrium constant? | E° = (0.0591/n) log K at 298 K.
What is the cell constant? | l/A, the ratio of distance between electrodes to their area.

# Chemical Kinetics
What is the rate of a reaction? | The change in concentration of a reactant or product per unit time.
What is the rate law? | An expression relating rate to concentrations: rate = k[A]ˣ[B]ʸ.
What is the order of a reaction? | The sum of the powers of the concentration terms in the rate law.
What is molecularity? | The number of reacting species taking part in an elementary step.
Can order be zero or fractional? | Yes; molecularity cannot.
What is the unit of k for a zero-order reaction? | mol L⁻¹ s⁻¹.
What is the unit of k for a first-order reaction? | s⁻¹.
Write the integrated rate equation for a first-order reaction. | k = (2.303/t) log([A]₀/[A]).
What is the half-life of a first-order reaction? | t½ = 0.693/k.
What is the half-life of a zero-order reaction? | t½ = [A]₀/2k.
What is a pseudo first-order reaction? | A reaction of higher order that behaves as first order because one reactant is in large excess.
Give an example of a pseudo first-order reaction. | Hydrolysis of ethyl acetate or inversion of cane sugar.
Write the Arrhenius equation. | k = A e^(−Eₐ/RT).
What is activation energy? | The minimum extra energy reactants need to form products.
How does a catalyst increase the rate? | By providing a path of lower activation energy.
How does rate change with a 10 °C rise in temperature? | It roughly doubles.
What is the collision frequency? | The number of collisions per second per unit volume.
Does a catalyst change ΔG or the equilibrium constant? | No.
What is the rate-determining step? | The slowest step of a reaction mechanism.

# Surface Chemistry
What is adsorption? | The accumulation of molecules on the surface of a solid or liquid.
What is the difference between adsorption and absorption? | Adsorption is on the surface; absorption is throughout the bulk.
What is physisorption? | Adsorption by weak van der Waals forces; it is reversible.
What is chemisorption? | Adsorption by chemical bonds; it is specific and irreversible.
What is a catalyst? | A substance that changes the rate of a reaction without being used up.
What is a colloid? | A mixture with particles of 1 nm to 1000 nm dispersed in a medium.
What is the Tyndall effect? | Scattering of light by colloidal particles.
What is Brownian movement? | The zig-zag motion of colloidal particles.
What is coagulation? | The settling of colloidal particles on adding an electrolyte.
State the Hardy–Schulze rule. | The higher the charge on the coagulating ion, the greater its coagulating power.
What is an emulsion? | A colloid of one liquid dispersed in another, such as milk.
What is peptisation? | Converting a fresh precipitate into a colloid by adding a little electrolyte.
What is electrophoresis? | The movement of colloidal particles under an electric field.
What is a micelle? | An aggregate of soap molecules formed above the critical micelle concentration.

# d- and f-Block Elements
What are transition elements? | Elements with partly filled d-orbitals in the atom or in a common ion.
What is the general configuration of d-block elements? | (n − 1)d¹⁻¹⁰ ns¹⁻².
Why do transition metals show variable oxidation states? | Because (n − 1)d and ns electrons have similar energies.
Why are transition metal compounds coloured? | Because of d–d transitions of unpaired electrons.
Why are transition metals good catalysts? | They have variable oxidation states and can form complexes.
Why are zinc, cadmium and mercury not true transition elements? | Their d-orbitals are completely filled.
What is the lanthanoid contraction? | The steady decrease in size from lanthanum to lutetium due to poor shielding by 4f electrons.
What is the formula of potassium dichromate? | K₂Cr₂O₇.
What is the formula of potassium permanganate? | KMnO₄.
What is the colour of potassium dichromate? | Orange.
What is the oxidation state of Mn in KMnO₄? | +7.
What is the oxidation state of Cr in K₂Cr₂O₇? | +6.
Which transition metal has the highest melting point? | Tungsten.
What is the common oxidation state of lanthanoids? | +3.
What is misch metal? | An alloy of lanthanoids with iron, used in lighter flints.
Which actinoid is used as nuclear fuel? | Uranium.
Why is Sc³⁺ colourless? | It has no d-electrons.
What is the spin-only magnetic moment formula? | μ = √[n(n + 2)] BM.

# Coordination Compounds
What is a coordination compound? | A compound in which a central metal is bonded to ligands by coordinate bonds.
What is a ligand? | An ion or molecule that donates an electron pair to the central metal.
What is the coordination number? | The number of ligand donor atoms bonded to the central metal.
What is a bidentate ligand? | A ligand with two donor atoms, such as ethane-1,2-diamine.
What is a chelate? | A ring complex formed by a polydentate ligand.
What is an ambidentate ligand? | A ligand that can bind through two different atoms, such as NO₂⁻ and SCN⁻.
What is the denticity of EDTA? | Six.
What is the IUPAC name of K₄[Fe(CN)₆]? | Potassium hexacyanidoferrate(II).
What is the IUPAC name of [Co(NH₃)₆]Cl₃? | Hexaamminecobalt(III) chloride.
Who proposed the coordination theory? | Alfred Werner.
What is the hybridisation in an octahedral inner-orbital complex? | d²sp³.
What is the hybridisation in a tetrahedral complex? | sp³.
What is the hybridisation in a square planar complex? | dsp².
What is crystal field splitting? | The splitting of d-orbitals into two sets in the field of ligands.
Which ligands are strong field ligands? | CO and CN⁻.
What is linkage isomerism? | Isomerism due to an ambidentate ligand binding through different atoms.
What is the central metal in haemoglobin? | Iron.
What is the central metal in chlorophyll? | Magnesium.
What is the central metal in vitamin B12? | Cobalt.
What is cis-platin used for? | The treatment of cancer.

# Haloalkanes and Haloarenes
What is the general formula of haloalkanes? | CₙH₂ₙ₊₁X.
What is an SN1 reaction? | A two-step nucleophilic substitution through a carbocation; rate depends only on the substrate.
What is an SN2 reaction? | A one-step nucleophilic substitution with inversion of configuration.
Which alkyl halides react fastest by SN1? | Tertiary.
Which alkyl halides react fastest by SN2? | Primary (methyl fastest).
What is Walden inversion? | Inversion of configuration in an SN2 reaction.
What is a racemic mixture? | An equimolar mixture of two enantiomers; it is optically inactive.
What is chirality? | The property of a molecule of not being superimposable on its mirror image.
State Saytzeff's rule. | In elimination, the more substituted alkene is the major product.
What is the Wurtz reaction? | Alkyl halides react with sodium in dry ether to give higher alkanes.
What is the Finkelstein reaction? | Alkyl chloride or bromide reacts with NaI in acetone to give alkyl iodide.
What is the Swarts reaction? | Alkyl chloride or bromide reacts with a metallic fluoride to give alkyl fluoride.
What is the Sandmeyer reaction? | A diazonium salt reacts with CuCl or CuBr to give chloro- or bromobenzene.
What is a Grignard reagent? | RMgX, prepared from an alkyl halide and magnesium in dry ether.
Why are haloarenes less reactive towards nucleophilic substitution? | The C–X bond has partial double-bond character due to resonance.
What is the full form of DDT? | Dichlorodiphenyltrichloroethane.
What is chloroform? | Trichloromethane, CHCl₃.
What is freon? | A chlorofluorocarbon used as a refrigerant.
Why is chloroform stored in dark bottles? | It is oxidised by air in light to poisonous phosgene.

# Alcohols, Phenols and Ethers
What is the functional group of alcohols? | –OH on an sp³ carbon.
What is the Lucas reagent? | Concentrated HCl with anhydrous ZnCl₂.
How does the Lucas test distinguish alcohols? | Tertiary gives turbidity at once, secondary in about five minutes, primary not at room temperature.
Why is phenol acidic? | The phenoxide ion is stabilised by resonance.
What is Kolbe's reaction? | Sodium phenoxide reacts with CO₂ to give salicylic acid.
What is the Reimer–Tiemann reaction? | Phenol with chloroform and NaOH gives salicylaldehyde.
What is Williamson synthesis? | An alkyl halide reacts with sodium alkoxide to give an ether.
What does phenol give with bromine water? | A white precipitate of 2,4,6-tribromophenol.
What is the dehydration product of ethanol at 443 K? | Ethene.
What is the dehydration product of ethanol at 413 K? | Diethyl ether.
Why do alcohols have higher boiling points than ethers? | Because of intermolecular hydrogen bonding.
What is rectified spirit? | 95 per cent ethanol.
What is wood spirit? | Methanol.
What is the IUPAC name of phenol? | Phenol (benzenol).
How is ethanol made commercially from sugar? | By fermentation with yeast.
What does a primary alcohol give on oxidation? | An aldehyde, then a carboxylic acid.
What does a secondary alcohol give on oxidation? | A ketone.

# Aldehydes, Ketones and Carboxylic Acids
What is the functional group of aldehydes? | –CHO.
What is the functional group of ketones? | >C=O with two carbon groups.
What is Tollens' reagent? | Ammoniacal silver nitrate; aldehydes give a silver mirror.
What is Fehling's solution used for? | To test for aliphatic aldehydes, which give a red precipitate of Cu₂O.
What is the aldol condensation? | Aldehydes or ketones with an α-hydrogen react in dilute alkali to give β-hydroxy carbonyl compounds.
What is the Cannizzaro reaction? | Aldehydes without an α-hydrogen give an alcohol and a salt of the acid in concentrated alkali.
What is the Clemmensen reduction? | Reduction of a carbonyl group to CH₂ with zinc amalgam and concentrated HCl.
What is the Wolff–Kishner reduction? | Reduction of a carbonyl group to CH₂ with hydrazine and KOH.
What is the Rosenmund reduction? | Acyl chloride is reduced to an aldehyde with H₂ over Pd/BaSO₄.
What is the iodoform test? | Compounds with CH₃CO– or CH₃CH(OH)– give yellow iodoform with iodine and NaOH.
What is the HVZ reaction? | Carboxylic acids with an α-hydrogen are halogenated at the α-position with X₂ and red phosphorus.
Why are carboxylic acids more acidic than phenols? | The carboxylate ion is more stabilised by resonance over two oxygen atoms.
What is formalin? | A 40 per cent aqueous solution of formaldehyde.
What is the IUPAC name of acetone? | Propanone.
What is the IUPAC name of acetic acid? | Ethanoic acid.
Which is more reactive towards nucleophiles, aldehydes or ketones? | Aldehydes.
What is decarboxylation? | Removal of CO₂ from a carboxylic acid salt with soda lime.
What is esterification? | An acid reacts with an alcohol in the presence of acid to form an ester.

# Amines
What is the functional group of primary amines? | –NH₂.
Why are amines basic? | The nitrogen has a lone pair of electrons.
Which is more basic in water, aniline or methylamine? | Methylamine.
What is the Hoffmann bromamide reaction? | An amide with Br₂ and NaOH gives a primary amine with one carbon less.
What is the Gabriel phthalimide synthesis used for? | Preparing pure primary aliphatic amines.
What is the carbylamine reaction? | Primary amines with chloroform and KOH give foul-smelling isocyanides.
What is Hinsberg's reagent? | Benzenesulphonyl chloride, used to distinguish primary, secondary and tertiary amines.
What is diazotisation? | Aniline reacts with nitrous acid at 273 to 278 K to give benzenediazonium chloride.
What is a coupling reaction? | A diazonium salt reacts with phenol or aniline to give a coloured azo dye.
What is the IUPAC name of aniline? | Benzenamine.
Why is aniline less basic than ammonia? | The lone pair is delocalised into the benzene ring.
What does aniline give with bromine water? | A white precipitate of 2,4,6-tribromoaniline.

# Biomolecules
What are carbohydrates? | Polyhydroxy aldehydes or ketones, or compounds that give them on hydrolysis.
What are monosaccharides? | Simple sugars that cannot be hydrolysed further, such as glucose and fructose.
What is the molecular formula of glucose? | C₆H₁₂O₆.
What does sucrose give on hydrolysis? | Glucose and fructose.
What is invert sugar? | The equimolar mixture of glucose and fructose from hydrolysis of sucrose.
What is a reducing sugar? | A sugar that reduces Tollens' or Fehling's reagent, such as glucose and maltose.
Is sucrose a reducing sugar? | No.
What is a glycosidic linkage? | The oxide linkage joining two monosaccharide units.
What are the two components of starch? | Amylose and amylopectin.
What are amino acids? | Compounds with both an amino group and a carboxyl group.
What is a peptide bond? | The –CO–NH– linkage between two amino acids.
What are essential amino acids? | Amino acids the body cannot make and must get from food.
What is a zwitterion? | A dipolar ion of an amino acid carrying both positive and negative charges.
What is denaturation of a protein? | Loss of its secondary and tertiary structure and biological activity on heating or change of pH.
What are enzymes? | Biological catalysts, almost all of them proteins.
Which vitamin deficiency causes scurvy? | Vitamin C.
Which vitamin deficiency causes rickets? | Vitamin D.
Which vitamin deficiency causes night blindness? | Vitamin A.
Name the bases in DNA. | Adenine, guanine, cytosine and thymine.
Which base is present in RNA but not in DNA? | Uracil.
What is a nucleotide? | A unit of a base, a pentose sugar and a phosphate group.
Which vitamins are fat soluble? | A, D, E and K.
What is the sugar in DNA? | 2-deoxyribose.
`);
