import Image from "next/image";
import { logoOf } from "@/lib/tech-buzz-public";

/** The technology's own logo (public/images/tech) beside its name in a Tech Buzz pill; nothing when it has none. */
export function TechIcon({ item, size = 14 }: { item: { techId?: string; technology: string }; size?: number }) {
  const src = logoOf(item);
  return src ? <Image src={src} alt="" width={size} height={size} style={{ display: "inline-block", flex: "none", verticalAlign: "-2px", marginRight: 5, borderRadius: 3, objectFit: "contain" }} /> : null;
}
