import { googleFontHref, googleFontLinkId } from "./google-fonts";

/** The chosen font's id (the dropdown's value). */
export const APP_FONT_STORAGE_KEY = "masterclass:app-font-family";
/** What the pre-paint script needs to apply the choice without the font list: { id, stack, href, linkId }. */
export const APP_FONT_STACK_KEY = "masterclass:app-font-applied";

/** The default application font: Inter, self-hosted by next/font in app/layout.tsx (--font-inter). Devanagari falls
 *  through to the page's Anek cut (--font-anek, set on Hindi pages) and then the device's own Hindi font. */
export const DEFAULT_APP_FONT_ID = "inter";
export const DEFAULT_APP_FONT_STACK = '"MC Currency", var(--font-inter, "Inter"), system-ui, -apple-system, "Segoe UI", var(--font-anek, "Nirmala UI"), "Nirmala UI", Arial, sans-serif';

/** The --app-font value: the device's currency glyphs first (see "MC Currency" in globals.css), then the chosen stack.
 *  Inter is the self-hosted copy, never a second download from Google Fonts. */
export function appFontStack(stack: string, id?: string): string {
  return id === DEFAULT_APP_FONT_ID ? DEFAULT_APP_FONT_STACK : `"MC Currency", ${stack}, "Nirmala UI", sans-serif`;
}

/** The record the pre-paint script reads back. */
export function appFontRecord(font: { id: string; name: string; stack: string }) {
  const own = font.id === DEFAULT_APP_FONT_ID;
  return JSON.stringify({ id: font.id, stack: appFontStack(font.stack, font.id), href: own ? null : googleFontHref(font.name), linkId: googleFontLinkId(font.name) });
}

/**
 * Inlined in <head> by app/layout.tsx: applies a saved application font before the first paint, so pages open in the
 * chosen typography instead of swapping to it after hydration. Only a Google Fonts stylesheet is ever linked.
 */
export const APP_FONT_SCRIPT = `(function(){try{var v=JSON.parse(localStorage.getItem(${JSON.stringify(APP_FONT_STACK_KEY)})||"null");if(!v||typeof v.stack!=="string")return;var r=document.documentElement;r.style.setProperty("--app-font",v.stack);r.setAttribute("data-app-font",String(v.id||"custom"));if(typeof v.href==="string"&&v.href.indexOf("https://fonts.googleapis.com/")===0&&!document.getElementById(v.linkId)){var l=document.createElement("link");l.id=v.linkId;l.rel="stylesheet";l.href=v.href;document.head.appendChild(l)}}catch(e){}})()`;
