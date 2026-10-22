/**
 * The service icons each certification track may show on its steps. `brand:<slug>` is a real brand mark copied
 * from simple-icons (lib/certification-brands.ts, CC0 paths); `aws:<service>|<category>` is drawn by
 * components/aws-service-icon.tsx, because AWS's own service icons are not redistributable with an app and
 * simple-icons no longer carries them. scripts/generate-certification-content.ts lets the model pick only from
 * these lists, so every icon on a step is one the page can draw.
 */
const aws = (service: string, category: string) => `aws:${service}|${category}`;

const AWS_CORE = [
  aws("Amazon EC2", "Core AWS Services"), aws("Amazon S3", "Storage & Backup"), aws("AWS Lambda", "Core AWS Services"),
  aws("Amazon DynamoDB", "Databases"), aws("Amazon RDS", "Databases"), aws("Amazon Aurora", "Databases"),
  aws("Amazon ElastiCache", "Databases"), aws("Amazon VPC", "Networking & Edge"), aws("Elastic Load Balancing", "Networking & Edge"),
  aws("Amazon CloudFront", "Networking & Edge"), aws("Amazon Route 53", "Networking & Edge"), aws("Amazon API Gateway", "Networking & Edge"),
  aws("AWS IAM", "Security & Identity"), aws("AWS KMS", "Security & Identity"), aws("AWS Secrets Manager", "Security & Identity"),
  aws("Amazon SQS", "Messaging & Integration"), aws("Amazon SNS", "Messaging & Integration"), aws("Amazon EventBridge", "Messaging & Integration"),
  aws("AWS Step Functions", "Messaging & Integration"), aws("Amazon CloudWatch", "Monitoring & Reliability"),
  aws("AWS CloudFormation", "Management & Governance"), aws("AWS Organizations", "Management & Governance"),
  aws("Amazon ECS", "Containers"), aws("Amazon EKS", "Containers"), aws("Amazon EFS", "Storage & Backup"),
];

export const ICON_CHOICES: Record<string, string[]> = {
  "system-design": [
    "brand:redis", "brand:postgresql", "brand:mongodb", "brand:apachecassandra", "brand:apachekafka", "brand:rabbitmq", "brand:nginx",
    "brand:docker", "brand:kubernetes", "brand:elasticsearch", "brand:prometheus", "brand:grafana", "brand:cloudflare", "brand:graphql",
    aws("Amazon ElastiCache", "Databases"), aws("Elastic Load Balancing", "Networking & Edge"), aws("Amazon SQS", "Messaging & Integration"),
    aws("Amazon DynamoDB", "Databases"), aws("Amazon S3", "Storage & Backup"), aws("Amazon CloudFront", "Networking & Edge"),
  ],
  "claude-code": [
    "brand:claude", "brand:anthropic", "brand:modelcontextprotocol", "brand:github", "brand:githubactions", "brand:typescript",
    "brand:nodedotjs", "brand:python", "brand:jetbrains", "brand:docker", "brand:postgresql",
  ],
  aws: [
    ...AWS_CORE,
    aws("Amazon Bedrock", "AI & Machine Learning"), aws("Amazon SageMaker", "AI & Machine Learning"), aws("Amazon Q", "AI & Machine Learning"),
    aws("Amazon Kinesis", "Analytics & Data Engineering"), aws("AWS Glue", "Analytics & Data Engineering"), aws("Amazon Athena", "Analytics & Data Engineering"),
    aws("Amazon Redshift", "Analytics & Data Engineering"), aws("AWS CodePipeline", "DevOps & CI/CD"), aws("AWS Cost Explorer", "Cost & Billing"),
  ],
  n8n: [
    "brand:n8n", "brand:docker", "brand:postgresql", "brand:redis", "brand:gmail", "brand:googlesheets", "brand:telegram", "brand:notion",
    "brand:github", "brand:anthropic", "brand:nodedotjs", "brand:python", "brand:postman",
  ],
  "agentic-ai": [
    "brand:huggingface", "brand:nvidia", "brand:langchain", "brand:langgraph", "brand:anthropic", "brand:claude", "brand:modelcontextprotocol",
    "brand:python", "brand:ollama", "brand:fastapi", "brand:pydantic", "brand:googlecloud",
    aws("Amazon Bedrock", "AI & Machine Learning"), aws("Amazon SageMaker", "AI & Machine Learning"),
  ],
  "langchain-python": [
    "brand:langchain", "brand:langgraph", "brand:python", "brand:pydantic", "brand:fastapi", "brand:datastax", "brand:anthropic",
    "brand:huggingface", "brand:ollama", "brand:postgresql", "brand:redis", "brand:jupyter", "brand:docker", "brand:streamlit",
  ],
};

export const BRAND_SLUGS = [...new Set(Object.values(ICON_CHOICES).flat().filter(key => key.startsWith("brand:")).map(key => key.slice(6)))];
