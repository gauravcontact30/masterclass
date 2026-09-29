import { wordQuerySchema } from "@/lib/english-word";
import { lookupEnglishWord } from "@/lib/server/english-word";
import { proLearnRoute } from "@/lib/server/pro-learn-route";

export const runtime = "nodejs";
export const maxDuration = 180;
export const POST = proLearnRoute("word-lookup", wordQuerySchema, (input, signal) => lookupEnglishWord(input.word, signal));
