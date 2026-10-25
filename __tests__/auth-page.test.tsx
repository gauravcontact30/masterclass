import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthPage, safeRedirect } from "@/components/auth-page";
import { hardNavigate } from "@/lib/hard-navigate";
const replace = hardNavigate as jest.Mock;

const signInWithPassword = jest.fn();
const signUp = jest.fn();
const signOut = jest.fn().mockResolvedValue({ error: null });
const resend = jest.fn();
const confirmed = { data: { user: { id: "u1", email_confirmed_at: "2026-10-20T00:00:00Z" } }, error: null };

jest.mock("@/lib/supabase-browser", () => ({ supabaseBrowser: () => ({ auth: { signInWithPassword, signUp, signOut, resend } }) }));
jest.mock("sonner", () => ({ toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn(), info: jest.fn() }) }));
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
  signInWithPassword.mockResolvedValue(confirmed);
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
  signInWithPassword.mockResolvedValue(confirmed);
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
  ["/tech-buzz", "/tech-buzz"], ["/tech-buzz?filter=ai", "/tech-buzz?filter=ai"]
])("safeRedirect(%p) → %p", (target, expected) => { expect(safeRedirect(target)).toBe(expected); });

test("the form posts (never GET) and is an ordinary form even before hydration", () => {
  render(<AuthPage mode="signin" enabled />);
  expect(screen.getByRole("button", { name: "Sign in" }).closest("form")).toHaveAttribute("method", "post");
});

test("a successful sign-in leaves a one-shot notice for the dashboard's confirmation toast", async () => {
  sessionStorage.clear();
  signInWithPassword.mockResolvedValue(confirmed);
  render(<AuthPage mode="signin" enabled />);
  const user = await fillCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(replace).toHaveBeenCalled());
  expect(sessionStorage.getItem("mc:auth-notice")).toBe("signed_in");
});

test("an account whose email is not confirmed cannot enter, and can ask for the email again", async () => {
  signInWithPassword.mockResolvedValue({ data: { user: { id: "u1", email_confirmed_at: null } }, error: null });
  resend.mockResolvedValue({ error: null });
  render(<AuthPage mode="signin" enabled />);
  const user = await fillCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Confirm your email first");
  expect(signOut).toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Resend confirmation email" }));
  await waitFor(() => expect(resend).toHaveBeenCalledWith(expect.objectContaining({ type: "signup", email: "student@example.com" })));
  expect(await screen.findByRole("button", { name: /Resend available in \d+s/ })).toBeDisabled();
});

test("Supabase's own email_not_confirmed refusal offers the resend too", async () => {
  signInWithPassword.mockResolvedValue({ data: {}, error: { code: "email_not_confirmed", message: "Email not confirmed" } });
  render(<AuthPage mode="signin" enabled />);
  const user = await fillCredentials();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("button", { name: "Resend confirmation email" })).toBeInTheDocument();
});

test("sign-up confirms the account was created, shows where the email went and waits before a resend", async () => {
  const { toast } = jest.requireMock("sonner") as { toast: { success: jest.Mock } };
  signUp.mockResolvedValue({ data: { user: { id: "u1", email_confirmed_at: null }, session: null }, error: null });
  render(<AuthPage mode="signup" enabled />);
  const user = await fillCredentials("new@example.com");
  await user.click(screen.getByRole("button", { name: "Start learning" }));
  expect(await screen.findByText(/Sent to new@example.com/)).toBeInTheDocument();
  expect(toast.success).toHaveBeenCalledWith("Account created successfully", expect.objectContaining({ description: expect.stringContaining("new@example.com") }));
  expect(screen.getByRole("button", { name: /Resend available in/ })).toBeDisabled();
});

test("a project that auto-confirms still signs the new learner in, with a welcome notice", async () => {
  sessionStorage.clear();
  signUp.mockResolvedValue({ data: { user: { id: "u1", email_confirmed_at: "2026-10-20T00:00:00Z" }, session: { access_token: "t" } }, error: null });
  render(<AuthPage mode="signup" enabled />);
  const user = await fillCredentials("new@example.com");
  await user.click(screen.getByRole("button", { name: "Start learning" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  expect(sessionStorage.getItem("mc:auth-notice")).toBe("created");
});

test.each([
  ["link_expired", "That confirmation link has expired"],
  ["link_other_device", "opened in a different browser"],
] as const)("an emailed-link problem (%s) is explained on the sign-in page", (linkError, text) => {
  render(<AuthPage mode="signin" enabled linkError={linkError} />);
  expect(screen.getByRole("alert")).toHaveTextContent(text);
});

test("sign-up with an already-registered address says so instead of waiting for an email that never comes", async () => {
  const { toast } = jest.requireMock("sonner") as { toast: { info: jest.Mock } };
  // Supabase's decoy for a confirmed address: 200, a user with no identities, and no email sent.
  signUp.mockResolvedValue({ data: { user: { id: "decoy", email_confirmed_at: null, identities: [] }, session: null }, error: null });
  render(<AuthPage mode="signup" enabled />);
  const user = await fillCredentials("taken@example.com");
  await user.click(screen.getByRole("button", { name: "Start learning" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("An account with this email already exists");
  expect(screen.queryByText(/Sent to taken@example.com/)).not.toBeInTheDocument();
  expect(toast.info).toHaveBeenCalledWith("This email already has an account", expect.anything());
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in?email=taken%40example.com");
});
