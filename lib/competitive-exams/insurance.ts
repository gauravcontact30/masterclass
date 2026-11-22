import { obj, pack, sub } from "./types";

/*
 * LIC and the public insurance companies: LIC AAO and ADO, NIACL AO, NICL AO, LIC Assistant. Reasoning and
 * quantitative aptitude come from the computed practice. This pack covers insurance awareness, its principles,
 * regulation, government schemes and financial markets. "asked" names the recurring topic only.
 */
const INS = "LIC AAO, NIACL AO Insurance Awareness (recurring topic)";
const FIN = "LIC AAO Financial Market Awareness (recurring topic)";
export default pack("insurance", [
  obj("Insurance awareness", 5, INS, "The Life Insurance Corporation of India was established on", ["1 September 1956", "19 July 1969", "1 January 1973", "15 April 1980"], 0, "LIC was formed on 1 September 1956 by nationalising about 245 insurers."),
  obj("Insurance awareness", 5, INS, "Where is the headquarters of LIC?", ["New Delhi", "Mumbai", "Kolkata", "Chennai"], 1, "LIC's central office, Yogakshema, is in Mumbai."),
  obj("Insurance awareness", 5, INS, "The insurance regulator IRDAI is headquartered in", ["Mumbai", "New Delhi", "Hyderabad", "Bengaluru"], 2, "IRDAI, set up under the IRDA Act, 1999, is based in Hyderabad."),
  obj("Insurance awareness", 4, INS, "Which committee recommended opening the insurance sector to private companies?", ["Narasimham Committee", "Malhotra Committee", "Rangarajan Committee", "Kelkar Committee"], 1, "The R. N. Malhotra Committee report of 1994 led to the IRDA Act, 1999."),
  obj("Insurance awareness", 4, INS, "General insurance business in India was nationalised through an Act of", ["1956", "1969", "1972", "1991"], 2, "The General Insurance Business (Nationalisation) Act, 1972 took effect from 1 January 1973."),
  obj("Insurance awareness", 4, INS, "India's national reinsurer is", ["LIC", "GIC Re", "New India Assurance", "ECGC"], 1, "General Insurance Corporation of India (GIC Re), headquartered in Mumbai."),
  obj("Principles", 5, INS, "The principle that both parties must disclose all material facts is", ["indemnity", "utmost good faith (uberrimae fidei)", "subrogation", "contribution"], 1, "Insurance contracts require utmost good faith from both sides."),
  obj("Principles", 5, INS, "Which principle does NOT apply to life insurance?", ["Insurable interest", "Utmost good faith", "Indemnity", "Proximate cause"], 2, "A human life cannot be valued exactly, so life insurance pays a fixed sum, not an indemnity."),
  obj("Principles", 4, INS, "After paying a claim, the insurer takes over the insured's rights against a third party. This is", ["contribution", "subrogation", "indemnity", "abandonment"], 1, "Subrogation stops the insured from being paid twice for one loss."),
  obj("Principles", 4, INS, "The principle of causa proxima means", ["the nearest effective cause of loss decides the claim", "the closest insurer pays", "the newest policy applies", "losses are shared equally"], 0, "Proximate cause: the dominant, effective cause of the loss is examined."),
  obj("Principles", 4, INS, "When one property is insured with two insurers, they share the loss under the principle of", ["subrogation", "contribution", "utmost good faith", "insurable interest"], 1, "Contribution makes each insurer pay its rateable share."),
  obj("Products", 5, INS, "A term insurance policy pays", ["a maturity benefit only", "the sum assured only if the insured dies during the term", "returns linked to the market", "a pension"], 1, "Term insurance is pure protection with no maturity benefit, so its premium is lowest."),
  obj("Products", 4, INS, "ULIP stands for", ["Unit Linked Insurance Plan", "Universal Life Insurance Policy", "Unified Loan Insurance Plan", "United Life Investment Plan"], 0, "A ULIP combines life cover with market-linked investment."),
  obj("Products", 4, INS, "Insurance bought by an insurance company to share its own risk is called", ["co-insurance", "reinsurance", "bancassurance", "microinsurance"], 1, "Reinsurance spreads large risks across insurers."),
  obj("Products", 4, INS, "Selling insurance products through bank branches is called", ["bancassurance", "microfinance", "reinsurance", "underwriting"], 0, "Banks act as corporate agents of insurers."),
  obj("Products", 3, INS, "A professional who calculates insurance risks and premiums is an", ["auditor", "actuary", "underwriter", "surveyor"], 1, "Actuaries use statistics to price policies and set reserves."),
  obj("Schemes", 5, INS, "Pradhan Mantri Jeevan Jyoti Bima Yojana gives a life cover of", ["₹1 lakh", "₹2 lakh", "₹5 lakh", "₹10 lakh"], 1, "PMJJBY offers ₹2 lakh life cover for an annual premium of ₹436."),
  obj("Schemes", 5, INS, "Pradhan Mantri Suraksha Bima Yojana covers", ["natural death only", "accidental death and disability", "hospitalisation", "crop loss"], 1, "PMSBY gives ₹2 lakh accident cover for ₹20 a year."),
  obj("Schemes", 4, INS, "Ayushman Bharat PM-JAY provides health cover of up to", ["₹1 lakh per person", "₹2 lakh per family", "₹5 lakh per family per year", "₹10 lakh per person"], 2, "It covers secondary and tertiary hospitalisation for eligible families."),
  obj("Schemes", 3, INS, "The Insurance Ombudsman resolves", ["disputes between insurers", "policyholder complaints against insurers", "tax disputes", "stock market disputes"], 1, "It offers free, quick redress for policyholders' grievances."),
  obj("Financial markets", 5, FIN, "SEBI became a statutory body in", ["1988", "1992", "1999", "2003"], 1, "Set up in 1988, SEBI got statutory powers through the SEBI Act, 1992."),
  obj("Financial markets", 4, FIN, "Asia's oldest stock exchange is", ["NSE", "BSE", "Tokyo Stock Exchange", "Hong Kong Stock Exchange"], 1, "The Bombay Stock Exchange was founded in 1875."),
  obj("Financial markets", 4, FIN, "How many companies make up the Sensex?", ["30", "50", "100", "500"], 0, "The S&P BSE Sensex tracks 30 large companies; the Nifty 50 tracks 50."),
  obj("Financial markets", 4, FIN, "The repo rate is the rate at which", ["banks lend to customers", "the RBI lends short-term money to banks", "banks deposit money with the RBI", "the government borrows abroad"], 1, "Raising the repo rate makes borrowing costlier and cools inflation."),
  obj("Financial markets", 3, FIN, "A mutual fund's NAV is", ["its brokerage fee", "the market value of its assets per unit", "its annual return", "its expense ratio"], 1, "Net Asset Value = (assets − liabilities) / number of units."),
], [
  sub("Principles", 5, INS, "Explain the main principles of insurance.", ["Utmost good faith: both parties disclose all material facts.", "Insurable interest: the insured must suffer a financial loss from the event.", "Indemnity: the insured is restored to the pre-loss position, no better (not for life insurance).", "Subrogation, contribution and proximate cause govern how claims are settled and shared."]),
  sub("Products", 4, INS, "Compare term insurance and endowment insurance.", ["Term: pays only on death within the term; no maturity value; lowest premium.", "Endowment: pays on death or at maturity; part saving, part protection; higher premium.", "Term suits pure protection; endowment suits disciplined saving.", "Advice: buy adequate term cover first, invest separately."]),
  sub("Descriptive", 4, "LIC AAO descriptive paper (recurring theme)", "Write a short essay outline on 'Insurance penetration in rural India'.", ["Introduction: penetration (premium as a share of GDP) remains low in villages.", "Reasons: low awareness, irregular incomes, distance from branches, mistrust.", "Measures: PMJJBY, PMSBY, microinsurance, bancassurance and digital sales.", "Conclusion: simple products and local agents can close the protection gap."]),
  sub("Interview", 4, "LIC AAO interview (recurring question)", "How would you convince a farmer to buy insurance?", ["Start from his real risks: illness, accident, crop loss.", "Explain one simple product in plain language, such as PMSBY at ₹20 a year.", "Show how the family is protected if the earning member dies or is injured.", "Be honest about exclusions and help with the paperwork."]),
]);
