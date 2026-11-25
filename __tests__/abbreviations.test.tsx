import { render } from "@testing-library/react";
import { ExpandedText } from "@/components/expanded-text";
import { compactAbbreviations, expandAbbreviations } from "@/lib/abbreviations";

// The full form shows only in the tooltip, on hover or focus (user rule 2026-11-01): a pill beside the short form
// stretched lines and broke cards into several rows. components/expanded-text.tsx
const titles = (container: HTMLElement) => [...container.querySelectorAll("abbr")].map(abbr => [abbr.textContent, abbr.title]);
test("known terms are marked with their full forms as tooltips, leaving the text unchanged", () => {
  const { container } = render(<p><ExpandedText text="Use AWS EC2, S3 and a JWT API." /></p>);
  expect(container.textContent).toBe("Use AWS EC2, S3 and a JWT API.");
  // "AWS EC2" is one term, not two, so four marks cover the five names.
  expect(titles(container)).toEqual([
    ["AWS EC2", "AWS EC2 stands for Elastic Compute Cloud"], ["S3", "S3 stands for Simple Storage Service"],
    ["JWT", "JWT stands for JSON Web Token"], ["API", "API stands for Application Programming Interface"],
  ]);
});
test("an author's own parenthetical is absorbed into the tooltip; code, URLs, unknown and ambiguous terms remain intact", () => {
  const { container } = render(<ExpandedText text="EC2 (Elastic Compute Cloud). API at https://host.test/API and `AWS S3`. npm V8 UNKNOWN." />);
  // The spelled-out form moves into the mark rather than being repeated beside it.
  expect(container.textContent).toBe("EC2. API at https://host.test/API and `AWS S3`. npm V8 UNKNOWN.");
  expect(titles(container)).toEqual([["EC2", "EC2 stands for Elastic Compute Cloud"], ["API", "API stands for Application Programming Interface"]]);
  const parts = expandAbbreviations("https://host.test/API `AWS S3` npm V8 UNKNOWN");
  expect(parts.filter(part => part.fullForm)).toHaveLength(0);
  expect(parts.map(part => part.text).join("")).toBe("https://host.test/API `AWS S3` npm V8 UNKNOWN");
});
test("word boundaries, plurals, longest matches and encryption context", () => {
  expect(expandAbbreviations("APIs CI/CD").filter(part => part.fullForm).map(part => part.fullForm)).toEqual(["Application Programming Interfaces", "Continuous Integration / Continuous Delivery"]);
  expect(expandAbbreviations("API_KEY MyAPI").some(part => part.fullForm)).toBe(false);
  expect(expandAbbreviations("SSE encryption on S3")[0].fullForm).toBe("Server-Side Encryption");
  expect(expandAbbreviations("SSE streams events")[0].fullForm).toBe("Server-Sent Events");
});
test("navigation labels remove known full forms without stripping meaningful parentheses", () => {
  expect(compactAbbreviations("EC2 (Elastic Compute Cloud) and Identity and Access Management (IAM)")).toBe("EC2 and IAM");
  expect(compactAbbreviations("Modules (dynamic and global)")).toBe("Modules (dynamic and global)");
});
