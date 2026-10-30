import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db, check } from "./db";
import { profile } from "./repository";
import { supabaseServer } from "./auth";

/*
 * Google sign-in run by the app itself (app/api/auth/google → Google → app/api/auth/callback/google), using the OAuth
 * client in CLIENT_ID / CLIENT_SECRET (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET also accepted). That client is registered
 * for <origin>/api/auth/callback/google, and Supabase's own Google provider stays off: once Google vouches for a verified
 * email, the service role finds or creates that Supabase user and mints a one-time magic-link token, and verifying it
 * through the cookie-bound client sets the ordinary Supabase session. Everything downstream (profiles trigger, trial,
 * notifications, proxy, RLS) sees a normal signed-in user.
 */
export const googleClient = () => {
  const id = process.env.GOOGLE_CLIENT_ID ?? process.env.CLIENT_ID, secret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
};
export const GOOGLE_COOKIE = "mc_google_oauth";
export const CALLBACK_PATH = "/api/auth/callback/google";
const base64url = (bytes: Buffer) => bytes.toString("base64url");
export const randomToken = () => base64url(randomBytes(32));
export const pkceChallenge = (verifier: string) => base64url(createHash("sha256").update(verifier).digest());
export function sameToken(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export type GoogleProfile = { sub: string; email: string; name: string; picture: string | null };

/** Trades the authorization code for tokens and checks the ID token. The token comes straight from Google's token
 *  endpoint over TLS (authenticated with the client secret), so its claims are checked rather than its signature
 *  (OpenID Connect Core §3.1.3.7). */
export async function exchangeCode({ code, verifier, nonce, redirectUri }: { code: string; verifier: string; nonce: string; redirectUri: string }): Promise<GoogleProfile> {
  const client = googleClient();
  if (!client) throw new Error("google_not_configured");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, cache: "no-store",
    body: new URLSearchParams({ code, client_id: client.id, client_secret: client.secret, code_verifier: verifier, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const tokens = await response.json().catch(() => ({})) as { id_token?: string; error?: string };
  if (!response.ok || !tokens.id_token) throw new Error(`google_token_${tokens.error ?? response.status}`);
  const claims = JSON.parse(Buffer.from(tokens.id_token.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
  const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  const audienceOk = claims.aud === client.id || (Array.isArray(claims.aud) && claims.aud.includes(client.id));
  const fresh = typeof claims.exp === "number" && claims.exp * 1000 > Date.now();
  if (!issuerOk || !audienceOk || !fresh || !sameToken(String(claims.nonce ?? ""), nonce)) throw new Error("google_token_invalid");
  // Only an address Google has verified may sign in to (or create) the account that owns it.
  if (claims.email_verified !== true || typeof claims.email !== "string" || typeof claims.sub !== "string") throw new Error("google_email_unverified");
  return { sub: claims.sub, email: claims.email.trim().toLowerCase(), name: typeof claims.name === "string" ? claims.name.slice(0, 80) : "", picture: typeof claims.picture === "string" && claims.picture.startsWith("https://") ? claims.picture : null };
}

const accountIdByEmail = async (email: string) => check(await db().rpc("auth_user_id_by_email", { p_email: email })) as string | null;

/** Finds or creates the Supabase user for a verified Google identity, then signs it in on this response's cookies. */
export async function signInWithGoogleProfile(google: GoogleProfile): Promise<{ created: boolean }> {
  const admin = db().auth.admin;
  const metadata = { google_sub: google.sub, ...(google.picture ? { avatar_url: google.picture } : {}) };
  let id = await accountIdByEmail(google.email), created = false;
  if (!id) {
    // full_name rides in the metadata, as at email sign-up; the on_auth_user_created trigger copies it into profiles.
    const { data } = await admin.createUser({ email: google.email, email_confirm: true, user_metadata: { full_name: google.name, ...metadata } });
    id = data?.user?.id ?? await accountIdByEmail(google.email); // a parallel sign-in may have created it first
    if (!id) throw new Error("google_account_failed");
    created = Boolean(data?.user);
    await profile(id);
  } else {
    const { data } = await admin.getUserById(id);
    const user = data?.user;
    const current = (user?.user_metadata ?? {}) as Record<string, unknown>;
    // An address someone registered but never confirmed: Google has now proved who owns it. Confirm it, and replace the
    // unconfirmed password so whoever registered it cannot get in with it. The owner can set their own in Settings.
    const unconfirmed = Boolean(user && !user.email_confirmed_at);
    await admin.updateUserById(id, {
      user_metadata: { ...current, ...metadata, ...(current.full_name ? {} : { full_name: google.name }) },
      ...(unconfirmed ? { email_confirm: true, password: randomToken() } : {}),
    });
  }
  // generateLink only returns the token (it sends no email); verifying it sets the session cookies.
  const { data: link, error: linkError } = await admin.generateLink({ type: "magiclink", email: google.email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) throw new Error(`google_link_${linkError?.code ?? "missing"}`);
  const { error } = await (await supabaseServer()).auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error) throw new Error(`google_session_${error.code ?? error.message}`);
  return { created };
}
