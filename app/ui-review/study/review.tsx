"use client";
import { useState } from "react";
import type { StudyPack } from "@/lib/study/types";
import { StudyReader } from "@/components/study-reader";
import { StudyNavigation } from "@/components/study-navigation";
export function StudyReview({ pack }: { pack: StudyPack }) {
  const [open, setOpen] = useState(false);
  return <div style={{ padding: 30 }}><p>Development fixture · published example content · no account or payment changes</p><button onClick={() => setOpen(true)}>Open reader preview</button><div style={{ width: 250 }}><StudyNavigation access={{ selections: [], isSuperAdmin: true }} category="system-design" collapsed={false} /></div>{open && <StudyReader pack={pack} onClose={() => setOpen(false)} onPlans={() => setOpen(false)} />}</div>;
}
