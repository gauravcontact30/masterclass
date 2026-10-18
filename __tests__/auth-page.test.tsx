import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthPage, safeRedirect } from "@/components/auth-page";
import { hardNavigate } from "@/lib/hard-navigate";
const replace = hardNavigate as jest.Mock;

const signInWithPassword = jest.fn();
const signUp = jest.fn();

jest.mock("@/lib/supabase-browser", () => ({ supabaseBrowser: () => ({ auth: { signInWithPassword, signUp } }) }));
jest.mock("@/lib/hard-navigate", () => ({ hardNavigate: jest.fn() }));

async function fillCredentials(email = "student@example.com", password = "hunter2pass") {
  const user = userEvent.setup();
  // Sign-up asks for a name as well; sign-in has no such field.
  const nameField = screen.queryByLabelText("Your name");
  if (nameField) await user.type(nameField, "Asha Iyer");
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  return user;
}

test("signs in with email and password, then lands on the dashboard", async () => {
  signInWithPassword.mockResolvedValue({ data: {}, error: null });
  render(<AuthPage mode="signin" enabled />);

  const user = await fillCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  await waitFor(() => expect(signInWithPassword).toHaveBeenCalledWith({ email: "student@example.com", password: "hunter2pass" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
});

test("explains a failed sign-in instead of leaving the form silent", async () => {
  signInWithPassword.mockResolvedValue({ data: {}, error: { code: "invalid_credentials", message: "Invalid login credentials" } });
  render(<AuthPage mode="signin" enabled />);

  const user = await fillCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("That email and password don’t match an account.");
  expect(replace).not.toHaveBeenCalled();
});

test("signing up asks the visitor to confirm their email rather than signing them straight in", async () => {
  signUp.mockResolvedValue({ data: { user: { id: "u1" }, session: null }, error: null });
  render(<AuthPage mode="signup" enabled />);

  const user = await fillCredentials("new@example.com");
  await user.click(screen.getByRole("button", { name: "Start learning" }));

  expect(await screen.findByText("Confirm your email")).toBeInTheDocument();
  expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com", password: "hunter2pass" }));
  expect(replace).not.toHaveBeenCalled();
});

test("points an already-registered visitor at signing in", async () => {
  signUp.mockResolvedValue({ data: {}, error: { code: "user_already_exists", message: "User already registered" } });
  render(<AuthPage mode="signup" enabled />);

  const user = await fillCredentials("taken@example.com");
  await user.click(screen.getByRole("button", { name: "Start learning" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("An account with this email already exists. Sign in instead.");
});

test("names an email address the auth service will not accept", async () => {
  signUp.mockResolvedValue({ data: {}, error: { code: "email_address_invalid", message: "Email address is invalid" } });
  render(<AuthPage mode="signup" enabled />);

  const user = await fillCredentials("nope@example.com");
  await user.click(screen.getByRole("button", { name: "Start learning" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("That email address isn’t accepted. Try another one.");
});

test("asks for a name when signing up and sends it as the profile's full name", async () => {
  signUp.mockResolvedValue({ data: { user: { id: "u1" }, session: null }, error: null });
  render(<AuthPage mode="signup" enabled />);

  const user = await fillCredentials("named@example.com");
  await user.click(screen.getByRole("button", { name: "Start learning" }));

  await waitFor(() => expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
    options: expect.objectContaining({ data: { full_name: "Asha Iyer" } }),
  })));
});

test("does not ask a returning visitor for their name", () => {
  render(<AuthPage mode="signin" enabled />);
  expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
});

test("offers the opposite route so visitors can switch between signing in and up", () => {
  render(<AuthPage mode="signin" enabled />);
  expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/sign-up");
});

test("offers the sign-in route from the sign-up page", () => {
  render(<AuthPage mode="signup" enabled />);
  expect(screen.getByRole("link", { name: /already have an account/i })).toHaveAttribute("href", "/sign-in");
});

test("shows the setup notice instead of a form when auth is not configured", () => {
  render(<AuthPage mode="signin" enabled={false} />);
  expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  expect(screen.getByText("Your learning space is almost ready")).toBeInTheDocument();
});

test.each([
  ["signin", true],
  ["signup", true],
  ["signin", false],
] as const)("links back to the home page (%s, auth enabled: %s)", (mode, enabled) => {
  render(<AuthPage mode={mode} enabled={enabled} />);
  expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
});

test.each(["signin", "signup"] as const)("the eye button reveals and hides the password without submitting (%s)", async mode => {
  render(<AuthPage mode={mode} enabled />);
  const user = userEvent.setup();
  const input = screen.getByLabelText("Password");
  expect(input).toHaveAttribute("type", "password");

  const reveal = screen.getByRole("button", { name: "Show password" });
  expect(reveal).toHaveAttribute("type", "button");
  expect(reveal).toHaveAttribute("aria-pressed", "false");
  await user.click(reveal);

  expect(input).toHaveAttribute("type", "text");
  const conceal = screen.getByRole("button", { name: "Hide password" });
  expect(conceal).toHaveAttribute("aria-pressed", "true");
  await user.click(conceal);

  expect(input).toHaveAttribute("type", "password");
  expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute("aria-pressed", "false");
  expect(signInWithPassword).not.toHaveBeenCalled();
  expect(signUp).not.toHaveBeenCalled();
});

test("after sign-in, the proxy's redirect target is followed only when it is an in-app path", async () => {
  signInWithPassword.mockResolvedValue({ data: {}, error: null });
  render(<AuthPage mode="signin" enabled redirectTo="/dashboard/super-admin" />);
  const user = await fillCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/super-admin"));
  // The button stays busy while the dashboard loads, so a second tap cannot resubmit.
  expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
});

test.each([
  ["https://evil.example/dashboard", "/dashboard"], ["//evil.example", "/dashboard"], ["/dashboard\evil", "/dashboard"],
  ["/api/admin", "/dashboard"], [undefined, "/dashboard"], ["/dashboard/notes?tab=1", "/dashboard/notes?tab=1"], ["/notes", "/notes"],
])("safeRedirect(%p) → %p", (target, expected) => { expect(safeRedirect(target)).toBe(expected); });

test("the form posts (never GET) and is an ordinary form even before hydration", () => {
  render(<AuthPage mode="signin" enabled />);
  expect(screen.getByRole("button", { name: "Sign in" }).closest("form")).toHaveAttribute("method", "post");
});
