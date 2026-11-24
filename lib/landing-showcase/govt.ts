import type { Choice, ShowcaseSlide, Written } from "./types";
import { competitiveSubjectImage } from "../exam-images";

/** A painted competitive-exam subject picture (learning-images bucket), or the local picture when none is configured. */
const subject = (name: string, fallback: string) => competitiveSubjectImage(name) ?? fallback;

/*
 * Government Job Exams showcase: six of India's most sought-after recruitment exams. Each has a carousel slide, its
 * paper pattern, a short sample paper (questions with answers), a mock test the visitor can mark, and star-rated
 * interview questions with model answers where the exam has an interview stage. Patterns change between
 * notifications, so the panel asks the visitor to confirm against the latest official notification.
 */
export type GovtExam = ShowcaseSlide & {
  name: string; body: string; href: string;
  pattern: { label: string; value: string }[];
  sample: Choice[];
  mock: Choice[];
  /** Absent when selection has no interview round; `noInterview` then says how selection works. */
  interview?: Written[];
  noInterview?: string;
};

export const GOVT_EXAMS: GovtExam[] = [
  {
    id: "upsc", name: "UPSC Civil Services", body: "Union Public Service Commission", logo: "/images/exams/upsc.png",
    image: subject("Polity", "/images/landing/hero-government-exams.webp"), fallback: "/images/landing/hero-government-exams.webp", focus: "50% 45%", alt: "Parliament House, Rashtrapati Bhavan and the Supreme Court around an open Constitution, with a citizen voting",
    kicker: "UPSC CSE · IAS, IPS, IFS", title: "India's toughest and most respected exam", text: "Prelims, nine Mains papers and a 275-mark Personality Test for the IAS, IPS, IFS and other central services.",
    facts: ["3 stages", "Interview 275 marks"], href: "/exams/competitive-exams",
    pattern: [
      { label: "Prelims", value: "GS Paper I: 100 questions, 200 marks, 2 h · CSAT: 80 questions, qualifying at 33%" },
      { label: "Negative marking", value: "One-third of the question's marks" },
      { label: "Mains", value: "Nine descriptive papers; seven count for merit (1750 marks)" },
      { label: "Interview", value: "Personality Test, 275 marks" },
    ],
    sample: [
      { topic: "Polity", stars: 5, q: "Which Article of the Constitution provides for the Finance Commission?", options: ["Article 280", "Article 312", "Article 324", "Article 356"], correct: 0, why: "Article 280: the President constitutes a Finance Commission every five years." },
      { topic: "Geography", stars: 4, q: "The Tropic of Cancer does NOT pass through which state?", options: ["Rajasthan", "Gujarat", "Odisha", "Tripura"], correct: 2, why: "It crosses Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura and Mizoram." },
      { topic: "Economy", stars: 4, q: "Which body releases the all-India Consumer Price Index (Combined)?", options: ["Reserve Bank of India", "National Statistics Office", "NITI Aayog", "Labour Bureau"], correct: 1, why: "The NSO (MoSPI) publishes CPI (Combined); the Labour Bureau publishes CPI for Industrial Workers." },
    ],
    mock: [
      { topic: "Polity", stars: 5, q: "Fundamental Duties were added to the Constitution by the", options: ["24th Amendment", "42nd Amendment", "44th Amendment", "52nd Amendment"], correct: 1, why: "The 42nd Amendment (1976) added Part IVA, Article 51A." },
      { topic: "Polity", stars: 5, q: "Who presides over a joint sitting of the two Houses of Parliament?", options: ["The President", "The Vice-President", "The Speaker of the Lok Sabha", "The Prime Minister"], correct: 2, why: "Article 118(4): the Speaker presides over a joint sitting." },
      { topic: "Environment", stars: 4, q: "Which is the largest tiger reserve in India by area?", options: ["Jim Corbett", "Sundarbans", "Nagarjunsagar-Srisailam", "Kanha"], correct: 2, why: "Nagarjunsagar-Srisailam in Andhra Pradesh and Telangana is the largest by area." },
    ],
    interview: [
      { tag: "Personality Test", stars: 5, q: "Tell us about yourself, and why the civil services?", points: ["Keep it to a minute, consistent with your Detailed Application Form.", "Give one real experience that drew you to public service, not a cliché.", "Say what you would bring: a skill, a region you know, a problem you want to solve."] },
      { tag: "Home district", stars: 5, q: "What are the main problems of your district, and what would you do as its District Magistrate?", points: ["Name two or three specific issues, with a figure if you know one.", "Mention the schemes already working on them.", "Offer practical steps with the people involved: panchayats, departments, citizens."] },
      { tag: "Current affairs", stars: 4, q: "Should India hold simultaneous elections?", points: ["For: lower cost, less policy paralysis from repeated model codes of conduct.", "Against: federalism, accountability, and what happens if a government falls mid-term.", "The High-Level Committee (2024) recommended it in phases; end with a balanced view of your own."] },
    ],
  },
  {
    id: "ssc", name: "SSC CGL", body: "Staff Selection Commission", logo: "/images/exams/ssc.png",
    image: subject("Quantitative Aptitude", "/images/landing/slide-exams.webp"), fallback: "/images/landing/slide-exams.webp", focus: "50% 45%", alt: "An aspirant solving profit, time-and-work and train problems in a notebook, with coins, a pie chart and a model train around her",
    kicker: "SSC CGL · Group B & C", title: "Inspector, ASO, Auditor and more", text: "One exam for Income Tax and Excise Inspectors, Assistant Section Officers, CBI Sub-Inspectors and dozens of central posts.",
    facts: ["2 tiers", "No interview"], href: "/exams/competitive-exams",
    pattern: [
      { label: "Tier 1", value: "100 questions, 200 marks, 60 min: Reasoning, General Awareness, Quantitative Aptitude, English" },
      { label: "Negative marking", value: "0.50 marks per wrong answer in Tier 1" },
      { label: "Tier 2", value: "Mathematics, Reasoning, English, General Awareness, Computer Knowledge and a data entry test" },
      { label: "Final stage", value: "Document verification; merit on Tier 2" },
    ],
    sample: [
      { topic: "Quantitative Aptitude", stars: 5, q: "A shopkeeper marks goods 25% above cost and gives a 10% discount. What is the profit?", options: ["10%", "12.5%", "15%", "17.5%"], correct: 1, why: "1.25 × 0.90 = 1.125, a profit of 12.5%." },
      { topic: "Reasoning", stars: 5, q: "Find the next number: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "48"], correct: 1, why: "The differences are 4, 6, 8, 10, so the next is 30 + 12 = 42." },
      { topic: "English", stars: 4, q: "Choose the synonym of 'Candid'.", options: ["Frank", "Secretive", "Rude", "Careful"], correct: 0, why: "Candid means open and honest: frank." },
    ],
    mock: [
      { topic: "Quantitative Aptitude", stars: 5, q: "What is the simple interest on ₹5,000 at 8% a year for 3 years?", options: ["₹1,000", "₹1,200", "₹1,250", "₹1,400"], correct: 1, why: "SI = 5000 × 8 × 3 / 100 = ₹1,200." },
      { topic: "Reasoning", stars: 4, q: "If CAT is written as DBU, how is DOG written?", options: ["EPH", "EPG", "DPH", "FQI"], correct: 0, why: "Each letter moves one place forward: D→E, O→P, G→H." },
      { topic: "General Science", stars: 4, q: "Which vitamin does the skin make in sunlight?", options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], correct: 3, why: "UV-B light converts a cholesterol derivative in the skin into vitamin D." },
    ],
    noInterview: "SSC CGL has no interview round: selection is on Tier 2 marks, then document verification. Practise the mock test instead.",
  },
  {
    id: "banks", name: "IBPS PO", body: "Institute of Banking Personnel Selection", logo: "/images/exams/banks.png",
    image: subject("Banking Awareness", "/images/landing/hero-government-exams.webp"), fallback: "/images/landing/hero-government-exams.webp", focus: "50% 45%", alt: "An aspirant studying how money flows between a central bank and branch banks, with an ATM and a cheque on the desk",
    kicker: "Banks · IBPS PO, SBI PO", title: "Probationary Officer in public sector banks", text: "Prelims, Mains with a descriptive English paper, and an interview that counts for a fifth of the final merit.",
    facts: ["3 stages", "Interview 100 marks"], href: "/exams/competitive-exams",
    pattern: [
      { label: "Prelims", value: "100 questions, 100 marks, 60 min: English 30, Quantitative Aptitude 35, Reasoning 35, timed by section" },
      { label: "Negative marking", value: "One-quarter of the question's marks" },
      { label: "Mains", value: "Objective test plus a descriptive English paper (letter and essay)" },
      { label: "Interview", value: "100 marks; final merit Mains 80 : Interview 20" },
    ],
    sample: [
      { topic: "Banking Awareness", stars: 5, q: "Which of these is NOT a function of the RBI?", options: ["Issuing currency notes", "Banker to the government", "Accepting deposits from the public", "Regulating banks"], correct: 2, why: "The RBI does not take deposits from the public; commercial banks do." },
      { topic: "Quantitative Aptitude", stars: 4, q: "Two numbers are in the ratio 3 : 5 and their sum is 64. What is the larger number?", options: ["24", "36", "40", "48"], correct: 2, why: "64 ÷ 8 = 8 per part; 5 × 8 = 40." },
      { topic: "Banking Awareness", stars: 5, q: "Banks keep the Cash Reserve Ratio (CRR) with", options: ["themselves, as cash", "the RBI", "the Government of India", "NABARD"], correct: 1, why: "CRR is the share of deposits a bank must keep as a balance with the RBI." },
    ],
    mock: [
      { topic: "Banking Awareness", stars: 5, q: "A loan becomes a Non-Performing Asset when interest or principal is overdue for more than", options: ["30 days", "60 days", "90 days", "180 days"], correct: 2, why: "The RBI's norm is 90 days overdue." },
      { topic: "Banking Awareness", stars: 4, q: "In banking, KYC stands for", options: ["Keep Your Cash", "Know Your Customer", "Know Your Credit", "Key Yield Calculation"], correct: 1, why: "Know Your Customer: verifying identity and address." },
      { topic: "Reasoning", stars: 4, q: "Pointing to a boy, Riya says, \"He is the son of my grandfather's only son.\" How is he related to Riya?", options: ["Cousin", "Brother", "Uncle", "Nephew"], correct: 1, why: "Her grandfather's only son is her father, so his son is her brother." },
    ],
    interview: [
      { tag: "Motivation", stars: 5, q: "Why do you want to be a banker, especially after your degree?", points: ["Link your background to banking: numbers, people, or rural reach.", "Show you know the PO role: credit, customer service, branch operations, rotation.", "Mention a stable career with responsibility early, but lead with service."] },
      { tag: "Banking awareness", stars: 5, q: "What is the difference between the repo rate and the reverse repo rate?", points: ["Repo: the rate at which the RBI lends to banks against government securities.", "Reverse repo: the rate at which the RBI absorbs money from banks; since 2022 the Standing Deposit Facility is the corridor's floor.", "Quote the current repo rate from the latest MPC statement before your interview."] },
      { tag: "Schemes", stars: 4, q: "What is financial inclusion, and which schemes support it?", points: ["Access to affordable banking, credit, insurance and pensions for everyone.", "PM Jan Dhan Yojana (2014) for accounts; PMJJBY and PMSBY for insurance; Atal Pension Yojana.", "UPI and Aadhaar-based payments bring the last mile online."] },
    ],
  },
  {
    id: "railways", name: "RRB NTPC", body: "Railway Recruitment Boards", logo: "/images/exams/railways.png",
    image: subject("Railway GK", "/images/landing/hero-government-exams-portrait.webp"), fallback: "/images/landing/hero-government-exams-portrait.webp", focus: "50% 45%", alt: "An aspirant studying a railway map of India beside a steam engine, a modern train and a station",
    kicker: "Railways · RRB NTPC", title: "Station Master, Clerk, Goods Guard and more", text: "Non-technical popular categories across Indian Railways, filled through two computer-based tests and a skill test.",
    facts: ["2 CBTs", "No interview"], href: "/exams/competitive-exams",
    pattern: [
      { label: "CBT 1", value: "100 questions, 90 min: General Awareness 40, Mathematics 30, Reasoning 30" },
      { label: "Negative marking", value: "One-third of a mark per wrong answer" },
      { label: "CBT 2", value: "120 questions, 90 min: General Awareness 50, Mathematics 35, Reasoning 35" },
      { label: "Final stage", value: "Typing or aptitude test by post, then document verification and medical" },
    ],
    sample: [
      { topic: "Railway GK", stars: 5, q: "Where is the Integral Coach Factory?", options: ["Kapurthala", "Chennai", "Varanasi", "Chittaranjan"], correct: 1, why: "ICF is at Perambur, Chennai." },
      { topic: "Mathematics", stars: 5, q: "A can finish a job in 12 days and B in 18 days. How long will they take together?", options: ["6 days", "7.2 days", "7.5 days", "8 days"], correct: 1, why: "1/12 + 1/18 = 5/36 of the job a day, so 36/5 = 7.2 days." },
      { topic: "General Science", stars: 4, q: "What is the SI unit of electric current?", options: ["Volt", "Ohm", "Ampere", "Coulomb"], correct: 2, why: "The ampere is an SI base unit." },
    ],
    mock: [
      { topic: "Railway GK", stars: 4, q: "Where is the Rail Wheel Factory?", options: ["Bengaluru", "Kolkata", "Bhopal", "Patiala"], correct: 0, why: "It is at Yelahanka, Bengaluru." },
      { topic: "Mathematics", stars: 4, q: "What is the LCM of 12, 15 and 20?", options: ["40", "60", "120", "180"], correct: 1, why: "12 = 2²·3, 15 = 3·5, 20 = 2²·5, so LCM = 2²·3·5 = 60." },
      { topic: "General Science", stars: 4, q: "Which gas makes up most of the Earth's atmosphere?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"], correct: 2, why: "Nitrogen is about 78% of dry air." },
    ],
    noInterview: "RRB NTPC has no interview round: selection is on CBT 2 (and the skill test for some posts), then document verification and medical.",
  },
  {
    id: "nda", name: "NDA", body: "UPSC · National Defence Academy", logo: "/images/exams/defence.png",
    image: subject("Defence GK", "/images/landing/hero-career.webp"), fallback: "/images/landing/hero-career.webp", focus: "50% 45%", alt: "An aspirant studying a relief map of India with a model tank, aircraft carrier, submarine and fighter jet",
    kicker: "Defence · NDA & NA", title: "Officer training straight after Class 12", text: "A written exam by UPSC, then a five-day SSB interview worth 900 marks for the Army, Navy and Air Force.",
    facts: ["Written + SSB", "SSB 900 marks"], href: "/exams/competitive-exams",
    pattern: [
      { label: "Mathematics", value: "120 questions, 300 marks, 2 h 30 min" },
      { label: "General Ability Test", value: "150 questions, 600 marks, 2 h 30 min" },
      { label: "Negative marking", value: "One-third of the question's marks" },
      { label: "SSB interview", value: "Five days of tests, interview and conference, 900 marks" },
    ],
    sample: [
      { topic: "Mathematics", stars: 5, q: "If log₁₀ 2 = 0.3010, what is log₁₀ 8?", options: ["0.6020", "0.9030", "1.2040", "2.4080"], correct: 1, why: "log 8 = 3 log 2 = 3 × 0.3010 = 0.9030." },
      { topic: "History", stars: 5, q: "Operation Vijay (1999) is associated with", options: ["Siachen", "Kargil", "Goa", "Sri Lanka"], correct: 1, why: "Operation Vijay drove intruders out of Kargil; 26 July is Kargil Vijay Diwas." },
      { topic: "Physics", stars: 4, q: "A ball thrown straight up returns after 4 s (g = 10 m/s²). How high did it rise?", options: ["10 m", "20 m", "40 m", "80 m"], correct: 1, why: "2 s up, so u = 20 m/s and h = u² / 2g = 400 / 20 = 20 m." },
    ],
    mock: [
      { topic: "Mathematics", stars: 5, q: "sin²θ + cos²θ equals", options: ["0", "1", "2", "tan θ"], correct: 1, why: "The Pythagorean identity." },
      { topic: "Defence GK", stars: 4, q: "What is the motto of the Indian Army?", options: ["Service Before Self", "Touch the Sky with Glory", "Sha No Varunah", "Valour and Faith"], correct: 0, why: "'Touch the Sky with Glory' is the Air Force's; 'Sha No Varunah' the Navy's." },
      { topic: "Mathematics", stars: 4, q: "In how many ways can the letters of the word NDA be arranged?", options: ["3", "6", "9", "27"], correct: 1, why: "Three distinct letters: 3! = 6." },
    ],
    interview: [
      { tag: "Personal interview", stars: 5, q: "Tell me about yourself.", points: ["Follow your PIQ form: family, education, hobbies, sports, achievements.", "Give a real example for each quality you claim.", "Be honest and consistent; the interviewing officer checks against the PIQ."] },
      { tag: "Motivation", stars: 5, q: "Why do you want to join the Armed Forces?", points: ["A personal reason: a person, a moment, the life you have seen.", "Show you know the life: discipline, postings, responsibility for men.", "Avoid only 'job security' or 'the uniform'; speak of leadership and service."] },
      { tag: "Self-awareness", stars: 4, q: "What will you do if you are not recommended this time?", points: ["Stay composed: learn from the experience and the feedback.", "Work on the weak areas and try again with a clear plan.", "Mention a backup without sounding less committed."] },
    ],
  },
  {
    id: "state-psc", name: "UPPSC PCS", body: "Uttar Pradesh Public Service Commission", logo: "/images/exams/state-psc.png",
    image: subject("History", "/images/landing/hero-government-exams.webp"), fallback: "/images/landing/hero-government-exams.webp", focus: "50% 45%", alt: "An aspirant reading Indian history beside the Ashoka pillar, a fort and the Salt March",
    kicker: "State PSC · UPPSC, BPSC, MPPSC", title: "SDM, DSP and state civil services", text: "Prelims, Mains with two Uttar Pradesh papers, and an interview: the route to SDM, DSP and other state posts.",
    facts: ["3 stages", "Interview 100 marks"], href: "/exams/competitive-exams",
    pattern: [
      { label: "Prelims", value: "GS Paper I: 150 questions, 200 marks, 2 h · CSAT: qualifying at 33%" },
      { label: "Negative marking", value: "One-third of the question's marks" },
      { label: "Mains", value: "General Hindi, Essay and six GS papers, two of them on Uttar Pradesh" },
      { label: "Interview", value: "100 marks" },
    ],
    sample: [
      { topic: "UP Geography", stars: 5, q: "Which of these rivers does not flow through Uttar Pradesh?", options: ["Gomti", "Ghaghara", "Narmada", "Betwa"], correct: 2, why: "The Narmada flows through Madhya Pradesh, Maharashtra and Gujarat." },
      { topic: "Polity", stars: 4, q: "Article 243G of the Constitution deals with", options: ["elections to Panchayats", "powers and responsibilities of Panchayats", "the State Finance Commission", "Municipalities"], correct: 1, why: "243G: powers, authority and responsibilities of Panchayats, linked to the Eleventh Schedule." },
      { topic: "UP GK", stars: 4, q: "Dudhwa National Park is in which district?", options: ["Bahraich", "Lakhimpur Kheri", "Pilibhit", "Sonbhadra"], correct: 1, why: "Dudhwa is in Lakhimpur Kheri, on the Nepal border." },
    ],
    mock: [
      { topic: "Polity", stars: 4, q: "Which of these states has a Legislative Council?", options: ["Rajasthan", "Gujarat", "Uttar Pradesh", "Punjab"], correct: 2, why: "Uttar Pradesh is bicameral, with a Vidhan Parishad." },
      { topic: "UP GK", stars: 4, q: "The Triveni Sangam is at", options: ["Varanasi", "Prayagraj", "Ayodhya", "Mathura"], correct: 1, why: "Prayagraj: the meeting of the Ganga, the Yamuna and the mythical Saraswati." },
      { topic: "Polity", stars: 4, q: "Who appoints the Chairman of a State Public Service Commission?", options: ["The President", "The Chief Minister", "The Governor", "The Chief Justice of the High Court"], correct: 2, why: "Article 316: the Governor appoints the Chairman and members of a State PSC." },
    ],
    interview: [
      { tag: "State schemes", stars: 5, q: "What is the One District One Product scheme?", points: ["A Uttar Pradesh scheme from 2018 that backs one traditional product in each district.", "Examples: Moradabad brassware, Varanasi silk, Firozabad glassware.", "It offers finance, training, design and marketing support to local artisans."] },
      { tag: "Administration", stars: 5, q: "As an SDM, how would you handle tension during a festival procession?", points: ["Prevent first: meet community leaders, agree the route and timing in advance.", "Deploy police and magistrates at sensitive points, and watch social media for rumours.", "If trouble starts, act quickly and impartially, and keep the public informed."] },
      { tag: "Home district", stars: 4, q: "What is the main crop of your district, and what problems do its farmers face?", points: ["Name the crop and season; give one figure if you know it.", "Common issues: small holdings, irrigation, prices, stray cattle, storage.", "Suggest practical steps: FPOs, crop insurance, market links, schemes already running."] },
    ],
  },
];
