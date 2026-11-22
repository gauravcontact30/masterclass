import type { ExamId } from "./exams";

/*
 * Who conducts each exam, where its official notices and calendar are published, and how often it is usually held.
 * Exact dates change every cycle and are announced by the conducting body, so the page links to it instead of
 * printing dates it cannot vouch for. `site` is null where the official site changes from year to year (GATE).
 */
export type ExamCalendar = { body: string; site: string | null; siteLabel: string; frequency: string };
export const CALENDAR: Partial<Record<ExamId, ExamCalendar>> = {
  nda: { body: "UPSC", site: "https://upsc.gov.in/", siteLabel: "upsc.gov.in", frequency: "Twice a year (NDA & NA I and II)" },
  defence: { body: "UPSC (CDS), Indian Air Force (AFCAT), the services (Agniveer)", site: "https://upsc.gov.in/", siteLabel: "upsc.gov.in", frequency: "CDS and AFCAT twice a year; Agniveer as notified" },
  banks: { body: "IBPS, SBI, RBI", site: "https://www.ibps.in/", siteLabel: "ibps.in", frequency: "Yearly, per the IBPS calendar" },
  railways: { body: "Railway Recruitment Boards (RRBs)", site: "https://indianrailways.gov.in/", siteLabel: "indianrailways.gov.in", frequency: "Per the RRBs' annual recruitment calendar" },
  ssc: { body: "Staff Selection Commission", site: "https://ssc.gov.in/", siteLabel: "ssc.gov.in", frequency: "Yearly, per the SSC exam calendar" },
  upsc: { body: "UPSC", site: "https://upsc.gov.in/", siteLabel: "upsc.gov.in", frequency: "Yearly, per the UPSC annual calendar" },
  cbi: { body: "SSC (through SSC CGL)", site: "https://ssc.gov.in/", siteLabel: "ssc.gov.in", frequency: "Yearly, with SSC CGL" },
  "income-tax": { body: "SSC (through SSC CGL, CHSL and MTS)", site: "https://ssc.gov.in/", siteLabel: "ssc.gov.in", frequency: "Yearly, with SSC CGL and CHSL" },
  ib: { body: "Ministry of Home Affairs", site: "https://www.mha.gov.in/", siteLabel: "mha.gov.in", frequency: "As notified by the MHA" },
  police: { body: "State police recruitment boards, UPSC (CAPF), SSC (CPO)", site: "https://ssc.gov.in/", siteLabel: "ssc.gov.in", frequency: "Varies by state; CAPF and CPO yearly" },
  "state-psc": { body: "State Public Service Commissions (UPPSC, BPSC, MPPSC, RPSC…)", site: "https://uppsc.up.nic.in/", siteLabel: "uppsc.up.nic.in (UPPSC)", frequency: "Usually yearly; varies by state" },
  insurance: { body: "LIC, NIACL, NICL", site: "https://licindia.in/", siteLabel: "licindia.in", frequency: "As notified by each insurer" },
  epfo: { body: "EPFO (SSA), UPSC (EO/AO, APFC)", site: "https://www.epfindia.gov.in/", siteLabel: "epfindia.gov.in", frequency: "As notified" },
  "coast-guard": { body: "Indian Coast Guard", site: "https://joinindiancoastguard.cdac.in/", siteLabel: "joinindiancoastguard.cdac.in", frequency: "Usually two Navik batches a year" },
  tet: { body: "CBSE (CTET), state boards (UPTET and others)", site: "https://ctet.nic.in/", siteLabel: "ctet.nic.in", frequency: "CTET usually twice a year" },
  isro: { body: "ISRO Centralised Recruitment Board", site: "https://www.isro.gov.in/", siteLabel: "isro.gov.in", frequency: "As notified" },
  gate: { body: "IISc and the IITs, in rotation", site: null, siteLabel: "The organising IIT's GATE website (changes each year)", frequency: "Once a year, usually in February" },
  "ugc-net": { body: "National Testing Agency", site: "https://ugcnet.nta.ac.in/", siteLabel: "ugcnet.nta.ac.in", frequency: "Twice a year (June and December cycles)" },
};
