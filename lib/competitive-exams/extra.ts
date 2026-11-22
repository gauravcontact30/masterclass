import { obj, sub, type Objective, type Subjective } from "./types";

/*
 * Extra hand-authored practice questions (2026-11-22), merged into an exam's pack by loadExam
 * (lib/competitive-exams/exams.ts). They are labelled as practice sets in the exam's pattern, not as past-paper
 * questions, so no year is claimed for them.
 */
type Draft<T> = Omit<T, "id">;
type Extra = { objective: Draft<Objective>[]; subjective: Draft<Subjective>[] };
const set = (exam: string) => `Practice set · ${exam} pattern`;

const TET = set("CTET / UPTET");
const SSC = set("SSC CGL / CHSL");
const BANK = set("IBPS / SBI");
const RRB = set("RRB NTPC / Group D");
const NDA = set("NDA");
const UPSC = set("UPSC Prelims");
const POLICE = set("State Police");

export const EXTRA: Partial<Record<string, Extra>> = {
  tet: {
    objective: [
      obj("Child Development", 5, TET, "Which stage of Piaget's theory is marked by abstract and hypothetical thinking?", ["Sensorimotor", "Pre-operational", "Concrete operational", "Formal operational"], 3, "From about 11 years, children can reason abstractly and test hypotheses: the formal operational stage."),
      obj("Child Development", 5, TET, "According to Vygotsky, the gap between what a child can do alone and what the child can do with help is the", ["Scaffolding", "Zone of Proximal Development", "Assimilation", "Schema"], 1, "This is the Zone of Proximal Development; scaffolding is the support given within it."),
      obj("Child Development", 4, TET, "Kohlberg's theory explains the development of", ["Language", "Moral reasoning", "Intelligence", "Motor skills"], 1, "Kohlberg described three levels of moral reasoning: pre-conventional, conventional and post-conventional."),
      obj("Child Development", 4, TET, "The theory of multiple intelligences was proposed by", ["Howard Gardner", "Ivan Pavlov", "Abraham Maslow", "Leon Festinger"], 0, "Howard Gardner proposed multiple intelligences, such as linguistic, logical-mathematical, spatial and interpersonal."),
      obj("Pedagogy", 5, TET, "Formative assessment is mainly used to", ["Rank students at the end of the year", "Improve learning while teaching is going on", "Award certificates", "Select students for admission"], 1, "Formative assessment gives continuous feedback that helps teachers and learners improve during the course."),
      obj("Pedagogy", 5, TET, "The RTE Act, 2009 guarantees free and compulsory education to children aged", ["3 to 14 years", "6 to 14 years", "6 to 18 years", "5 to 15 years"], 1, "Article 21A and the RTE Act, 2009 cover all children from 6 to 14 years."),
      obj("Language Pedagogy", 4, TET, "A child who picks up a language by hearing it used naturally around them is engaged in", ["Language learning", "Language acquisition", "Translation", "Rote learning"], 1, "Acquisition is natural and subconscious; learning is formal and conscious."),
      obj("Mathematics Pedagogy", 4, TET, "What is the best way to introduce fractions to young children?", ["Memorising definitions", "Concrete activities such as paper folding and sharing food", "Solving many written sums", "Teaching LCM first"], 1, "Hands-on experience with concrete objects builds understanding before symbols are introduced."),
    ],
    subjective: [
      sub("Child Development", 4, TET, "Explain the difference between growth and development.", ["Growth is a quantitative physical change: height, weight and size.", "Development is qualitative and lifelong: changes in skills, thinking, emotions and behaviour.", "Growth stops at maturity; development continues throughout life.", "Growth can be measured directly; development is observed through behaviour."]),
      sub("Pedagogy", 4, TET, "What is inclusive education?", ["Teaching all children, including children with disabilities and from disadvantaged groups, together in regular classrooms.", "Curriculum, teaching methods and assessment are adapted so that every child can take part.", "It is supported by the RTE Act, 2009 and the Rights of Persons with Disabilities Act, 2016."]),
    ],
  },
  ssc: {
    objective: [
      obj("Polity", 5, SSC, "Which Article of the Constitution provides the Right to Constitutional Remedies?", ["Article 19", "Article 21", "Article 32", "Article 44"], 2, "Article 32 lets citizens approach the Supreme Court to enforce Fundamental Rights; Dr Ambedkar called it the heart and soul of the Constitution."),
      obj("Geography", 4, SSC, "Which is the longest river of peninsular India?", ["Krishna", "Godavari", "Narmada", "Kaveri"], 1, "The Godavari is the longest river of peninsular India and is often called the Dakshin Ganga."),
      obj("General Science", 5, SSC, "A deficiency of which vitamin causes scurvy?", ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], 2, "A lack of vitamin C (ascorbic acid) causes scurvy, with bleeding gums."),
      obj("History", 5, SSC, "In which year was the Battle of Plassey fought?", ["1757", "1764", "1857", "1761"], 0, "Robert Clive's forces defeated Siraj-ud-Daulah at Plassey in 1757."),
      obj("Quantitative Aptitude", 4, SSC, "An item marked at ₹800 is sold at a 15% discount. What is its selling price?", ["₹640", "₹680", "₹700", "₹720"], 1, "Selling price = 800 × 85/100 = ₹680."),
      obj("Reasoning", 4, SSC, "Find the next number: 2, 6, 12, 20, 30, ?", ["40", "42", "44", "36"], 1, "The differences are 4, 6, 8 and 10, so the next number is 30 + 12 = 42."),
    ],
    subjective: [
      sub("Polity", 4, SSC, "What are the Fundamental Duties?", ["They were added by the 42nd Amendment, 1976, on the Swaran Singh Committee's advice, in Article 51A.", "There are now 11 duties; the 11th, about educating children aged 6 to 14, came with the 86th Amendment, 2002.", "They include respecting the Constitution, the National Flag and the National Anthem, and protecting the environment.", "They are not enforceable in a court of law."]),
    ],
  },
  banks: {
    objective: [
      obj("Banking Awareness", 5, BANK, "What does CRR stand for?", ["Cash Reserve Ratio", "Credit Reserve Rate", "Current Ratio Requirement", "Capital Risk Ratio"], 0, "CRR is the share of a bank's deposits that it must keep with the RBI as cash."),
      obj("Banking Awareness", 5, BANK, "Which body regulates the securities market in India?", ["RBI", "SEBI", "IRDAI", "PFRDA"], 1, "SEBI regulates the securities market; IRDAI regulates insurance and PFRDA regulates pensions."),
      obj("Banking Awareness", 4, BANK, "How are NEFT transactions settled?", ["Only on weekdays", "In half-hourly batches, round the clock", "In real time, one by one", "Once a day"], 1, "Since December 2019, NEFT runs round the clock with half-hourly settlement batches; RTGS settles each payment in real time."),
      obj("Quantitative Aptitude", 4, BANK, "Find the simple interest on ₹5,000 at 8% per annum for 3 years.", ["₹1,000", "₹1,200", "₹1,400", "₹1,500"], 1, "Simple interest = 5000 × 8 × 3 / 100 = ₹1,200."),
      obj("Reasoning", 4, BANK, "If CAT is coded as DBU, how is DOG coded?", ["EPH", "EPG", "DPH", "FQI"], 0, "Each letter moves one place forward: D to E, O to P and G to H."),
    ],
    subjective: [
      sub("Banking Awareness", 4, BANK, "What is the repo rate, and how does it affect inflation?", ["The repo rate is the rate at which the RBI lends short-term money to banks against government securities.", "Raising it makes borrowing costlier, reduces the money supply and helps control inflation.", "Cutting it makes loans cheaper and supports growth.", "The reverse repo rate is the rate at which the RBI borrows from banks."]),
    ],
  },
  railways: {
    objective: [
      obj("General Science", 5, RRB, "What is the SI unit of force?", ["Joule", "Newton", "Pascal", "Watt"], 1, "One newton is the force that gives a mass of 1 kg an acceleration of 1 m/s²."),
      obj("Indian Railways", 5, RRB, "India's first passenger train ran in 1853 between", ["Howrah and Hooghly", "Bori Bunder (Bombay) and Thane", "Madras and Arcot", "Delhi and Agra"], 1, "The first passenger train ran from Bori Bunder to Thane on 16 April 1853."),
      obj("Mathematics", 4, RRB, "A train 240 m long passes a pole in 12 seconds. What is its speed in km/h?", ["60", "72", "80", "90"], 1, "Speed = 240/12 = 20 m/s, and 20 × 18/5 = 72 km/h."),
      obj("Reasoning", 4, RRB, "Pointing to a man, Rita says, \"He is the son of my grandfather's only son.\" How is the man related to Rita?", ["Cousin", "Brother", "Uncle", "Father"], 1, "Her grandfather's only son is her father, so the man is her brother."),
      obj("General Science", 4, RRB, "Which gas makes up most of Earth's atmosphere?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], 1, "Nitrogen makes up about 78% of the atmosphere."),
    ],
    subjective: [],
  },
  nda: {
    objective: [
      obj("Mathematics", 4, NDA, "What is the value of sin 30° + cos 60°?", ["0", "1/2", "1", "√3"], 2, "sin 30° = cos 60° = 1/2, so the sum is 1."),
      obj("General Science", 4, NDA, "Which mirror is used as a rear-view mirror in vehicles?", ["Plane", "Concave", "Convex", "Cylindrical"], 2, "A convex mirror gives an erect, diminished image and a wide field of view."),
      obj("History", 5, NDA, "Who proclaimed the Provisional Government of Azad Hind in 1943?", ["Mahatma Gandhi", "Subhas Chandra Bose", "Rash Behari Bose", "Bhagat Singh"], 1, "Netaji Subhas Chandra Bose proclaimed it in Singapore in October 1943."),
      obj("Geography", 4, NDA, "Which line marks the boundary between India and Pakistan?", ["McMahon Line", "Durand Line", "Radcliffe Line", "Line of Actual Control"], 2, "The Radcliffe Line (1947) is the India-Pakistan boundary; the McMahon Line lies between India and Tibet (China)."),
    ],
    subjective: [],
  },
  upsc: {
    objective: [
      obj("Polity", 5, UPSC, "Which Schedule of the Constitution contains the anti-defection law?", ["Eighth", "Ninth", "Tenth", "Eleventh"], 2, "The Tenth Schedule was added by the 52nd Amendment, 1985."),
      obj("Economy", 5, UPSC, "Which index is used for the RBI's retail inflation target?", ["WPI", "CPI (Combined)", "GDP deflator", "IIP"], 1, "The inflation target of 4%, with a band of 2% either side, is set on CPI (Combined)."),
      obj("Environment", 4, UPSC, "The Ramsar Convention is about the conservation of", ["Wetlands", "The ozone layer", "Only migratory birds", "Deserts"], 0, "The Ramsar Convention (1971) protects wetlands of international importance."),
      obj("History", 4, UPSC, "The Permanent Settlement of Bengal (1793) was introduced by", ["Lord Wellesley", "Lord Cornwallis", "Lord Dalhousie", "Warren Hastings"], 1, "Lord Cornwallis fixed the land revenue permanently with the zamindars in 1793."),
    ],
    subjective: [
      sub("Polity", 4, set("UPSC Mains"), "Distinguish between Fundamental Rights and Directive Principles of State Policy.", ["Fundamental Rights (Part III) are justiciable; Directive Principles (Part IV) cannot be enforced in court.", "Rights limit the State and protect individuals; Directives guide the State towards social and economic justice.", "Rights establish political democracy; Directives aim at a welfare state.", "Courts balance the two: in Minerva Mills (1980), the Supreme Court held that the harmony between them is part of the basic structure."]),
    ],
  },
  police: {
    objective: [
      obj("Criminal Law and Procedure", 5, POLICE, "Which law replaced the Indian Penal Code from 1 July 2024?", ["Bharatiya Nagarik Suraksha Sanhita", "Bharatiya Nyaya Sanhita", "Bharatiya Sakshya Adhiniyam", "Code of Criminal Procedure"], 1, "The Bharatiya Nyaya Sanhita, 2023 replaced the IPC; the BNSS replaced the CrPC and the Bharatiya Sakshya Adhiniyam replaced the Evidence Act."),
      obj("Police GK", 5, POLICE, "Which single number connects to police, fire and ambulance services across India?", ["100", "108", "112", "101"], 2, "112 is India's Emergency Response Support System number."),
    ],
    subjective: [],
  },
};

/** The extra questions for one exam, with ids of their own. */
export function extraFor(exam: string): { objective: Objective[]; subjective: Subjective[] } {
  const extra = EXTRA[exam];
  if (!extra) return { objective: [], subjective: [] };
  return {
    objective: extra.objective.map((item, index) => ({ ...item, id: `${exam}-xo${index + 1}` })),
    subjective: extra.subjective.map((item, index) => ({ ...item, id: `${exam}-xs${index + 1}` })),
  };
}
