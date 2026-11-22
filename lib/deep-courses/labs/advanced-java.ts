import type { TopicLab } from "../types";
import { LABS_1 } from "./advanced-java-1";
import { LABS_2 } from "./advanced-java-2";

/** Hands-on labs for Advanced Java, keyed by topic id (see TopicLab). */
export const LABS: Record<string, TopicLab> = { ...LABS_1, ...LABS_2 };
