/** A full page navigation (not a client-router transition). Its own module so tests can observe it. */
export function hardNavigate(url: string) { window.location.assign(url); }
