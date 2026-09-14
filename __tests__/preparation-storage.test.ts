/** @jest-environment node */
import { preparationAccess, savePreparations } from "@/lib/server/preparations";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
jest.mock("@/lib/server/auth", () => ({ currentUser: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
const update = jest.fn().mockResolvedValue({ error: null });
beforeEach(() => { jest.mocked(db).mockReturnValue({ auth: { admin: { updateUserById: update } } } as unknown as ReturnType<typeof db>); });
function user(metadata: Record<string, unknown>, email = "student@example.org") { jest.mocked(currentUser).mockResolvedValue({ id: "student", email, email_confirmed_at: "2026-01-01", user_metadata: metadata } as NonNullable<Awaited<ReturnType<typeof currentUser>>>); }
test("metadata cannot grant superadmin status and invalid selections are discarded", async () => {
  user({ isSuperAdmin: true, learning_preparations: ["nda", "forged", "nda", 4] });
  expect(await preparationAccess("student")).toEqual({ selections: ["nda"], isSuperAdmin: false });
  await expect(preparationAccess("someone-else")).rejects.toMatchObject({ status: 401 });
});
test("saved choices preserve other profile metadata and reject empty selection", async () => {
  user({ display_name: "Student" });
  await savePreparations("student", ["neet", "system-design"]);
  expect(update).toHaveBeenCalledWith("student", { user_metadata: { display_name: "Student", learning_preparations: ["neet", "system-design"] } });
  await expect(savePreparations("student", [])).rejects.toThrow();
  await expect(savePreparations("other", ["nda"])).rejects.toMatchObject({ status: 401 });
});
