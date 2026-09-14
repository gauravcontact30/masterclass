import "server-only";
import { currentUser } from "./auth";
import { db } from "./db";
import { HttpError } from "./http";
import { isSuperAdminUser, preparationSchema, PREPARATIONS, type PreparationAccess } from "@/lib/study/preparations";

export async function preparationAccess(owner: string): Promise<PreparationAccess> {
  const user = await currentUser();
  if (!user || user.id !== owner) throw new HttpError(401, "signin_required");
  // Preferences are user-editable, never authority for an administrator role or a paid tier.
  // Existing Auth storage avoids making the dashboard depend on an unapplied SQL migration.
  const raw: unknown = user.user_metadata?.learning_preparations;
  const known = new Set(PREPARATIONS.map(option => option.id));
  const selections = Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => typeof id === "string" && known.has(id)))] : [];
  return { selections, isSuperAdmin: isSuperAdminUser(user) };
}
export async function savePreparations(owner: string, selections: string[]) {
  const validated = preparationSchema.parse(selections);
  const user = await currentUser();
  if (!user || user.id !== owner) throw new HttpError(401, "signin_required");
  const result = await db().auth.admin.updateUserById(owner, { user_metadata: { ...user.user_metadata, learning_preparations: validated } });
  if (result.error) throw new HttpError(503, "service_error");
}
