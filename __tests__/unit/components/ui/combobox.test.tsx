import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookOpen } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

const groups = [{ label: "Frontend", options: [{ value: "react", label: "React" }, { value: "vue", label: "Vue" }] }, { label: "Empty", options: [] }];
const props = { groups, placeholder: "Pick one", searchPlaceholder: "Search", emptyText: "Nothing found", clearLabel: "Clear", ariaLabel: "Technology" };

describe("Combobox", () => {
  it("opens, filters, clears the query and selects an option", async () => {
    const onChange = jest.fn();
    render(<Combobox {...props} value="" onChange={onChange} icon={BookOpen} id="tech" />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Technology" }));
    const search = await screen.findByPlaceholderText("Search");
    await userEvent.type(search, "zzz");
    expect(await screen.findByText("Nothing found")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(search).toHaveValue("");
    expect(screen.queryByText("Empty")).toBeNull();
    await userEvent.click(screen.getByRole("option", { name: "Vue" }));
    expect(onChange).toHaveBeenCalledWith("vue");
  });

  it("shows the selection and clears it by click or keyboard without opening", () => {
    const onChange = jest.fn();
    render(<Combobox {...props} value="react" onChange={onChange} />);
    expect(screen.getByText("React")).toHaveClass("combobox-value");
    const clear = screen.getByRole("button", { name: "Clear" });
    fireEvent.click(clear);
    fireEvent.keyDown(clear, { key: "Enter" });
    fireEvent.keyDown(clear, { key: " " });
    fireEvent.keyDown(clear, { key: "a" });
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("resets the query when it closes", async () => {
    render(<Combobox {...props} value="" onChange={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Technology" }));
    await userEvent.type(await screen.findByPlaceholderText("Search"), "re");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Technology" }));
    expect(await screen.findByPlaceholderText("Search")).toHaveValue("");
  });
});
