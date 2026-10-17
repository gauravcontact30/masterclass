import { render } from "@testing-library/react";
import { ExclusiveAccordions } from "@/components/exclusive-accordions";

const open = (details: HTMLDetailsElement) => { details.open = true; details.dispatchEvent(new Event("toggle")); };

test("opening an accordion closes the one opened before it in the same group, but not nested or free ones", () => {
  const { container } = render(<>
    <ExclusiveAccordions />
    <ul><li><details id="a"><summary>A</summary><details id="inner"><summary>Inner</summary></details></details></li><li><details id="b"><summary>B</summary></details></li></ul>
    <section><details id="other" open><summary>Other group</summary></details></section>
    <ul><li><details id="tree" data-accordion="free" open><summary>Folder</summary></details></li><li><details id="c"><summary>C</summary></details></li></ul>
  </>);
  const get = (id: string) => container.querySelector<HTMLDetailsElement>(`#${id}`)!;
  open(get("a"));
  open(get("inner"));
  expect(get("a").open).toBe(true);
  open(get("b"));
  expect(get("a").open).toBe(false);
  expect(get("b").open).toBe(true);
  expect(get("other").open).toBe(true);
  open(get("c"));
  expect(get("tree").open).toBe(true);
});
