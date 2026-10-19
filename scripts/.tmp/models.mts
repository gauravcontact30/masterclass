import { gateway } from "ai";
const { models } = await gateway.getAvailableModels();
console.log(models.filter(m => m.modelType === "image").map(m => `${m.id} ${JSON.stringify(m.pricing ?? {})}`).join("\n"));
