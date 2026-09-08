import { render, screen, waitFor } from "@testing-library/react";
import { Workspace } from "@/components/workspace";
import { requestJson } from "@/lib/client";

jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: jest.requireActual("@/lib/client").errorKey }));
jest.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }), UserButton: () => null }));
jest.mock("@/components/generation-form", () => ({ GenerationForm: () => null }));
jest.mock("@/components/learn-modal", () => ({ LearnModal: () => null }));
jest.mock("@/components/membership", () => ({ Membership: () => null }));
jest.mock("@/components/connections", () => ({ Connections: () => null }));
jest.mock("@/components/sample-lessons", () => ({ SampleLessons: () => null }));

const accountData = {
  profile: { language: "en" },
  account: { tier: "free", used: 1, limit: 3, subscription: null, creditBalance: 2 },
  documents: [],
  progress: [],
};

beforeEach(() => {
  (requestJson as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/catalog") return Promise.resolve({ technologies: [], topics: [] });
    if (url === "/api/account") return Promise.resolve(accountData);
    return Promise.resolve({});
  });
});

test("shows the purchased download-credit balance as a dashboard stat", async () => {
  render(<Workspace authEnabled configured billingEnabled />);
  await waitFor(() => expect(screen.getByText("Download credits").closest(".stat")!.textContent).toContain("2"));
});
