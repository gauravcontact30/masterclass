import type { BoardId, ClassId, PackSubject, Stars } from "./types";

/*
 * Past papers and upcoming examinations for the Board Exams page.
 *
 * Past papers: question papers belong to the boards, so this page reproduces none. It links to each board's official
 * archive, one row per year for the last 20 years. Older years may not be online; the row says where to look.
 *
 * Upcoming: only dates published by the board itself are shown as dates. UP Board's 2027 schedule was read from its
 * notice of 12 October 2026 (upmsp.edu.in, "TimeTable_2027_Vigyapti.pdf"). Where a board has not published (or we have
 * not verified) its date sheet, the subject says so and links to the official site instead of guessing.
 */
export type OfficialLink = { label: string; href: string; note: string };
export const OFFICIAL: Record<BoardId, { site: string; links: OfficialLink[] }> = {
  up: {
    site: "https://upmsp.edu.in/",
    links: [
      { label: "Model papers", href: "https://upmsp.edu.in/Board_ModelPaper.aspx", note: "UPMSP model papers for High School and Intermediate" },
      { label: "Question bank", href: "https://upmsp.edu.in/Board_QuestionBank.aspx", note: "UPMSP question bank by subject" },
      { label: "Notices and time table", href: "https://upmsp.edu.in/", note: "Exam schedule, admit card and result notices" },
    ],
  },
  cbse: {
    site: "https://www.cbse.gov.in/",
    links: [
      { label: "Previous years' question papers", href: "https://www.cbse.gov.in/", note: "CBSE main site: Question Papers section" },
      { label: "Sample question papers and marking schemes", href: "https://cbseacademic.nic.in/", note: "CBSE Academic: Sample Question Papers section" },
      { label: "Date sheet and circulars", href: "https://www.cbse.gov.in/", note: "CBSE main site: Circulars and date sheet" },
    ],
  },
  icse: {
    site: "https://cisce.org/",
    links: [
      { label: "Specimen question papers", href: "https://cisce.org/", note: "CISCE: Publications, specimen papers for ICSE and ISC" },
      { label: "Regulations and syllabus", href: "https://cisce.org/", note: "CISCE: Regulations and Syllabuses" },
      { label: "Time table", href: "https://cisce.org/", note: "CISCE: ICSE and ISC examination time table" },
    ],
  },
};
/** The last 20 examination years, newest first. */
export const PAST_YEARS: number[] = Array.from({ length: 20 }, (_, index) => 2025 - index);
/** Where a year's paper is likely to be found. Boards keep recent years online; older ones are often only in print. */
export const archiveNote = (board: BoardId, year: number) =>
  year >= 2018 ? "Usually on the official site" : year >= 2012 ? (board === "cbse" ? "Often on the official site" : "May be archived; check the official site") : "Often only in print: ask your school or the board's regional office";

export type Upcoming = { date: string | null; shift: string | null; paper: string; status: "official" | "awaiting" };
const MORNING = "8:30 am – 11:45 am", EVENING = "2:00 pm – 5:15 pm";
/** UP Board 2027, from the board's notice of 12 October 2026: the whole examination runs 5 to 24 February 2027. */
const UP_2027: Record<ClassId, Record<PackSubject, Upcoming>> = {
  "10": {
    math: { date: "2027-02-13", shift: MORNING, paper: "Mathematics (गणित)", status: "official" },
    physics: { date: "2027-02-17", shift: MORNING, paper: "Science (विज्ञान), including Physics", status: "official" },
    chemistry: { date: "2027-02-17", shift: MORNING, paper: "Science (विज्ञान), including Chemistry", status: "official" },
    english: { date: "2027-02-10", shift: MORNING, paper: "English (अंग्रेजी)", status: "official" },
  },
  "12": {
    math: { date: "2027-02-12", shift: EVENING, paper: "Mathematics (गणित)", status: "official" },
    physics: { date: "2027-02-17", shift: EVENING, paper: "Physics (भौतिक विज्ञान)", status: "official" },
    chemistry: { date: "2027-02-15", shift: EVENING, paper: "Chemistry (रसायन विज्ञान)", status: "official" },
    english: { date: "2027-02-08", shift: EVENING, paper: "English (अंग्रेजी)", status: "official" },
  },
};
export const UPCOMING_WINDOW: Record<BoardId, { title: string; window: string; status: "official" | "awaiting"; source: string }> = {
  up: { title: "UP Board 2027", window: "5 February to 24 February 2027", status: "official", source: "UPMSP notice dated 12 October 2026" },
  cbse: { title: "CBSE 2027", window: "Main examinations have begun in mid-February in recent years", status: "awaiting", source: "Check the CBSE date sheet when it is released" },
  icse: { title: "ICSE / ISC 2027", window: "Examinations have run from mid-February to early April in recent years", status: "awaiting", source: "Check the CISCE time table when it is released" },
};
export const upcomingFor = (board: BoardId, cls: ClassId, subject: PackSubject): Upcoming =>
  board === "up" ? UP_2027[cls][subject] : { date: null, shift: null, paper: "", status: "awaiting" };

/**
 * How often a question of this type has come up in board papers, as a band. It follows the editorial star rating
 * (2001 to 2025), so it is a study guide, never a claim about one specific paper or year.
 */
export const askedBand = (stars: Stars | undefined) =>
  stars === 5 ? "Asked in most years, 2001–2025" : stars === 4 ? "Asked often, 2001–2025" : stars === 3 ? "Asked from time to time, 2001–2025" : null;
