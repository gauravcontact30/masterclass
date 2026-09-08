import { escapeHtml,splitText } from "@/lib/generation/content";
test("generated markup is escaped before rendering",()=>{expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');});
test("long unbroken text is paginated rather than overflowing forever",()=>{expect(splitText("x".repeat(1500),550).map(s=>s.length)).toEqual([550,550,400]);});
