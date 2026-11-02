"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  ArrowLeft, Bookmark, BookmarkCheck, Check, ChevronRight, CirclePause, CirclePlay, EyeOff, Flag, Highlighter, Link2, MessageCircle, MoreHorizontal, Plus, Printer, Repeat2, Share, ThumbsDown, UserCheck, UserPlus, UserX, VolumeX,
} from "lucide-react";
import { setExclusiveMark, setMark, useMarks, type MarkResult } from "@/lib/tech-buzz-marks";
import type { TechBuzzTopicInfo } from "@/lib/tech-buzz-public";
import { HIDE_HIGHLIGHTS, markKey } from "@/lib/tech-buzz-mark-keys";
import { ClapButton, type Claps } from "./clap-button";
import styles from "./tech-buzz-story-bar.module.css";

/*
 * The reader actions at the top of an opened Tech Buzz story: topic chips to follow, the author's follow button and the
 * action dock (clap, discussion, repost, save, listen, share, more). Every choice is stored on the reader's account
 * through lib/tech-buzz-marks.ts. Results come back through `onResult`, so the page shows one toast for all of them.
 */
export type ResultHandler = (result: MarkResult, done?: string) => void;

const compact = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const storiesLabel = (count: number) => `${count} ${count === 1 ? "story" : "stories"}`;

/**
 * The story's topics: the ring follows a topic, the name opens every story on it. On screens with a pointer a card
 * previews the topic on hover or focus, and one button follows them all.
 */
export function TopicChips({ topics, onResult }: { topics: TechBuzzTopicInfo[]; onResult: ResultHandler }) {
  const followed = useMarks("topic");
  if (!topics.length) return null;
  const unfollowed = topics.filter(({ tag }) => !followed[markKey(tag)]);
  const followTopic = (tag: string, on: boolean) => setExclusiveMark("topic", "mute_topic", markKey(tag), !on).then(result => onResult(result, on ? `Unfollowed ${tag}` : `Following ${tag}. New stories appear in your Following feed.`));
  const followAll = async () => {
    const allFollowed = unfollowed.length === 0;
    const targets = allFollowed ? topics : unfollowed;
    for (const { tag } of targets) {
      const result = await setExclusiveMark("topic", "mute_topic", markKey(tag), !allFollowed);
      if (result !== "ok") { onResult(result); return; }
    }
    onResult("ok", allFollowed ? "Unfollowed these topics" : "Following these topics. New stories appear in your Following feed.");
  };
  return <ul className={styles.chips} aria-label="Topics in this story">
    {topics.map(({ tag, count, stories }) => {
      const on = !!followed[markKey(tag)];
      const href = `/tech-buzz?tag=${encodeURIComponent(tag)}`;
      return <li key={tag} className={styles.chip} data-on={on || undefined}>
        <button type="button" className={styles.chipToggle} aria-pressed={on} aria-label={`${on ? "Unfollow" : "Follow"} topic ${tag}`} title={on ? `Following ${tag}` : `Follow ${tag}`} onClick={() => followTopic(tag, on)}>
          <span className={styles.chipRing}>{on ? <Check size={11} strokeWidth={3} aria-hidden="true" /> : <Plus size={11} strokeWidth={2.5} aria-hidden="true" />}</span>
        </button>
        <Link href={href} className={styles.chipName}>{tag}<small aria-label={storiesLabel(count)}>{count}</small></Link>
        <div className={styles.topicCard} role="group" aria-label={`More on ${tag}`}>
          <div className={styles.topicCardHead}>
            <p><b>{tag}</b><span>{storiesLabel(count)}</span></p>
            <button type="button" className={styles.topicCardFollow} aria-pressed={on} onClick={() => followTopic(tag, on)}>{on ? "Following" : "Follow"}</button>
          </div>
          {stories.length > 0
            ? <ul>{stories.map(story => <li key={story.slug}><Link href={`/tech-buzz/${story.slug}`}><span>{story.title}</span><small>{story.readTimeMinutes} min</small></Link></li>)}</ul>
            : <p className={styles.topicCardNote}>This is the first story on {tag}. Follow it to see the next one in your Following feed.</p>}
          {count > 1 && <Link href={href} className={styles.topicCardAll}>See all {storiesLabel(count)}</Link>}
        </div>
      </li>;
    })}
    {topics.length > 1 && <li className={styles.chipAll}>
      <button type="button" aria-pressed={unfollowed.length === 0} onClick={followAll}>{unfollowed.length === 0 ? "Following all" : "Follow all"}</button>
    </li>}
  </ul>;
}

