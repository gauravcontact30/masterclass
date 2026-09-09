import { Curriculum, GenerationRequest } from "@/lib/domain";
export type ContentPage = { title: string; body: string; kind: "cover" | "divider" | "text" | "code"; lesson: number | null };
export function splitText(text: string, max = 550): string[] {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    let index = rest.lastIndexOf("\n", max);
    if (index < max / 2) index = rest.lastIndexOf(" ", max);
    if (index < 1) index = max;
    chunks.push(rest.slice(0,index)); rest = rest.slice(index).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}
export function contentPages(deck: Curriculum, request: GenerationRequest, references: string[]): ContentPage[] {
  const hi = request.language === "hi";
  const level=hi ? {beginner:"शुरुआती",intermediate:"मध्यम",advanced:"उन्नत"}[request.level] : request.level;
  const coverLevel = hi ? level : level.charAt(0).toUpperCase() + level.slice(1);
  const pages: ContentPage[] = [{ title: deck.title, body: hi ? `${coverLevel} स्तर, ${deck.minutes} मिनट` : `${coverLevel} level, ${deck.minutes} minutes`, kind:"cover", lesson:null }];
  const add = (title: string, text: string, lesson: number | null = null, kind: ContentPage["kind"] = "text") => {
    splitText(text,kind === "code" ? 420 : request.format === "pdf" ? 1000 : 550).forEach((body,index) => pages.push({ title: title + (index ? ` (${index+1})` : ""), body, kind, lesson }));
  };
  add(hi ? "आप क्या सीखेंगे" : "What you will learn", deck.objectives.map((s,i)=>`${i+1}. ${s}`).join("\n\n"));
  if(deck.prerequisites.length) add(hi ? "शुरू करने से पहले" : "Before you begin",deck.prerequisites.join("\n\n"));
  add(hi ? "सीखने का क्रम" : "Your learning roadmap",deck.lessons.map((s,i)=>`${i+1}. ${s.title}`).join("\n"));
  deck.lessons.forEach((lesson,i)=>{
    // Each lesson opens on its own divider page, the way a chapter opener works
    // in print. The pages that follow carry section labels instead of repeating
    // the lesson title, so the reader's contents list stays scannable.
    pages.push({ title:lesson.title,body:`${hi?"पाठ":"Lesson"} ${i+1}`,kind:"divider",lesson:i });
    // One field, one page, in both formats — a page of dot-pointed bullets
    // (see render.ts's bulletLines) reads far better than several fields
    // merged under an inline sub-header, which used to only happen for PDF.
    add(hi?"समझें":"The idea",lesson.explanation,i);
    add(hi ? "उदाहरण" : "A worked example",lesson.example,i);
    if(lesson.code) add(hi ? "कोड को समझें" : "Read the code",lesson.code,i,"code");
    add(hi ? "खुद अभ्यास करें" : "Try it yourself",lesson.exercise,i);
    add(hi ? "अपनी समझ जाँचें" : "Check your understanding",lesson.checkpoint,i);
    add(hi ? "इस गलती से बचें" : "Avoid this mistake",lesson.mistake,i);
  });
  add(hi ? "मिनी प्रोजेक्ट" : "Put it together",deck.project);
  add(hi ? "सारांश" : "What to remember",deck.summary);
  add(hi ? "शब्दावली" : "Your glossary",deck.glossary.map(g=>`${g.term}: ${g.definition}`).join("\n\n"));
  if(references.length) add(hi ? "आगे पढ़ें" : "Further reading",references.join("\n\n"));
  return pages;
}
export function escapeHtml(value: string) { return value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!)); }
