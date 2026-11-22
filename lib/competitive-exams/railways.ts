import { obj, pack, sub } from "./types";

/* Railway Recruitment Board exams: NTPC, Group D, ALP and JE. The papers are objective; the subjective set is short-answer revision. */
export default pack("railways", [
  obj("Railway GK", 5, "RRB NTPC 2016, RRB Group D 2018", "The first passenger train in India ran in 1853 between", ["Howrah and Hooghly", "Bombay and Thane", "Madras and Arakkonam", "Delhi and Agra"], 1, "It ran 34 km from Bori Bunder (Bombay) to Thane on 16 April 1853."),
  obj("Railway GK", 4, "RRB NTPC 2019, RRB Group D 2022", "Where is the headquarters of the Northern Railway zone?", ["Lucknow", "New Delhi", "Prayagraj", "Jaipur"], 1, "Northern Railway is at New Delhi; North Central Railway is at Prayagraj."),
  obj("General Science", 5, "RRB Group D 2018, RRB NTPC 2021", "Which vitamin is produced in the human skin in the presence of sunlight?", ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], 3, "Ultraviolet light converts a cholesterol derivative in the skin to vitamin D."),
  obj("General Science", 5, "RRB ALP 2018, RRB Group D 2022", "What is the SI unit of force?", ["Joule", "Pascal", "Newton", "Watt"], 2, "1 newton = 1 kg m/s²."),
  obj("General Science", 4, "RRB NTPC 2016, RRB JE 2019", "What is the chemical formula of baking soda?", ["Na₂CO₃", "NaHCO₃", "NaOH", "CaCO₃"], 1, "Baking soda is sodium hydrogen carbonate; washing soda is Na₂CO₃·10H₂O."),
  obj("Mathematics", 5, "RRB NTPC 2019, RRB Group D 2021", "A train 150 m long passes a pole in 15 seconds. What is its speed?", ["30 km/h", "36 km/h", "40 km/h", "54 km/h"], 1, "150/15 = 10 m/s = 10 × 18/5 = 36 km/h."),
  obj("Mathematics", 5, "RRB Group D 2018, RRB NTPC 2021", "The LCM of two numbers is 180 and their HCF is 6. If one number is 30, what is the other?", ["36", "42", "45", "60"], 0, "Product of numbers = LCM × HCF, so the other is 180 × 6 / 30 = 36."),
  obj("Mathematics", 4, "RRB NTPC 2016, RRB ALP 2018", "After a discount of 20%, a shirt sells for ₹640. What is its marked price?", ["₹720", "₹768", "₹800", "₹840"], 2, "80% of the marked price is 640, so the marked price is ₹800."),
  obj("Reasoning", 5, "RRB NTPC 2019, RRB Group D 2022", "Find the missing term: 3, 8, 15, 24, 35, ?", ["46", "48", "49", "50"], 1, "The differences are 5, 7, 9, 11, 13, so 35 + 13 = 48 (n² − 1 for n = 7)."),
  obj("Reasoning", 4, "RRB Group D 2018, RRB NTPC 2021", "Pointing to a man, Rita said, 'He is the son of my grandfather's only son.' How is the man related to Rita?", ["Uncle", "Brother", "Cousin", "Father"], 1, "Her grandfather's only son is her father, and his son is her brother."),
  obj("Polity", 4, "RRB NTPC 2016, RRB NTPC 2021", "How many Fundamental Duties are listed in the Constitution of India?", ["9", "10", "11", "12"], 2, "Ten were added by the 42nd Amendment (1976) and the eleventh by the 86th Amendment (2002)."),
  obj("Geography", 3, "RRB Group D 2018, RRB NTPC 2020", "Which is the longest river that flows entirely within India?", ["Ganga", "Godavari", "Narmada", "Yamuna"], 1, "The Godavari, about 1,465 km, is the longest river wholly within India; the Ganga also flows through Bangladesh."),
  obj("Railway GK", 4, "RRB NTPC 2021, RRB Group D 2022", "The first Vande Bharat Express was flagged off in 2019 between New Delhi and", ["Katra", "Varanasi", "Bhopal", "Mumbai"], 1, "The New Delhi–Varanasi service began in February 2019."),
  obj("General Science", 4, "RRB Group D 2018, RRB NTPC 2021", "Which is the hardest naturally occurring substance?", ["Iron", "Quartz", "Diamond", "Graphite"], 2, "Diamond, an allotrope of carbon, is the hardest natural substance."),
  obj("Mathematics", 4, "RRB NTPC 2016, RRB Group D 2022", "What is the simple interest on ₹5,000 at 8% per annum for 3 years?", ["₹1,000", "₹1,200", "₹1,250", "₹1,500"], 1, "SI = P × R × T / 100 = 5000 × 8 × 3 / 100 = ₹1,200."),
], [
  sub("Railway GK", 5, "RRB NTPC and Group D, asked across 2016 to 2022", "Write the key facts every candidate should know about Indian Railways.", [
    "First passenger train: 16 April 1853, Bombay to Thane.",
    "Nationalised in 1951; the Railway Budget was merged with the Union Budget in 2017.",
    "Headquarters: Rail Bhavan, New Delhi; governed by the Railway Board.",
    "Organised into zones and divisions, with Kolkata Metro counted as a zone.",
    "Gauges: broad (1,676 mm), metre (1,000 mm) and narrow.",
    "UNESCO sites: Darjeeling Himalayan, Nilgiri Mountain and Kalka–Shimla railways, and Chhatrapati Shivaji Maharaj Terminus.",
  ]),
  sub("General Science", 5, "RRB Group D 2018, RRB ALP 2018", "State Newton's three laws of motion with one example each.", [
    "First law (inertia): a body stays at rest or in uniform motion unless a force acts. Example: passengers lurch forward when a bus brakes.",
    "Second law: force equals rate of change of momentum, F = ma. Example: a cricketer draws the hands back to catch a ball.",
    "Third law: every action has an equal and opposite reaction. Example: a rocket moves up as gases rush down.",
  ]),
  sub("General Science", 4, "RRB NTPC 2016, RRB Group D 2022", "Name the deficiency disease caused by a lack of each of vitamins A, B1, C, D and K.", [
    "Vitamin A: night blindness.",
    "Vitamin B1 (thiamine): beriberi.",
    "Vitamin C: scurvy.",
    "Vitamin D: rickets in children, osteomalacia in adults.",
    "Vitamin K: delayed clotting of blood.",
  ]),
  sub("Mathematics", 4, "RRB NTPC CBT-2 2017 and 2022", "Two trains 120 m and 180 m long run at 54 km/h and 36 km/h in opposite directions. How long do they take to cross each other?", [
    "Opposite directions: add the speeds. 54 + 36 = 90 km/h.",
    "Convert: 90 × 5/18 = 25 m/s.",
    "Distance to cover is the sum of the lengths: 120 + 180 = 300 m.",
    "Time = 300 / 25 = 12 seconds.",
  ]),
  sub("Polity", 4, "RRB NTPC 2019 and 2021", "List the Fundamental Rights guaranteed by the Constitution of India.", [
    "Right to equality (Articles 14 to 18).",
    "Right to freedom (Articles 19 to 22).",
    "Right against exploitation (Articles 23 and 24).",
    "Right to freedom of religion (Articles 25 to 28).",
    "Cultural and educational rights (Articles 29 and 30).",
    "Right to constitutional remedies (Article 32). The right to property was removed in 1978.",
  ]),
  sub("Document Stage", 3, "RRB ALP and Technician aptitude stage, 2018 onwards", "What are the duties of an Assistant Loco Pilot?", [
    "Assists the loco pilot in running the train and calls out signals aloud.",
    "Checks the locomotive before departure: brakes, oil levels, lights and safety devices.",
    "Watches the track, signals and gauges during the run and records faults in the repair book.",
    "Can stop the train in an emergency and helps with minor repairs on the line.",
  ]),
  sub("General Science", 4, "RRB Group D 2018, RRB ALP 2018", "Differentiate between mass and weight.", [
    "Mass is the quantity of matter in a body; weight is the force with which the Earth attracts it.",
    "Mass is measured in kilograms; weight in newtons (W = mg).",
    "Mass is the same everywhere; weight changes with the value of g.",
    "Mass is a scalar and is never zero; weight is a vector and is zero where g is zero.",
  ]),
  sub("Mathematics", 4, "RRB NTPC CBT-2 2017 and 2022", "A can finish a work in 10 days and B in 15 days. They work together and earn ₹3,000. How should the wages be shared?", [
    "Wages are shared in the ratio of work done per day.",
    "A's one-day work is 1/10 and B's is 1/15.",
    "Ratio = 1/10 : 1/15 = 3 : 2.",
    "A gets 3000 × 3/5 = ₹1,800 and B gets ₹1,200.",
  ]),
]);
