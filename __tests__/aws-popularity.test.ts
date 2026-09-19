import { AWS_SERVICE_CATALOG } from "@/lib/generation/guides/aws-service-catalog";
import { AWS_POPULARITY, popularityRank } from "@/lib/generation/guides/aws-popularity";
import directory from "@/lib/generation/guides/aws-directory-generated.json";

const names = new Set(directory.map(service => service.name));
const inCategory = (category: string) => AWS_SERVICE_CATALOG.filter(service => service.category === category).map(s => s.name);

describe("AWS popularity ranking", () => {
  it("names only services that exist, so a rename cannot silently demote one", () => {
    const missing = AWS_POPULARITY.filter(name => !names.has(name));
    expect(missing).toEqual([]);
  });

  it("lists each service once", () => {
    expect(AWS_POPULARITY).toHaveLength(new Set(AWS_POPULARITY).size);
  });

  it("ranks listed services ahead of unlisted ones", () => {
    expect(popularityRank("Amazon S3")).toBeLessThan(popularityRank("Access Analyzer"));
    expect(popularityRank("Amazon Bedrock")).toBeLessThan(popularityRank("Amazon Forecast"));
  });
});

describe("catalog ordering", () => {
  it("opens AI & Machine Learning with the services interviews ask about", () => {
    expect(inCategory("AI & Machine Learning").slice(0, 4)).toEqual([
      "Amazon Bedrock",
      "Amazon SageMaker AI",
      "Amazon Rekognition",
      "Amazon Comprehend",
    ]);
  });

  it("opens DevOps & CI/CD with the delivery core", () => {
    expect(inCategory("DevOps & CI/CD").slice(0, 4)).toEqual([
      "AWS CloudFormation",
      "AWS CodePipeline",
      "AWS CodeBuild",
      "AWS CodeDeploy",
    ]);
  });

  it("leads every other category with a ranked service", () => {
    const categories = [...new Set(AWS_SERVICE_CATALOG.map(service => service.category))];
    const led = categories.filter(category => popularityRank(inCategory(category)[0]) !== Number.MAX_SAFE_INTEGER);
    // Not every category has a famous member, but the big ones must.
    for (const category of ["Storage & Backup", "Databases", "Security & Identity", "Networking & Edge", "Core AWS Services"]) {
      expect(led).toContain(category);
    }
  });

  it("puts popularity ahead of the generated capability flag", () => {
    const storage = inCategory("Storage & Backup");
    // AWS Backup is marked "capability" by the generator but is a headline service.
    expect(storage.indexOf("AWS Backup")).toBeLessThan(storage.indexOf("Amazon EBS"));
  });

  it("keeps unranked services in alphabetical order after the ranked ones", () => {
    const unranked = AWS_SERVICE_CATALOG.filter(
      service => service.category === "Analytics & Data Engineering" && popularityRank(service.name) === Number.MAX_SAFE_INTEGER,
    ).map(service => service.name);
    const services = unranked.filter(name => directory.find(d => d.name === name)?.kind !== "capability");
    expect(services).toEqual([...services].sort((a, b) => a.localeCompare(b)));
  });

  it("still contains every service from the directory", () => {
    expect(AWS_SERVICE_CATALOG).toHaveLength(directory.length);
  });
});
