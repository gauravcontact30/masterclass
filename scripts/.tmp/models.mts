import { gateway } from "ai";
const { models } = await gateway.getAvailableModels();
console.log(models.filter((m: any) => m.modelType === "image").map((m: any) => `${m.id} ${JSON.stringify(m.pricing ?? {})}`).join("\n"));
