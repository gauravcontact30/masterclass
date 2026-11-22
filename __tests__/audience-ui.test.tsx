import { act, render, screen, waitFor } from "@testing-library/react";
import { AudienceProvider } from "@/components/audience-provider";
import { useAudienceGroups } from "@/components/audience-paths";

/* "Learning paths" moved from its own header dropdown into the account menu's tab (components/landing-navbar.tsx); the
   audience rules live in useAudienceGroups. This probe renders the groups the way that tab does: a heading per group
   over its links. */
function Paths() {
  const groups = useAudienceGroups();
  return <>{groups.map(group => <section key={group.id}>
    <h3>{group.title}</h3><p>{group.note}</p>
    <ul>{group.links.map(link => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>
  </section>)}</>;
}
const mount = () => render(<AudienceProvider><Paths /></AudienceProvider>);
beforeEach(() => { global.fetch = jest.fn(); });
test("server/default render exposes only the worldwide Tech path", () => {
  render(<Paths />);
  expect(screen.getByRole("link", { name: /Learning Dashboard/ })).toHaveAttribute("href", "/learning");
  expect(screen.getByRole("link", { name: /Tech Buzz/ })).toHaveAttribute("href", "/tech-buzz");
  expect(screen.queryByText(/Board exam aspirants/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Indian government job seekers/)).not.toBeInTheDocument();
});
test("India sees all three audiences after the server decision", async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ indiaAccess: true }) } as Response);
  mount();
  expect(await screen.findByRole("heading", { name: "Board exam aspirants" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Indian government job seekers" })).toBeVisible();
  expect(screen.getByText(/UP Board, CBSE and ICSE/)).toHaveTextContent("Class 10 and 12");
});
test.each([false, undefined])("overseas and unknown responses hide India paths (%s)", async indiaAccess => {
  jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ indiaAccess }) } as Response);
  mount();
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(screen.queryByText("Board exam aspirants")).not.toBeInTheDocument();
});
test("offline detection keeps Tech usable", async () => {
  jest.mocked(fetch).mockRejectedValue(new Error("offline"));
  mount();
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(screen.getByRole("link", { name: /Tech Buzz/ })).toBeVisible();
  expect(screen.queryByText("Board exam aspirants")).not.toBeInTheDocument();
});
test("restoring a page rechecks geography and removes previous India content", async () => {
  jest.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ indiaAccess: true }) } as Response)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ indiaAccess: false }) } as Response);
  mount();
  await screen.findByText("Board exam aspirants");
  await act(async () => { window.dispatchEvent(new Event("pageshow")); });
  expect(screen.queryByText("Board exam aspirants")).not.toBeInTheDocument();
});
