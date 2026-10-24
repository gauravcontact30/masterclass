import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TechyServices } from "@/components/techy-services";
import { serviceCards, TECHY_AWS_SERVICES } from "@/lib/techy-services";

test("AWS atlases cover all categories and prioritize common services", () => {
  expect(TECHY_AWS_SERVICES.length).toBeGreaterThan(438);
  expect(new Set(TECHY_AWS_SERVICES.map(item => item.id)).size).toBe(TECHY_AWS_SERVICES.length);
  expect(serviceCards("aws-all")[0].name).toBe("Amazon S3");
  expect(serviceCards("aws-ai")[0].name).toBe("Amazon Bedrock");
  expect(serviceCards("aws-ai").length).toBeGreaterThan(45);
  expect(serviceCards("aws-devops").slice(0, 4).map(item => item.name)).toEqual(["AWS CodePipeline", "AWS CodeBuild", "AWS CodeDeploy", "AWS CodeCommit"]);
  expect(serviceCards("aws-devops").find(item => item.name === "AWS CodeCommit")?.lifecycle).toMatch(/reopened/);
  expect(serviceCards("aws-devops").find(item => item.name === "AWS OpsWorks")?.lifecycle).toMatch(/Retired/);
  expect(serviceCards("aws-ai").find(item => item.name === "Amazon Forecast")?.lifecycle).toMatch(/Maintenance/);
});

test("service filters, answer reveal and no-result recovery work", async () => {
  const user = userEvent.setup(); render(<TechyServices scope="aws-devops"/>);
  expect(screen.getByRole("heading", { name: "AWS CodePipeline" })).toBeVisible();
  await user.type(screen.getByRole("searchbox", { name: "Find a service" }), "CodeCommit");
  expect(screen.getByRole("heading", { name: "AWS CodeCommit" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Reveal service notes" }));
  expect(screen.queryByRole("link", { name: /Official service reference/ })).toBeNull();
  await user.type(screen.getByRole("searchbox", { name: "Find a service" }), " no-match");
  expect(screen.getByText("No services match.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear service filters" }));
  expect(screen.getByRole("heading", { name: "AWS CodePipeline" })).toBeVisible();
  await user.selectOptions(screen.getByRole("combobox", { name: "Jump to service" }), "codebuild");
  expect(screen.getByRole("heading", { name: "AWS CodeBuild" })).toBeVisible();
});
