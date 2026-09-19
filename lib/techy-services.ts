import directory from "./generation/guides/aws-directory-generated.json";
import { AWS_POPULARITY } from "./generation/guides/aws-popularity";

export type ServiceScope = "aws-ai" | "aws-all" | "aws-devops";
export type ServiceCard = { id: string; name: string; category: string; summary: string; points: string[]; sourceUrl: string; kind: string; lifecycle?: string; lifecycleUrl?: string };
const aiCategory = "AI & Machine Learning";
const devopsCategory = "DevOps & CI/CD";
const supplemental: ServiceCard[] = [
  ["nova", "Amazon Nova", "Foundation models for supported text, image and multimodal tasks.", "Select models by task and evaluate quality.|Check model and regional availability.", "https://aws.amazon.com/nova/"],
  ["bedrock-knowledge-bases", "Amazon Bedrock Knowledge Bases", "Managed retrieval workflows that connect supported data sources to generation.", "Ingest, chunk and retrieve relevant data.|Preserve source permissions in application retrieval.", "https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html"],
  ["bedrock-guardrails", "Amazon Bedrock Guardrails", "Configurable safety controls for model inputs and responses.", "Configure content and topic policies.|Evaluate false positives and missed violations.", "https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html"],
  ["trainium", "AWS Trainium", "AWS-designed acceleration for supported machine learning training workloads.", "Evaluate compiler and framework compatibility.|Measure training throughput for your model.", "https://aws.amazon.com/ai/machine-learning/trainium/"],
  ["inferentia", "AWS Inferentia", "AWS-designed acceleration for supported inference workloads.", "Use compatible Neuron tooling.|Benchmark latency and throughput before migration.", "https://aws.amazon.com/ai/machine-learning/inferentia/"],
  ["quick", "Amazon Quick Suite", "An AI work suite for research, insights and workflow automation.", "Connect authorized business data.|Review actions and source access policies.", "https://aws.amazon.com/quicksuite/"],
  ["transform", "AWS Transform", "Agent-assisted modernization of supported legacy workloads.", "Assess supported migration targets.|Review generated changes and run regression tests.", "https://aws.amazon.com/transform/"],
  ["q-developer", "Amazon Q Developer", "Developer assistance for supported coding and AWS workflows.", "Review generated code and suggested operations.|IDE plugins have an announced 2027 end-of-support timeline; check current migration guidance.", "https://aws.amazon.com/q/developer/"],
  ["strands", "Strands Agents SDK", "An open-source SDK for building agents; an SDK, not a standalone managed AWS service.", "Define tools and a bounded execution strategy.|Choose a model provider and deployment environment.", "https://strandsagents.com/"],
  ["sagemaker-pipelines", "Amazon SageMaker Pipelines", "Orchestrate repeatable machine learning workflow steps.", "Track pipeline executions and artifacts.|Use explicit quality gates before deployment.", "https://docs.aws.amazon.com/sagemaker/latest/dg/pipelines.html"],
  ["sagemaker-canvas", "Amazon SageMaker Canvas", "A visual environment for supported ML and generative AI workflows.", "Prepare data and compare model results.|Confirm supported regions and feature availability.", "https://docs.aws.amazon.com/sagemaker/latest/dg/canvas.html"],
].map(([id, name, summary, points, sourceUrl]) => ({ id, name, summary, points: points.split("|"), sourceUrl, category: aiCategory, kind: "Related offering" }));

const maintenance = new Set(["forecast", "forecastquery", "kendra", "kendra-ranking", "qbusiness", "qapps", "cloud9", "codecatalyst", "codeguru-reviewer", "bedrock-agent", "bedrock-agent-runtime", "sagemaker-a2i-runtime", "sagemaker-geospatial", "apprunner", "auditmanager", "cloudsearch", "cloudsearchdomain", "clouddirectory", "discovery", "migrationhub", "glacier", "ssm-incidents", "ssm-contacts", "cognito-sync", "timestream-query", "timestream-write"]);
const sunset = new Map([ ["frauddetector", "2026-10-07"], ["lookoutequipment", "2026-10-07"], ["proton", "2026-10-07"], ["appmesh", "2026-09-30"], ["pinpoint", "2026-10-30"], ["finspace", "2026-10-07"], ["finspace-data", "2026-10-07"], ["waf", "2026-10-07"], ["waf-regional", "2026-10-07"] ]);
const retired = new Set(["AWS OpsWorks", "opsworks", "opsworkscm", "evidently", "mediastore", "mediastore-data", "elastictranscoder", "iotanalytics", "iotevents", "iotevents-data", "qldb", "qldb-session", "robomaker", "simspaceweaver", "workdocs", "voice-id", "panorama", "inspector", "nimble", "sms"]);
const lifecycleRoot = "https://docs.aws.amazon.com/general/latest/gr/";

