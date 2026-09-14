import type { ServiceEntry } from "@/lib/domain";
import { AWS_SERVICE_CATALOG } from "./aws-service-catalog";

/**
 * Named views over the one AWS service directory, so the DevOps guide's CI/CD
 * card grid and the AWS AI guide's card grid stay in step with the entries in
 * ./aws-service-catalog.ts instead of drifting into three copies of the same
 * facts.
 */
const byName = (names: string[]): ServiceEntry[] => names.map(name => {
  const service = AWS_SERVICE_CATALOG.find(entry => entry.name === name);
  if (!service) throw new Error(`Unknown AWS service in a catalogue view: ${name}`);
  return service;
});

/**
 * The services a delivery pipeline on AWS is actually built from, in the order
 * a change travels: source, build, artefacts, infrastructure, deploy, run,
 * observe and operate.
 */
export const AWS_CICD_SERVICES: ServiceEntry[] = byName([
  "AWS CodeCommit",
  "AWS CodePipeline",
  "AWS CodeBuild",
  "AWS CodeArtifact",
  "Amazon ECR",
  "AWS CodeDeploy",
  "AWS CloudFormation",
  "AWS CDK",
  "Amazon ECS",
  "Amazon EKS",
  "AWS Fargate",
  "AWS Systems Manager",
  "AWS AppConfig",
  "Amazon CloudWatch",
  "AWS X-Ray",
  "Amazon DevOps Guru",
  "AWS IAM",
  "AWS OpsWorks",
]);

/** Every AI and machine learning service in the directory, for the AWS AI guide. */
export const AWS_AI_SERVICES: ServiceEntry[] = AWS_SERVICE_CATALOG.filter(service => service.category === "AI & Machine Learning");
