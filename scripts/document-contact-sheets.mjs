import { createCanvas,loadImage,DOMMatrix,ImageData,Path2D } from "@napi-rs/canvas";
import { readFile,writeFile } from "node:fs/promises";
import { join } from "node:path";
globalThis.DOMMatrix=DOMMatrix;globalThis.ImageData=ImageData;globalThis.Path2D=Path2D;
const {getDocument}=await import("pdfjs-dist/legacy/build/pdf.mjs");
const root=process.env.DOCUMENT_QA_DIR;if(!root)throw new Error("Set DOCUMENT_QA_DIR");
for(const lang of ["en","hi"]){
 const task=getDocument({data:new Uint8Array(await readFile(join(root,`${lang}-pdf.pdf`)))});const pdf=await task.promise;
 const images=[];
 for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const viewport=page.getViewport({scale:1});const canvas=createCanvas(viewport.width,viewport.height);await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;const bytes=canvas.toBuffer("image/png");await writeFile(join(root,`${lang}-actual-pdf-${i}.png`),bytes);images.push(bytes);}
 await task.destroy();
 async function sheet(images,name){const canvas=createCanvas(1200,Math.ceil(images.length/4)*230);const ctx=canvas.getContext("2d");ctx.fillStyle="#dedee6";ctx.fillRect(0,0,canvas.width,canvas.height);for(let i=0;i<images.length;i++){const img=await loadImage(images[i]);const width=280,height=205;const scale=Math.min(width/img.width,height/img.height);ctx.drawImage(img,10+(i%4)*300,10+Math.floor(i/4)*230,img.width*scale,img.height*scale);ctx.fillStyle="#171726";ctx.font="12px sans-serif";ctx.fillText(String(i+1),10+(i%4)*300,225+Math.floor(i/4)*230);}await writeFile(join(root,name),canvas.toBuffer("image/png"));}
 await sheet(images,`${lang}-pdf-contact.png`);
 const slides=[];for(let i=1;i<=26;i++)slides.push(await readFile(join(root,`${lang}-powerpoint`,`Slide${i}.PNG`)));
 await sheet(slides,`${lang}-pptx-contact.png`);
 console.log(`${lang}: actual PDF pages and PowerPoint contact sheets rendered.`);
}