/** Follows the story's author; `onChange` keeps the page's follower count in step. */
export function FollowAuthor({ name, onResult, onChange }: { name: string; onResult: ResultHandler; onChange?: (delta: number) => void }) {
  const followed = useMarks("author");
  const key = markKey(name);
  const on = !!followed[key];
  return <button type="button" className={styles.follow} aria-pressed={on} aria-label={`${on ? "Unfollow" : "Follow"} ${name}`}
    onClick={() => setExclusiveMark("author", "mute_author", key, !on).then(result => {
      if (result === "ok") onChange?.(on ? -1 : 1);
      onResult(result, on ? `Unfollowed ${name}` : `Following ${name}`);
    })}>
    {on ? <UserCheck size={14} aria-hidden="true" /> : <UserPlus size={14} aria-hidden="true" />}
    <span>{on ? "Following" : "Follow"}</span>
  </button>;
}

const REPORT_REASONS = ["Something is inaccurate", "The code does not work", "It is out of date", "Spam or low quality"];

type MenuProps = { articleId: string; title: string; slug: string; author: string; tags: string[]; hidden: boolean; onCopy: () => void; onFollowersChange: (delta: number) => void; onResult: ResultHandler; notify: (message: string) => void };

/** The "more" menu: closes on an outside click or Escape, and hands focus back to its button. Topics and reporting open as their own page of it. */
function MoreMenu({ articleId, title, slug, author, tags, hidden, onCopy, onFollowersChange, onResult, notify }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "topics" | "report">("main");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const authorKey = markKey(author);
  const less = !!useMarks("less")[articleId];
  const highlightsHidden = !!useMarks("pref")[HIDE_HIGHLIGHTS];
  const following = !!useMarks("author")[authorKey];
  const authorMuted = !!useMarks("mute_author")[authorKey];
  const mutedTopics = useMarks("mute_topic");
  const mutedCount = tags.filter(tag => mutedTopics[markKey(tag)]).length;
  // Read when the menu opens, which only happens in the browser.
  const shortcut = open && /mac/i.test(navigator.platform) ? "⌘ /" : "Ctrl /";

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  const close = () => { setOpen(false); setView("main"); };
  const report = (reason: string) => {
    close();
    fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tech Buzz reader", category: "content", title: `Story report: ${reason}`.slice(0, 140), body: `"${title}" (/tech-buzz/${slug}): ${reason}.` }),
    }).then(response => notify(response.ok ? "Thanks, the report reached our editors." : "That report could not be sent. Try again later."))
      .catch(() => notify("That report could not be sent. Try again later."));
  };
  const follow = () => {
    close();
    setExclusiveMark("author", "mute_author", authorKey, !following).then(result => {
      if (result === "ok") onFollowersChange(following ? -1 : 1);
      onResult(result, following ? `Unfollowed ${author}` : `Following ${author}`);
    });
  };
  const muteAuthor = () => {
    close();
    setExclusiveMark("mute_author", "author", authorKey, !authorMuted).then(result => {
      if (result === "ok" && !authorMuted && following) onFollowersChange(-1);
      onResult(result, authorMuted ? `${author} is back in your feed` : `Muted ${author}. Undo any time from the Tech Buzz feed.`);
    });
  };
  const muteTopic = (tag: string, muted: boolean) =>
    setExclusiveMark("mute_topic", "topic", markKey(tag), !muted).then(result => onResult(result, muted ? `${tag} is back in your feed` : `Muted ${tag}`));

  return <div className={styles.more} ref={root}>
    <button ref={trigger} type="button" className={styles.tool} aria-haspopup="menu" aria-expanded={open} aria-label="More actions" title="More actions"
      onClick={() => { setView("main"); setOpen(value => !value); }}>
      <MoreHorizontal size={18} aria-hidden="true" />
    </button>
    {open && <div className={styles.menu} role="menu" aria-label={view === "report" ? "What is wrong with this story?" : view === "topics" ? "Mute topics" : "More actions"}>
      {view === "report" && <>
        <button type="button" role="menuitem" className={styles.menuBack} onClick={() => setView("main")}><ArrowLeft size={15} aria-hidden="true" />What is wrong with this story?</button>
        {REPORT_REASONS.map(reason => <button key={reason} type="button" role="menuitem" onClick={() => report(reason)}>{reason}</button>)}
      </>}
      {view === "topics" && <>
        <button type="button" role="menuitem" className={styles.menuBack} onClick={() => setView("main")}><ArrowLeft size={15} aria-hidden="true" />Mute topics</button>
        {tags.map(tag => {
          const muted = !!mutedTopics[markKey(tag)];
          return <button key={tag} type="button" role="menuitemcheckbox" aria-checked={muted} onClick={() => muteTopic(tag, muted)}>
            <span className={styles.menuCheck} data-on={muted || undefined} aria-hidden="true">{muted && <Check size={12} strokeWidth={3} />}</span>{tag}
          </button>;
        })}
      </>}
      {view === "main" && <>
        <button type="button" role="menuitem" onClick={() => { close(); setMark("less", articleId, !less).then(result => onResult(result, less ? "Back to the usual mix of stories" : "You will see fewer stories like this")); }}>
          <ThumbsDown size={15} fill={less ? "currentColor" : "none"} aria-hidden="true" />{less ? "Undo show less like this" : "Show less like this"}
        </button>
        <hr />
        <button type="button" role="menuitem" onClick={() => { close(); setMark("pref", HIDE_HIGHLIGHTS, !highlightsHidden).then(result => onResult(result, highlightsHidden ? "Highlights showing" : "Highlights hidden")); }}>
          <Highlighter size={15} aria-hidden="true" />{highlightsHidden ? "Show highlights" : "Hide highlights"}<kbd>{shortcut}</kbd>
        </button>
        <button type="button" role="menuitem" onClick={follow}>{following ? <UserCheck size={15} aria-hidden="true" /> : <UserPlus size={15} aria-hidden="true" />}{following ? "Unfollow author" : "Follow author"}</button>
        <hr />
        <button type="button" role="menuitem" onClick={muteAuthor}><UserX size={15} aria-hidden="true" />{authorMuted ? "Unmute author" : "Mute author"}</button>
        {tags.length > 0 && <button type="button" role="menuitem" aria-haspopup="menu" onClick={() => setView("topics")}>
          <VolumeX size={15} aria-hidden="true" />Mute topics{mutedCount > 0 && <small>{mutedCount}</small>}<ChevronRight size={15} className={styles.menuEnd} aria-hidden="true" />
        </button>}
        <button type="button" role="menuitem" onClick={() => { close(); setMark("hide", articleId, !hidden).then(result => onResult(result, hidden ? "This story is back in your feed" : "Hidden from your Tech Buzz feed")); }}>
          <EyeOff size={15} aria-hidden="true" />{hidden ? "Show in my feed again" : "Hide from my feed"}
        </button>
        <hr />
        <button type="button" role="menuitem" onClick={() => { close(); onCopy(); }}><Link2 size={15} aria-hidden="true" />Copy link</button>
        <button type="button" role="menuitem" onClick={() => { close(); window.print(); }}><Printer size={15} aria-hidden="true" />Print or save as PDF</button>
        <button type="button" role="menuitem" className={styles.menuDanger} aria-haspopup="menu" onClick={() => setView("report")}><Flag size={15} aria-hidden="true" />Report story…</button>
      </>}
    </div>}
  </div>;
}

