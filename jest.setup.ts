import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
  // @ts-expect-error Node TextDecoder matches DOM TextDecoder
  globalThis.TextDecoder = TextDecoder;
}

// jsdom has no ResizeObserver; cmdk (used by the technology/topic combobox)
// observes its list to size itself, so tests that open it need a stub. Guard
// on `Element` too: server-logic suites run under the "node" test
// environment (no DOM at all), so this file must be a no-op there.
if (typeof Element !== "undefined") {
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
    });
  }
  // jsdom has no browser top layer. nwsapi 2.2.27 recursively calls
  // Element.matches for these native-only states, hanging Floating UI's
  // positioning queries. Model the absent states without stubbing menus or
  // changing ordinary selector matching.
  const matches = Element.prototype.matches;
  Element.prototype.matches = function (selector: string) {
    if ([":modal", ":fullscreen", ":popover-open"].includes(selector)) return false;
    return matches.call(this, selector);
  };
  // Base UI dispatches pointer clicks; jsdom only provides mouse events.
  if (typeof window.PointerEvent === "undefined") {
    window.PointerEvent = MouseEvent as typeof PointerEvent;
  }
  if (typeof globalThis.ResizeObserver === "undefined") {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  }
  if (typeof Element.prototype.scrollIntoView !== "function") {
    Element.prototype.scrollIntoView = () => {};
  }
  if (typeof Element.prototype.hasPointerCapture !== "function") {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (typeof Element.prototype.setPointerCapture !== "function") {
    Element.prototype.setPointerCapture = () => {};
  }
  if (typeof Element.prototype.releasePointerCapture !== "function") {
    Element.prototype.releasePointerCapture = () => {};
  }
}
