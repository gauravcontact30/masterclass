import { obj, pack, sub } from "./types";

/*
 * Indian Coast Guard: Navik (General Duty and Domestic Branch), Yantrik and Assistant Commandant. Mathematics and
 * reasoning come from the computed practice. This pack covers the service, maritime zones, defence GK and the
 * Class 10–12 science asked in Section I and II. "asked" names the recurring topic only.
 */
const ICG = "Coast Guard Navik Section I General Knowledge (recurring topic)";
const SCI = "Coast Guard Navik Science (recurring topic)";
export default pack("coast-guard", [
  obj("Coast Guard", 5, ICG, "The Indian Coast Guard works under the", ["Ministry of Home Affairs", "Ministry of Defence", "Ministry of Shipping", "Ministry of External Affairs"], 1, "It is an armed force of the Union under the Ministry of Defence."),
  obj("Coast Guard", 5, ICG, "Coast Guard Day is observed on", ["1 February", "4 December", "15 January", "8 October"], 0, "The interim Coast Guard began on 1 February 1977."),
  obj("Coast Guard", 4, ICG, "The Coast Guard was constituted as an armed force by the", ["Coast Guard Act, 1978", "Navy Act, 1957", "Maritime Zones Act, 1976", "Merchant Shipping Act, 1958"], 0, "Parliament passed the Coast Guard Act in August 1978, making the force a statutory armed force of the Union."),
  obj("Coast Guard", 5, ICG, "What is the motto of the Indian Coast Guard?", ["Sham No Varunah", "Vayam Rakshamah", "Nabha Sparsham Deeptam", "Seva Paramo Dharma"], 1, "'Vayam Rakshamah' means 'We Protect'."),
  obj("Maritime zones", 5, ICG, "India's territorial waters extend up to", ["3 nautical miles", "12 nautical miles", "24 nautical miles", "200 nautical miles"], 1, "Measured from the baseline, under UNCLOS and the Maritime Zones Act, 1976."),
  obj("Maritime zones", 5, ICG, "The Exclusive Economic Zone extends up to", ["12 nautical miles", "24 nautical miles", "100 nautical miles", "200 nautical miles"], 3, "In its EEZ a country has rights over fishing and seabed resources."),
  obj("Maritime zones", 4, ICG, "One nautical mile equals about", ["1.0 km", "1.609 km", "1.852 km", "2.0 km"], 2, "A nautical mile is 1,852 metres."),
  obj("Maritime zones", 4, ICG, "Which UN convention sets the rules for maritime zones?", ["UNFCCC", "UNCLOS", "MARPOL", "SOLAS"], 1, "The UN Convention on the Law of the Sea (1982)."),
  obj("Defence", 5, ICG, "Navy Day is observed on 4 December to mark", ["the 1971 attack on Karachi harbour (Operation Trident)", "Independence", "the Kargil victory", "the first submarine"], 0, "Operation Trident struck Karachi on 4 December 1971."),
  obj("Defence", 4, ICG, "India's first indigenous aircraft carrier is", ["INS Viraat", "INS Vikramaditya", "INS Vikrant", "INS Arihant"], 2, "INS Vikrant was commissioned on 2 September 2022."),
  obj("Defence", 4, ICG, "Army Day and Air Force Day are observed on", ["15 January and 8 October", "26 January and 15 August", "4 December and 1 February", "8 October and 15 January"], 0, "Army Day: 15 January; Air Force Day: 8 October."),
  obj("Defence", 3, ICG, "INS Arihant is India's first indigenous", ["aircraft carrier", "nuclear-powered ballistic missile submarine", "destroyer", "frigate"], 1, "It completed India's nuclear triad."),
  obj("Science", 5, SCI, "The SI unit of force is the", ["joule", "watt", "newton", "pascal"], 2, "1 newton accelerates 1 kg at 1 m/s²."),
  obj("Science", 5, SCI, "The speed of light in vacuum is about", ["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "340 m/s"], 1, "c ≈ 3 × 10⁸ m/s; 340 m/s is roughly the speed of sound in air."),
  obj("Science", 5, SCI, "A ship floats because of", ["Pascal's law", "Archimedes' principle", "Newton's third law", "Bernoulli's principle"], 1, "It displaces a weight of water equal to its own weight."),
  obj("Science", 4, SCI, "SONAR works using", ["radio waves", "light waves", "sound waves", "X-rays"], 2, "It sends ultrasonic pulses and times their echoes."),
  obj("Science", 4, SCI, "Water has its maximum density at", ["0 °C", "4 °C", "37 °C", "100 °C"], 1, "This anomalous expansion is why lakes freeze from the top."),
  obj("Science", 4, SCI, "Ohm's law states that, at constant temperature,", ["V = IR", "P = VI", "F = ma", "E = mc²"], 0, "Current through a conductor is proportional to the voltage across it."),
  obj("Science", 4, SCI, "The pH of pure water at 25 °C is", ["0", "5", "7", "14"], 2, "Pure water is neutral."),
  obj("Science", 4, SCI, "Acceleration due to gravity at the Earth's surface is about", ["6.8 m/s²", "9.8 m/s²", "11.2 m/s²", "98 m/s²"], 1, "11.2 km/s is the escape velocity, a different quantity."),
  obj("Science", 3, SCI, "Bending of light as it passes from air into water is called", ["reflection", "refraction", "diffraction", "dispersion"], 1, "Light changes speed and direction at the boundary."),
  obj("Science", 3, SCI, "Which gas makes up most of the Earth's atmosphere?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"], 2, "About 78% nitrogen and 21% oxygen."),
], [
  sub("Coast Guard", 4, ICG, "What are the main duties of the Indian Coast Guard?", ["Protecting India's maritime zones and offshore installations.", "Search and rescue of fishermen and seafarers in distress.", "Preventing smuggling, poaching and illegal fishing.", "Responding to marine pollution such as oil spills."]),
  sub("Maritime zones", 4, ICG, "Explain India's maritime zones.", ["Territorial waters: up to 12 nautical miles, with full sovereignty.", "Contiguous zone: up to 24 nautical miles, for customs, immigration and sanitary control.", "Exclusive Economic Zone: up to 200 nautical miles, with rights over resources.", "Continental shelf: the seabed beyond, as allowed by UNCLOS."]),
  sub("Interview", 4, "Coast Guard interview (recurring question)", "Why do you want to join the Coast Guard?", ["Speak about serving the nation at sea and saving lives.", "Mention its duties: search and rescue, protecting fishermen, preventing smuggling.", "Show you understand the discipline and long sea deployments.", "Give one personal reason or experience that drew you to the sea."]),
]);
