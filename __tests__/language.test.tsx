import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { HeaderLanguageSwitch } from "@/components/language-switch";
import { en, SUPPORTED_LANGUAGES, usableLanguage } from "@/lib/i18n";
import hindi from "@/lib/locales/ui-hi.json";

/*
 * The interface is in English and Hindi (lib/i18n.ts). The Hindi strings load only for readers who choose Hindi
 * (lib/locales/ui-hi.json, keyed by the English text), and the choice is kept in this browser.
 */
function Probe() {
  const { language, t } = useLanguage();
  return <><h1>{t("welcome")}</h1><p data-testid="language">{language}</p><HeaderLanguageSwitch /></>;
}

test("every English interface string has its Hindi translation", () => {
  const missing = (Object.values(en) as string[]).filter(text => !(text in (hindi as Record<string, string>)));
  expect(missing).toEqual([]);
  expect(Object.values(hindi).every(Boolean)).toBe(true);
});

test("English and Hindi are offered; any other code falls back to English", () => {
  expect(SUPPORTED_LANGUAGES.map(language => language.code).sort()).toEqual(["en", "hi"]);
  expect(SUPPORTED_LANGUAGES.every(language => language.available)).toBe(true);
  expect(usableLanguage("hi")).toBe("hi");
  expect(usableLanguage("es")).toBe("en");
  expect(usableLanguage(null)).toBe("en");
});

test("defaults to English, switches to Hindi from the header switch and remembers it", async () => {
  localStorage.clear();
  render(<LanguageProvider><Probe /></LanguageProvider>);
  expect(screen.getByRole("heading")).toHaveTextContent(en.welcome);
  const toggle = screen.getByRole("switch", { name: "Hindi language" });
  expect(toggle).toHaveAttribute("aria-checked", "false");
  await userEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(localStorage.getItem("mc-language")).toBe("hi");
  await waitFor(() => expect(document.documentElement.lang).toBe("hi"));
  // The Hindi dictionary arrives as its own chunk, then replaces the English text.
  await waitFor(() => expect(screen.getByRole("heading")).toHaveTextContent((hindi as Record<string, string>)[en.welcome]));
});

test("a saved choice is restored on the next visit", async () => {
  localStorage.setItem("mc-language", "hi");
  render(<LanguageProvider><Probe /></LanguageProvider>);
  await waitFor(() => expect(screen.getByTestId("language")).toHaveTextContent("hi"));
});
