import { Activity, Atom, Award, Banknote, Blocks, BookOpen, BookOpenText, BriefcaseBusiness, Building, Calculator, ClipboardList, Cloud, FlaskConical, GraduationCap, Landmark, Languages, Lightbulb, Link2, Magnet, Network, Plane, ReceiptIndianRupee, School, Server, Shield, ShieldCheck, Sigma, Siren, TestTubes, TrainFront, Triangle, Waypoints, Workflow, type LucideIcon } from "lucide-react";
import type { StreamGroup, StreamTech } from "@/lib/streams";

/** One icon per Streams playlist: the rail, the thumbnails, the sidebar and the suggestions all use it. */
export const TECH_ICON: Record<StreamTech, LucideIcon> = {
  nextjs: Triangle, react: Atom, langchain: Link2, langgraph: Network, langsmith: Activity, langflow: Workflow, langserve: Server,
  n8n: Waypoints, aws: Cloud, sysdesign: Blocks,
  "board10-maths": Calculator, "board10-physics": Lightbulb, "board10-chemistry": FlaskConical, "board10-english": BookOpen,
  "board12-maths": Sigma, "board12-physics": Magnet, "board12-chemistry": TestTubes, "board12-english": BookOpenText,
  upsc: Landmark, ias: Award, pcs: Building, ssc: ClipboardList, nda: Shield, defence: Plane, bankpo: Banknote, railways: TrainFront,
  police: Siren, cbi: ShieldCheck, incometax: ReceiptIndianRupee, ctet: School, ca: BriefcaseBusiness,
  ielts: Languages,
};
/** And one per category. */
export const GROUP_ICON: Record<StreamGroup, LucideIcon> = { tech: Blocks, board: GraduationCap, exams: Landmark, ielts: Languages };