export const TECHY_AWS_SERVICES: ServiceCard[] = [
  ...directory.map(entry => ({ id: entry.awsId || entry.name, name: entry.name, category: entry.category, summary: entry.summary, points: entry.points, sourceUrl: entry.sourceUrl, kind: entry.kind === "service" ? "Service" : "Service / API capability" })),
  ...supplemental,
].map(entry => {
  if (retired.has(entry.id)) return { ...entry, lifecycle: "Retired — historical reference", lifecycleUrl: lifecycleRoot + "full_shutdown_services.html" };
  if (sunset.has(entry.id)) return { ...entry, lifecycle: `Sunset — support ends ${sunset.get(entry.id)}`, lifecycleUrl: lifecycleRoot + "sunset_services.html" };
  if (maintenance.has(entry.id)) return { ...entry, lifecycle: "Maintenance — closed to new customers", lifecycleUrl: lifecycleRoot + "maintenance_services.html" };
  if (entry.id === "q-developer") return { ...entry, lifecycle: "IDE plugins sunset — 2027-04-30 (not the entire service)", lifecycleUrl: lifecycleRoot + "sunset_services.html" };
  if (entry.id === "codecommit") return { ...entry, lifecycle: "New-customer access reopened November 2025", lifecycleUrl: "https://aws.amazon.com/blogs/devops/aws-codecommit-returns-to-general-availability/" };
  return entry;
});

const aiFirst = ["Amazon Bedrock", "Amazon SageMaker AI", "Amazon Bedrock AgentCore", "Amazon Nova", "Amazon Bedrock Knowledge Bases", "Amazon Bedrock Guardrails", "Amazon Textract", "Amazon Transcribe", "Amazon Rekognition", "Amazon Polly", "Amazon Translate", "Amazon Lex", "Amazon Comprehend", "Amazon Personalize"];
const devopsFirst = ["AWS CodePipeline", "AWS CodeBuild", "AWS CodeDeploy", "AWS CodeCommit", "AWS CloudFormation", "AWS CDK", "Amazon ECR", "Amazon CloudWatch", "AWS Systems Manager", "AWS CodeArtifact", "AWS CodeConnections", "AWS AppConfig", "AWS Secrets Manager", "AWS X-Ray"];
const devopsRelated = new Set([...devopsFirst, "Amazon ECS", "Amazon EKS", "AWS Fargate", "AWS IAM", "AWS CloudTrail", "AWS Config", "Amazon EventBridge", "AWS Step Functions", "Amazon Inspector", "AWS Security Agent", "AWS Systems Manager QuickSetup", "AWS Lambda", "Amazon S3", "Amazon EC2", "AWS KMS", "AWS Device Farm", "Amplify"]);
const aiRelated = new Set(["AWS Security Agent", "AWS DevOps Agent Service", "Amazon OpenSearch Service", "Amazon Connect", "AWS HealthLake", "Amazon Q", "Amazon QuickSight", "Amazon CodeGuru Profiler", "Amazon CodeGuru Security", "CodeGuruReviewer"]);

export function servicePriority(name: string, scope: ServiceScope) {
  const order = scope === "aws-ai" ? aiFirst : scope === "aws-devops" ? devopsFirst : AWS_POPULARITY;
  const rank = order.indexOf(name);
  return rank < 0 ? Number.MAX_SAFE_INTEGER : rank;
}
export function serviceCards(scope: ServiceScope) {
  return TECHY_AWS_SERVICES.filter(entry => scope === "aws-all" || (scope === "aws-ai" ? entry.category === aiCategory || aiRelated.has(entry.name) : entry.category === devopsCategory || entry.category === "Developer Tools" || devopsRelated.has(entry.name)))
    .sort((a, b) => Number(!!a.lifecycle && a.id !== "codecommit") - Number(!!b.lifecycle && b.id !== "codecommit") || servicePriority(a.name, scope) - servicePriority(b.name, scope) || a.name.localeCompare(b.name));
}
