import { createElement } from "react";
import {
  Activity, AlignLeft, Anchor, Aperture, ArrowLeftRight, ArrowUpDown, Asterisk, Atom, Baseline, Banknote,
  BarChart3, Battery, Beaker, Binary, Blocks, BookMarked, BookOpen, BookText, Box, Boxes, Braces, Brain,
  Building2, CalendarDays, Calculator, Circle, CircleDot, CircuitBoard, ClipboardList, Clock, Clock3, Coins,
  Combine, Compass, Cone, Crosshair, Cylinder, Diameter, Dices, Divide, Dna, Droplets, Ear, EqualNot, Eye,
  FileText, Filter, Flame, Flashlight, FlaskConical, FlaskRound, Footprints, Gauge, Gavel, GitBranch,
  GitMerge, Glasses, Globe, Globe2, Grid2x2, Grid3x3, Hash, Headphones, Highlighter, Keyboard, Landmark,
  Languages, Layers, Leaf, Lightbulb, LineChart, Magnet, Mail, Megaphone, MessageSquareText, MessagesSquare,
  Microscope, Milestone, Move3d, Music, Network, Newspaper, NotebookPen, Orbit, Parentheses, PenLine,
  Pentagon, Percent, PieChart, Pill, Puzzle, Pyramid, Quote, Radical, Radiation, Radio, Ratio, Recycle,
  Repeat, Rocket, Route, Ruler, Scale, Scan, ScrollText, Shapes, Shield, Sigma, Snowflake, Speech,
  SpellCheck, Spline, SquareFunction, Square, Stethoscope, StickyNote, Superscript, Target, Telescope, Text,
  TestTube, TestTubes, Thermometer, Timer, TrendingUp, Triangle, Trophy, Type, Users, Utensils, Variable,
  Volume2, Waves, Waypoints, Weight, Wheat, Wind, Workflow, Zap, Infinity as InfinityIcon, type LucideIcon,
} from "lucide-react";

/**
 * The mark on a Class Room card.
 *
 * Class Room cards are categorised by class ("Class 9") or by exam ("SSC MTS"),
 * neither of which says anything about the topic, so the per-category resolvers
 * the other catalogues use would give every card in a subject the same icon.
 * Matching runs on the topic name and its summary instead — the summary carries
 * the chapter, which is often the only place the subject word appears ("Playing
 * with Numbers · …" for "Prime factorisation").
 *
 * Each subject has its own ordered table because the same word means different
 * things in different rooms: "reflection" is a mirror in Physics and a diary
 * entry in English, and "solution" is a liquid in Chemistry and an answer in
 * Maths. Order matters within a table — the first pattern that matches wins, so
 * the specific ones are listed above the general ones they would otherwise be
 * swallowed by.
 *
 * The tables are deliberately long. A table with one mark per broad area gives
 * fifty cards the same glyph, which tells a reader nothing; these are grained to
 * the level of the chapter a card actually names, so a cone, a cylinder and a
 * sphere are three different marks rather than three "solids".
 */
type Table = [RegExp, LucideIcon][];

