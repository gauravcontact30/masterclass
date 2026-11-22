import { obj, pack, sub } from "./types";

/*
 * Intelligence Bureau: ACIO Grade II and Security Assistant. Tier 1 tests current affairs, general studies,
 * numerical aptitude, reasoning and English; numerical and reasoning come from the computed practice. This pack
 * covers security institutions, internal security law, borders and cyber security. "asked" names the topic only.
 */
const IB = "IB ACIO Tier 1 General Studies (recurring topic)";
const SEC = "IB ACIO, SSC CGL Internal Security (recurring topic)";
export default pack("ib", [
  obj("Intelligence", 5, IB, "The Intelligence Bureau functions under the", ["Ministry of Defence", "Ministry of Home Affairs", "Cabinet Secretariat", "Prime Minister's Office"], 1, "The IB is India's internal intelligence agency under the MHA."),
  obj("Intelligence", 4, IB, "The Intelligence Bureau traces its origin to", ["1887", "1920", "1947", "1968"], 0, "It began in 1887 under British rule and is among the oldest intelligence agencies in the world."),
  obj("Intelligence", 5, IB, "The Research and Analysis Wing (R&AW) was set up in", ["1947", "1962", "1968", "1999"], 2, "R&AW was carved out of the IB in 1968 for external intelligence."),
  obj("Intelligence", 4, IB, "Who was the first chief of R&AW?", ["R. N. Kao", "B. N. Mullik", "Ajit Doval", "K. Sankaran Nair"], 0, "Rameshwar Nath Kao headed R&AW from 1968 to 1977."),
  obj("Intelligence", 4, SEC, "The National Security Council of India was set up in", ["1990", "1998", "2004", "2008"], 1, "It was set up in 1998; the National Security Adviser heads its secretariat."),
  obj("Intelligence", 4, SEC, "The Multi Agency Centre (MAC), for sharing counter-terror intelligence, functions under the", ["NIA", "R&AW", "Intelligence Bureau", "NSG"], 2, "The MAC under the IB connects central and state agencies."),
  obj("Intelligence", 3, SEC, "The National Technical Research Organisation (NTRO) handles", ["border policing", "technical intelligence", "financial crime", "disaster response"], 1, "NTRO, set up in 2004, gathers technical and signals intelligence."),
  obj("Intelligence", 3, SEC, "NATGRID is designed to", ["link databases so agencies can access information on suspects", "track weather", "manage the power grid", "run the Aadhaar system"], 0, "The National Intelligence Grid links databases held by banks, airlines, telecom and other providers."),
  obj("Security law", 5, SEC, "The law under which India bans terrorist organisations is the", ["NSA, 1980", "UAPA, 1967", "AFSPA, 1958", "TADA, 1985"], 1, "The Unlawful Activities (Prevention) Act, 1967 lists banned terrorist organisations and individuals."),
  obj("Security law", 4, SEC, "The Official Secrets Act dates from", ["1889", "1923", "1950", "1971"], 1, "The Official Secrets Act, 1923 punishes spying and leaks of secret information."),
  obj("Security law", 4, SEC, "A National Emergency is declared under", ["Article 352", "Article 356", "Article 360", "Article 365"], 0, "Article 352 covers war, external aggression or armed rebellion."),
  obj("Security law", 4, SEC, "President's Rule in a state is imposed under", ["Article 352", "Article 356", "Article 360", "Article 370"], 1, "Article 356 applies when the constitutional machinery in a state fails."),
  obj("Security law", 3, SEC, "The Armed Forces (Special Powers) Act applies in", ["every state", "areas declared 'disturbed'", "Union Territories only", "border districts only"], 1, "AFSPA gives special powers to the armed forces in notified disturbed areas."),
  obj("Borders", 5, IB, "India shares its longest land border with", ["China", "Pakistan", "Bangladesh", "Nepal"], 2, "The India–Bangladesh border is about 4,097 km long."),
  obj("Borders", 4, IB, "The McMahon Line is the boundary between India and", ["Pakistan", "China", "Myanmar", "Nepal"], 1, "It marks the eastern sector of the India–China boundary in Arunachal Pradesh."),
  obj("Borders", 4, IB, "The Radcliffe Line separates India from", ["China", "Pakistan and Bangladesh", "Afghanistan", "Myanmar"], 1, "Drawn in 1947, it divided Punjab and Bengal between India and Pakistan (East Pakistan became Bangladesh)."),
  obj("Borders", 4, IB, "The Durand Line is the boundary between", ["India and Pakistan", "Pakistan and Afghanistan", "India and China", "Afghanistan and Iran"], 1, "It was drawn in 1893."),
  obj("Borders", 4, IB, "Which strait separates India from Sri Lanka?", ["Malacca Strait", "Palk Strait", "Hormuz Strait", "Ten Degree Channel"], 1, "The Palk Strait lies between Tamil Nadu and northern Sri Lanka."),
  obj("Borders", 4, IB, "The Siachen Glacier lies in the", ["Pir Panjal range", "Karakoram range", "Zanskar range", "Shivalik range"], 1, "It is in the eastern Karakoram."),
  obj("Borders", 3, IB, "Which border force guards the India–Nepal and India–Bhutan borders?", ["BSF", "ITBP", "SSB", "Assam Rifles"], 2, "The Sashastra Seema Bal guards both open borders."),
  obj("Cyber security", 4, SEC, "The national nodal agency for responding to cyber security incidents is", ["NIC", "CERT-In", "C-DAC", "NTRO"], 1, "CERT-In, under the Ministry of Electronics and IT, handles cyber incident response."),
  obj("Cyber security", 4, SEC, "An email that pretends to be from a bank to steal passwords is an example of", ["phishing", "spoofing a firewall", "encryption", "a denial-of-service attack"], 0, "Phishing tricks users into revealing credentials."),
  obj("Cyber security", 3, SEC, "HTTPS protects web traffic using", ["FTP", "TLS encryption", "plain HTTP", "SMTP"], 1, "Transport Layer Security encrypts data between the browser and the server."),
  obj("Cyber security", 3, SEC, "Which law deals with cyber crime and electronic records in India?", ["IT Act, 2000", "Telegraph Act, 1885", "Copyright Act, 1957", "DPDP Act, 2023 only"], 0, "The Information Technology Act, 2000 defines cyber offences and gives electronic records legal recognition."),
], [
  sub("Intelligence", 4, IB, "Distinguish the roles of the IB and R&AW.", ["The IB handles internal intelligence: counter-terrorism, counter-intelligence and threats inside India.", "R&AW handles external intelligence about other countries.", "The IB reports to the Ministry of Home Affairs; R&AW to the Cabinet Secretariat.", "They share inputs through the Multi Agency Centre and the National Security Council."]),
  sub("Security", 4, SEC, "What are the main internal security challenges facing India?", ["Cross-border terrorism, especially in Jammu and Kashmir.", "Left-wing extremism in parts of central and eastern India.", "Insurgency in parts of the North-East.", "Cyber attacks, organised crime, drug trafficking and radicalisation online."]),
  sub("Tier 2", 4, "IB ACIO Tier 2 essay (recurring theme)", "Outline an essay on 'Technology and national security'.", ["Introduction: security now depends on data, networks and space, not only on borders.", "Opportunities: surveillance, drones, satellite imagery and data analytics.", "Threats: cyber attacks on critical infrastructure, disinformation and encrypted terror communication.", "Way forward: indigenous technology, skilled personnel, privacy safeguards and international cooperation."]),
  sub("Interview", 4, "IB ACIO interview (recurring question)", "Why is discretion important for an intelligence officer?", ["Sources and methods must stay secret or they stop working.", "A careless word can put lives at risk.", "Officers must avoid revealing their work even to family and on social media.", "Integrity and discretion are what make the service trustworthy."]),
]);
