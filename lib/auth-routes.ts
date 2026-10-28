// Pure route-guard decision, shared by the proxy middleware and kept testable
// on its own. Returns a path to redirect to, or null to let the request through.
import { isSafeRedirect, signInFor } from "@/lib/safe-redirect";

const AUTH_PAGES = ["/sign-in", "/sign-up"];
export function redirectFor({ pathname, search = "", signedIn }: { pathname: string; search?: string; signedIn: boolean }): string | null {
  const onAuthPage = AUTH_PAGES.some(page => pathname === page || pathname.startsWith(`${page}/`));
  // Signed out: sign in, then come back to the page that was asked for (the dashboard home needs no return path).
  if (!signedIn && /^\/(learning|super-admin)(\/|$)/.test(pathname)) return pathname === "/learning" ? "/sign-in" : signInFor(pathname + search);
  if (signedIn && onAuthPage) {
    const back = new URLSearchParams(search).get("redirect");
    return isSafeRedirect(back) ? back : "/learning";
  }
  if (signedIn && pathname === "/") return "/learning";
  return null;
}