const MATHS: Table = [
  // Logic and calculus lead: their words ("statement", "limit", "function")
  // appear inside other topics' names and would be claimed by them.
  [/statement|quantifier|negation|converse|contrapositive|validating|mathematical reasoning/i, Braces],
  [/induction/i, Repeat],
  [/limit|continuity/i, Milestone],
  [/derivative|differentiat|differential calculus|rate of change|maxima|minima|tangent to a curve/i, Spline],
  [/integral|integrat|area under/i, InfinityIcon],
  [/differential equation/i, Workflow],
  [/permutation|combination|factorial|counting principle/i, Puzzle],
  [/binomial|pascal/i, Blocks],
  [/probabilit|dice|chance|bayes/i, Dices],
  [/deviation|variance|variation|dispersion/i, Activity],
  [/mean|median|mode|average/i, Scale],
  [/histogram|bar graph|frequency|ogive|cumulative/i, BarChart3],
  [/pie chart|pictograph|tally|data handling|data interpretation/i, PieChart],
  [/matri(x|ces)|determinant|minor|cofactor/i, Grid2x2],
  [/complex number|imaginary|argand|modulus and amplitude/i, Waypoints],
  [/vector|scalar product|cross product|direction cosine/i, Move3d],
  // A tangent to a circle is a circle topic; every other tangent is trigonometry.
  [/tangent to a circle|tangent from an external point/i, Circle],
  [/trigonometr|sine|cosine|tangent ratio|height and distance/i, Triangle],
  [/conic|parabola|ellipse|hyperbola/i, Aperture],
  [/coordinate|cartesian|straight line|slope|distance formula|section formula/i, LineChart],
  [/three.dimension|3.?d geometry|plane\b/i, Move3d],
  [/circle|arc|chord|sector|segment|circumference/i, Circle],
  // "Triangle" contains "angle", so it has to sit above the angles rule.
  [/triangle|congruen|similar|pythagoras|centroid|incentre|circumcentre/i, Triangle],
  [/quadrilateral|parallelogram|rhombus|trapezium|rectangle/i, Square],
  [/polygon|pentagon|hexagon/i, Pentagon],
  [/symmetr/i, Combine],
  [/construction|bisector|ruler and compass/i, Compass],
  [/angle|parallel line|transversal/i, Diameter],
  [/cylinder/i, Cylinder],
  [/cone\b/i, Cone],
  [/sphere|hemisphere/i, Globe],
  [/pyramid/i, Pyramid],
  [/cube|cuboid/i, Box],
  [/volume|surface area|mensuration/i, Box],
  [/perimeter|\barea\b|heron/i, Scan],
  [/geometr|shape|solid/i, Shapes],
  [/profit|loss|discount|marked price|selling price/i, Coins],
  [/interest|compounding|compounded/i, Banknote],
  [/tax|gst|commission|brokerage|bill\b|invoice/i, Landmark],
  [/percent/i, Percent],
  [/ratio|proportion|unitary/i, Ratio],
  [/time and work|pipes and cistern|work and wages/i, Users],
  [/speed|distance|train|boat|stream/i, Route],
  [/clock|calendar/i, Clock3],
  [/mixture|alligation/i, Combine],
  [/hcf|lcm|highest common|lowest common/i, GitMerge],
  [/prime|composite|factor tree|divisib/i, Asterisk],
  [/integer|number line|negative number/i, ArrowLeftRight],
  [/fraction/i, Divide],
  [/decimal/i, CircleDot],
  [/square root|cube root|surd|radical|rational|irrational|real number/i, Radical],
  [/exponent|power\b|index|scientific notation/i, Superscript],
  [/logarithm/i, TrendingUp],
  [/sequence|series|progression|arithmetic mean|geometric mean/i, GitBranch],
  [/polynomial|zeroes of|remainder theorem|factor theorem/i, Variable],
  [/quadratic/i, SquareFunction],
  [/inequalit|linear programming/i, EqualNot],
  [/identit|expansion of|algebraic expression/i, Parentheses],
  [/set\b|venn|union|intersection|inclusion.exclusion/i, Network],
  [/relation|function|domain|range|mapping/i, Workflow],
  [/algebra|equation|factoris/i, Sigma],
  [/measur|unit|metric|scale|estimat|round/i, Ruler],
  [/graph|chart/i, PieChart],
  [/number|place value|numeration|roman/i, Hash],
];

