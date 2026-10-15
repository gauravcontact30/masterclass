import { TECHNOLOGY_HANDBOOKS } from "../lib/pro-learn/technology-handbooks";
import { aiTerms } from "../lib/pro-learn/ai-glossary";
let total=0, withPts=0;
for (const h of [...TECHNOLOGY_HANDBOOKS].sort((a,b)=>a.title.localeCompare(b.title))) {
  const n=h.topics.length, p=h.topics.filter(t=>t.points?.length).length, prep=h.topics.filter(t=>t.prepared).length, voc=h.topics.filter(t=>t.vocabulary).length;
  total+=n; withPts+=p;
  console.log(`${n}\tpts=${p}\tprep=${prep}\tvoc=${voc}\t${h.title}`);
}
const ai=aiTerms(); console.log(`AI terms ${ai.length} pts=${ai.filter(t=>t.points?.length).length}`);
console.log("total",total,"withPts",withPts);
