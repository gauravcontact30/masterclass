import { act,fireEvent,render,screen,within } from "@testing-library/react";
import { StudentReviews } from "@/components/student-reviews";
test("five sample reviews use initials, support direct selection, rotate and pause",()=>{
  jest.useFakeTimers();render(<StudentReviews/>);
  expect(screen.getByText("Sample reviews")).toBeVisible();
  expect(within(screen.getByRole("group",{name:"Choose a review"})).getAllByRole("button")).toHaveLength(5);
  expect(screen.queryByText("Illustrative profile · not a verified customer")).not.toBeInTheDocument();
  expect(screen.queryByRole("img",{name:/portrait/})).not.toBeInTheDocument();
  act(()=>jest.advanceTimersByTime(5500));expect(screen.getByRole("group",{name:"Sample review 2 of 5"})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Pause reviews"}));act(()=>jest.advanceTimersByTime(20000));expect(screen.getByRole("group",{name:"Sample review 2 of 5"})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:/^Sana R\./}));expect(screen.getByRole("group",{name:"Sample review 5 of 5"})).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Next review"}));expect(screen.getByRole("group",{name:"Sample review 1 of 5"})).toBeVisible();
  jest.useRealTimers();
});