const PHYSICS: Table = [
  // Above the atom rule: the chapter is "Semiconductor Electronics", and
  // "electron" inside "Electronics" would otherwise claim every card in it.
  [/semiconductor|diode|transistor|logic gate|rectif|energy band|p.?n junction/i, Binary],
  [/photoelectric|dual nature|matter wave|de broglie/i, Flashlight],
  [/x.?ray|laser/i, Radiation],
  [/nucleus|nuclear|radioact|isotope|fission|fusion|binding energy/i, Atom],
  [/atom|electron|bohr|rutherford|spectral line|quantum/i, Atom],
  // Reflection is a mirror here and a diary entry in English.
  [/mirror|reflection/i, Eye],
  [/lens|refraction|prism|dispersion|rainbow/i, Glasses],
  [/eye|vision|myopia|hypermetropia|spectacle/i, Eye],
  [/interference|diffraction|polaris|double slit/i, Aperture],
  [/light|optic|image|colour|spectrum|luminous/i, Lightbulb],
  [/sound|echo|audible|noise|pitch|loudness|doppler/i, Volume2],
  [/oscillat|simple harmonic|pendulum|resonan|vibration/i, Waves],
  [/wave|amplitude|wavelength|frequenc/i, Waves],
  [/magnet|compass|solenoid|flux|electromagnetic induction|transformer|dynamo/i, Magnet],
  [/alternating current|ac circuit|lcr|impedance/i, Activity],
  [/capacit|resist|ohm|series and parallel|wheatstone|potentiometer|meter bridge/i, CircuitBoard],
  [/battery|\bcell\b|emf|power supply/i, Battery],
  [/current|circuit|voltage|electric|charge|potential|coulomb|gauss/i, Zap],
  [/thermodynam|entropy|carnot|isothermal|adiabatic/i, Flame],
  [/heat|temperature|thermal|calorimet|latent|specific heat/i, Thermometer],
  [/kinetic theory|ideal gas|mean free path/i, Wind],
  [/gravit|orbit|satellite|escape velocit|kepler|planet/i, Orbit],
  [/star|constellation|universe|galaxy|solar system/i, Telescope],
  [/pressure|fluid|float|buoyan|archimedes|density|viscos|surface tension|bernoulli|hydraulic/i, Droplets],
  [/elastic|stress|strain|young|deformation/i, Anchor],
  [/friction/i, Footprints],
  [/momentum|impulse|collision/i, ArrowLeftRight],
  [/newton|law of motion|inertia|free body|force/i, Weight],
  [/work|energy|power|conservation/i, Gauge],
  [/rotation|torque|moment of inertia|rigid body|angular|centre of mass/i, Compass],
  [/projectile/i, Rocket],
  [/motion|velocit|accelerat|displacement|kinemat|circular motion/i, LineChart],
  [/communication|modulation|antenna/i, Radio],
  [/telescope|microscope|astronom/i, Telescope],
  [/measur|unit|si |significant figure|dimension|error|instrument|vernier|screw gauge/i, Ruler],
  [/scalar/i, Move3d],
  [/wind|air|atmosphere|weather/i, Wind],
];

const CHEMISTRY: Table = [
  // Combustion is a flame, not a reaction vessel.
  [/combustion|fuel|flame|petroleum|calorific|fire|extinguish|coal/i, Flame],
  [/periodic|group \d|classification of element|valency|atomic number|periodic trend|transition element|lanthanoid|actinoid|[spdf].block|hydrogen/i, Grid3x3],
  // Atomic structure must survive the periodic-table rule sitting above it.
  [/orbital|quantum number|configuration|thomson|rutherford|bohr|de broglie|heisenberg|shell/i, Atom],
  [/atom|electron|proton|neutron|nucleus|isotope|isobar/i, Atom],
  [/coordination|ligand|werner|complex ion|crystal field/i, Waypoints],
  [/bond|covalent|ionic|hybrid|vsepr|lewis|shape of molecule|valence|molecular orbital/i, Puzzle],
  [/acid|base|salt|\bph\b|alkali|neutralis|indicator|buffer|hydrolysis/i, TestTube],
  [/electrochem|electrolys|cell potential|galvanic|electroplat|conductance|nernst/i, Battery],
  [/thermodynam|enthalpy|entropy|heat of reaction|calorimet|hess/i, Flame],
  [/equilibrium|le chatelier|reversible/i, Scale],
  [/rate (of reaction|law|equation)|catalys|arrhenius|order of reaction|half.life|collision theory|kinetics/i, Timer],
  [/adsorption|colloid|emulsion|surface chemistr|tyndall|sol\b|gel\b/i, Droplets],
  [/alcohol|phenol|ether/i, FlaskRound],
  [/aldehyde|ketone|carboxyl|ester/i, TestTubes],
  [/amine|diazonium/i, Dna],
  [/haloalkane|haloarene|halogen derivative/i, Combine],
  [/alkane|alkene|alkyne|hydrocarbon|benzene|aromatic|allotrope|carbon/i, Recycle],
  [/isomer|nomenclature|functional group|homologous|electrophil|nucleophil|mechanism|intermediate|carbocation|carbanion|free radical|organic/i, Workflow],
  [/polymer|plastic|rubber|nylon|fibre|wool|silk|cotton/i, Network],
  [/biomolecul|carbohydrate|protein|vitamin|enzyme|nucleic|lipid|hormone|amino acid/i, Leaf],
  [/metal|alloy|ore|metallurg|extraction|non.metal|corrosion|rust|refining/i, Anchor],
  [/water|air|soil|atmosphere|environment|pollution|green chemistry|ozone|greenhouse|conservation/i, Globe2],
  [/crystal|solid state|unit cell|packing|defect/i, Boxes],
  [/states? of matter|change of state|physical nature|particle|evaporation|condensation|sublimation|melting|boiling|kinetic theory|liquefaction|gas\b|van der waals/i, Snowflake],
  [/solution|solubilit|concentration|molarity|colligative|osmotic|raoult|henry/i, Beaker],
  [/mixture|separation|distillation|chromatograph|filtration|crystallis/i, Filter],
  [/redox|oxidation|reduction/i, ArrowUpDown],
  [/mole|stoichiometr|balancing|laws? of chemical/i, Calculator],
  [/everyday|medicine|drug|soap|detergent|food|cleansing|antibiotic/i, Pill],
  [/named reaction|aldol|cannizzaro|clemmensen/i, BookMarked],
  [/float|sink/i, Droplets],
  [/expansion on heating/i, Thermometer],
  [/physical (and chemical )?change|chemical change/i, Repeat],
  [/displacement|decomposition|combination reaction/i, ArrowLeftRight],
  [/practical|analysis|qualitative|titration/i, Microscope],
  [/equation|reaction/i, FlaskConical],
];

