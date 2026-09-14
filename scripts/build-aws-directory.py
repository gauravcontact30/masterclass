"""Build a pinned AWS reference directory from official, Apache-licensed SDK models.

Usage: python scripts/build-aws-directory.py .next/cache/aws-source/botocore-*.whl
The wheel is read as data, never installed or imported. Curated essentials win.
"""
import gzip
import hashlib
import html
import json
import pathlib
import re
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
GUIDES = ROOT / "lib/generation/guides"
wheel = pathlib.Path(sys.argv[1])
essentials_path = GUIDES / "aws-service-essentials.json"
if not essentials_path.exists():
    original = (GUIDES / "aws-service-catalog.ts").read_text(encoding="utf-8")
    essentials_path.write_text(json.dumps(json.loads(original.split("= ", 1)[1].rstrip(";\n")), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
essentials = json.loads(essentials_path.read_text(encoding="utf-8"))
overrides_path = GUIDES / "aws-directory-overrides.json"
overrides = json.loads(overrides_path.read_text(encoding="utf-8")) if overrides_path.exists() else {}

CATEGORY_IDS = {
    "Core AWS Services": "ec2 lambda lambda-core lambda-microvms autoscaling autoscaling-plans application-autoscaling batch lightsail elasticbeanstalk imagebuilder compute-optimizer compute-optimizer-automation outposts evs pcs",
    "Containers": "ecs eks eks-auth ecr ecr-public apprunner",
    "Storage & Backup": "s3 s3control s3files s3outposts s3tables s3vectors ebs efs fsx glacier storagegateway backup backup-gateway backupsearch dlm rbin importexport snowball snow-device-management",
    "Databases": "rds rds-data docdb docdb-elastic dsql dynamodb dynamodbstreams elasticache memorydb dax neptune neptune-graph neptunedata keyspaces keyspacesstreams timestream-influxdb timestream-query timestream-write sdb simpledbv2 odb",
    "Networking & Edge": "apigateway apigatewayv2 apigatewaymanagementapi cloudfront cloudfront-keyvaluestore directconnect interconnect elb elbv2 globalaccelerator route53 route53domains route53globalresolver route53profiles route53resolver route53-recovery-cluster route53-recovery-control-config route53-recovery-readiness vpc-lattice networkmanager networkmonitor networkflowmonitor internetmonitor appmesh servicediscovery arc-region-switch arc-zonal-shift",
    "AI & Machine Learning": "bedrock bedrock-agent bedrock-agent-runtime bedrock-runtime bedrock-agentcore bedrock-agentcore-control bedrock-data-automation bedrock-data-automation-runtime agent-registry agent-registry-control nova-act sagemaker sagemaker-a2i-runtime sagemaker-edge sagemaker-featurestore-runtime sagemaker-geospatial sagemaker-metrics sagemaker-runtime sagemakerjobruntime comprehend comprehendmedical rekognition textract transcribe translate polly lex-models lex-runtime lexv2-models lexv2-runtime personalize personalize-events personalize-runtime forecast forecastquery kendra kendra-ranking frauddetector machinelearning lookoutequipment qbusiness qapps cleanroomsml",
    "DevOps & CI/CD": "codeartifact codebuild codecatalyst codecommit codeconnections codedeploy codepipeline codestar-connections codestar-notifications cloudformation cloudcontrol appconfig appconfigdata proton signer signer-data devops-agent devops-guru",
    "Messaging & Integration": "sqs sns events pipes scheduler schemas stepfunctions swf mq appflow b2bi appintegrations ses sesv2 pinpoint pinpoint-email pinpoint-sms-voice pinpoint-sms-voice-v2 sms-voice socialmessaging mailmanager notifications notificationscontacts",
    "Security & Identity": "iam iam-toolbox accessanalyzer acm acm-pca pca-connector-ad pca-connector-scep kms secretsmanager cloudhsm cloudhsmv2 guardduty shield waf waf-regional wafv2 fms cognito-idp cognito-identity cognito-sync sts sso sso-admin sso-oidc identitystore signin account-access rolesanywhere verifiedpermissions detective inspector inspector2 inspector-scan macie2 securityhub securitylake security-ir securityagent ds ds-data clouddirectory network-firewall payment-cryptography payment-cryptography-data artifact auditmanager mpa",
    "Monitoring & Reliability": "cloudwatch logs xray application-insights application-signals synthetics rum oam observabilityadmin amp grafana aiops health resiliencehub resiliencehubv2 fis pi",
    "Management & Governance": "account config cloudtrail cloudtrail-data organizations controltower controlcatalog servicecatalog servicecatalog-appregistry service-quotas resource-explorer-2 resource-groups resourcegroupstaggingapi ram ssm ssm-contacts ssm-guiconnect ssm-incidents ssm-quicksetup ssm-sap wellarchitected trustedadvisor support support-app supportauthz launch-wizard license-manager license-manager-linux-subscriptions license-manager-user-subscriptions",
    "Cost & Billing": "budgets ce billing billingconductor bcm-dashboards bcm-data-exports bcm-pricing-calculator bcm-recommended-actions cost-optimization-hub cur freetier pricing pricing-plan-manager savingsplans invoicing taxsettings applicationcostprofiler sustainability",
    "Analytics & Data Engineering": "athena emr emr-containers emr-serverless redshift redshift-data redshift-serverless glue databrew datazone lakeformation dataexchange datapipeline kinesis kafka kafkaconnect firehose kinesisanalytics kinesisanalyticsv2 opensearch opensearchserverless es osis cloudsearch cloudsearchdomain quicksight cleanrooms entityresolution finspace finspace-data",
    "Migration & Modernization": "datasync dms discovery drs m2 mgh mgn migration-hub-refactor-spaces migrationhub-config migrationhuborchestrator migrationhubstrategy transfer",
    "Developer Tools": "amplify amplifybackend amplifyuibuilder appsync cloud9 codeguru-reviewer codeguru-security codeguruprofiler devicefarm serverlessrepo ec2-instance-connect mwaa mwaa-serverless",
    "Media & Streaming": "mediaconnect mediaconvert medialive mediapackage mediapackage-vod mediapackagev2 mediastore mediastore-data mediatailor elementalinference ivs ivs-realtime ivschat kinesisvideo kinesis-video-archived-media kinesis-video-media kinesis-video-signaling kinesis-video-webrtc-storage deadline",
    "IoT & Edge Devices": "iot iot-data iot-jobs-data iot-managed-integrations iotdeviceadvisor iotfleetwise iotsecuretunneling iotsitewise iotthingsgraph iottwinmaker iotwireless greengrass greengrassv2",
    "Business Applications": "connect connect-contact-lens connectcampaigns connectcampaignsv2 connectcases connecthealth connectparticipant customer-profiles qconnect wisdom voice-id chime chime-sdk-identity chime-sdk-media-pipelines chime-sdk-meetings chime-sdk-messaging chime-sdk-voice appfabric workdocs workmail workmailmessageflow wickr chatbot repostspace uxc supplychain",
    "End-User Computing": "appstream workspaces workspaces-instances workspaces-thin-client workspaces-web",
    "Industry & Emerging Services": "braket groundstation gamelift gameliftstreams geo-maps geo-places geo-routes location healthlake medical-imaging omics managedblockchain managedblockchain-query mturk tnb rtbfabric",
    "Marketplace & Partners": "marketplace-agreement marketplace-catalog marketplace-deployment marketplace-discovery marketplace-entitlement marketplace-reporting marketplacecommerceanalytics meteringmarketplace partnercentral-account partnercentral-benefits partnercentral-channel partnercentral-revenue-measurement partnercentral-selling",
}
categories = {key: category for category, keys in CATEGORY_IDS.items() for key in keys.split()}
aliases = dict(pair.split("=", 1) for pair in """ec2=Amazon EC2
lambda=AWS Lambda
ecs=Amazon ECS
eks=Amazon EKS
apprunner=AWS App Runner
s3=Amazon S3
ebs=Amazon EBS
efs=Amazon EFS
glacier=Amazon S3 Glacier
rds=Amazon RDS
dynamodb=Amazon DynamoDB
elasticache=Amazon ElastiCache
route53=Amazon Route 53
cloudfront=Amazon CloudFront
elbv2=Elastic Load Balancing
directconnect=AWS Direct Connect
apigateway=Amazon API Gateway
iam=AWS IAM
secretsmanager=AWS Secrets Manager
kms=AWS KMS
guardduty=Amazon GuardDuty
shield=AWS Shield
wafv2=AWS WAF
cognito-idp=Amazon Cognito
cloudwatch=Amazon CloudWatch
xray=AWS X-Ray
cloudtrail=AWS CloudTrail
ssm=AWS Systems Manager
cloudformation=AWS CloudFormation
config=AWS Config
organizations=AWS Organizations
athena=Amazon Athena
emr=Amazon EMR
redshift=Amazon Redshift
kinesis=Amazon Kinesis
glue=AWS Glue
opensearch=Amazon OpenSearch Service
bedrock=Amazon Bedrock
bedrock-agentcore=Amazon Bedrock AgentCore
sagemaker=Amazon SageMaker AI
rekognition=Amazon Rekognition
textract=Amazon Textract
transcribe=Amazon Transcribe
polly=Amazon Polly
comprehend=Amazon Comprehend
translate=Amazon Translate
lexv2-models=Amazon Lex
personalize=Amazon Personalize
forecast=Amazon Forecast
kendra=Amazon Kendra
codepipeline=AWS CodePipeline
codebuild=AWS CodeBuild
codedeploy=AWS CodeDeploy
codeartifact=AWS CodeArtifact
codecommit=AWS CodeCommit
ecr=Amazon ECR
appconfig=AWS AppConfig
devops-guru=Amazon DevOps Guru
sqs=Amazon SQS
sns=Amazon SNS
events=Amazon EventBridge
stepfunctions=AWS Step Functions
firehose=Amazon Data Firehose
globalaccelerator=AWS Global Accelerator
batch=AWS Batch""".splitlines())
by_name = {entry["name"]: entry for entry in essentials}

def plain(value):
    value = re.sub(r"</(?:p|li|div|h\d)>", ". ", value)
    value = html.unescape(re.sub(r"<[^>]+>", "", value))
    return re.sub(r"\s+", " ", value).replace(". .", ".").strip(" .")

def concise(value, limit):
    value = plain(value)
    first = re.split(r"(?<=[.!?])\s+(?=[A-Z])", value)[0]
    if len(first) <= limit:
        return first.rstrip(".") + "."
    return first[:limit - 1].rsplit(" ", 1)[0].rstrip(" ,;:") + "…"

def paragraphs(value):
    found = [plain(p) for p in re.findall(r"<p>(.*?)</p>", value, re.S) if plain(p)]
    return found or ([plain(value)] if plain(value) else [])

def useful(value):
    return not re.search(r"^(welcome|for (more |information|details)|this (guide|document|section)|see |the following|to learn|you (can find|should)|use the following)|api reference|https?://|end.of.support|end.of.life", value, re.I)

def operation_points(model):
    candidates, details = [], []
    for name, operation in model.get("operations", {}).items():
        if re.match(r"(Tag|Untag|ListTags|GetTags)", name):
            continue
        description = next((p for p in paragraphs(operation.get("documentation", "")) if useful(p)), "")
        if not description:
            continue
        details.extend(concise(p, 270) for p in paragraphs(operation.get("documentation", ""))[1:] if useful(p) and len(p) > 35)
        # Prefer distinct domain actions over inventories and generic CRUD.
        score = 3 if re.match(r"(Invoke|Start|Run|Detect|Analyze|Search|Query|Send|Put|Publish|Evaluate|Create|Generate|Translate|Synthesize)", name) else 1
        if re.match(r"(Delete|List|Describe|Get|Update)", name):
            score = 0
        candidates.append((score, name, concise(description, 270)))
    candidates.sort(key=lambda item: (-item[0], item[1]))
    selected, verbs = [], set()
    for score, name, description in candidates:
        if description in selected:
            continue
        verb = re.match(r"^[A-Z][a-z]+", name)
        verb = verb.group() if verb else name
        if verb in verbs and len(verbs) < 3:
            continue
        selected.append(description)
        verbs.add(verb)
        if len(selected) == 3:
            break
    for _, _, description in candidates:
        if len(selected) >= 3:
            break
        if description not in selected:
            selected.append(description)
    for description in details:
        if len(selected) >= 3:
            break
        if description not in selected:
            selected.append(description)
    return selected

entries, issues, namespaces = [], [], {}
with zipfile.ZipFile(wheel) as archive:
    for name in sorted(archive.namelist()):
        if name.endswith("/service-2.json.gz"):
            namespaces[name.split("/")[2]] = name
    used = set()
    for aws_id, path in sorted(namespaces.items()):
        model = json.loads(gzip.decompress(archive.read(path)))
        metadata = model["metadata"]
        if aws_id not in categories:
            issues.append({"id": aws_id, "issue": "category missing"})
        source = f"https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/{aws_id}.html"
        if aws_id in aliases:
            entry = dict(by_name[aliases[aws_id]])
            used.add(entry["name"])
            entry.update(category=categories[aws_id], kind="service", sourceUrl=source, awsId=aws_id)
        else:
            name = metadata.get("serviceAbbreviation") or metadata.get("serviceFullName") or metadata["serviceId"]
            name = name.replace("Amazon Web Services", "AWS")
            docs = model.get("documentation", "")
            purpose = next((p for p in paragraphs(docs) if useful(p) and len(p) > 45), "")
            if not purpose:
                purpose = f"Access the documented {name} capabilities through its AWS API."
                issues.append({"id": aws_id, "issue": "purpose needs review", "name": name})
            points = operation_points(model)
            if len(points) < 3:
                issues.append({"id": aws_id, "issue": "points need review", "points": points})
            entry = dict(name=name, category=categories.get(aws_id, "Management & Governance"), summary=concise(purpose, 295), points=points, sourceUrl=source, awsId=aws_id, kind="capability")
        entry.update(overrides.get(aws_id, {}))
        entries.append(entry)
    extras_categories = {"AWS Fargate": "Containers", "Amazon VPC": "Networking & Edge", "Amazon Aurora": "Databases", "AWS CDK": "DevOps & CI/CD", "AWS Budgets & Cost Explorer": "Cost & Billing", "Amazon Q": "AI & Machine Learning", "AWS OpsWorks": "DevOps & CI/CD"}
    for item in essentials:
        if item["name"] not in used:
            entries.append({**item, "category": extras_categories[item["name"]], "kind": "service", "sourceUrl": "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/aws-services.html"})
    notices = ROOT / "docs/third-party/botocore"
    notices.mkdir(parents=True, exist_ok=True)
    for filename in ["LICENSE.txt", "NOTICE"]:
        path = next(name for name in archive.namelist() if name.endswith(".dist-info/" + filename))
        (notices / filename).write_bytes(archive.read(path))

(GUIDES / "aws-directory-generated.json").write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(GUIDES / "aws-directory-categories.json").write_text(json.dumps(list(CATEGORY_IDS), indent=2) + "\n", encoding="utf-8")
issues = [issue for issue in issues if not ((issue["issue"] == "purpose needs review" and "summary" in overrides.get(issue["id"], {})) or (issue["issue"] == "points need review" and "points" in overrides.get(issue["id"], {})))]
report = {"source": wheel.name, "sha256": hashlib.sha256(wheel.read_bytes()).hexdigest(), "namespaces": len(namespaces), "entries": len(entries), "review": issues}
(ROOT / ".next/cache/aws-source/review.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(report, indent=2, ensure_ascii=False))
