import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { en, SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { hi, es, ja, de, fr, zh } from "@/lib/i18n-locales";

function Probe() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <>
      <h1>{t("welcome")}</h1>
      <p data-testid="slider-title">{t("campusSlideTitle")}</p>
      <button onClick={() => setLanguage(language === "en" ? "hi" : "en")}>Switch</button>
      <LanguageSwitcher />
    </>
  );
}

test("all visible translation keys have valid strings across all 7 supported languages", () => {
  const expectedKeys = Object.keys(en).sort();
  expect(Object.keys(hi).sort()).toEqual(expectedKeys);
  expect(Object.values(hi).every(Boolean)).toBe(true);

  expect(Object.keys(es).sort()).toEqual(expectedKeys);
  expect(Object.values(es).every(Boolean)).toBe(true);

  expect(Object.keys(ja).sort()).toEqual(expectedKeys);
  expect(Object.values(ja).every(Boolean)).toBe(true);

  expect(Object.keys(de).sort()).toEqual(expectedKeys);
  expect(Object.values(de).every(Boolean)).toBe(true);

  expect(Object.keys(fr).sort()).toEqual(expectedKeys);
  expect(Object.values(fr).every(Boolean)).toBe(true);

  expect(Object.keys(zh).sort()).toEqual(expectedKeys);
  expect(Object.values(zh).every(Boolean)).toBe(true);
});

test("SUPPORTED_LANGUAGES contains all 7 countries shown in the screenshot", () => {
  const codes = SUPPORTED_LANGUAGES.map(l => l.countryCode);
  expect(codes).toEqual(["US", "IN", "ES", "JP", "DE", "FR", "CN"]);
});

test("defaults to English, updates document lang and persists Hindi", async () => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>
  );
  expect(screen.getByRole("heading")).toHaveTextContent(en.welcome);
  await userEvent.click(screen.getByRole("button", { name: "Switch" }));
  expect(screen.getByRole("heading")).toHaveTextContent(hi.welcome);
  expect(localStorage.getItem("masterclass:language")).toBe("hi");
  await waitFor(() => expect(document.documentElement.lang).toBe("hi"));
  expect(fetch).toHaveBeenCalledWith("/api/account", expect.objectContaining({ body: JSON.stringify({ language: "hi" }) }));
});

test("LanguageSwitcher opens popover with country codes and changes language to Spanish and Japanese", async () => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>
  );

  // Open language switcher
  const trigger = screen.getByRole("button", { expanded: false });
  fireEvent.click(trigger);

  // Check that all language badges EN, HI, ES, JA, DE, FR, ZH are in popover
  expect(screen.getByText("EN")).toBeInTheDocument();
  expect(screen.getByText("HI")).toBeInTheDocument();
  expect(screen.getByText("ES")).toBeInTheDocument();
  expect(screen.getByText("JA")).toBeInTheDocument();
  expect(screen.getByText("DE")).toBeInTheDocument();
  expect(screen.getByText("FR")).toBeInTheDocument();
  expect(screen.getByText("ZH")).toBeInTheDocument();

  // Click Spanish (ES)
  const esButton = screen.getByRole("option", { name: /Español/i });
  fireEvent.click(esButton);

  expect(localStorage.getItem("masterclass:language")).toBe("es");
  expect(screen.getByTestId("slider-title")).toHaveTextContent(es.campusSlideTitle);

  // Re-open and select Japanese (JP)
  fireEvent.click(screen.getByRole("button", { expanded: false }));
  const jaButton = screen.getByRole("option", { name: /日本語/i });
  fireEvent.click(jaButton);

  expect(localStorage.getItem("masterclass:language")).toBe("ja");
  expect(screen.getByTestId("slider-title")).toHaveTextContent(ja.campusSlideTitle);
});