const ENGLISH: Table = [
  // Reported speech is a quotation here; "speech" alone is spoken English.
  [/reported|direct and indirect|narration|quotation/i, Quote],
  [/tense|past|present|future|continuous|perfect/i, Clock],
  [/letter|application|email|invitation|notice|résumé|resume|report writing/i, Mail],
  [/essay|article|paragraph|composition/i, NotebookPen],
  [/story|narrative|descriptive|diary/i, BookMarked],
  [/debate|speech writing|poster|advertisement|slogan/i, Megaphone],
  [/comprehension|passage|reading|note making|summar|inference|skimming|cloze/i, BookOpen],
  [/poem|poetry|poetic|rhyme|stanza|imagery|symbolism|figure of speech|simile|metaphor/i, Music],
  [/prose|drama|play\b|character|theme|extract|appreciation|novel|literar/i, ScrollText],
  [/idiom|phrasal|collocation|proverb/i, MessagesSquare],
  [/vocabular|synonym|antonym|one.word|word formation|prefix|suffix|root|homophone|homonym|dictionary/i, Languages],
  [/spelling|punctuation|capital/i, SpellCheck],
  [/editing|omission|error|correction|jumbled|reordering|gap filling|transformation/i, PenLine],
  [/listening|audio/i, Headphones],
  [/speaking|conversation|dialogue|interview|discussion|fluency|pronunciation|speech/i, Speech],
  [/noun|pronoun|determiner|quantifier|article/i, Text],
  [/verb|modal|gerund|participle|infinitive|voice/i, Type],
  [/adjective|adverb|degree of comparison/i, Highlighter],
  [/preposition|conjunction|connector/i, Waypoints],
  [/clause|phrase|sentence|subject|predicate|concord|agreement|conditional|syntax/i, AlignLeft],
  [/grammar/i, Type],
];

