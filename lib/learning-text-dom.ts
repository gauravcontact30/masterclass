import { anchorText, locateAnchor, type LearningMark, type TextAnchor } from "./learning-marks";

type TextState = { source: string; displayed: string; visible: number[] };
const originals = new WeakMap<Text, TextState>();
const excluded = "[data-learning-tools],button,input,textarea,select,svg,script,style,[aria-hidden='true'],[contenteditable='true']";
type Part = { node: Text; start: number; state: TextState };

/** Keep React's text nodes intact. Only their data changes; no wrapping, moving or
 * removing nodes. This also removes deleted text from copying/accessibility. */
export function textModel(root: HTMLElement) {
  const parts: Part[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let text = "";
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    const ignored = parent?.closest(excluded);
    if (!parent || (ignored && root.contains(ignored)) || parent.closest("[data-learning-content]") !== root) continue;
    let state = originals.get(node);
    // A React update replaced the text: use the new source and resolve anchors again.
    if (!state || state.displayed !== node.data) {
      state = { source: node.data, displayed: node.data, visible: Array.from({ length: node.length }, (_, i) => i) };
      originals.set(node, state);
    }
    parts.push({ node, start: text.length, state });
    text += state.source;
  }
  return { text, parts };
}

export function renderPersonalText(root: HTMLElement, marks: LearningMark[]) {
  const model = textModel(root);
  const resolved = marks.map(mark => ({ mark, position: locateAnchor(model.text, mark) })).filter(item => item.position !== null);
  const deletions = resolved.filter(item => item.mark.kind === "delete");
  for (const part of model.parts) {
    const visible: number[] = [];
    for (let i = 0; i < part.state.source.length; i++) {
      const offset = part.start + i;
      if (!deletions.some(item => offset >= item.position!.start && offset < item.position!.end)) visible.push(i);
    }
    const displayed = visible.map(i => part.state.source[i]).join("");
    part.state.visible = visible;
    part.state.displayed = displayed;
    if (part.node.data !== displayed) part.node.data = displayed;
  }
  collapseEmptied(root, model.parts);
  const ranges = new Map<string, Range[]>();
  for (const { mark, position } of resolved) {
    if (mark.kind !== "highlight") continue;
    const selected: Range[] = [];
    for (const part of model.parts) {
      const from = part.state.visible.findIndex(i => part.start + i >= position!.start && part.start + i < position!.end);
      if (from < 0) continue;
      let to = from + 1;
      while (to < part.state.visible.length && part.start + part.state.visible[to] < position!.end) to++;
      const range = document.createRange(); range.setStart(part.node, from); range.setEnd(part.node, to); selected.push(range);
    }
    ranges.set(mark.id, selected);
  }
  return ranges;
}

export function selectionAnchor(root: HTMLElement, range: Range): TextAnchor | null {
  const model = textModel(root);
  let start: number | undefined, end: number | undefined;
  for (const part of model.parts) {
    if (!range.intersectsNode(part.node) || !part.state.visible.length) continue;
    const from = range.startContainer === part.node ? range.startOffset : 0;
    const to = range.endContainer === part.node ? range.endOffset : part.node.length;
    if (from >= to) continue;
    start ??= part.start + part.state.visible[from];
    end = part.start + part.state.visible[to - 1] + 1;
  }
  if (start === undefined || end === undefined || end - start > 12000) return null;
  const anchor = anchorText(model.text, start, end);
  return anchor.quote.trim() ? anchor : null;
}

export function restorePersonalText(root: HTMLElement) {
  for (const part of textModel(root).parts) {
    if (part.node.data !== part.state.source) part.node.data = part.state.source;
    originals.delete(part.node);
  }
  root.querySelectorAll(`[${EMPTIED}]`).forEach(element => element.removeAttribute(EMPTIED));
}

const EMPTIED = "data-learning-emptied";
// Elements that still mean something with no text of their own.
const meaningful = "img,picture,video,audio,canvas,iframe,input,textarea,select,button,a[href],[data-learning-tools]";

/** Hide the lines, bullets and boxes whose text was entirely deleted, so the
 * layout closes the gap instead of leaving empty space. Only an attribute is
 * set; React's nodes stay in place, and restoring removes it. */
function collapseEmptied(root: HTMLElement, parts: Part[]) {
  const displayed = new Map(parts.map(part => [part.node, part.state.displayed]));
  const isEmpty = (element: Element) => {
    if (element.matches(meaningful) || element.querySelector(meaningful)) return false;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const own = displayed.get(node);
      // Decorative hidden text (such as abbreviation pills) is not content; text in a nested region is.
      const text = own ?? (node.parentElement?.closest("[aria-hidden='true']") && node.parentElement.closest("[data-learning-content]") === root ? "" : node.data);
      if (text.trim()) return false;
    }
    return true;
  };
  const emptied = new Set<Element>();
  for (const part of parts) {
    if (!part.state.source.trim() || part.state.displayed.trim()) continue;
    // Climb while the whole ancestor is now empty, e.g. a list item, then its list, then its section.
    for (let element = part.node.parentElement; element && element !== root && root.contains(element) && !emptied.has(element); element = element.parentElement) {
      if (!isEmpty(element)) break;
      emptied.add(element);
      // A deleted abbreviation also hides the full-form pill rendered right after it.
      const pill = element.nextElementSibling;
      if (element.matches("abbr") && pill?.matches("[aria-hidden='true']")) emptied.add(pill);
    }
  }
  root.querySelectorAll(`[${EMPTIED}]`).forEach(element => { if (!emptied.has(element)) element.removeAttribute(EMPTIED); });
  emptied.forEach(element => { if (!element.hasAttribute(EMPTIED)) element.setAttribute(EMPTIED, ""); });
}

/** Hit-test real text glyphs, not the nearest line when hovering blank space. */
export function wordAtPoint(root: HTMLElement, x: number, y: number): TextAnchor | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const caret = doc.caretPositionFromPoint?.(x, y);
  const fallback = !caret ? doc.caretRangeFromPoint?.(x, y) : null;
  const node = caret?.offsetNode ?? fallback?.startContainer;
  const offset = caret?.offset ?? fallback?.startOffset ?? 0;
  if (!node || node.nodeType !== Node.TEXT_NODE || !root.contains(node)) return null;
  const text = (node as Text).data;
  // Segmenter handles Hindi and other scripts without relying on ASCII word boundaries.
  const segments = new Intl.Segmenter(undefined, { granularity: "word" }).segment(text);
  for (const word of segments) {
    if (!word.isWordLike || offset < word.index || offset > word.index + word.segment.length) continue;
    const range = document.createRange(); range.setStart(node, word.index); range.setEnd(node, word.index + word.segment.length);
    const touchesGlyph = [...range.getClientRects()].some(rect => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
    if (touchesGlyph) return selectionAnchor(root, range);
  }
  return null;
}
