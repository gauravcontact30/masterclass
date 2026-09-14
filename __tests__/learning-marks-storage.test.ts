/** @jest-environment node */
import { listLearningMarks, removeLearningMark, saveLearningMark } from "@/lib/server/learning-marks";

const mockObjects = new Map<string, string>();
const mockStore = {
  list: jest.fn(async (prefix: string) => ({ data: [...mockObjects.keys()].filter(key => key.startsWith(`${prefix}/`)).map(key => ({ name: key.slice(prefix.length + 1) })), error: null })),
  download: jest.fn(async (path: string) => ({ data: new Blob([mockObjects.get(path)!]), error: null })),
  upload: jest.fn(async (path: string, body: string) => { mockObjects.set(path, body); return { error: null }; }),
  remove: jest.fn(async (paths: string[]) => { paths.forEach(path => mockObjects.delete(path)); return { error: null }; }),
};
const mockStorage = { getBucket: jest.fn(async () => ({ data: { public: false }, error: null })), createBucket: jest.fn(), from: jest.fn(() => mockStore) };
jest.mock("@/lib/server/db", () => ({ db: () => ({ storage: mockStorage }) }));
const mark = { id: "00000000-0000-4000-8000-000000000001", contentKey: "lesson", quote: "hello", prefix: "", suffix: "", start: 0, end: 5, color: "teal" as const, kind: "highlight" as const };
beforeEach(() => { mockObjects.clear(); });
test("edits persist in private cloud objects, load again and are scoped to each owner", async () => {
  await saveLearningMark("alice", mark);
  expect(mockStorage.from).toHaveBeenCalledWith("learning-marks");
  expect(mockStore.upload).toHaveBeenCalledWith(`alice/${mark.id}.json`, expect.any(String), expect.objectContaining({ upsert: true, cacheControl: "0", contentType: "application/json" }));
  expect((await listLearningMarks("alice")).marks[0]).toMatchObject(mark);
  expect((await listLearningMarks("bob")).marks).toHaveLength(0);
  await removeLearningMark("bob", mark.id);
  expect((await listLearningMarks("alice")).marks).toHaveLength(1);
  await removeLearningMark("alice", mark.id);
  expect((await listLearningMarks("alice")).marks).toHaveLength(0);
});
test("owner paths cannot traverse into another account and recoloring preserves record identity", async () => {
  await saveLearningMark("alice/../bob", mark);
  expect([...mockObjects.keys()][0]).toBe(`alice%2F..%2Fbob/${mark.id}.json`);
  await saveLearningMark("alice/../bob", { ...mark, color: "pink" });
  expect(mockObjects.size).toBe(1);
  expect((await listLearningMarks("alice/../bob")).marks[0].color).toBe("pink");
});
