import { Globe } from "lucide-react";
import { siInstagram, siFacebook, siTelegram, siYoutube, siX, siWhatsapp } from "simple-icons";

const marks = { Instagram: siInstagram, Facebook: siFacebook, Telegram: siTelegram, YouTube: siYoutube, "X (Twitter)": siX, WhatsApp: siWhatsapp };
export function SocialPlatformIcon({ platform }: { platform: string }) {
  if (platform === "LinkedIn") return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="3" fill="#0a66c2"/><path fill="#fff" d="M5 9h3v10H5zm1.5-5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM10 9h3v1.4c.6-1 1.5-1.6 2.8-1.6 3 0 3.7 1.9 3.7 4.4V19h-3v-5.2c0-1.2 0-2.7-1.7-2.7s-1.8 1.3-1.8 2.6V19h-3z"/></svg>;
  const mark = marks[platform as keyof typeof marks];
  return mark ? <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill={`#${mark.hex}`}><path d={mark.path}/></svg> : <Globe size={20} aria-hidden="true" />;
}
