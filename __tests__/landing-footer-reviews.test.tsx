import { act,fireEvent,render,screen } from "@testing-library/react";
import { LandingFooter } from "@/components/landing-footer";
import { StudentReviews } from "@/components/student-reviews";
test("Move to top scrolls smoothly and respects reduced motion",()=>{
  window.scrollTo=jest.fn();render(<LandingFooter/>);fireEvent.click(screen.getByRole("button",{name:"Move to top"}));expect(window.scrollTo).toHaveBeenLastCalledWith({top:0,behavior:"smooth"});
  window.matchMedia=jest.fn().mockReturnValue({matches:true});fireEvent.click(screen.getByRole("button",{name:"Move to top"}));expect(window.scrollTo).toHaveBeenLastCalledWith({top:0,behavior:"instant"});
  Reflect.deleteProperty(window,"matchMedia");
});
test("five sample reviews use initials, support direct selection, rotate and pause",()=>{
  jest.useFakeTimers();render(<StudentReviews/>);
  expect(screen.getByText("Sample reviews")).toBeVisible();
  expect(screen.getAllByRole("button",{name:/Read sample review by/})).toHaveLength(5);
  expect(screen.queryByText("Illustrative profile · not a verified customer")).not.toBeInTheDocument();
  expect(screen.queryByRole("img",{name:/portrait/})).not.toBeInTheDocument();
  act(()=>jest.advanceTimersByTime(5500));expect(screen.getByRole("group",{name:"Sample review 2 of 5"})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Pause reviews"}));act(()=>jest.advanceTimersByTime(20000));expect(screen.getByRole("group",{name:"Sample review 2 of 5"})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Read sample review by Sana R."}));expect(screen.getByRole("group",{name:"Sample review 5 of 5"})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Next review"}));expect(screen.getByRole("group",{name:"Sample review 1 of 5"})).toBeVisible();
  jest.useRealTimers();
});
