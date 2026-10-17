import { problemPoints } from "@/lib/problem-points";

describe("problemPoints", () => {
  it("keeps a single clause as one point without its full stop", () => {
    expect(problemPoints("Governed, auditable access to internal systems.")).toEqual(["Governed, auditable access to internal systems"]);
  });

  it("splits at a joining clause and drops the joining word", () => {
    expect(problemPoints("Course landing pages get enrollment-day traffic spikes, and rendering identical content per visit wastes server work."))
      .toEqual(["Course landing pages get enrollment-day traffic spikes", "Rendering identical content per visit wastes server work"]);
    expect(problemPoints("Public notices must load fast under traffic spikes, while permit status lookups need current per-applicant data."))
      .toEqual(["Public notices must load fast under traffic spikes", "Permit status lookups need current per-applicant data"]);
  });

  it("splits at semicolons and sentence breaks", () => {
    expect(problemPoints("Audits take weeks; evidence lives in ten tools. Reviewers re-ask the same questions."))
      .toEqual(["Audits take weeks", "Evidence lives in ten tools", "Reviewers re-ask the same questions"]);
  });

  it("does not split a list joined by and without a comma", () => {
    expect(problemPoints("Lesson pages need the same outline sidebar and progress bar without each page re-implementing them."))
      .toEqual(["Lesson pages need the same outline sidebar and progress bar without each page re-implementing them"]);
  });
});
