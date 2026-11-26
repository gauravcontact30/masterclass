import { render, screen } from "@testing-library/react";
import { FooterVisibility } from "@/components/footer-visibility";

let path = "/";
jest.mock("next/navigation", () => ({ usePathname: () => path }));
const shown = (p: string) => { path = p; const { unmount } = render(<FooterVisibility><footer>site footer</footer></FooterVisibility>); const has = !!screen.queryByText("site footer"); unmount(); return has; };

test("dashboards (Learning, Super Admin, exam portals and IELTS Achievers) close with their own footline, not the site footer", () => {
  for (const p of ["/learning", "/learning/coffee-and-code", "/super-admin", "/exams/board-exams", "/ielts", "/ielts/dashboard", "/ielts/plans", "/ielts/sign-in", "/sign-in", "/sign-up"]) expect([p, shown(p)]).toEqual([p, false]);
});

test("public pages keep the site footer, including the public IELTS guide", () => {
  for (const p of ["/", "/ielts-preparation", "/tech-buzz", "/learning-paths", "/about"]) expect([p, shown(p)]).toEqual([p, true]);
});
