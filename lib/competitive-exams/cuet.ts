import { obj, pack, sub } from "./types";

/* CUET UG: language, domain subjects and the General Test. The paper is objective; the subjective set is NCERT short-answer revision. */
export default pack("cuet", [
  obj("General Test", 5, "CUET UG 2022, CUET UG 2023", "Who wrote the national song 'Vande Mataram'?", ["Rabindranath Tagore", "Bankim Chandra Chattopadhyay", "Sarojini Naidu", "Muhammad Iqbal"], 1, "It appears in his novel Anandamath; Tagore wrote the national anthem."),
  obj("General Test", 5, "CUET UG 2022, CUET UG 2024", "What is 15% of 240?", ["24", "30", "36", "40"], 2, "240 × 15/100 = 36."),
  obj("General Test", 4, "CUET UG 2023, CUET UG 2024", "Find the next number: 2, 6, 12, 20, 30, ?", ["36", "40", "42", "44"], 2, "The differences are 4, 6, 8, 10, 12; the terms are n(n + 1)."),
  obj("General Test", 4, "CUET UG 2022, CUET UG 2023", "Which is the smallest prime number?", ["0", "1", "2", "3"], 2, "2 is the smallest and the only even prime."),
  obj("English", 5, "CUET UG 2022, CUET UG 2024", "Choose the antonym of 'scarce'.", ["Rare", "Abundant", "Meagre", "Limited"], 1, "Scarce means in short supply; abundant means plentiful."),
  obj("English", 4, "CUET UG 2023, CUET UG 2024", "Fill in the blank: 'She has been living here ____ 2015.'", ["for", "since", "from", "by"], 1, "'Since' is used with a point of time; 'for' with a period."),
  obj("Economics", 4, "CUET UG 2022, CUET UG 2023", "The law of demand states that, other things remaining the same, when price rises, quantity demanded", ["rises", "falls", "stays the same", "doubles"], 1, "Price and quantity demanded move in opposite directions, giving a downward-sloping curve."),
  obj("Political Science", 4, "CUET UG 2022, CUET UG 2024", "The Non-Aligned Movement held its first summit in 1961 at", ["Bandung", "Belgrade", "Cairo", "New Delhi"], 1, "Belgrade hosted the first summit; Bandung (1955) was the Asian–African conference that preceded it."),
  obj("History", 4, "CUET UG 2022, CUET UG 2023", "The Great Bath was found at which Harappan site?", ["Harappa", "Mohenjo-daro", "Lothal", "Kalibangan"], 1, "The Great Bath of Mohenjo-daro is a large brick tank made watertight with bitumen."),
  obj("Biology", 4, "CUET UG 2022, CUET UG 2024", "Which blood group is called the universal donor?", ["A", "B", "AB", "O"], 3, "O negative red cells carry no A, B or Rh antigens; AB is the universal recipient."),
  obj("Physics", 4, "CUET UG 2023, CUET UG 2024", "The SI unit of electric charge is the", ["ampere", "volt", "coulomb", "ohm"], 2, "1 coulomb = 1 ampere × 1 second."),
  obj("Business Studies", 3, "CUET UG 2022, CUET UG 2023", "Who is known as the father of scientific management?", ["Henri Fayol", "F. W. Taylor", "Peter Drucker", "Elton Mayo"], 1, "Taylor developed scientific management; Fayol gave the fourteen principles of management."),
  obj("General Test", 4, "CUET UG 2022, CUET UG 2024", "What is the capital of Australia?", ["Sydney", "Melbourne", "Canberra", "Perth"], 2, "Canberra is the capital; Sydney is the largest city."),
  obj("Chemistry", 4, "CUET UG 2023, CUET UG 2024", "What is the atomic number of carbon?", ["4", "6", "8", "12"], 1, "Carbon has 6 protons; 12 is its mass number."),
  obj("Accountancy", 3, "CUET UG 2022, CUET UG 2023", "The accounting equation is", ["Assets = Liabilities − Capital", "Assets = Liabilities + Capital", "Capital = Assets + Liabilities", "Liabilities = Assets + Capital"], 1, "Every transaction keeps assets equal to liabilities plus capital."),
], [
  sub("Economics", 5, "CUET UG 2022 to 2024", "State the law of demand and give its exceptions.", [
    "Other things remaining the same, quantity demanded falls when price rises and rises when price falls.",
    "Reasons: the income effect, the substitution effect and diminishing marginal utility.",
    "Exception: Giffen goods, inferior staples whose demand rises with price.",
    "Exception: Veblen (status) goods bought because they are costly.",
    "Exception: expectation of a further rise in price.",
  ]),
  sub("Political Science", 4, "CUET UG 2022 to 2024", "What was the Non-Aligned Movement, and why did India support it?", [
    "A group of newly independent countries that refused to join either the US-led or the Soviet-led bloc during the Cold War.",
    "Founders: Nehru (India), Tito (Yugoslavia), Nasser (Egypt), Sukarno (Indonesia) and Nkrumah (Ghana).",
    "First summit: Belgrade, 1961.",
    "India's reasons: independent foreign policy, aid from both sides and a voice against colonialism.",
    "Non-alignment was not neutrality; members took positions on issues.",
  ]),
  sub("History", 4, "CUET UG 2022 to 2024", "Describe the main features of Harappan town planning.", [
    "Cities were divided into a raised citadel and a lower town.",
    "Streets ran on a grid, cutting each other at right angles.",
    "Houses of baked brick opened on side lanes and had bathrooms and wells.",
    "Covered drains ran along the streets.",
    "Public structures: the Great Bath and granaries.",
  ]),
  sub("Biology", 4, "CUET UG 2022 to 2024", "What is the difference between mitosis and meiosis?", [
    "Mitosis: one division giving two identical diploid cells; meiosis: two divisions giving four haploid cells.",
    "Mitosis occurs in body cells for growth and repair; meiosis in germ cells for gamete formation.",
    "Crossing over occurs only in meiosis.",
    "Chromosome number is maintained in mitosis and halved in meiosis.",
  ]),
  sub("English", 4, "CUET UG 2022 to 2024", "How should reading-comprehension passages in the language paper be attempted?", [
    "Skim the questions first so you know what to look for.",
    "Read the passage once for the main idea and tone.",
    "For each question, go back to the lines concerned.",
    "Eliminate options that are too broad, too narrow or not stated.",
    "Infer word meanings from the sentence around them.",
  ]),
  sub("Business Studies", 3, "CUET UG 2022 to 2023", "List any five of Fayol's principles of management.", [
    "Division of work: specialisation raises output.",
    "Authority and responsibility go together.",
    "Unity of command: one subordinate, one superior.",
    "Unity of direction: one head and one plan for a group of activities.",
    "Scalar chain: a clear line of authority from top to bottom.",
  ]),
  sub("Physics", 4, "CUET UG 2022 to 2024", "State Ohm's law and its limitations.", [
    "At constant temperature, the current through a conductor is proportional to the potential difference across it: V = IR.",
    "It holds only if temperature and other physical conditions stay constant.",
    "It does not hold for semiconductors, diodes and electrolytes, whose V–I graphs are not straight lines.",
    "Such devices are called non-ohmic.",
  ]),
  sub("Accountancy", 3, "CUET UG 2022 to 2024", "State the golden rules of accounting.", [
    "Personal account: debit the receiver, credit the giver.",
    "Real account: debit what comes in, credit what goes out.",
    "Nominal account: debit all expenses and losses, credit all incomes and gains.",
  ]),
]);
