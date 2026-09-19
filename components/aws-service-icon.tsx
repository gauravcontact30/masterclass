import { createElement } from "react";
import {
  Activity, Archive, ArrowRightLeft, BellRing, Boxes, BrainCircuit, Briefcase, ChartColumn, Clapperboard,
  Cloud, Code2, Container, Cpu, Database, GitBranch, Globe, HardDrive, Inbox, KeyRound, Layers,
  MessagesSquare, MonitorSmartphone, Network, Receipt, Rocket, Server, ShieldCheck, SlidersHorizontal,
  Store, Waypoints, Zap, type LucideIcon,
} from "lucide-react";

/**
 * A mark for an AWS service.
 *
 * AWS's own service icons are trademarked artwork and are not redistributable
 * with an app, so these are Lucide glyphs chosen to carry the same meaning:
 * what the service *does*, drawn in the one icon set the rest of the app uses.
 * The category supplies the default, because a category is exactly a statement
 * about what its services do, and the handful of services a reader recognises
 * on sight get their own.
 */
const BY_CATEGORY: Record<string, LucideIcon> = {
  "Core AWS Services": Cloud,
  "Containers": Container,
  "Storage & Backup": HardDrive,
  "Databases": Database,
  "Networking & Edge": Network,
  "AI & Machine Learning": BrainCircuit,
  "DevOps & CI/CD": GitBranch,
  "Messaging & Integration": MessagesSquare,
  "Security & Identity": ShieldCheck,
  "Monitoring & Reliability": Activity,
  "Management & Governance": SlidersHorizontal,
  "Cost & Billing": Receipt,
  "Analytics & Data Engineering": ChartColumn,
  "Migration & Modernization": ArrowRightLeft,
  "Developer Tools": Code2,
  "Media & Streaming": Clapperboard,
  "IoT & Edge Devices": Cpu,
  "Business Applications": Briefcase,
  "End-User Computing": MonitorSmartphone,
  "Industry & Emerging Services": Rocket,
  "Marketplace & Partners": Store,
};

/** The services whose shape a reader already knows, so the mark should match it. */
const BY_SERVICE: Record<string, LucideIcon> = {
  "Amazon S3": Archive,
  "Amazon EC2": Server,
  "AWS Lambda": Zap,
  "AWS IAM": KeyRound,
  "AWS KMS": KeyRound,
  "AWS Secrets Manager": KeyRound,
  "Amazon CloudFront": Globe,
  "Amazon Route 53": Waypoints,
  "Amazon API Gateway": Waypoints,
  "AWS CloudFormation": Layers,
  "Amazon CloudWatch": Activity,
  "Amazon SQS": Inbox,
  "Amazon SNS": BellRing,
  "Amazon ECS": Container,
  "Amazon EKS": Boxes,
  "Amazon EFS": HardDrive,
  "Elastic Load Balancing": Network,
};

/** The mark for a whole category, used by the category tabs. */
export function awsCategoryIcon(category: string): LucideIcon {
  return BY_CATEGORY[category] ?? Cloud;
}

export function AwsCategoryIcon({ category, size = 14, className }: { category: string; size?: number; className?: string }) {
  return createElement(awsCategoryIcon(category), { size, className, "aria-hidden": true });
}

export function awsServiceIcon(name: string, category: string): LucideIcon {
  return BY_SERVICE[name] ?? BY_CATEGORY[category] ?? Cloud;
}

export function AwsServiceIcon({ name, category, size = 15, className }: {
  name: string; category: string; size?: number; className?: string;
}) {
  // `createElement` rather than `<Icon />`: every value in the maps is a stable
  // module-level reference, but rendering a capitalised local reads to the
  // compiler as a component built during render, which it rightly rejects.
  return createElement(awsServiceIcon(name, category), { size, className, "aria-hidden": true });
}
