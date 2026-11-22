import { obj, pack, sub } from "./types";

/* CAT and other MBA entrance tests (XAT, SNAP, NMAT, CMAT). Subjective: Written Ability Test and personal-interview questions. */
export default pack("cat", [
  obj("Quantitative Ability", 5, "CAT 2018, CAT 2021", "A shopkeeper sells an article at a profit of 20%. If he had bought it for 10% less and sold it for ₹18 less, he would have gained 25%. What is the cost price?", ["₹200", "₹240", "₹250", "₹300"], 1, "Let the cost be C. Then 1.2C − 18 = 1.25 × 0.9C = 1.125C, so 0.075C = 18 and C = ₹240."),
  obj("Quantitative Ability", 5, "CAT 2017, CAT 2020", "The average of five consecutive odd numbers is 27. What is the largest of them?", ["29", "31", "33", "35"], 1, "The middle number is 27, so the numbers are 23, 25, 27, 29 and 31."),
  obj("Quantitative Ability", 5, "CAT 2019, CAT 2022", "Pipes A and B fill a tank in 20 and 30 minutes. Both are opened together, and A is closed after 6 minutes. How much longer does B take to fill the tank?", ["12 minutes", "15 minutes", "18 minutes", "20 minutes"], 1, "In 6 minutes they fill 6 × (1/20 + 1/30) = 1/2. B fills the other half in 15 minutes."),
  obj("Quantitative Ability", 4, "CAT 2018, XAT 2020", "How many three-digit numbers are divisible by 7?", ["126", "127", "128", "129"], 2, "From 105 to 994: (994 − 105)/7 + 1 = 128."),
  obj("Quantitative Ability", 4, "CAT 2019, CAT 2023", "If log₂ x + log₂ (x − 2) = 3, then x equals", ["2", "3", "4", "8"], 2, "x(x − 2) = 8 gives x² − 2x − 8 = 0, so x = 4 (x = −2 is rejected)."),
  obj("Logical Reasoning", 5, "CAT 2017, CAT 2021", "Five people A, B, C, D and E sit in a row. C sits in the middle, A is at one end, and B sits next to C but not next to A. D is not next to B. Who sits at the other end?", ["B", "D", "E", "Cannot be determined"], 2, "With A in seat 1 and C in seat 3, B is in seat 4. D cannot be next to B, so D is in seat 2 and E takes seat 5."),
  obj("Data Interpretation", 4, "CAT 2018, CAT 2022", "A company's sales rose from ₹80 crore to ₹100 crore and then fell to ₹90 crore. What is the overall percentage change?", ["10%", "12.5%", "15%", "20%"], 1, "(90 − 80)/80 × 100 = 12.5% increase."),
  obj("Verbal Ability", 5, "CAT 2019, CAT 2022", "Para-jumble questions in CAT are best solved by first identifying", ["the longest sentence", "mandatory pairs and the opening sentence", "the sentence with the most difficult word", "the sentence with a date"], 1, "Linking pronouns, connectors and chronology fix pairs, and an independent sentence usually opens the paragraph."),
  obj("Verbal Ability", 4, "CAT 2018, XAT 2021", "Choose the word closest in meaning to 'pragmatic'.", ["Idealistic", "Practical", "Dogmatic", "Erratic"], 1, "Pragmatic means dealing with things sensibly and practically."),
  obj("Verbal Ability", 4, "CAT 2017, CAT 2020", "An argument states: 'Sales rose after the new logo was introduced, so the logo caused the rise.' The reasoning is flawed because it", ["uses circular reasoning", "confuses correlation with causation", "attacks the person", "appeals to authority"], 1, "One event following another does not prove it was caused by it (post hoc)."),
  obj("Quantitative Ability", 4, "CAT 2020, SNAP 2022", "In how many ways can a committee of 3 be chosen from 4 men and 3 women so that it has at least one woman?", ["27", "31", "34", "35"], 1, "Total ⁷C₃ = 35, minus all-men committees ⁴C₃ = 4, gives 31."),
  obj("Quantitative Ability", 3, "CAT 2019, NMAT 2021", "The sum of an infinite geometric series with first term 6 and common ratio 1/3 is", ["8", "9", "12", "18"], 1, "S = a/(1 − r) = 6/(2/3) = 9."),
  obj("Quantitative Ability", 4, "CMAT 2021, SNAP 2022", "Two successive discounts of 20% and 10% are equal to a single discount of", ["28%", "29%", "30%", "32%"], 0, "0.8 × 0.9 = 0.72, so the single discount is 28%."),
  obj("Quantitative Ability", 4, "CAT 2018, NMAT 2021", "The HCF of two numbers is 12 and their LCM is 252. If one number is 36, the other is", ["48", "72", "84", "96"], 2, "The other number is 12 × 252 / 36 = 84."),
  obj("Verbal Ability", 4, "CAT 2019, XAT 2022", "Choose the word opposite in meaning to 'ephemeral'.", ["Fleeting", "Enduring", "Fragile", "Trivial"], 1, "Ephemeral means lasting a very short time."),
], [
  sub("Personal Interview", 5, "IIM interviews, asked every year", "Why do you want to do an MBA?", [
    "Start from where you are: the work or study that showed you a gap in your skills.",
    "Name the gap: managing people, finance, strategy or building a business.",
    "Explain how this programme fills it through its courses, peers and placements.",
    "End with a specific short-term goal and a broader long-term one.",
    "Avoid 'higher salary' and 'everyone does it' as the main reasons.",
  ]),
  sub("Personal Interview", 5, "IIM and XLRI interviews, asked every year", "Tell us about a weakness of yours and what you have done about it.", [
    "Pick a real weakness that is not fatal for a manager.",
    "Give one incident where it cost you something.",
    "Describe the specific steps you took to improve.",
    "Show evidence of progress and admit it is still work in progress.",
    "Do not disguise a strength as a weakness.",
  ]),
  sub("Written Ability Test", 4, "IIM WAT 2019 to 2023", "Write an essay outline on 'Is work from home the future of work?'", [
    "Introduction: the pandemic turned remote work from a perk into a norm.",
    "In favour: no commute, wider talent pool, lower office costs and flexibility.",
    "Against: weaker collaboration and mentoring, blurred boundaries and unequal home conditions.",
    "Evidence: many firms have settled on hybrid schedules.",
    "Conclusion: the future is hybrid, with the mix decided by the nature of the work.",
  ]),
  sub("Written Ability Test", 4, "IIM WAT 2018 to 2022", "How should a 20-minute WAT essay be planned?", [
    "Three minutes to plan: note your stand and three supporting points.",
    "Introduction of two or three lines that defines the topic and states your position.",
    "Two or three body paragraphs, each with one argument and one example.",
    "One paragraph that acknowledges the other side.",
    "A short conclusion with a way forward; keep two minutes to proofread.",
  ]),
  sub("Quantitative Ability", 4, "CAT 2019 and 2022 (TITA questions)", "Two trains start at the same time from A and B, 300 km apart, and travel towards each other at 40 km/h and 60 km/h. Where do they meet?", [
    "Relative speed when approaching: 40 + 60 = 100 km/h.",
    "Time to meet: 300/100 = 3 hours.",
    "Distance covered by the first train: 40 × 3 = 120 km.",
    "They meet 120 km from A and 180 km from B, in the ratio of their speeds, 2 : 3.",
  ]),
  sub("Personal Interview", 3, "IIM interviews 2017 to 2023", "You have a gap year or low marks in graduation. How will you explain it?", [
    "State the fact plainly without excuses.",
    "Explain what happened in one or two sentences.",
    "Show what you did with the time or how you recovered afterwards.",
    "Point to recent evidence of ability, such as your test score or work record.",
  ]),
  sub("Personal Interview", 4, "IIM interviews, asked every year", "Where do you see yourself five years from now?", [
    "Name a realistic role and function, not a job title at a dream company.",
    "Show the path: the first job after the MBA and what you want to learn in it.",
    "Connect it to your background so the plan looks continuous.",
    "Stay open: say what would make you change course.",
  ]),
  sub("Written Ability Test", 4, "IIM WAT 2019 to 2023", "Write an essay outline on 'Should social media be regulated?'", [
    "Introduction: social media is now the main public square.",
    "For regulation: misinformation, hate speech, harm to children and data misuse.",
    "Against heavy regulation: the risk to free speech and of censorship by the state.",
    "Middle path: transparency of algorithms, quick grievance redress and independent oversight.",
    "Conclusion: regulate conduct and accountability, not opinion.",
  ]),
]);
