/**
 * Editorial ordering of AWS services by how often a learner meets them — in job
 * descriptions, certification blueprints, reference architectures and interview
 * questions. It is a curated teaching order, not measured usage data, and AWS
 * publishes no per-service adoption figures to rank against.
 *
 * Ranking applies *within* a category, so "AI & Machine Learning" opens with
 * Bedrock and SageMaker and "DevOps & CI/CD" with CloudFormation. Every name
 * here must match an entry in `aws-directory-generated.json`; the catalog test
 * fails if one drifts, so a rename cannot silently drop a service to the back.
 *
 * Services absent from this list keep their alphabetical order after the ranked
 * ones, which is the honest position for a service nobody has ranked yet.
 */
export const AWS_POPULARITY: string[] = [
  // Tier 1 — the services almost every AWS account uses.
  "Amazon S3",
  "Amazon EC2",
  "AWS Lambda",
  "AWS IAM",
  "Amazon VPC",
  "Amazon RDS",
  "Amazon DynamoDB",
  "Amazon CloudWatch",
  "Amazon CloudFront",
  "Amazon Route 53",
  "Elastic Load Balancing",
  "Amazon ECS",
  "Amazon EKS",
  "Amazon SQS",
  "Amazon SNS",
  "Amazon API Gateway",
  "AWS CloudFormation",
  "AWS KMS",
  "AWS Secrets Manager",
  "Amazon EFS",

  // Tier 2 — standard building blocks in production architectures.
  "AWS Fargate",
  "Amazon ECR",
  "Amazon Aurora",
  "Amazon ElastiCache",
  "AWS Step Functions",
  "Amazon EventBridge",
  "AWS CloudTrail",
  "AWS Config",
  "AWS Systems Manager",
  "Amazon Cognito",
  "AWS WAF",
  "AWS Shield",
  "Amazon GuardDuty",
  "AWS Organizations",
  "AWS Backup",
  "Auto Scaling",
  "Application Auto Scaling",
  "AWS X-Ray",
  "Amazon SES",

  // Tier 3 — data, analytics and AI, led by the services interviews ask about.
  "Amazon Bedrock",
  "Amazon SageMaker AI",
  "AWS Glue",
  "Amazon Athena",
  "Amazon Redshift",
  "Amazon Kinesis",
  "Amazon EMR",
  "Amazon OpenSearch Service",
  "Amazon QuickSight",
  "AWS Lake Formation",
  "Amazon Rekognition",
  "Amazon Comprehend",
  "Amazon Textract",
  "Amazon Polly",
  "Amazon Transcribe",
  "Amazon Translate",
  "Amazon Personalize",
  "Amazon Kendra",
  "Amazon Forecast",

  // Tier 4 — common in delivery pipelines and platform work.
  "AWS CodePipeline",
  "AWS CodeBuild",
  "AWS CodeDeploy",
  "AWS Batch",
  "AWS Direct Connect",
  "Amazon Neptune",
  "Amazon FSx",
  "Amazon Lightsail",
  "Amazon Macie 2",
  "Amazon Inspector",
  "AWS Trusted Advisor",
  "AWS Cost Explorer",
  "Amazon MSK Connect",
  "Amplify",
  "AWSAppSync",
];

const RANK = new Map(AWS_POPULARITY.map((name, index) => [name, index]));

/** Ranked services sort first, in list order; everything else keeps its place after them. */
export const popularityRank = (name: string) => RANK.get(name) ?? Number.MAX_SAFE_INTEGER;
