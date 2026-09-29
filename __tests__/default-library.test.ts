/** @jest-environment node */
import { curriculumSchema, DOCUMENT_FORMAT } from "@/lib/domain";
import { DEFAULT_GUIDES, defaultLibraryRequest } from "@/lib/generation/default-library";
import { NEXTJS_16_INTERVIEW, REACT_19_INTERVIEW } from "@/lib/generation/interview-questions";
import { curriculumNotes } from "@/lib/notes";

const guide = (id: string) => DEFAULT_GUIDES.find(g => g.id === id)!;
const apiNames = (id: string) => guide(id).curriculum.lessons.flatMap(lesson => (lesson.apiReference ?? []).map(api => api.name)).join(" | ");

describe.each(DEFAULT_GUIDES.map(g => [g.id, g] as const))("%s guide", (_id, g) => {
  test("validates against the curriculum schema and has lessons", () => {
    expect(() => curriculumSchema.parse(g.curriculum)).not.toThrow();
    expect(g.curriculum.lessons.length).toBeGreaterThan(0);
  });

  test("is requested as a notes document", () => {
    expect(defaultLibraryRequest(g)).toEqual({ ...g.request, format: DOCUMENT_FORMAT });
  });

  test("notes include every interview question and its similar-question answers", () => {
    const notes = curriculumNotes(g.curriculum, g.curriculum.title, "en");
    for (const item of g.curriculum.lessons.flatMap(lesson => lesson.interview ?? []).slice(0, 5)) {
      expect(notes).toContain(item.question);
      for (const similar of item.similar) expect(notes).toContain(similar.answer);
    }
  });
});

test("guide ids are unique and versions are positive", () => {
  expect(new Set(DEFAULT_GUIDES.map(g => g.id)).size).toBe(DEFAULT_GUIDES.length);
  for (const g of DEFAULT_GUIDES) expect(g.version).toBeGreaterThan(0);
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

test("every interview bank entry belongs to a real lesson, so no question is silently dropped", () => {
  const titles = (id: string) => new Set(guide(id).curriculum.lessons.map(l => l.title));
  for (const title of Object.keys(REACT_19_INTERVIEW)) expect(titles("react-19")).toContain(title);
  for (const title of Object.keys(NEXTJS_16_INTERVIEW)) expect(titles("nextjs-16")).toContain(title);
});
