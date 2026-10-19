import { fireEvent, render, screen } from "@testing-library/react";
import { HashlessNavigation } from "@/components/hashless-navigation";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/" }));

function Page() {
  return <>
    <HashlessNavigation />
    <a href="#pricing">Pricing</a>
    <a href="/terms#refunds">Refunds</a>
    <a href="#pricing" target="_blank" rel="noreferrer">New tab</a>
    <section id="pricing">Plans</section>
  </>;
}

describe("HashlessNavigation", () => {
  beforeEach(() => { push.mockClear(); Element.prototype.scrollIntoView = jest.fn(); history.replaceState(null, "", "/"); });

  it("scrolls to an in-page section without putting a #fragment in the address bar", () => {
    render(<Page />);
    fireEvent.click(screen.getByText("Pricing"));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(location.hash).toBe("");
    expect(document.activeElement).toBe(screen.getByText("Plans"));
  });

  it("opens a section on another page at its plain URL, then scrolls there", () => {
    render(<Page />);
    fireEvent.click(screen.getByText("Refunds"));
    expect(push).toHaveBeenCalledWith("/terms");
    expect(sessionStorage.getItem("masterclass:pending-section")).toBe("refunds");
  });

  it("drops a fragment that arrives in the URL and keeps the router's history state", () => {
    history.replaceState({ tree: "kept" }, "", "/#pricing");
    render(<Page />);
    expect(location.hash).toBe("");
    expect(history.state).toEqual({ tree: "kept" });
  });

  it("leaves new-tab links alone", () => {
    render(<Page />);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    screen.getByText("New tab").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