/** Exams are not subject-shaped: their cards are papers, sections and process. */
const EXAM: Table = [
  [/at a glance|pattern|eligibilit|selection|syllabus overview/i, ClipboardList],
  [/counsel|admission|seat allot|choice filling/i, StickyNote],
  [/interview|ssb|personality|viva/i, MessageSquareText],
  [/psycholog|aptitude test battery/i, Brain],
  [/physical|pet|pst|medical standard|race|height/i, Footprints],
  [/typing|stenograph|shorthand/i, Keyboard],
  [/current affair|general awareness|general knowledge|gk |events/i, Newspaper],
  [/polity|constitution|governance|civics/i, Landmark],
  [/law|legal|judiciar|jurisprudence/i, Gavel],
  [/history|freedom struggle|ancient|medieval|modern india/i, ScrollText],
  [/geograph|environment|ecology|climate/i, Globe2],
  [/econom|finance|account|commerce|budget|banking/i, BarChart3],
  [/statistic|data interpretation/i, PieChart],
  [/reasoning|analogy|series|coding|blood relation|direction|puzzle|syllogism|non-verbal|spatial|logical/i, Puzzle],
  [/english|language|comprehension|grammar|vocabular/i, Languages],
  [/mathemat|quantitative|arithmetic|aptitude|number|algebra|mensuration|percentage|ratio/i, Calculator],
  [/physics|mechanic|optic|electric/i, Atom],
  [/chemistr|organic|inorganic/i, FlaskConical],
  [/nursing|stethoscope|neet|medical entrance/i, Stethoscope],
  [/pharmac/i, Pill],
  [/biolog|botany|zoolog|anatomy|physiolog/i, Leaf],
  [/agricultur|horticultur/i, Wheat],
  [/architect|planning\b/i, Building2],
  [/hotel|hospitality|catering|culinary/i, Utensils],
  [/comput|informatics|programming/i, Binary],
  [/design|drawing|sketch|aesthetic|colour theory|visual/i, Baseline],
  [/defence|army|navy|air force|military|agniveer/i, Shield],
  [/scholarship|stipend|fee structure/i, Banknote],
  [/time.{0,14}(speed|work|distance)|speed.{0,14}distance|lcm|hcf|simplification|interest/i, Calculator],
  [/geometry|angle|triangle|mensuration/i, Triangle],
  [/combinatoric|counting|permutation/i, Puzzle],
  [/probabilit|data handling/i, Dices],
  [/mental ability|odd one out|embedded|mirror figure|figure/i, Puzzle],
  [/coordinate|vector|conic/i, LineChart],
  [/electromagnet|thermodynamic|kinetic theory|general science/i, Atom],
  [/sociolog|philosoph|political science|social/i, Users],
  [/subject combination|choosing|option/i, StickyNote],
  [/studio|model making|composition|material handling|creative ability|situation test/i, Baseline],
  [/essay|answer writing|para jumble|summary|writing practice/i, NotebookPen],
  [/syllabus structure|programme structure|paper is organised|articleship|training/i, ClipboardList],
  [/clinical|paediatric|community medicine|vignette|internal medicine/i, Stethoscope],
  [/taxation|\bgst\b/i, Landmark],
  [/research pathway|dual degree|bs.?ms/i, Microscope],
  [/time management|strategy|mock|revision|preparation/i, Target],
  [/date|calendar|application window|admit card|result/i, CalendarDays],
  [/rank|merit|cut.?off|score|marking/i, Trophy],
  [/timing|duration|shift/i, Timer],
  [/radio|broadcast/i, Radio],
  [/sun|solar/i, Lightbulb],
  [/light/i, Lightbulb],
  [/hearing|listening/i, Ear],
  [/document|certificate|verification|form/i, FileText],
  [/crosshair/i, Crosshair],
];

const TABLES: Record<string, Table> = { maths: MATHS, physics: PHYSICS, chemistry: CHEMISTRY, english: ENGLISH };

const FALLBACK: Record<string, LucideIcon> = {
  maths: Calculator, physics: Atom, chemistry: FlaskConical, english: BookText,
};

/**
 * The icon for one topic, chosen from its own subject's table.
 *
 * An unmatched topic falls back to its subject's mark rather than to a generic
 * one: a card without a specific icon should still say which room it is in.
 */
export function classroomTopicIcon(subject: string, name: string, summary = ""): LucideIcon {
  const table = TABLES[subject] ?? EXAM;
  // The topic name is more specific than its chapter or exam description.
  return table.find(([pattern]) => pattern.test(name))?.[1]
    ?? table.find(([pattern]) => pattern.test(summary))?.[1] ?? FALLBACK[subject] ?? Layers;
}

export function ClassroomTopicIcon({ subject, name, summary, size = 15, className }: {
  subject: string; name: string; summary?: string; size?: number; className?: string;
}) {
  return createElement(classroomTopicIcon(subject, name, summary), { size, className, "aria-hidden": true });
}
