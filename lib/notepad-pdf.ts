import { notepadDocument } from "./notepad";

/** A safe download name: letters, digits, dots and dashes; "document" when nothing is left. */
const fileName = (title: string) => title.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "document";

/**
 * Downloads a Notepad document as a PDF file. The document is laid out exactly as the HTML export (paper colour,
 * tables, images, diagrams) inside an off-screen frame, so its styles never touch the page, then jsPDF paginates it
 * onto A4. jsPDF (and its html2canvas renderer) load only when a PDF is requested.
 */
export async function downloadNotepadPdf(title: string, html: string, background?: string) {
  const { jsPDF } = await import("jspdf");
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:800px;height:1100px;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(frame);
  try {
    const doc = frame.contentDocument;
    if (!doc) throw new Error("Could not prepare the PDF.");
    doc.open();
    doc.write(notepadDocument(title, html, background));
    doc.close();
    // The page width is set by the PDF, so the document drops its centred 800px column and outer margin.
    doc.body.style.margin = "0";
    doc.body.style.maxWidth = "none";
    await Promise.all([...doc.images].map(image => image.complete ? null : new Promise(done => { image.onload = image.onerror = done; })));
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setProperties({ title: title || "Untitled document", creator: "MasterClass Notepad" });
    const margin = 36;
    await pdf.html(doc.body, { margin, autoPaging: "text", width: pdf.internal.pageSize.getWidth() - margin * 2, windowWidth: 800 });
    pdf.save(`${fileName(title)}.pdf`);
  } finally {
    frame.remove();
  }
}
