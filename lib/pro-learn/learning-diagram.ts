import { z } from "zod";

const x = z.number().min(12).max(628);
const y = z.number().min(12).max(348);
const tone = z.enum(["blue", "green", "purple", "orange", "ink"]).default("blue");

// A small drawing vocabulary: model output never becomes markup, URLs or CSS.
export const learningDiagramSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(600),
  elements: z.array(z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("line"), x1: x, y1: y, x2: x, y2: y, arrow: z.boolean().default(false), tone }),
    z.object({ kind: z.literal("circle"), x, y, radius: z.number().min(3).max(120), tone }),
    z.object({ kind: z.literal("rect"), x, y, width: z.number().min(5).max(600), height: z.number().min(5).max(320), tone }),
    z.object({ kind: z.literal("text"), x, y, text: z.string().min(1).max(65), tone }),
  ])).min(3).max(60),
  takeaway: z.string().min(10).max(350),
}).superRefine((diagram, ctx) => {
  diagram.elements.forEach((element, index) => {
    const outside = element.kind === "rect"
      ? element.x + element.width > 640 || element.y + element.height > 360
      : element.kind === "circle"
        ? element.x - element.radius < 0 || element.x + element.radius > 640 || element.y - element.radius < 0 || element.y + element.radius > 360
        : false;
    if (outside) ctx.addIssue({ code: "custom", message: "Keep the shape inside the canvas", path: ["elements", index] });
  });
});

export type LearningDiagram = z.infer<typeof learningDiagramSchema>;
