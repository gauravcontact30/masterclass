/** @jest-environment node */
import { curriculumSchema, InterviewQuestion } from "@/lib/domain";
import { contentPages } from "@/lib/generation/content";
import { DEFAULT_GUIDES, defaultLibraryRequest } from "@/lib/generation/default-library";
import { NEXTJS_16_INTERVIEW, REACT_19_INTERVIEW } from "@/lib/generation/interview-questions";
import { curriculumNotes } from "@/lib/notes";

const guide = (id: string) => DEFAULT_GUIDES.find(g => g.id === id)!;
const apiNames = (id: string) => guide(id).curriculum.lessons.flatMap(lesson => (lesson.apiReference ?? []).map(api => api.name)).join(" | ");

describe.each(DEFAULT_GUIDES.map(g => [g.id, g] as const))("%s guide", (_id, g) => {
  test("validates against the curriculum schema", () => {
    expect(() => curriculumSchema.parse(g.curriculum)).not.toThrow();
  });

  test("every lesson carries every rich section", () => {
    for (const lesson of g.curriculum.lessons) {
      expect({ title: lesson.title, diagram: Boolean(lesson.diagram), useCase: Boolean(lesson.useCase), code: lesson.code.length > 0 }).toEqual({ title: lesson.title, diagram: true, useCase: true, code: true });
      expect(lesson.keyPoints!.length).toBeGreaterThanOrEqual(5);
      expect(new Set(lesson.keyPoints!.map(p => p.tone)).size).toBe(3);
      expect(lesson.apiReference!.length).toBeGreaterThanOrEqual(1);
      expect(lesson.vocabulary!.length).toBeGreaterThanOrEqual(5);
      expect(lesson.vocabulary!.length).toBeLessThanOrEqual(6);
      expect(lesson.interview!.length).toBeGreaterThanOrEqual(2);
      lesson.interview!.forEach((q: InterviewQuestion) => expect(q.similar.length).toBeGreaterThanOrEqual(1));
    }
  });

  test("stays within the renderer's page budget in both formats", () => {
    for (const format of ["pdf", "pptx"] as const) {
      const pages = contentPages(g.curriculum, defaultLibraryRequest(g, format), (g.curriculum.sources ?? []).map(s => s.url));
      expect(pages.length).toBeLessThan(900);
      expect(pages.filter(p => p.kind === "interview").length).toBeGreaterThanOrEqual(g.curriculum.lessons.length * 2);
    }
  });

  test("notes include interview questions and similar-question answers", () => {
    const notes = curriculumNotes(g.curriculum, g.curriculum.title, "en");
    const first = g.curriculum.lessons[0].interview![0];
    expect(notes).toContain(first.question);
    expect(notes).toContain(first.similar[0].answer);
  });
});

test("the React guide documents every built-in Hook and the React 19 APIs", () => {
  const names = apiNames("react-19");
  for (const hook of ["useState", "useReducer", "useContext", "useRef", "useImperativeHandle", "useEffect", "useLayoutEffect", "useInsertionEffect", "useEffectEvent", "useMemo", "useCallback", "useTransition", "useDeferredValue", "useId", "useDebugValue", "useSyncExternalStore", "useActionState", "useOptimistic", "useFormStatus", "use", "Activity", "ViewTransition"]) {
    expect(names).toMatch(new RegExp(`(^|[ |])${hook}($|[ |,])`));
  }
});

test("the Next.js guide documents every Next.js 16 hook", () => {
  const names = apiNames("nextjs-16");
  for (const hook of ["usePathname", "useSearchParams", "useParams", "useRouter", "useLinkStatus", "useSelectedLayoutSegment", "useSelectedLayoutSegments", "useReportWebVitals", "useOffline"]) {
    expect(names.split(" | ")).toContain(hook);
  }
});

test("interview banks match lesson titles exactly, so no lesson silently loses its questions", () => {
  expect(Object.keys(REACT_19_INTERVIEW).sort()).toEqual(guide("react-19").curriculum.lessons.map(l => l.title).sort());
  expect(Object.keys(NEXTJS_16_INTERVIEW).sort()).toEqual(guide("nextjs-16").curriculum.lessons.map(l => l.title).sort());
});

test("slides split each interview question into an answer slide and a practice slide", () => {
  const react = guide("react-19");
  const slides = contentPages(react.curriculum, defaultLibraryRequest(react, "pptx"), []).filter(p => p.kind === "interview");
  expect(slides.map(p => p.part).slice(0, 2)).toEqual(["answer", "practice"]);
  const pdf = contentPages(react.curriculum, defaultLibraryRequest(react, "pdf"), []).filter(p => p.kind === "interview");
  expect(new Set(pdf.map(p => p.part))).toEqual(new Set(["all"]));
});
