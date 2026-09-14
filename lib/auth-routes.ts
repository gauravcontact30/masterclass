// Pure route-guard decision, shared by the proxy middleware and kept testable
// on its own. Returns a path to redirect to, or null to let the request through.
const AUTH_PAGES = ["/sign-in", "/sign-up"];
export function redirectFor({ pathname, signedIn }: { pathname: string; signedIn: boolean }): string | null {
  const onAuthPage = AUTH_PAGES.some(page => pathname === page || pathname.startsWith(`${page}/`));
  if (!signedIn && pathname.startsWith("/dashboard")) return "/sign-in";
  if (signedIn && (onAuthPage || pathname === "/")) return "/dashboard";
  return null;
}
