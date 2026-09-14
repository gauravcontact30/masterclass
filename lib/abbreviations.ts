/** Shared, explicit meanings. Ambiguous words and brand names without a full
 * form (for example npm, V8 and NestJS) must not acquire invented expansions.
 * AWS names: https://docs.aws.amazon.com/glossary/latest/reference/glos-chap.html
 * and https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-services-that-work-with-iam.html
 */
export const ABBREVIATIONS: Readonly<Record<string, string>> = {
  AWS: "Amazon Web Services", EC2: "Elastic Compute Cloud", S3: "Simple Storage Service",
  EBS: "Elastic Block Store", EFS: "Elastic File System", ECS: "Elastic Container Service",
  EKS: "Elastic Kubernetes Service", ECR: "Elastic Container Registry", RDS: "Relational Database Service",
  VPC: "Virtual Private Cloud", IAM: "Identity and Access Management", KMS: "Key Management Service",
  STS: "Security Token Service", SQS: "Simple Queue Service", SNS: "Simple Notification Service",
  SES: "Simple Email Service", SWF: "Simple Workflow Service", DMS: "Database Migration Service",
  DMSs: "Database Migration Services", SCT: "Schema Conversion Tool", ACM: "AWS Certificate Manager",
  WAF: "Web Application Firewall", ELB: "Elastic Load Balancing", ALB: "Application Load Balancer",
  NLB: "Network Load Balancer", GWLB: "Gateway Load Balancer", ASG: "Auto Scaling Group",
  ARN: "Amazon Resource Name", ARNs: "Amazon Resource Names", AZ: "Availability Zone", AZs: "Availability Zones",
  AMI: "Amazon Machine Image", AMIs: "Amazon Machine Images", SSM: "AWS Systems Manager",
  MSK: "Managed Streaming for Apache Kafka", MWAA: "Managed Workflows for Apache Airflow",
  MQ: "Message Queuing", QLDB: "Quantum Ledger Database", DAX: "DynamoDB Accelerator",
  EMR: "Elastic MapReduce", KDS: "Kinesis Data Streams", KCL: "Kinesis Client Library",
  TCO: "Total Cost of Ownership", CUR: "Cost and Usage Report", RI: "Reserved Instance",
  RCU: "Read Capacity Unit", WCU: "Write Capacity Unit", SCP: "Service Control Policy",
  SCPs: "Service Control Policies", OU: "Organizational Unit", OUs: "Organizational Units",
  HSM: "Hardware Security Module", CMK: "Customer Master Key", BYOL: "Bring Your Own License",
  "SSE-S3": "Server-Side Encryption with Amazon S3 Managed Keys",
  "SSE-KMS": "Server-Side Encryption with AWS Key Management Service Keys",
  "SSE-C": "Server-Side Encryption with Customer-Provided Keys",
  API: "Application Programming Interface", APIs: "Application Programming Interfaces",
  SDK: "Software Development Kit", SDKs: "Software Development Kits", CLI: "Command-Line Interface",
  UI: "User Interface", UX: "User Experience", GUI: "Graphical User Interface",
  HTTP: "Hypertext Transfer Protocol", HTTPS: "Hypertext Transfer Protocol Secure",
  URL: "Uniform Resource Locator", URLs: "Uniform Resource Locators", URI: "Uniform Resource Identifier",
  DNS: "Domain Name System", TCP: "Transmission Control Protocol", UDP: "User Datagram Protocol",
  IP: "Internet Protocol", IPv4: "Internet Protocol Version 4", IPv6: "Internet Protocol Version 6",
  TLS: "Transport Layer Security", SSL: "Secure Sockets Layer", SSH: "Secure Shell",
  FTP: "File Transfer Protocol", SFTP: "SSH File Transfer Protocol", SMTP: "Simple Mail Transfer Protocol",
  CDN: "Content Delivery Network", CDNs: "Content Delivery Networks", NAT: "Network Address Translation",
  CIDR: "Classless Inter-Domain Routing", VPN: "Virtual Private Network", ACL: "Access Control List",
  ACLs: "Access Control Lists", NACL: "Network Access Control List", LAN: "Local Area Network", WAN: "Wide Area Network",
  CPU: "Central Processing Unit", GPU: "Graphics Processing Unit", RAM: "Random Access Memory",
  SSD: "Solid-State Drive", HDD: "Hard Disk Drive", OS: "Operating System", VM: "Virtual Machine",
  VMs: "Virtual Machines", "I/O": "Input/Output", IOPS: "Input/Output Operations Per Second",
  JSON: "JavaScript Object Notation", XML: "Extensible Markup Language", YAML: "YAML Ain’t Markup Language",
  HTML: "Hypertext Markup Language", CSS: "Cascading Style Sheets", JS: "JavaScript", TS: "TypeScript",
  SQL: "Structured Query Language", NoSQL: "Not Only SQL", CRUD: "Create, Read, Update, Delete",
  ORM: "Object-Relational Mapping", ORMs: "Object-Relational Mappers", ODM: "Object-Document Mapping",
  ACID: "Atomicity, Consistency, Isolation, Durability", OLTP: "Online Transaction Processing",
  OLAP: "Online Analytical Processing", ETL: "Extract, Transform, Load", ELT: "Extract, Load, Transform",
  REST: "Representational State Transfer", RPC: "Remote Procedure Call", GraphQL: "Graph Query Language",
  SDL: "Schema Definition Language", AST: "Abstract Syntax Tree", JWT: "JSON Web Token",
  CORS: "Cross-Origin Resource Sharing", CSRF: "Cross-Site Request Forgery", XSS: "Cross-Site Scripting",
  RBAC: "Role-Based Access Control", ABAC: "Attribute-Based Access Control", MFA: "Multi-Factor Authentication",
  SSO: "Single Sign-On", OIDC: "OpenID Connect", SAML: "Security Assertion Markup Language",
  DDoS: "Distributed Denial of Service", DoS: "Denial of Service", AES: "Advanced Encryption Standard",
  SHA: "Secure Hash Algorithm", HMAC: "Hash-Based Message Authentication Code",
  DI: "Dependency Injection", DTO: "Data Transfer Object", DTOs: "Data Transfer Objects",
  OOP: "Object-Oriented Programming", MVC: "Model-View-Controller", IoC: "Inversion of Control",
  ESM: "ECMAScript Modules", CJS: "CommonJS", SSE: "Server-Sent Events",
  SSR: "Server-Side Rendering", CSR: "Client-Side Rendering", SSG: "Static Site Generation",
  ISR: "Incremental Static Regeneration", RSC: "React Server Components", SPA: "Single-Page Application",
  DOM: "Document Object Model", SEO: "Search Engine Optimization", PWA: "Progressive Web App",
  HMR: "Hot Module Replacement", TDD: "Test-Driven Development", BDD: "Behavior-Driven Development",
  E2E: "End-to-End", CI: "Continuous Integration", "CI/CD": "Continuous Integration / Continuous Delivery",
  IaC: "Infrastructure as Code", IaaS: "Infrastructure as a Service", PaaS: "Platform as a Service",
  SaaS: "Software as a Service", FaaS: "Function as a Service", SRE: "Site Reliability Engineering",
  SLA: "Service Level Agreement", SLO: "Service Level Objective", SLI: "Service Level Indicator",
  RTO: "Recovery Time Objective", RPO: "Recovery Point Objective", DR: "Disaster Recovery",
  TTL: "Time to Live", LRU: "Least Recently Used", FIFO: "First In, First Out", DLQ: "Dead-Letter Queue",
  MQTT: "Message Queuing Telemetry Transport", AMQP: "Advanced Message Queuing Protocol",
  AI: "Artificial Intelligence", ML: "Machine Learning", NLP: "Natural Language Processing",
  LLM: "Large Language Model", LLMs: "Large Language Models", RAG: "Retrieval-Augmented Generation",
  MCP: "Model Context Protocol", CoT: "Chain of Thought",
  RLHF: "Reinforcement Learning from Human Feedback", DPO: "Direct Preference Optimization",
  SFT: "Supervised Fine-Tuning", PEFT: "Parameter-Efficient Fine-Tuning", LoRA: "Low-Rank Adaptation",
  QLoRA: "Quantized Low-Rank Adaptation", HyDE: "Hypothetical Document Embeddings",
  OCR: "Optical Character Recognition", ASR: "Automatic Speech Recognition", TTS: "Text-to-Speech",
  PII: "Personally Identifiable Information", PDF: "Portable Document Format", CSV: "Comma-Separated Values",
  ES: "ECMAScript", CNCF: "Cloud Native Computing Foundation", DAG: "Directed Acyclic Graph",
  dbt: "Data Build Tool", ID: "Identifier", IDs: "Identifiers", UUID: "Universally Unique Identifier",
  AOT: "Ahead-of-Time", JIT: "Just-in-Time", GC: "Garbage Collection", NAPI: "Node-API",
  IAMs: "Identity and Access Management Systems", IoT: "Internet of Things", KPI: "Key Performance Indicator",
};

