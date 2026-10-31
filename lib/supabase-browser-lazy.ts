"use client";
// Screens that only talk to Supabase when the visitor acts (sign in, sign up, forgot and reset password) load the
// client on first use, so supabase-js stays out of the bundle that has to hydrate before the form responds.
let loading: Promise<typeof import("./supabase-browser")> | undefined;

/** Starts (or reuses) the download. Call it on first focus so the client is ready by the time the form is sent. */
export function preloadSupabaseBrowser() {
  return (loading ??= import("./supabase-browser"));
}

export async function browserAuth() {
  return (await preloadSupabaseBrowser()).supabaseBrowser().auth;
}
