import type { TechnologyGuide } from "./index";
import { AWS_AI_LESSONS } from "./aws-ai-lessons";
import { AWS_AI_SERVICES } from "./aws-catalog-views";
import { AWS_AI_EXPANDED_LESSONS, AWS_AI_EXPANDED_SOURCES } from "./aws-ai-expanded";

const urls = [
  ["bedrock/latest/userguide/what-is-bedrock.html", "Amazon Bedrock"],
  ["bedrock/latest/userguide/model-access.html", "Bedrock model access prerequisites"],
  ["bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html", "Amazon Bedrock AgentCore"],
  ["sagemaker/latest/dg/whatis.html", "Amazon SageMaker AI"],
  ["amazonq/latest/qdeveloper-ug/what-is.html", "Amazon Q Developer"],
  ["rekognition/latest/dg/what-is.html", "Amazon Rekognition"],
  ["textract/latest/dg/what-is.html", "Amazon Textract"],
  ["transcribe/latest/dg/what-is.html", "Amazon Transcribe"],
  ["polly/latest/dg/what-is.html", "Amazon Polly"],
  ["comprehend/latest/dg/what-is.html", "Amazon Comprehend"],
  ["translate/latest/dg/what-is.html", "Amazon Translate"],
  ["lexv2/latest/dg/what-is.html", "Amazon Lex"],
  ["personalize/latest/dg/what-is-personalize.html", "Amazon Personalize"],
  ["forecast/latest/dg/what-is-forecast.html", "Amazon Forecast availability"],
  ["kendra/latest/dg/what-is-kendra.html", "Amazon Kendra"],
];

const guide: TechnologyGuide = {
  version: 6,
  id: "aws-ai-services", technologyId: "aws", topicId: "aws-ai-services", level: "intermediate",
  curriculum: {
    title: "AWS AI services", minutes: 150 + AWS_AI_EXPANDED_LESSONS.length * 8,
    objectives: ["Choose between generative AI, custom ML and task-specific APIs.", "Understand each AWS AI service through concise, pointwise cards.", "Design an evaluated workflow with clear data boundaries and human review."],
    prerequisites: ["Basic AWS IAM and S3 knowledge.", "Familiarity with an API request and response."],
    services: AWS_AI_SERVICES,
    lessons: [
      {
        title: "Start with the task, then choose the service",
        diagram: {"kind": "flow", "caption": "Input contract → Task-specific API → Validate extraction → Generate explanation → Evaluate outcome", "items": [{"label": "Input contract"}, {"label": "Task-specific API"}, {"label": "Validate extraction"}, {"label": "Generate explanation"}, {"label": "Evaluate outcome"}]},
        explanation: "- Write down the required output before choosing a model: an extracted invoice field, transcript, recommendation or generated answer\n- For a specific task, evaluate the matching managed API against representative inputs\n- Use Bedrock for foundation-model inference; consider SageMaker AI when building, training or deploying a model is part of the requirement\n- Separate deterministic validation from probabilistic model output\n- Define an acceptance dataset with difficult examples and expected answers\n- Track correctness, latency, cost per successful task and manual-review rate together\n- Keep access permissions, retention and logs explicit at each processing step",
        example: "A fictional learning app receives scanned worksheets. It first extracts text with Textract, validates the required question fields, and then asks a Bedrock model to explain the extracted question. An unreadable question goes to review instead of receiving an invented answer. The test set includes rotated pages, handwriting and an empty scan.",
        code: "# design/worksheet-pipeline.yaml — a design sketch, not deployable infrastructure\nsteps:\n  - extract: textract\n  - validate: required_question_fields\n  - review: low_confidence_or_missing_fields\n  - explain: bedrock\nacceptance:\n  dataset: annotated_worksheets\n  metrics: [field_accuracy, answer_correctness, latency, review_rate]\n",
        keyPoints: [{ tone: "tip", title: "Try it yourself", text: "Use the worked example as a starting point, change one input, and compare the result with your prediction." }],
        exercise: "Choose three inputs for a worksheet assistant: a clean scan, an unreadable scan and a page containing instructions to ignore the task. State the expected route and output for each.",
        checkpoint: "Can you explain why extraction, validation and explanation are separate steps, and identify which step must reject an unreadable question?",
        mistake: "Treating a fluent generated explanation as evidence that the source document was read correctly.",
      },
      ...AWS_AI_LESSONS,
      ...AWS_AI_EXPANDED_LESSONS,
    ],
    project: "Design an accessible worksheet assistant using Textract for extraction, Bedrock for explanations and Polly for spoken output. Document the input/output contract for each step, a manual-review path, IAM permissions, retention choices, and a small evaluation dataset. Compare cost and latency using measured requests in a sandbox before proposing production capacity.",
    summary: "AWS offers foundation-model access, custom machine learning workflows and APIs for specific tasks. These notes connect each service to its purpose, a practical use and operating considerations. Choose through measured task performance and keep validation and human review visible in the design.",
    glossary: [
      { term: "Inference", definition: "Running a trained model on a new input to produce a prediction or response." },
      { term: "RAG", definition: "Retrieval-augmented generation: supplying relevant retrieved content alongside a question to ground a model response." },
      { term: "Confidence", definition: "A service-specific score used when deciding whether an output needs additional review; it is not a universal guarantee of accuracy." },
      { term: "Evaluation set", definition: "Representative inputs with expected outcomes used to compare quality across changes." },
    ],
    sources: [
      ...urls.map(([path, title]) => ({ url: `https://docs.aws.amazon.com/${path}`, title, retrievedAt: "2026-09-12T00:00:00.000Z" })),
      ...AWS_AI_EXPANDED_SOURCES,
      { url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-filesystem-configurations.html", title: "AgentCore managed session storage", retrievedAt: "2026-09-14T00:00:00.000Z" },
      { url: "https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html", title: "Bedrock service-specific retention", retrievedAt: "2026-09-14T00:00:00.000Z" },
    ],
  },
};
export const AWS_AI_CORE_LESSON_COUNT = 1 + AWS_AI_LESSONS.length;
export default guide;
