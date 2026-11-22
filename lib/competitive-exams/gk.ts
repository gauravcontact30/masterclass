import type { Objective, Stars } from "./types";

/*
 * Static GK asked again and again across government exams, hand-authored. Each row lists the exams that set this
 * kind of question; "asked" names them without claiming one specific paper and year.
 */
type Row = [exams: string[], subject: string, stars: Stars, q: string, options: string[], correct: number, why: string];
const ALL = ["ssc", "railways", "banks", "police", "upsc", "state-psc", "defence", "tet"];
const LABEL: Record<string, string> = { ssc: "SSC", railways: "RRB", banks: "Bank exams", police: "Police exams", upsc: "UPSC", "state-psc": "State PSC", defence: "CDS/AFCAT", tet: "TET" };
const ROWS: Row[] = [
  [ALL, "Polity", 5, "Who is known as the chief architect of the Indian Constitution?", ["Jawaharlal Nehru", "B. R. Ambedkar", "Rajendra Prasad", "Sardar Patel"], 1, "Dr B. R. Ambedkar chaired the Drafting Committee."],
  [ALL, "Polity", 5, "On which date did the Constitution of India come into force?", ["15 August 1947", "26 November 1949", "26 January 1950", "2 October 1950"], 2, "It was adopted on 26 November 1949 and came into force on 26 January 1950."],
  [["ssc", "upsc", "state-psc", "police"], "Polity", 4, "Which Article of the Constitution abolishes untouchability?", ["Article 14", "Article 17", "Article 21", "Article 32"], 1, "Article 17 abolishes untouchability."],
  [["ssc", "upsc", "state-psc", "banks"], "Polity", 4, "Which Article is called the 'heart and soul' of the Constitution by Dr Ambedkar?", ["Article 19", "Article 21", "Article 32", "Article 368"], 2, "Article 32, the right to constitutional remedies."],
  [["ssc", "railways", "upsc", "state-psc"], "Polity", 4, "What is the minimum age to become a member of the Lok Sabha?", ["18 years", "21 years", "25 years", "30 years"], 2, "Article 84 sets 25 years for the Lok Sabha (30 for the Rajya Sabha)."],
  [["ssc", "upsc", "state-psc", "defence"], "Polity", 4, "Who presides over a joint sitting of both Houses of Parliament?", ["The President", "The Vice-President", "The Speaker of the Lok Sabha", "The Prime Minister"], 2, "Article 108: the Speaker presides over a joint sitting."],
  [["ssc", "upsc", "state-psc", "police"], "Polity", 3, "The concept of Directive Principles of State Policy was borrowed from the constitution of", ["the USA", "Ireland", "Canada", "the UK"], 1, "The Directive Principles are drawn from the Irish Constitution."],
  [ALL, "History", 5, "Who was the first Prime Minister of India?", ["Sardar Patel", "Jawaharlal Nehru", "Lal Bahadur Shastri", "Rajendra Prasad"], 1, "Jawaharlal Nehru served from 1947 to 1964."],
  [["ssc", "railways", "upsc", "state-psc", "police"], "History", 5, "The Jallianwala Bagh massacre took place in", ["1909", "1919", "1929", "1942"], 1, "It happened in Amritsar on 13 April 1919."],
  [["ssc", "railways", "upsc", "state-psc"], "History", 4, "The Quit India Movement was launched in", ["1930", "1935", "1942", "1946"], 2, "Gandhi launched it on 8 August 1942 in Bombay."],
  [["ssc", "railways", "upsc", "state-psc"], "History", 4, "Who founded the Indian National Congress in 1885?", ["Dadabhai Naoroji", "A. O. Hume", "Bal Gangadhar Tilak", "W. C. Bonnerjee"], 1, "A. O. Hume founded it; W. C. Bonnerjee presided over the first session."],
  [["ssc", "railways", "upsc", "state-psc"], "History", 4, "The First Battle of Panipat (1526) was fought between Babur and", ["Hemu", "Ibrahim Lodi", "Rana Sanga", "Sher Shah Suri"], 1, "Babur defeated Ibrahim Lodi and founded the Mughal Empire."],
  [["ssc", "railways", "state-psc", "tet"], "History", 3, "Who wrote 'Vande Mataram'?", ["Rabindranath Tagore", "Bankim Chandra Chatterjee", "Sarojini Naidu", "Muhammad Iqbal"], 1, "It appears in Bankim Chandra Chatterjee's novel Anandamath."],
  [ALL, "General Knowledge", 5, "Who wrote India's national anthem, 'Jana Gana Mana'?", ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Sarojini Naidu", "Subramania Bharati"], 1, "Rabindranath Tagore wrote it; it was adopted on 24 January 1950."],
  [["ssc", "railways", "banks", "police", "tet"], "General Knowledge", 4, "What is the national aquatic animal of India?", ["Dolphin (Gangetic river dolphin)", "Crocodile", "Turtle", "Whale shark"], 0, "The Gangetic river dolphin was declared the national aquatic animal in 2009."],
  [ALL, "Geography", 5, "Which is the largest state of India by area?", ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Uttar Pradesh"], 2, "Rajasthan is the largest by area."],
  [["ssc", "railways", "upsc", "state-psc", "defence"], "Geography", 4, "Which is the largest freshwater lake in India?", ["Dal Lake", "Chilika Lake", "Wular Lake", "Loktak Lake"], 2, "Wular Lake in Jammu and Kashmir; Chilika is the largest brackish-water lagoon."],
  [["ssc", "railways", "upsc", "state-psc", "defence"], "Geography", 4, "Which river is known as the 'Sorrow of Bihar'?", ["Ganga", "Kosi", "Son", "Gandak"], 1, "The Kosi changes course and floods frequently."],
  [["ssc", "railways", "upsc", "state-psc"], "Geography", 4, "The Palk Strait separates India from", ["Myanmar", "Sri Lanka", "Maldives", "Bangladesh"], 1, "The Palk Strait lies between Tamil Nadu and Sri Lanka."],
  [ALL, "Geography", 4, "Which planet is known as the Red Planet?", ["Venus", "Jupiter", "Mars", "Saturn"], 2, "Iron oxide on its surface makes Mars look red."],
  [["ssc", "railways", "upsc", "defence"], "Geography", 3, "Which is the largest ocean on Earth?", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"], 3, "The Pacific is the largest and deepest ocean."],
  [ALL, "General Science", 5, "What is the chemical formula of common salt?", ["KCl", "NaCl", "NaHCO₃", "CaCl₂"], 1, "Common salt is sodium chloride, NaCl."],
  [ALL, "General Science", 5, "Which part of the cell is known as its powerhouse?", ["Nucleus", "Ribosome", "Mitochondrion", "Golgi body"], 2, "Mitochondria produce ATP through respiration."],
  [["ssc", "railways", "police", "defence", "tet"], "General Science", 4, "Deficiency of iodine in the diet causes", ["Rickets", "Scurvy", "Goitre", "Anaemia"], 2, "Iodine deficiency enlarges the thyroid gland (goitre)."],
  [["ssc", "railways", "police", "defence"], "General Science", 4, "Which blood group is called the universal donor?", ["A", "B", "AB", "O negative"], 3, "O negative red cells can be given to patients of any blood group."],
  [["ssc", "railways", "defence"], "General Science", 4, "Which gas is used in the preparation of soda water?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2, "Carbon dioxide dissolved under pressure makes soda water."],
  [["ssc", "railways", "defence", "police"], "General Science", 4, "The SI unit of electric current is the", ["Volt", "Ohm", "Ampere", "Watt"], 2, "Current is measured in amperes."],
  [["ssc", "railways", "defence"], "General Science", 3, "Which instrument measures atmospheric pressure?", ["Hygrometer", "Barometer", "Thermometer", "Anemometer"], 1, "A barometer measures atmospheric pressure."],
  [["ssc", "railways", "tet"], "General Science", 3, "Photosynthesis takes place in which cell organelle?", ["Mitochondria", "Chloroplast", "Nucleus", "Vacuole"], 1, "Chloroplasts contain chlorophyll, which captures light energy."],
  [["banks", "ssc", "upsc", "state-psc"], "Economy", 5, "Which body regulates monetary policy in India?", ["SEBI", "Ministry of Finance", "Reserve Bank of India", "NITI Aayog"], 2, "The RBI's Monetary Policy Committee sets the repo rate."],
  [["banks", "ssc"], "Banking Awareness", 5, "The rate at which the RBI lends short-term money to commercial banks is the", ["Reverse repo rate", "Repo rate", "Bank rate", "CRR"], 1, "The repo rate is the policy rate for short-term lending against securities."],
  [["banks"], "Banking Awareness", 4, "What does CRR stand for?", ["Cash Reserve Ratio", "Credit Reserve Ratio", "Capital Reserve Requirement", "Current Rate of Return"], 0, "Cash Reserve Ratio: the share of deposits banks must keep with the RBI."],
  [["banks"], "Banking Awareness", 4, "Where is the headquarters of the Reserve Bank of India?", ["New Delhi", "Kolkata", "Mumbai", "Chennai"], 2, "The RBI has been headquartered in Mumbai since 1937."],
  [["banks", "ssc"], "Banking Awareness", 4, "NEFT stands for", ["National Electronic Funds Transfer", "Net Electronic Fund Transaction", "National Exchange Funds Transfer", "New Electronic Finance Transfer"], 0, "National Electronic Funds Transfer, run by the RBI."],
  [["banks"], "Banking Awareness", 3, "The Reserve Bank of India was established in", ["1935", "1947", "1949", "1969"], 0, "It began operations on 1 April 1935 and was nationalised in 1949."],
  [["banks", "ssc", "upsc"], "Economy", 4, "GST was introduced in India on", ["1 April 2016", "1 July 2017", "1 January 2018", "1 April 2017"], 1, "The Goods and Services Tax came into effect on 1 July 2017."],
  [["ssc", "railways", "police", "defence"], "Sports", 4, "How many players are there in a hockey team on the field?", ["9", "10", "11", "12"], 2, "Each side has eleven players on the field."],
  [["ssc", "railways", "police"], "Sports", 3, "The Durand Cup is associated with which sport?", ["Cricket", "Hockey", "Football", "Badminton"], 2, "The Durand Cup is one of the oldest football tournaments."],
  [["defence", "ssc", "police"], "Defence", 4, "Which is the highest wartime gallantry award in India?", ["Ashoka Chakra", "Param Vir Chakra", "Maha Vir Chakra", "Kirti Chakra"], 1, "The Param Vir Chakra is the highest wartime award."],
  [["defence", "ssc"], "Defence", 3, "Army Day in India is observed on", ["15 January", "26 January", "8 October", "4 December"], 0, "15 January marks Field Marshal K. M. Cariappa taking over as Commander-in-Chief in 1949."],
  [["tet"], "Child Development and Pedagogy", 5, "Who proposed the theory of cognitive development in four stages?", ["Vygotsky", "Jean Piaget", "Kohlberg", "Skinner"], 1, "Piaget: sensorimotor, pre-operational, concrete operational and formal operational."],
  [["tet"], "Child Development and Pedagogy", 5, "The 'Zone of Proximal Development' was proposed by", ["Piaget", "Lev Vygotsky", "Bruner", "Erikson"], 1, "Vygotsky: what a learner can do with guidance but not yet alone."],
  [["tet"], "Child Development and Pedagogy", 4, "Kohlberg's theory is about the development of", ["Language", "Moral reasoning", "Motor skills", "Intelligence"], 1, "Kohlberg described stages of moral reasoning."],
  [["tet"], "Child Development and Pedagogy", 4, "The Right of Children to Free and Compulsory Education Act covers children aged", ["3 to 10", "6 to 14", "5 to 15", "6 to 18"], 1, "The RTE Act, 2009, covers ages 6 to 14."],
  [["tet"], "Child Development and Pedagogy", 3, "'Learning by doing' is most associated with", ["John Dewey", "Pavlov", "Freud", "Thorndike"], 0, "John Dewey championed experiential, learning-by-doing education."],
  [["upsc", "state-psc", "ssc"], "Environment", 4, "The Kyoto Protocol is related to", ["Ozone depletion", "Greenhouse gas emissions", "Biodiversity", "Wetlands"], 1, "It set binding emission targets for developed countries (adopted 1997)."],
  [["upsc", "state-psc"], "Environment", 4, "The Ramsar Convention concerns the conservation of", ["Forests", "Wetlands", "Deserts", "Coral reefs only"], 1, "The 1971 Ramsar Convention protects wetlands of international importance."],
  [["upsc", "state-psc", "ssc"], "Environment", 3, "The Montreal Protocol aims to protect the", ["Ozone layer", "Oceans", "Tropical forests", "Polar ice"], 0, "It phases out ozone-depleting substances such as CFCs."],
];

/** Exams without GK rows of their own draw on the exam whose General Awareness paper they share. */
const GK_ALIAS: Record<string, string> = { cbi: "ssc", "income-tax": "ssc", ib: "ssc", epfo: "ssc", insurance: "banks", "coast-guard": "defence", nda: "defence" };
/** GK questions for one exam, as Objective rows. */
export function gkFor(examId: string): Objective[] {
  const source = ROWS.some(([exams]) => exams.includes(examId)) ? examId : GK_ALIAS[examId] ?? examId;
  return ROWS.filter(([exams]) => exams.includes(source)).map(([exams, subject, stars, q, options, correct, why], index) => ({
    id: `${examId}-gk${index + 1}`, subject, stars, q, options, correct, why,
    asked: `${exams.map(id => LABEL[id] ?? id).slice(0, 3).join(", ")} (frequently asked GK)`,
  }));
}
