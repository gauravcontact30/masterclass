import { readFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import PptxGenJS from "pptxgenjs";
import { Curriculum, GenerationRequest } from "@/lib/domain";
import { ContentPage, contentPages, escapeHtml } from "./content";
import { DocumentTheme, themes } from "./theme";

/**
 * Content is authored point-wise (see provider.ts's prompt): every line of a
 * lesson's explanation, example, exercise, checkpoint and mistake starts with
 * "- ". Detecting that here, rather than baking bullets into the schema,
 * keeps content.ts untouched and still degrades gracefully for prose fields
 * (project, summary) or any older cached document that predates this prompt.
 */
function bulletLines(text: string): string[] | null {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || !lines.every(l => /^[-•]\s/.test(l))) return null;
  return lines.map(l => l.replace(/^[-•]\s*/, ""));
}

/*
 * Four page archetypes rather than one template: cover, divider (a lesson
 * opener), text and code. Each theme also carries a motif — generated geometry
 * drawn as inline SVG on the pages that have room for it. Nothing here loads
 * over the network; the browser aborts every request that is not a data: URI.
 */

/** Deterministic geometry per theme, seeded on the page index so no two openers match. */
function motif(theme: DocumentTheme, seed: number, slide: boolean): string {
  const w = slide ? 1280 : 794, h = slide ? 720 : 1123;
  const shift = (seed * 37) % 90;
  if (theme.motif === "grid") {
    const dots = Array.from({ length: 7 * 5 }, (_, i) => {
      const cx = w - 210 + (i % 7) * 30, cy = 96 + Math.floor(i / 7) * 30;
      return `<circle cx="${cx}" cy="${cy}" r="${(i + seed) % 4 === 0 ? 5 : 2.4}" fill="#${theme.accent}" opacity="${(i + seed) % 4 === 0 ? ".55" : ".25"}"/>`;
    }).join("");
    return `<svg class="motif" viewBox="0 0 ${w} ${h}" aria-hidden="true">${dots}<rect x="${w - 212}" y="${h - 150 - shift}" width="150" height="3" fill="#${theme.accent2}" opacity=".8"/></svg>`;
  }
  if (theme.motif === "arcs") {
    const arcs = [0, 1, 2, 3].map(i => {
      const r = 120 + i * 54;
      return `<circle cx="${w - 70}" cy="${110 + shift}" r="${r}" fill="none" stroke="#${i === 1 ? theme.accent2 : theme.accent}" stroke-width="${i === 1 ? 3 : 1.2}" opacity="${i === 1 ? ".7" : ".28"}"/>`;
    }).join("");
    return `<svg class="motif" viewBox="0 0 ${w} ${h}" aria-hidden="true">${arcs}</svg>`;
  }
  const lines = Array.from({ length: 22 }, (_, i) => {
    const y = 70 + i * 15 + (shift % 15);
    return `<rect x="${w - 40 - ((i * 53 + seed * 29) % 300 + 60)}" y="${y}" width="${(i * 53 + seed * 29) % 300 + 60}" height="2" fill="#${i % 5 === 0 ? theme.accent2 : theme.accent}" opacity="${i % 5 === 0 ? ".7" : ".2"}"/>`;
  }).join("");
  return `<svg class="motif" viewBox="0 0 ${w} ${h}" aria-hidden="true">${lines}</svg>`;
}

