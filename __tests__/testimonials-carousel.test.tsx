import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { StudentReviews } from "@/components/student-reviews";
import { LanguageProvider } from "@/components/language-provider";
import { testimonials, testimonialAvatarGradient, testimonialInitials } from "@/lib/testimonials";
const INTERVAL=5500;
const advance=(ms:number)=>act(()=>{jest.advanceTimersByTime(ms);});
const current=()=>screen.getByRole("group",{name:/Sample review \d of 5/});
beforeEach(()=>{localStorage.clear();jest.useFakeTimers();window.matchMedia=jest.fn().mockReturnValue({matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()});});
afterEach(()=>jest.useRealTimers());

test("labels fictional reviews as samples with slide semantics",()=>{
 render(<StudentReviews/>);
 expect(screen.getByRole("region",{name:"Sample student reviews"})).toHaveAttribute("aria-roledescription","carousel");
 expect(screen.getByText("Sample reviews")).toBeVisible();
 expect(screen.getByText(/illustrations, not quotes from real students/)).toBeVisible();
 expect(current()).toHaveTextContent("Aditi S.");
 expect(current()).toHaveAttribute("aria-roledescription","slide");
 expect(within(current()).getByRole("img",{name:"Sample rating 5 out of 5"})).toBeInTheDocument();
});
test("autoplays through all five reviews and wraps",()=>{
 render(<StudentReviews/>);
 for(let i=1;i<=5;i++){expect(current()).toHaveAttribute("aria-label",`Sample review ${i} of 5`);advance(INTERVAL);}
 expect(current()).toHaveAttribute("aria-label","Sample review 1 of 5");
});
test("hover pauses rotation and leaving starts a fresh interval",()=>{
 render(<StudentReviews/>);advance(2000);fireEvent.mouseEnter(current());advance(18000);
 expect(current()).toHaveTextContent("Aditi S.");fireEvent.mouseLeave(current());advance(INTERVAL-1);
 expect(current()).toHaveTextContent("Aditi S.");advance(1);expect(current()).toHaveTextContent("Rohan M.");
});
test("focus pauses rotation including on the pause control",()=>{
 render(<StudentReviews/>);const next=screen.getByRole("button",{name:"Next review"});act(()=>next.focus());advance(18000);
 expect(current()).toHaveTextContent("Aditi S.");act(()=>next.blur());advance(INTERVAL);expect(current()).toHaveTextContent("Rohan M.");
 act(()=>screen.getByRole("button",{name:"Pause reviews"}).focus());advance(INTERVAL);expect(current()).toHaveTextContent("Rohan M.");
});
test("pause and play control rotation",()=>{
 render(<StudentReviews/>);fireEvent.click(screen.getByRole("button",{name:"Pause reviews"}));advance(18000);
 expect(current()).toHaveTextContent("Aditi S.");fireEvent.click(screen.getByRole("button",{name:"Play reviews"}));advance(INTERVAL);expect(current()).toHaveTextContent("Rohan M.");
});
test("reduced motion prevents autoplay but keeps manual navigation",()=>{
 window.matchMedia=jest.fn().mockReturnValue({matches:true,addEventListener:jest.fn(),removeEventListener:jest.fn()});
 render(<StudentReviews/>);advance(18000);expect(current()).toHaveTextContent("Aditi S.");
 fireEvent.click(screen.getByRole("button",{name:"Next review"}));expect(current()).toHaveTextContent("Rohan M.");
 advance(18000);expect(current()).toHaveTextContent("Rohan M.");
});
test("each selector opens its review and arrows wrap",()=>{
 render(<StudentReviews/>);const buttons=within(screen.getByRole("group",{name:"Choose a review"})).getAllByRole("button");
 expect(buttons).toHaveLength(5);fireEvent.click(buttons[4]);expect(current()).toHaveTextContent("Sana R.");
 fireEvent.click(screen.getByRole("button",{name:"Next review"}));expect(current()).toHaveTextContent("Aditi S.");
 fireEvent.click(screen.getByRole("button",{name:"Previous review"}));expect(current()).toHaveTextContent("Sana R.");
 expect(buttons[4]).toHaveAttribute("aria-pressed","true");
});
test("Hindi preference renders translated review controls",()=>{
 localStorage.setItem("masterclass:language","hi");render(<LanguageProvider><StudentReviews/></LanguageProvider>);
 expect(screen.queryByRole("region",{name:"Sample student reviews"})).not.toBeInTheDocument();
 expect(screen.getByRole("region")).toHaveAttribute("aria-roledescription","carousel");
 expect(screen.getByRole("group",{name:/1 \/ 5/})).toHaveTextContent("Aditi S.");
});

describe("testimonial data", () => {
  test("every entry is complete in both languages with a unique id", () => {
    expect(new Set(testimonials.map(item => item.id)).size).toBe(testimonials.length);
    for (const item of testimonials) {
      for (const field of [item.quote, item.name, item.program]) {
        expect(field.en.trim()).not.toBe("");
        expect(field.hi.trim()).not.toBe("");
      }
      if (item.rating !== undefined) expect([1, 2, 3, 4, 5]).toContain(item.rating);
    }
  });

  test("generated avatars use initials and a stable, name-derived gradient", () => {
    expect(testimonialInitials("Aisha R.")).toBe("AR");
    expect(testimonialInitials("आयशा आर.")).toBe("आआ");
    expect(testimonialAvatarGradient("aisha-r")).toBe(testimonialAvatarGradient("aisha-r"));
    expect(testimonialAvatarGradient("aisha-r")).toMatch(/^linear-gradient\(\d+deg, #[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
    const gradients = new Set(testimonials.map(item => testimonialAvatarGradient(item.id)));
    expect(gradients.size).toBeGreaterThan(1);
  });
});
