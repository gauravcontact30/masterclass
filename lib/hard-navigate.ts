/**
 * A full page navigation (not a client-router transition). Its own module so tests can observe it.
 * It replaces the current entry: the page navigated from (sign in, sign up) then leaves history, so Back from the
 * dashboard does not land on a page that only redirects forward again, which made Back look broken.
 */
export function hardNavigate(url: string) { window.location.replace(url); }
