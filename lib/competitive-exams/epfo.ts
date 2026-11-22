import { obj, pack, sub } from "./types";

/*
 * EPFO: Social Security Assistant and the UPSC EPFO Enforcement Officer / APFC test. General intelligence and
 * quantitative aptitude come from the computed practice. This pack covers social security, labour law, the
 * Constitution's labour provisions and welfare schemes. "asked" names the recurring topic only.
 */
const UPSC = "UPSC EPFO EO/AO, APFC (recurring topic)";
const SSA = "EPFO SSA General Awareness (recurring topic)";
export default pack("epfo", [
  obj("EPFO", 5, SSA, "The EPFO works under the", ["Ministry of Finance", "Ministry of Labour and Employment", "Ministry of Social Justice", "Ministry of Corporate Affairs"], 1, "The Employees' Provident Fund Organisation is a statutory body of the Ministry of Labour and Employment."),
  obj("EPFO", 5, SSA, "The EPFO was set up under the", ["Factories Act, 1948", "Employees' Provident Funds and Miscellaneous Provisions Act, 1952", "Payment of Wages Act, 1936", "Industrial Disputes Act, 1947"], 1, "The EPF & MP Act, 1952 created the provident fund scheme."),
  obj("EPFO", 4, SSA, "How many digits does a UAN have?", ["10", "12", "14", "16"], 1, "The Universal Account Number is a 12-digit number that stays with a member across jobs."),
  obj("EPFO", 4, UPSC, "Under the EPF scheme, an employee contributes what share of basic wages and dearness allowance?", ["8.33%", "10%", "12%", "15%"], 2, "The standard rate is 12% from the employee and 12% from the employer."),
  obj("EPFO", 4, UPSC, "The Employees' Pension Scheme run by the EPFO dates from", ["1952", "1976", "1995", "2004"], 2, "EPS, 1995; part of the employer's contribution (8.33%) goes to it."),
  obj("EPFO", 3, UPSC, "The EDLI scheme of the EPFO provides", ["housing loans", "life insurance cover to members", "unemployment allowance", "medical care"], 1, "The Employees' Deposit Linked Insurance Scheme, 1976."),
  obj("Social security", 4, UPSC, "The Employees' State Insurance Corporation was set up under an Act of", ["1923", "1948", "1952", "1961"], 1, "The ESI Act, 1948 provides medical, sickness and maternity benefits."),
  obj("Social security", 4, UPSC, "The National Pension System is regulated by", ["IRDAI", "SEBI", "PFRDA", "EPFO"], 2, "The Pension Fund Regulatory and Development Authority regulates the NPS."),
  obj("Social security", 4, SSA, "Atal Pension Yojana is open to people aged", ["18 to 40", "18 to 60", "21 to 50", "25 to 45"], 0, "It guarantees a pension of ₹1,000 to ₹5,000 a month from age 60."),
  obj("Social security", 4, SSA, "PM Shram Yogi Maan-dhan gives unorganised workers a monthly pension of", ["₹1,000", "₹2,000", "₹3,000", "₹5,000"], 2, "₹3,000 a month after age 60, with matching contributions from the government."),
  obj("Social security", 4, SSA, "The e-Shram portal is a national database of", ["taxpayers", "unorganised workers", "students", "farmers' land records"], 1, "Launched in 2021 to register unorganised workers for welfare schemes."),
  obj("Labour codes", 5, UPSC, "How many central labour laws were consolidated into the four labour codes?", ["17", "29", "44", "52"], 1, "Twenty-nine central laws were merged into four codes."),
  obj("Labour codes", 5, UPSC, "Which of these is NOT one of the four labour codes?", ["Code on Wages, 2019", "Industrial Relations Code, 2020", "Code on Social Security, 2020", "Code on Factories and Mines, 2021"], 3, "The fourth code is the Occupational Safety, Health and Working Conditions Code, 2020."),
  obj("Labour law", 4, UPSC, "The Maternity Benefit (Amendment) Act, 2017 raised paid maternity leave to", ["12 weeks", "18 weeks", "26 weeks", "52 weeks"], 2, "Twenty-six weeks for the first two children."),
  obj("Labour law", 4, UPSC, "The Payment of Gratuity Act dates from", ["1948", "1965", "1972", "1986"], 2, "Gratuity is payable after five years of continuous service (with exceptions)."),
  obj("Labour law", 3, UPSC, "The Minimum Wages Act was passed in", ["1936", "1948", "1970", "1976"], 1, "It has since been subsumed into the Code on Wages, 2019."),
  obj("Constitution", 5, UPSC, "Which Article prohibits the employment of children below 14 in factories and mines?", ["Article 21A", "Article 23", "Article 24", "Article 45"], 2, "Article 24 is a Fundamental Right against child labour in hazardous work."),
  obj("Constitution", 4, UPSC, "Which Article prohibits forced labour (begar)?", ["Article 17", "Article 23", "Article 39", "Article 43"], 1, "Article 23 prohibits traffic in human beings and forced labour."),
  obj("Constitution", 4, UPSC, "Equal pay for equal work for men and women is a Directive Principle under", ["Article 39(d)", "Article 41", "Article 43", "Article 47"], 0, "Article 39(d)."),
  obj("Constitution", 4, UPSC, "A living wage for workers is a Directive Principle under", ["Article 38", "Article 41", "Article 43", "Article 48"], 2, "Article 43 also promotes cottage industries."),
  obj("International", 4, SSA, "The International Labour Organization was founded in", ["1919", "1945", "1950", "1965"], 0, "Founded in 1919 under the Treaty of Versailles, it is headquartered in Geneva."),
  obj("International", 3, SSA, "The ILO is unique among UN agencies because it is", ["funded only by India", "tripartite: governments, employers and workers", "run by the World Bank", "limited to Europe"], 1, "Its tripartite structure gives workers and employers a voice alongside governments."),
], [
  sub("EPFO", 5, UPSC, "Explain the three schemes run by the EPFO.", ["EPF, 1952: a provident fund built from 12% employee and employer contributions, with interest.", "EPS, 1995: a monthly pension from age 58, funded from 8.33% of the employer's share.", "EDLI, 1976: life insurance cover paid to the nominee if the member dies in service.", "All are portable through the UAN when the member changes jobs."]),
  sub("Labour codes", 4, UPSC, "What changes do the four labour codes bring?", ["They merge 29 central laws into four codes on wages, industrial relations, social security and safety.", "A universal definition of wages and a statutory floor wage.", "Social security extended to gig and platform workers.", "Single registration, licensing and returns to ease compliance."]),
  sub("Social security", 4, UPSC, "Why does India need universal social security?", ["Most workers are in the unorganised sector without pensions or insurance.", "An ageing population needs old-age income.", "Health shocks push families into poverty.", "Schemes such as e-Shram, APY, PM-SYM and PMJJBY are steps towards universal cover."]),
  sub("Interview", 4, "EPFO interview (recurring question)", "How would you help a member whose PF claim has been pending for months?", ["Check the claim status and the exact reason for delay in the system.", "Fix common issues: KYC mismatch, unlinked Aadhaar, missing exit date.", "Keep the member informed and set a clear timeline.", "Escalate if needed and suggest using the grievance portal (EPFiGMS)."]),
]);
