import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin, userId } from "@/lib/server/http";
import { listLearningMarks, removeLearningMark, saveLearningMark } from "@/lib/server/learning-marks";
import { MARKER_COLORS } from "@/lib/learning-marks";

const ownerSchema = z.object({ expectedUserId: z.string().min(1).max(200), id: z.uuid() });
const markSchema = ownerSchema.extend({
  contentKey: z.string().min(1).max(200), kind: z.enum(["highlight", "delete"]),
  color: z.enum(MARKER_COLORS.map(color => color.id)),
  quote: z.string().min(1).max(12000).refine(value => !!value.trim()),
  prefix: z.string().max(48), suffix: z.string().max(48),
  start: z.number().int().min(0).max(10000000), end: z.number().int().min(1).max(10000000),
}).strict().refine(value => value.end - value.start === value.quote.length);
function draft(value: z.infer<typeof markSchema>) {
  const { id, contentKey, kind, color, quote, prefix, suffix, start, end } = value;
  return { id, contentKey, kind, color, quote, prefix, suffix, start, end };
}
export async function GET(request: Request) {
  return api(async () => {
    const owner = await userId();
    const offset = z.coerce.number().int().min(0).max(10000000).parse(new URL(request.url).searchParams.get("after") ?? 0);
    return Response.json({ userId: owner, ...await listLearningMarks(owner, offset) });
  });
}
export async function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await userId();
    const value = markSchema.parse(await jsonBody(request, 80000));
    if (value.expectedUserId !== owner) throw new HttpError(409, "account_changed");
    return Response.json({ userId: owner, mark: await saveLearningMark(owner, draft(value)) });
  });
}
export async function DELETE(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await userId();
    const value = ownerSchema.strict().parse(await jsonBody(request));
    if (value.expectedUserId !== owner) throw new HttpError(409, "account_changed");
    await removeLearningMark(owner, value.id);
    return Response.json({ userId: owner, id: value.id });
  });
}
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await userId();
    const { marks } = z.object({ marks: z.array(markSchema).min(1).max(50) }).strict().parse(await jsonBody(request, 4000000));
    if (marks.some(mark => mark.expectedUserId !== owner)) throw new HttpError(409, "account_changed");
    if (new Set(marks.map(mark => mark.id)).size !== marks.length) throw new HttpError(400, "invalid_request");
    const saved = [], failedIds: string[] = [];
    for (let index = 0; index < marks.length; index += 10) {
      const group = marks.slice(index, index + 10);
      const results = await Promise.allSettled(group.map(value => saveLearningMark(owner, draft(value))));
      for (const [i, result] of results.entries()) {
        if (result.status === "fulfilled") saved.push(result.value); else failedIds.push(group[i].id);
      }
    }
    return Response.json({ userId: owner, marks: saved, failedIds });
  });
}
