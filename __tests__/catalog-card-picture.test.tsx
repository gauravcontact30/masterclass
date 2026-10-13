import { fireEvent, render, screen } from "@testing-library/react";
import { CatalogBrowser } from "@/components/catalog-browser";

const items = [{ name: "Amazon S3", category: "Storage & Backup", summary: "Store and retrieve objects." }];
const renderCatalog = (itemImage?: Parameters<typeof CatalogBrowser>[0]["itemImage"]) => render(<CatalogBrowser id="aws-test" title="Popular AWS services" description="Services" noun="services"
  items={items} categories={[]} itemIcon={() => null} itemImage={itemImage} categoryIcon={() => null} question={item => item.name} onAsk={() => {}} />);

beforeEach(() => localStorage.clear());

test("a catalogue with pictures shows one on each card", () => {
  renderCatalog(item => ({ src: `/x/${item.name}.webp`, alt: `Illustration of what ${item.name} does` }));
  expect(screen.getByRole("img", { name: "Illustration of what Amazon S3 does" })).toHaveAttribute("src", "/x/Amazon S3.webp");
});

test("a picture that fails to load leaves the card without one", () => {
  renderCatalog(() => ({ src: "/missing.webp", alt: "Illustration" }));
  fireEvent.error(screen.getByRole("img", { name: "Illustration" }));
  expect(screen.queryByRole("img", { name: "Illustration" })).toBeNull();
  expect(screen.getByText("Amazon S3")).toBeInTheDocument();
});

test("catalogues without pictures render no picture slot", () => {
  renderCatalog();
  expect(screen.queryByRole("img", { name: /Illustration/ })).toBeNull();
});
