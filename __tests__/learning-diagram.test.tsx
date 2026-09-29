import { render, screen } from "@testing-library/react";
import { LearningDiagram } from "@/components/learning-diagram";
import { learningDiagramSchema } from "@/lib/pro-learn/learning-diagram";

const drawing = {
  title: "Force and acceleration", description: "A 2 kg block accelerates right under a 6 N net force.",
  elements: [
    { kind: "rect", x: 80, y: 100, width: 120, height: 80, tone: "blue" },
    { kind: "line", x1: 200, y1: 140, x2: 400, y2: 140, arrow: true, tone: "green" },
    { kind: "text", x: 250, y: 120, text: "F = 6 N", tone: "ink" },
  ], takeaway: "Using a = F/m gives an acceleration of 3 m/s².",
};

test("renders a factual labeled drawing with an accessible description and unique arrow references", () => {
  const diagram = learningDiagramSchema.parse(drawing);
  const { container } = render(<><LearningDiagram diagram={diagram} /><LearningDiagram diagram={diagram} /></>);
  expect(screen.getAllByRole("img", { name: /Force and acceleration/ })).toHaveLength(2);
  expect(screen.getAllByText("F = 6 N")).toHaveLength(2);
  const arrows = Array.from(container.querySelectorAll("line"), line => line.getAttribute("marker-end"));
  expect(arrows[0]).not.toBe(arrows[1]);
});

test("rejects executable elements and geometry outside the canvas", () => {
  expect(learningDiagramSchema.safeParse({ ...drawing, elements: [...drawing.elements, { kind: "script", text: "alert(1)" }] }).success).toBe(false);
  expect(learningDiagramSchema.safeParse({ ...drawing, elements: [...drawing.elements, { kind: "circle", x: 620, y: 120, radius: 100 }] }).success).toBe(false);
});

test("model-provided text is rendered literally, never as HTML", () => {
  const diagram = learningDiagramSchema.parse({ ...drawing, elements: [...drawing.elements, { kind: "text", x: 20, y: 200, text: '<script>alert(1)</script>' }] });
  const { container } = render(<LearningDiagram diagram={diagram} />);
  expect(container.querySelector("script")).toBeNull();
  expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
});
