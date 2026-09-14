import { bi, type StudyCourse } from "./types";
export const SYSTEM_DESIGN_TITLES = [
  ["whatsapp", "WhatsApp-style Messaging", "WhatsApp जैसा संदेश मंच"], ["facebook", "Facebook-style Social Network", "Facebook जैसा सोशल नेटवर्क"],
  ["instagram", "Instagram-style Photo & Video Sharing", "Instagram जैसा फोटो और वीडियो मंच"], ["food-delivery", "Food Delivery App", "खाना डिलीवरी ऐप"],
  ["college", "College Management App", "कॉलेज प्रबंधन ऐप"], ["ecommerce", "E-commerce App", "ई-कॉमर्स ऐप"],
  ["payments", "Payment Gateway", "पेमेंट गेटवे"], ["ai-automation", "AI Automation Platform", "AI ऑटोमेशन मंच"],
  ["ride-hailing", "Ride-hailing App", "राइड बुकिंग ऐप"], ["video-streaming", "Video Streaming Platform", "वीडियो स्ट्रीमिंग मंच"],
  ["url-shortener", "URL Shortener", "URL छोटा करने की सेवा"], ["ticket-booking", "Ticket Booking Platform", "टिकट बुकिंग मंच"],
] as const;
export const SYSTEM_DESIGN_COURSES: StudyCourse[] = SYSTEM_DESIGN_TITLES.map(([id, en, hi]) => ({
  id: `design-${id}`, category: "course", title: bi(`System Design · ${en}`, `सिस्टम डिज़ाइन · ${hi}`), subjects: ["system-design"], aliases: [id, en, "architecture", "interview", "HLD", "LLD", "system design"],
  sourceUrl: "https://aws.amazon.com/architecture/well-architected/",
  scope: bi("Detailed educational architecture and interview case study. Named products are inspiration; these are proposed designs, not claims about their private production architecture.", "विस्तृत शैक्षिक आर्किटेक्चर और साक्षात्कार अध्ययन। नामित उत्पाद प्रेरणा हैं; प्रस्तावित डिज़ाइन उनकी निजी उत्पादन संरचना के दावे नहीं हैं।"),
}));
