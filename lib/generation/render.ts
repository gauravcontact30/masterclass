import { readFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import PptxGenJS from "pptxgenjs";
import { Curriculum, GenerationRequest } from "@/lib/domain";
import { ContentPage, contentPages, escapeHtml } from "./content";
import { themes } from "./theme";

function pageHtml(page: ContentPage, index: number, count: number, request: GenerationRequest, font: string, slide: boolean) {
  const theme = themes[request.theme];
  return `<!doctype html><html lang="${request.language}"><head><meta charset="utf-8"><style>
  @font-face{font-family:Guide;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#${theme.background};color:#${theme.foreground};font-family:Guide,Arial,sans-serif}
  .page{width:${slide ? 1280 : 794}px;height:${slide ? 720 : 1123}px;padding:${slide ? "62px 76px" : "76px 64px"};position:relative;border-top:10px solid #${theme.accent}}
  .brand{font:16px Arial,sans-serif;letter-spacing:3px;color:#${theme.accent};margin-bottom:${slide ? 32 : 64}px}
  h1{font-size:${page.kind === "cover" ? (slide ? 54 : 46) : (slide ? 40 : 32)}px;line-height:1.35;margin:0 0 30px;overflow-wrap:anywhere}
  .body{font-size:${slide ? 24 : 19}px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}
  .code{font:20px/1.55 Guide,monospace;white-space:pre-wrap;background:#${theme.foreground}0C;padding:24px;border-left:3px solid #${theme.accent}}
  footer{position:absolute;bottom:30px;left:${slide ? 76 : 64}px;right:${slide ? 76 : 64}px;display:flex;justify-content:space-between;font:13px Arial;color:#${theme.muted}}
  </style></head><body><section class="page"><div class="brand">MASTERCLASS / ${request.format.toUpperCase()}</div><h1>${escapeHtml(page.title)}</h1><div class="body ${page.kind === "code" ? "code" : ""}">${escapeHtml(page.body)}</div><footer><span>${request.language === "hi" ? "चरण दर चरण सीखें" : "ONE STEP CLOSER TO MASTERY"}</span><span>${index+1} / ${count}</span></footer></section></body></html>`;
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
      const overflow = await page.evaluate(()=>{ const body=document.querySelector(".body")!.getBoundingClientRect();const footer=document.querySelector("footer")!.getBoundingClientRect();return body.bottom>footer.top-20; });
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
    pptx.layout="LAYOUT_WIDE";pptx.author="Masterclass";pptx.subject=deck.title;pptx.title=deck.title;
    // Use an installed, script-appropriate Office font; PDF embeds the bundled font.
    const officeFont=request.language === "hi" ? "Nirmala UI" : "Arial";
    pptx.theme={ headFontFace:officeFont,bodyFontFace:officeFont };
    const theme=themes[request.theme];
    pages.forEach((item,i)=>{
      const s=pptx.addSlide();s.background={color:theme.background};
      s.addText("MASTERCLASS",{x:0.8,y:0.45,w:11.7,h:0.3,fontSize:16,fontFace:officeFont,charSpacing:3,color:theme.accent,margin:0});
      s.addText(item.title,{x:0.8,y:1.05,w:11.7,h:1.45,fontFace:officeFont,fontSize:item.kind === "cover" ? 50 : 35,bold:true,color:theme.foreground,margin:0,breakLine:false,valign:"middle"});
      s.addText(item.body,{x:0.8,y:2.65,w:11.7,h:3.85,fontFace:officeFont,fontSize:item.kind === "code" ? 18 : 22,color:theme.foreground,margin:0,valign:"top",paraSpaceAfter:12,breakLine:false});
      s.addText(`${i+1} / ${pages.length}`,{x:11.4,y:7,w:1.1,h:0.25,fontFace:officeFont,fontSize:12,color:theme.muted,align:"right",margin:0});
      s.addNotes(`Masterclass lesson ${item.lesson === null ? "overview" : item.lesson+1}. ${item.body}`);
    });
    return { file:Buffer.from(await pptx.write({ outputType:"nodebuffer" }) as Buffer),previews,pages };
  } finally { await browser.close(); }
}
