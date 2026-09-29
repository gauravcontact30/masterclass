import { catalogue, type Catalogue } from "../catalogue";
import { MATHS } from "./maths";
import { PHYSICS } from "./physics";
import { CHEMISTRY } from "./chemistry";
import { ENGLISH } from "./english";
import {
  GOVT_DEFENCE, DIPLOMA_POLYTECHNIC, TALENT_OLYMPIADS, NAVODAYA, ENGINEERING,
  MEDICAL_SCIENCES, UNDERGRADUATE_HUMANITIES, LAW, DESIGN_ARCHITECTURE,
  DEFENCE_GOVERNMENT, PROFESSIONAL_SERVICES,
} from "./exams";

/**
 * Class Room: the school syllabus and the exams that follow it.
 *
 * Subjects come first because they are what a student is in the middle of; the
 * exam catalogues follow in the order the user listed them. A subject's
 * categories are its classes, so one tab holds Class 6 through Class 12 and the
 * catalogue's own category strip does the year-to-year navigation. An exam
 * group's categories are its exams, so the same strip switches between SSC MTS
 * and RRB Group D without leaving the tab.
 */
export const CLASSROOM_CATALOGUES: readonly Catalogue[] = [
  catalogue("maths", "Maths", "Every Maths topic from Class 6 to Class 12, chapter by chapter and concept by concept.", "topics",
    "Explain, for a school student,", MATHS),
  catalogue("physics", "Physics", "The physics strand of Science from Class 6 to 10, then Physics proper in Class 11 and 12.", "topics",
    "Explain, for a school physics student,", PHYSICS),
  catalogue("chemistry", "Chemistry", "The chemistry strand of Science from Class 6 to 10, then Chemistry proper in Class 11 and 12.", "topics",
    "Explain, for a school chemistry student,", CHEMISTRY),
  catalogue("english", "English", "Grammar, writing, reading and literature skills from Class 6 to Class 12, board-neutral throughout.", "topics",
    "Explain, for a school English student,", ENGLISH),

  catalogue("govt-defence", "Government Jobs & Defence", "SSC MTS, SSC GD Constable, RRB Group D, Indian Navy MR and Army Agniveer — pattern and full syllabus for each.", "topics",
    "Explain, for a candidate preparing this recruitment exam,", GOVT_DEFENCE),
  catalogue("diploma-polytechnic", "Diploma & Polytechnic", "State polytechnic and POLYCET entrance tests for diploma engineering admission after Class 10.", "topics",
    "Explain, for a polytechnic entrance candidate,", DIPLOMA_POLYTECHNIC),
  catalogue("talent-olympiads", "Talent Search & Olympiads", "NSO, IMO and NSTSE — the foundational aptitude and diagnostic tests taken alongside school.", "topics",
    "Explain, for an olympiad candidate,", TALENT_OLYMPIADS),
  catalogue("navodaya", "Navodaya (JNV) Exams", "JNVST entry at Class 6, and lateral entry at Class 9 and Class 11.", "topics",
    "Explain, for a Jawahar Navodaya Vidyalaya entrance candidate,", NAVODAYA),
  catalogue("engineering", "Engineering & Technology", "JEE Main, JEE Advanced, BITSAT and the state and private engineering tests.", "topics",
    "Explain, for an engineering entrance candidate,", ENGINEERING),
  catalogue("medical-sciences", "Medical & Sciences", "NEET UG for medical admission and IISER IAT for the integrated BS-MS science degree.", "topics",
    "Explain, for a medical or science entrance candidate,", MEDICAL_SCIENCES),
  catalogue("undergraduate-humanities", "General UG & Humanities", "CUET UG — the centralised entrance for Bachelor's programmes across central, state and private universities.", "topics",
    "Explain, for a CUET UG candidate,", UNDERGRADUATE_HUMANITIES),
  catalogue("law", "Law", "CLAT and AILET for five-year integrated law programmes at the National Law Universities.", "topics",
    "Explain, for a law entrance candidate,", LAW),
  catalogue("design-architecture", "Design & Architecture", "NID DAT, the NIFT entrance and UCEED — the aptitude tests for design education.", "topics",
    "Explain, for a design entrance candidate,", DESIGN_ARCHITECTURE),
  catalogue("defence-government", "Defence & Government", "NDA and NA — UPSC's direct entry to the armed forces after Class 12, including the SSB interview.", "topics",
    "Explain, for an NDA candidate,", DEFENCE_GOVERNMENT),
  catalogue("professional-services", "Civil Services & Professions", "UPSC Civil Services, GATE, NEET PG, CAT and the CA, CS and CMA finance qualifications.", "topics",
    "Explain, for a candidate preparing this professional examination,", PROFESSIONAL_SERVICES),
];
