import { obj, pack, sub } from "./types";

/* Defence: NDA, CDS, AFCAT and Agniveer written papers, with SSB interview questions as the subjective set. */
export default pack("defence", [
  obj("Polity", 5, "NDA 2018, CDS 2020", "Who is the Supreme Commander of the Indian Armed Forces?", ["The Prime Minister", "The President", "The Defence Minister", "The Chief of Defence Staff"], 1, "Article 53 vests the supreme command of the Defence Forces in the President."),
  obj("Defence GK", 5, "AFCAT 2019, NDA 2021", "Which is the highest peacetime gallantry award in India?", ["Param Vir Chakra", "Kirti Chakra", "Ashoka Chakra", "Maha Vir Chakra"], 2, "The Ashoka Chakra is the peacetime equivalent of the Param Vir Chakra, which is the highest wartime award."),
  obj("Defence GK", 4, "CDS 2019, AFCAT 2021", "The rank of Group Captain in the Indian Air Force is equivalent to which Army rank?", ["Major", "Lieutenant Colonel", "Colonel", "Brigadier"], 2, "Group Captain (Air Force) = Colonel (Army) = Captain (Navy)."),
  obj("Defence GK", 4, "AFCAT 2018, CDS 2022", "The motto of the Indian Air Force, 'Nabhah Sprisham Diptam', is taken from which text?", ["Rigveda", "Bhagavad Gita", "Mundaka Upanishad", "Ramayana"], 1, "It comes from the eleventh chapter of the Bhagavad Gita and means 'touch the sky with glory'."),
  obj("History", 5, "NDA 2017, CDS 2019", "The Battle of Plassey was fought in which year?", ["1757", "1764", "1761", "1857"], 0, "Robert Clive defeated Siraj-ud-Daulah at Plassey in 1757; Buxar followed in 1764."),
  obj("Geography", 4, "NDA 2019, NDA 2022", "The Tropic of Cancer does not pass through which of these states?", ["Rajasthan", "Odisha", "Tripura", "Mizoram"], 1, "It passes through eight states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura and Mizoram."),
  obj("Physics", 5, "NDA 2016, NDA 2020", "The SI unit of electric power is the", ["joule", "watt", "volt", "ampere"], 1, "Power is the rate of doing work: 1 watt = 1 joule per second."),
  obj("Mathematics", 5, "NDA 2018, NDA 2021", "What is the value of sin²30° + cos²60° + tan²45°?", ["1", "3/2", "2", "5/4"], 1, "(1/2)² + (1/2)² + 1² = 1/4 + 1/4 + 1 = 3/2."),
  obj("Mathematics", 4, "NDA 2019, NDA 2023", "If A is a 3 × 3 matrix with |A| = 4, what is |2A|?", ["8", "16", "32", "64"], 2, "|kA| = kⁿ|A| for an n × n matrix, so |2A| = 2³ × 4 = 32."),
  obj("English", 4, "CDS 2018, AFCAT 2020", "Choose the word nearest in meaning to 'valour'.", ["Fear", "Courage", "Pride", "Speed"], 1, "Valour means great courage, especially in battle."),
  obj("Chemistry", 4, "NDA 2017, NDA 2021", "Which gas is mainly responsible for the greenhouse effect on Earth?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], 2, "Carbon dioxide, with water vapour and methane, traps outgoing infrared radiation."),
  obj("Defence GK", 3, "AFCAT 2020, CDS 2021", "INS Vikrant, commissioned in 2022, is India's first indigenous", ["nuclear submarine", "aircraft carrier", "stealth frigate", "destroyer"], 1, "INS Vikrant (IAC-1) was built at Cochin Shipyard and commissioned in September 2022."),
  obj("Geography", 4, "NDA 2018, CDS 2021", "Which strait separates India from Sri Lanka?", ["Malacca Strait", "Palk Strait", "Hormuz Strait", "Sunda Strait"], 1, "The Palk Strait lies between Tamil Nadu and northern Sri Lanka."),
  obj("Physics", 4, "NDA 2019, NDA 2022", "In which medium does sound travel fastest?", ["Air", "Water", "Steel", "Vacuum"], 2, "Sound travels fastest in solids and cannot travel through a vacuum."),
  obj("Defence GK", 4, "CDS 2020, AFCAT 2022", "Where is the headquarters of the Eastern Naval Command?", ["Kochi", "Mumbai", "Visakhapatnam", "Port Blair"], 2, "Eastern: Visakhapatnam. Western: Mumbai. Southern: Kochi."),
], [
  sub("SSB Interview", 5, "SSB interviews, asked every year", "Why do you want to join the Armed Forces?", [
    "Give a personal reason first: an experience, a family member or an NCC camp that drew you to the life.",
    "Link it to what the service offers that you value: leadership at a young age, discipline, adventure and service to the country.",
    "Show you know the role you applied for and its demands, including hardship postings.",
    "Keep it honest and under a minute; rehearsed patriotic lines without a personal story are easy to see through.",
  ]),
  sub("SSB Interview", 5, "SSB interviews, asked every year", "Tell us about yourself, your family, your education and your hobbies in one answer.", [
    "This is the interviewing officer's rapid-fire opener; answer in the same order the parts were asked.",
    "Family: who they are and what they do, in one line each.",
    "Education: marks from class 10 onwards and one achievement.",
    "Hobbies and sports: name only those you can answer questions on.",
    "It tests memory and organised thinking, so do not skip a part.",
  ]),
  sub("SSB Lecturette", 4, "SSB GTO task, common topic since 2019", "Speak for three minutes on 'Women in the Armed Forces'.", [
    "Introduction: women have served as officers since 1992 and now hold permanent commissions.",
    "Milestones: the 2020 Supreme Court ruling on permanent commission, women fighter pilots since 2016, women cadets at the NDA since 2022 and women Agniveers.",
    "Benefits: a larger talent pool and proven performance in flying, engineering, medical and combat-support roles.",
    "Challenges: infrastructure, field postings and changing attitudes.",
    "Conclusion: selection should rest on merit and standards, not gender.",
  ]),
  sub("Current Affairs", 4, "CDS and AFCAT interviews 2022 to 2024", "What is the Agnipath scheme? Give its main features.", [
    "Launched in June 2022 to recruit soldiers, sailors and airmen below officer rank for four years; recruits are called Agniveers.",
    "Entry age is 17.5 to 21 years.",
    "Up to 25 per cent are retained in the regular cadre after four years.",
    "Those who leave receive the Seva Nidhi package of about ₹11.71 lakh and no pension.",
    "Aims: a younger force and a lower pension bill. Concerns: job security and training time.",
  ]),
  sub("Defence GK", 4, "NDA and CDS interviews 2020 to 2023", "What is the role of the Chief of Defence Staff?", [
    "The post was created in December 2019; General Bipin Rawat was the first CDS.",
    "The CDS is a four-star officer who heads the Department of Military Affairs.",
    "Acts as Permanent Chairman of the Chiefs of Staff Committee and principal military adviser to the Defence Minister on tri-service matters.",
    "Drives jointness: joint procurement, training and the creation of theatre commands.",
    "Does not exercise military command over the three service chiefs.",
  ]),
  sub("Descriptive", 3, "CDS and Territorial Army essay practice", "Write a short note on India's nuclear doctrine.", [
    "Credible minimum deterrence: keep only enough weapons to deter.",
    "No first use: nuclear weapons will be used only in retaliation to a nuclear attack on India or its forces.",
    "Retaliation will be massive and designed to inflict unacceptable damage.",
    "Only the civilian political leadership, through the Nuclear Command Authority, can authorise use.",
    "No use against non-nuclear-weapon states.",
  ]),
  sub("SSB Interview", 4, "SSB interviews and psychology tests, asked every year", "What are Officer Like Qualities?", [
    "The fifteen qualities on which SSB assessors rate a candidate, grouped under four factors.",
    "Planning and organising: effective intelligence, reasoning ability, organising ability, power of expression.",
    "Social adjustment: social adaptability, cooperation, sense of responsibility.",
    "Social effectiveness: initiative, self-confidence, speed of decision, ability to influence the group, liveliness.",
    "Dynamic: determination, courage, stamina.",
  ]),
  sub("Defence GK", 3, "CDS and Territorial Army interviews 2018 to 2023", "Name the commands of the Indian Army with their headquarters.", [
    "Northern Command: Udhampur.", "Western Command: Chandimandir.", "Eastern Command: Kolkata.",
    "Southern Command: Pune.", "Central Command: Lucknow.", "South Western Command: Jaipur.", "Army Training Command: Shimla.",
  ]),
]);
