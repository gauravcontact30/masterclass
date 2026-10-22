/**
 * The look of the "Fresh in tech" covers, shared by scripts/generate-news-covers.ts (the standing covers in
 * public/images/news) and lib/server/landing-news.ts, which paints a new cover for every slide each 21-day refresh.
 */
export const NEWS_COVER_STYLE = "A polished, modern 3D isometric illustration, soft studio lighting, clean pastel background with gentle gradients in warm cream, clay orange, sage and soft blue, crisp detailed objects, wide 16:9 landscape composition with the key action centred and breathing room at the edges. Absolutely no text, letters, words, numbers, code, logos, brand marks, captions or watermarks anywhere.";

export const NEWS_COVER_SCENES: Record<string, string> = {
  "ai-labs": "Four small futuristic research labs arranged around a glowing central hub, each lab with friendly robot assistants and holographic neural-network shapes, light beams connecting the labs to the hub, conveying several AI companies shipping new models.",
  agentic: "A team of small friendly robot agents passing glowing task cards along a looping conveyor of connected nodes, one robot using a toolbox, another reading a map, gears and branching paths showing an AI agent workflow.",
  "system-design": "A miniature city of server towers, load balancer gates, database cylinders and cache crates connected by glowing roads with tiny data parcels flowing between them, showing a scalable distributed system.",
  frontend: "A large floating browser window being assembled from stacked rounded UI blocks by tiny builders on scaffolding, with a glowing atom-like orbit and small state boxes flowing into the components, showing modern web app development.",
  aws: "Floating cloud islands each holding a distinct service object (a storage vault, a serverless lightning box, a database cylinder, an AI chip), linked by bridges with packets flowing, showing a cloud platform of many services.",
  musk: "A sleek reusable rocket lifting off from a launch tower at dawn beside a humanoid robot and an electric car on a small platform, a glowing AI chip floating above, conveying space travel and AI hardware.",
  "amazon-ai": "A warm smart home and a parcel warehouse side by side, a friendly smart speaker glowing, delivery robots moving parcels, and a shopping cart with a glowing AI spark, showing AI in shopping and home assistants.",
  "questions-tech": "A calm interview table with two chairs, a laptop with abstract coloured blocks, floating question-mark bubbles and lightbulb icons, sticky notes and a whiteboard of boxes and arrows, conveying a technical interview.",
  "questions-agentic": "A candidate and an interviewer at a round table with a small helpful robot between them, floating speech bubbles holding abstract node diagrams and tool icons, conveying an interview about AI agents.",
  trending: "A grand news stand made of glowing screens and rising chart bars, floating icons of clouds, chips, rockets and robots drifting upward like a trending feed, confetti-like sparks, conveying the hottest technology news.",
};