export function StoryDock({ articleId, slug, title, author, tags, claps, comments, reposts, playing, canListen, onComments, onListen, onShare, onCopy, onRepostChange, onFollowersChange, onResult, notify }: {
  articleId: string; slug: string; title: string; author: string; tags: string[]; claps: Claps; comments: number; reposts: number; playing: boolean; canListen: boolean;
  onComments: () => void; onListen: () => void; onShare: () => void; onCopy: () => void; onRepostChange: (delta: number) => void; onFollowersChange: (delta: number) => void; onResult: ResultHandler; notify: (message: string) => void;
}) {
  const saved = !!useMarks("save")[articleId];
  const reposted = !!useMarks("repost")[articleId];
  const hidden = !!useMarks("hide")[articleId];

  return <div className={styles.dock} role="group" aria-label="Story actions">
    <div className={styles.dockGroup}>
      <span className={styles.dockClap}><ClapButton slug={slug} claps={claps} size="small" /></span>
      <button type="button" className={styles.stat} onClick={onComments} aria-label={`Discussion: ${comments} ${comments === 1 ? "comment" : "comments"}`} title="Go to the discussion">
        <MessageCircle size={17} aria-hidden="true" /><span>{compact(comments)}</span>
      </button>
      <button type="button" className={styles.stat} data-on={reposted || undefined} aria-pressed={reposted} aria-label={`${reposted ? "Undo repost" : "Repost"}: ${reposts} ${reposts === 1 ? "repost" : "reposts"}`} title={reposted ? "Undo your repost" : "Repost this story"}
        onClick={() => setMark("repost", articleId, !reposted).then(result => {
          if (result === "ok") onRepostChange(reposted ? -1 : 1);
          onResult(result, reposted ? "Repost removed" : "Reposted. Find it under Your reposts on Tech Buzz.");
        })}>
        <Repeat2 size={17} aria-hidden="true" /><span>{compact(reposts)}</span>
      </button>
    </div>
    <div className={styles.dockGroup}>
      <button type="button" className={styles.tool} data-on={saved || undefined} aria-pressed={saved} aria-label={saved ? "Remove from reading list" : "Save to reading list"} title={saved ? "Saved to your reading list" : "Save to your reading list"}
        onClick={() => setMark("save", articleId, !saved).then(result => onResult(result, saved ? "Removed from your reading list" : "Saved to your reading list"))}>
        {saved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
      </button>
      {canListen && <button type="button" className={styles.tool} data-on={playing || undefined} aria-pressed={playing} aria-label={playing ? "Pause listening" : "Listen to this story"} title={playing ? "Pause" : "Listen"} onClick={onListen}>
        {playing ? <CirclePause size={18} aria-hidden="true" /> : <CirclePlay size={18} aria-hidden="true" />}
      </button>}
      <button type="button" className={styles.tool} aria-label="Share this story" title="Share" onClick={onShare}><Share size={17} aria-hidden="true" /></button>
      <MoreMenu articleId={articleId} title={title} slug={slug} author={author} tags={tags} hidden={hidden} onCopy={onCopy} onFollowersChange={onFollowersChange} onResult={onResult} notify={notify} />
    </div>
  </div>;
}

/** The story's main actions, floating at the bottom of the screen once the dock under the title has scrolled away. */
export function FloatingActions({ articleId, slug, claps, comments, playing, canListen, after, onComments, onListen, onShare, onResult }: {
  articleId: string; slug: string; claps: Claps; comments: number; playing: boolean; canListen: boolean; after: RefObject<HTMLElement | null>;
  onComments: () => void; onListen: () => void; onShare: () => void; onResult: ResultHandler;
}) {
  const [shown, setShown] = useState(false);
  const saved = !!useMarks("save")[articleId];
  useEffect(() => {
    if (!after.current) return;
    const observer = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(after.current);
    return () => observer.disconnect();
  }, [after]);
  if (!shown) return null;
  return <div className={styles.float} role="group" aria-label="Quick story actions">
    <span className={styles.dockClap}><ClapButton slug={slug} claps={claps} size="small" /></span>
    <button type="button" className={styles.stat} onClick={onComments} aria-label={`Discussion: ${comments} ${comments === 1 ? "comment" : "comments"}`} title="Go to the discussion"><MessageCircle size={17} aria-hidden="true" /><span>{compact(comments)}</span></button>
    <button type="button" className={styles.tool} data-on={saved || undefined} aria-pressed={saved} aria-label={saved ? "Remove from reading list" : "Save to reading list"} title={saved ? "Saved to your reading list" : "Save to your reading list"}
      onClick={() => setMark("save", articleId, !saved).then(result => onResult(result, saved ? "Removed from your reading list" : "Saved to your reading list"))}>
      {saved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
    </button>
    {canListen && <button type="button" className={styles.tool} data-on={playing || undefined} aria-pressed={playing} aria-label={playing ? "Pause listening" : "Listen to this story"} title={playing ? "Pause" : "Listen"} onClick={onListen}>{playing ? <CirclePause size={18} aria-hidden="true" /> : <CirclePlay size={18} aria-hidden="true" />}</button>}
    <button type="button" className={styles.tool} aria-label="Share this story" title="Share" onClick={onShare}><Share size={17} aria-hidden="true" /></button>
  </div>;
}
