/** @jest-environment node */
import { looksAutomated } from "@/lib/visit-quality";

const desktop = (screen: string, extra: Record<string, string> = {}) => ({ device: "Desktop", screen, timezone: "Europe/Berlin", language: "de-DE", ...extra });

describe("looksAutomated", () => {
  it("flags the near-square crawler screens found in the 2026-11-25 audit", () => {
    expect(looksAutomated(desktop("1280x1200", { timezone: "Asia/Shanghai", language: "en-US" }))).toBe(true);
    expect(looksAutomated(desktop("1366x1366"))).toBe(true);
    expect(looksAutomated(desktop("1394x1304"))).toBe(true);
    expect(looksAutomated(desktop("1295x1176"))).toBe(true);
  });

  it("keeps real desktop displays: 16:9, 16:10, 3:2, 5:4, 4:3, ultrawide and rotated portrait", () => {
    for (const screen of ["1920x1080", "2560x1440", "1440x900", "1536x864", "1366x768", "2256x1504", "1280x1024", "1600x1200", "3440x1440", "1080x1920", "1440x2560"]) {
      expect(looksAutomated(desktop(screen))).toBe(false);
    }
  });

  it("does not apply the screen-shape rule to phones and tablets", () => {
    expect(looksAutomated({ device: "Tablet", screen: "1024x1024", timezone: "Asia/Kolkata" })).toBe(false);
    expect(looksAutomated({ device: "Mobile", screen: "390x844", timezone: "Asia/Kolkata" })).toBe(false);
  });

  it("keeps the earlier rules", () => {
    expect(looksAutomated(desktop("800x600"))).toBe(true);
    expect(looksAutomated(desktop("1920x1080", { timezone: "UTC" }))).toBe(true);
    expect(looksAutomated(desktop("390x844"))).toBe(true);
    expect(looksAutomated(desktop("1920x1080", { language: "en-US@posix" }))).toBe(true);
    expect(looksAutomated({ device: "Desktop", screen: null })).toBe(false);
  });
});
