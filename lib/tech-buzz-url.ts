"use client";

/*
 * The feed's filters in the URL (?q=, ?feed=, ?topic=, ?tag=), shared by the Tech Buzz header, its side menu and the
 * feed. They are read in the browser so the feed stays prerendered. Next's own navigation does not announce a change
 * of search params, so writes here do.
 */
const URL_EVENT = "tech-buzz:url";

export const subscribeUrl = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_EVENT, onChange);
  return () => { window.removeEventListener("popstate", onChange); window.removeEventListener(URL_EVENT, onChange); };
};
export const urlParam = (name: string) => new URLSearchParams(window.location.search).get(name);
export const onFeedPage = () => window.location.pathname === "/tech-buzz";

/** Changes the feed's params in place, for what should not add a history entry (typing a search, clearing filters). */
export function replaceFeedParams(patch: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [name, value] of Object.entries(patch)) { if (value) params.set(name, value); else params.delete(name); }
  const search = params.toString();
  window.history.replaceState(null, "", search ? `/tech-buzz?${search}` : "/tech-buzz");
  window.dispatchEvent(new Event(URL_EVENT));
}

/** A link to a feed view: on the feed itself it changes the view without leaving the page. Returns true when handled. */
export function openFeedView(href: string) {
  if (!onFeedPage()) return false;
  window.history.pushState(null, "", href);
  window.dispatchEvent(new Event(URL_EVENT));
  window.scrollTo({ top: 0 });
  return true;
}
