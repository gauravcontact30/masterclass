import type { TopicLab } from "../types";
import { LABS_1 } from "./core-java-1";
import { LABS_2 } from "./core-java-2";
import { LABS_3 } from "./core-java-3";

/** Hands-on labs for Core Java, keyed by topic id (see TopicLab). */
export const LABS: Record<string, TopicLab> = { ...LABS_1, ...LABS_2, ...LABS_3 };