function pageHtml(page: ContentPage, index: number, count: number, request: GenerationRequest, font: string, slide: boolean) {
  const theme = themes[request.theme];
  const pad = slide ? "62px 76px" : "76px 64px";
  const opener = page.kind === "cover" || page.kind === "divider";
  const foot = request.language === "hi" ? "चरण दर चरण सीखें" : "One step closer to mastery";
  const bullets = page.kind === "text" ? bulletLines(page.body) : null;
  const bodyInner = bullets
    ? `<ul class="bullets">${bullets.map(line => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : escapeHtml(page.body);
  const body = page.kind === "divider"
    ? `<p class="opener-label">${escapeHtml(page.body)}</p>`
    : `<div class="body ${page.kind === "code" ? "code" : ""}">${bodyInner}</div>`;
  const mark = page.kind === "divider" ? `<div class="opener-mark">${String((page.lesson ?? 0) + 1).padStart(2, "0")}</div>` : "";
  // Openers centre their block in the space under the brand rather than
  // stacking at the top, which otherwise leaves a page mostly empty.
  const content = opener
    ? `<div class="opener-body">${mark}<h1>${escapeHtml(page.title)}</h1>${body}</div>`
    : `<h1>${escapeHtml(page.title)}</h1>${body}`;
  return `<!doctype html><html lang="${request.language}"><head><meta charset="utf-8"><style>
  @font-face{font-family:Guide;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}
  body{margin:0;background:#${theme.background};color:#${theme.foreground};font-family:Guide,Arial,sans-serif}
  .page{width:${slide ? 1280 : 794}px;height:${slide ? 720 : 1123}px;padding:${pad};position:relative;overflow:hidden;display:flex;flex-direction:column}
  .motif{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  .rule{position:absolute;top:0;left:0;right:0;height:10px;background:#${theme.accent}}
  .rule i{position:absolute;top:0;left:0;height:10px;width:${opener ? 62 : 24}%;background:#${theme.accent2}}
  .brand{position:relative;font:16px Arial,sans-serif;letter-spacing:3px;color:#${theme.accent};margin-bottom:${slide ? 30 : 58}px}
  h1{position:relative;font-size:${page.kind === "cover" ? (slide ? 62 : 56) : opener ? (slide ? 46 : 42) : (slide ? 40 : 32)}px;line-height:1.22;margin:0 0 26px;overflow-wrap:anywhere;letter-spacing:-1px}
  .opener-body{margin-block:auto;position:relative;padding-bottom:${slide ? 20 : 60}px}
  .opener-label{position:relative;font:${slide ? 22 : 19}px Arial,sans-serif;letter-spacing:2px;color:#${theme.muted};margin:0}
  .opener-mark{position:relative;font-size:${slide ? 150 : 168}px;line-height:.74;font-weight:700;color:#${theme.accent};opacity:.16;margin-bottom:${slide ? 12 : 10}px;letter-spacing:-6px}
  .body{position:relative;font-size:${slide ? 24 : 19}px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere;max-width:${slide ? "none" : "62ch"};border-left:3px solid #${theme.accent}33;padding-left:${slide ? 26 : 22}px}
  .bullets{list-style:none;margin:0;padding:0;display:grid;gap:${slide ? 16 : 13}px;white-space:normal}
  .bullets li{position:relative;padding-left:${slide ? 30 : 24}px}
  .bullets li::before{content:"";position:absolute;left:0;top:.55em;width:${slide ? 9 : 7}px;height:${slide ? 9 : 7}px;border-radius:50%;background:#${theme.accent2}}
  .code{font-family:Guide,monospace;font-size:${slide ? 20 : 17}px;line-height:1.55;background:#${theme.surface};border-left:3px solid #${theme.accent};padding:${slide ? 26 : 22}px}
  footer{position:absolute;bottom:30px;left:${slide ? 76 : 64}px;right:${slide ? 76 : 64}px;display:flex;justify-content:space-between;font:13px Arial;color:#${theme.muted}}
  </style></head><body><section class="page">
  <div class="rule"><i></i></div>${opener ? motif(theme, index, slide) : ""}
  <div class="brand">MASTERCLASS</div>
  ${content}
  <footer><span>${foot}</span><span>${index + 1} / ${count}</span></footer>
  </section></body></html>`;
}

export async function renderDocuments(deck: Curriculum, request: GenerationRequest, references: string[], config: { executablePath: string; fontPath: string }) {
  const pages = contentPages(deck,request,references);
  if(pages.length>500) throw new Error("Document too large");
  const font = (await readFile(config.fontPath)).toString("base64");
  const browser = await puppeteer.launch({ executablePath:config.executablePath, headless:true });
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request",request=>{ if(request.url().startsWith("data:") || request.url()==="about:blank") void request.continue(); else void request.abort(); });
    const previews: Buffer[] = [];
    const slide = request.format === "pptx";
    await page.setViewport({ width:slide ? 1280 : 794,height:slide ? 720 : 1123,deviceScaleFactor:1 });
    for(let i=0;i<pages.length;i++) {
      await page.setContent(pageHtml(pages[i],i,pages.length,request,font,slide));
      await page.evaluate(()=>document.fonts.ready);
      // Opener pages carry no .body block, so a missing element is not an overflow.
      const overflow = await page.evaluate(()=>{ const block=document.querySelector(".body");const footer=document.querySelector("footer");if(!block||!footer)return false;return block.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-20; });
      if(overflow) throw new Error(`Document layout overflow on page ${i+1}`);
      previews.push(Buffer.from(await page.screenshot({ type:"png" })));
    }
    if(request.format === "pdf") {
      // Keep selectable text and embedded Devanagari font in the actual PDF.
      const html = pages.map((p,i)=>pageHtml(p,i,pages.length,request,font,false));
      const first = html[0];
      const styles = first.slice(first.indexOf("<style>"),first.indexOf("</style>")+8);
      const sections = html.map(h=>h.slice(h.indexOf("<section"),h.indexOf("</section>")+10)).join("");
      await page.setContent(`<html lang="${request.language}"><head>${styles}<style>@page{size:A4;margin:0}.page{break-after:page}.page:last-child{break-after:auto}</style></head><body>${sections}</body></html>`);
      await page.evaluate(()=>document.fonts.ready);
      const file = Buffer.from(await page.pdf({ preferCSSPageSize:true,printBackground:true,timeout:60000 }));
      return { file,previews,pages };
    }
    const pptx = new PptxGenJS();
    pptx.layout="LAYOUT_WIDE";pptx.author="MasterClass";pptx.subject=deck.title;pptx.title=deck.title;
    // Use an installed, script-appropriate Office font; PDF embeds the bundled font.
    const officeFont=request.language === "hi" ? "Nirmala UI" : "Arial";
    pptx.theme={ headFontFace:officeFont,bodyFontFace:officeFont };
    const theme=themes[request.theme];
    // Mirrors bulletLines() above: point-wise content becomes real PowerPoint
    // bullet paragraphs (native bullet glyphs, one per line) instead of one
    // run of unbulleted text.
    const pptxBody=(text:string,color:string):string|PptxGenJS.TextProps[]=>{
      const points=bulletLines(text);
      if(!points)return text;
      return points.map(line=>({ text:line,options:{ bullet:{code:"25CF",indent:18},color } }));
    };
    pages.forEach((item,i)=>{
      const opener=item.kind==="cover"||item.kind==="divider";
      const s=pptx.addSlide();s.background={color:theme.background};
      // The same head rule and geometry as the HTML pages, rebuilt with native shapes.
      s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.14,fill:{color:theme.accent}});
      s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:opener?8.2:3.2,h:0.14,fill:{color:theme.accent2}});
      if(opener) for(let ring=0;ring<3;ring++) s.addShape(pptx.ShapeType.ellipse,{x:10.4+ring*0.34,y:0.7+ring*0.34,w:2.6-ring*0.68,h:2.6-ring*0.68,fill:{type:"solid",color:theme.background},line:{color:ring===1?theme.accent2:theme.accent,width:ring===1?2:1}});
      s.addText("MASTERCLASS",{x:0.8,y:0.45,w:11.7,h:0.3,fontSize:16,fontFace:officeFont,charSpacing:3,color:theme.accent,margin:0});
      if(item.kind==="divider") s.addText(String((item.lesson??0)+1).padStart(2,"0"),{x:0.78,y:0.95,w:3,h:1.3,fontFace:officeFont,fontSize:88,bold:true,color:theme.accent,transparency:86,margin:0});
      s.addText(item.title,{x:0.8,y:item.kind==="divider"?2.2:1.05,w:11.7,h:1.45,fontFace:officeFont,fontSize:item.kind==="cover"?50:item.kind==="divider"?40:35,bold:true,color:theme.foreground,margin:0,breakLine:false,valign:"middle"});
      if(item.kind==="code") s.addShape(pptx.ShapeType.rect,{x:0.8,y:2.55,w:11.7,h:4.05,fill:{color:theme.surface},line:{color:theme.accent,width:2}});
      const bodyColor=item.kind==="divider"?theme.muted:theme.foreground;
      s.addText(item.kind==="text"?pptxBody(item.body,bodyColor):item.body,{x:item.kind==="code"?1.05:0.8,y:item.kind==="divider"?3.5:2.65,w:item.kind==="code"?11.2:11.7,h:item.kind==="divider"?0.6:3.85,fontFace:officeFont,fontSize:item.kind==="code"?18:item.kind==="divider"?19:22,color:bodyColor,charSpacing:item.kind==="divider"?2:0,margin:0,valign:"top",paraSpaceAfter:14,lineSpacingMultiple:1.3,breakLine:false});
      s.addText(`${i+1} / ${pages.length}`,{x:11.4,y:7,w:1.1,h:0.25,fontFace:officeFont,fontSize:12,color:theme.muted,align:"right",margin:0});
      s.addNotes(`MasterClass lesson ${item.lesson === null ? "overview" : item.lesson+1}. ${item.body}`);
    });
    return { file:Buffer.from(await pptx.write({ outputType:"nodebuffer" }) as Buffer),previews,pages };
  } finally { await browser.close(); }
}
