import "server-only";
import { currentUser } from "./auth";
import { db } from "./db";
import { HttpError } from "./http";
import { isSuperAdminUser, PREPARATIONS, type PreparationAccess } from "@/lib/study/preparations";
import { preparationSchema } from "@/lib/study/preparation-schema";

export async function preparationAccess(owner: string): Promise<PreparationAccess> {
  const user = await currentUser();
  if (!user || user.id !== owner) throw new HttpError(401, "signin_required");
  // Preferences are user-editable, never authority for an administrator role or a paid tier.
  // Existing Auth storage avoids making the dashboard depend on an unapplied SQL migration.
  const raw: unknown = user.user_metadata?.learning_preparations;
  const known = new Set(PREPARATIONS.map(option => option.id));
  const saved = Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => typeof id === "string" && known.has(id)))] : [];
  // One membership covers every category: an account that never narrowed its focus sees all
  // of them. Paid access itself is enforced by requireLearningUser / requirePaidAccess.
  const selections = saved.length ? saved : [...known];
  return { selections, isSuperAdmin: isSuperAdminUser(user), focused: saved.length > 0 };
}
export async function savePreparations(owner: string, selections: string[]) {
  const validated = preparationSchema.parse(selections);
  const user = await currentUser();
  if (!user || user.id !== owner) throw new HttpError(401, "signin_required");
  const result = await db().auth.admin.updateUserById(owner, { user_metadata: { ...user.user_metadata, learning_preparations: validated } });
  if (result.error) throw new HttpError(503, "service_error");
}
/**
 * Server-side variant for flows with no browser session (guest checkout fulfilment from the
 * webhook or a guest verify). The caller has already established which account `owner` is.
 */
export async function savePreparationsFor(owner: string, selections: string[]) {
  const validated = preparationSchema.parse(selections);
  const { data, error } = await db().auth.admin.getUserById(owner);
  if (error || !data.user) throw new HttpError(503, "service_error");
  const result = await db().auth.admin.updateUserById(owner, { user_metadata: { ...data.user.user_metadata, learning_preparations: validated } });
  if (result.error) throw new HttpError(503, "service_error");
}
