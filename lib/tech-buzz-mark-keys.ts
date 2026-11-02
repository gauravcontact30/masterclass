/** Shared by the browser store (lib/tech-buzz-marks.ts) and the server, so a follow means the same key on both sides. */
export const MARK_KINDS = ["save", "topic", "author", "repost", "hide", "less", "mute_topic", "mute_author", "pref"] as const;
export type MarkKind = (typeof MARK_KINDS)[number];

export const markKey = (name: string) => name.trim().toLowerCase().slice(0, 200);

/** The `pref` mark set when a reader turned highlights off. */
export const HIDE_HIGHLIGHTS = "hide-highlights";