// Product names are official names, not fictional acronym expansions.
export const AWS_SERVICE_NAMES: Readonly<Record<string, string>> = {
  CloudFront: "Amazon CloudFront", CloudWatch: "Amazon CloudWatch", CloudTrail: "AWS CloudTrail",
  CloudFormation: "AWS CloudFormation", DynamoDB: "Amazon DynamoDB", ElastiCache: "Amazon ElastiCache",
  Redshift: "Amazon Redshift", Route53: "Amazon Route 53", "Route 53": "Amazon Route 53",
  Fargate: "AWS Fargate", Lambda: "AWS Lambda", EventBridge: "Amazon EventBridge",
  Cognito: "Amazon Cognito", AppSync: "AWS AppSync", Amplify: "AWS Amplify",
  "Step Functions": "AWS Step Functions", "API Gateway": "Amazon API Gateway",
  "Secrets Manager": "AWS Secrets Manager", "Systems Manager": "AWS Systems Manager",
  "CloudHSM": "AWS CloudHSM", "GuardDuty": "Amazon GuardDuty", "Security Hub": "AWS Security Hub",
  "AWS Config": "AWS Config", "AWS Backup": "AWS Backup", "AWS Glue": "AWS Glue",
  "Amazon Athena": "Amazon Athena", "Amazon Bedrock": "Amazon Bedrock", "Amazon SageMaker": "Amazon SageMaker",
};
const awsAcronyms = new Set("EC2 S3 EBS EFS ECS EKS ECR RDS VPC IAM KMS STS SQS SNS SES SWF DMS SCT ACM WAF ELB EMR MSK MWAA QLDB DAX SSM".split(" "));
const terms = { ...ABBREVIATIONS, ...AWS_SERVICE_NAMES };
for (const term of awsAcronyms) {
  terms[`Amazon ${term}`] = ABBREVIATIONS[term];
  terms[`AWS ${term}`] = ABBREVIATIONS[term];
}
const escaped = Object.keys(terms).sort((a, b) => b.length - a.length).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(${escaped.join("|")})(?![\\p{L}\\p{N}_])`, "gu");
export type ExpandedPart = { text: string; fullForm?: string };
/** Navigation keeps short labels, including when source titles already contain a full form. */
export function compactAbbreviations(text: string): string {
  for (const [short, full] of Object.entries(ABBREVIATIONS)) {
    text = text.replaceAll(`${short} (${full})`, short).replaceAll(`${full} (${short})`, short);
  }
  return text;
}
export function expandAbbreviations(text: string): ExpandedPart[] {
  const parts: ExpandedPart[] = [];
  let cursor = 0;
  // URLs, addresses, inline code and paths remain exact and copyable.
  const protectedRanges = [...text.matchAll(/`[^`]*`|https?:\/\/\S+|\b\S+@\S+\.\S+|(?:\.?\.?\/)[\w./-]+/g)].map(match => [match.index!, match.index! + match[0].length]);
  for (const match of text.matchAll(pattern)) {
    const start = match.index!;
    let end = start + match[0].length;
    if (start < cursor) continue;
    if (protectedRanges.some(([a, b]) => start >= a && start < b)) continue;
    let fullForm: string | undefined = terms[match[0]];
    if (match[0] === "SSE" && /encrypt|\bS3\b|\bKMS\b|bucket/i.test(text)) fullForm = "Server-Side Encryption";
    // Existing expansions and fully spelled official names need no duplicate.
    const after = text.slice(end);
    const before = text.slice(0, start).trimEnd();
    if (after.trimStart().startsWith(`(${fullForm})`)) end += after.indexOf(`(${fullForm})`) + fullForm.length + 2;
    if (fullForm === match[0] || before.toLowerCase().endsWith(`${fullForm.toLowerCase()} (`) || before.toLowerCase().endsWith(fullForm.toLowerCase()) || (/^(?:AWS|Amazon)\s+$/.test(text.slice(Math.max(0, start - 7), start)) && AWS_SERVICE_NAMES[match[0]])) fullForm = undefined;
    if (start > cursor) parts.push({ text: text.slice(cursor, start) });
    parts.push({ text: match[0], fullForm }); cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts.length ? parts : [{ text }];
}
