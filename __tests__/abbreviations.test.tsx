import { render } from "@testing-library/react";
import { ExpandedText } from "@/components/expanded-text";
import { compactAbbreviations, expandAbbreviations } from "@/lib/abbreviations";

test("known terms show their full forms in visible meaning pills", () => {
  const { container } = render(<p><ExpandedText text="Use AWS EC2, S3 and a JWT API." /></p>);
  expect(container.textContent).toContain("Use AWS EC2Elastic Compute Cloud");
  expect(container.textContent).toContain("S3Simple Storage Service");
  expect(container.textContent).toContain("JWTJSON Web Token");
  expect(container.textContent).toContain("APIApplication Programming Interface");
  expect(container.querySelector('abbr[title="Application Programming Interface"]')).toHaveTextContent("API");
  expect(container.querySelector('[aria-label="stands for Application Programming Interface"]')).toHaveTextContent("Application Programming Interface");
  // "AWS EC2" is one term, not two, so four marks cover the five names.
  expect(container.querySelector('abbr[title="Elastic Compute Cloud"]')).toHaveTextContent("AWS EC2");
  expect(container.querySelectorAll("abbr")).toHaveLength(4);
});
test("an author's own parenthetical is absorbed into the title; code, URLs, unknown and ambiguous terms remain intact", () => {
  const { container } = render(<ExpandedText text="EC2 (Elastic Compute Cloud). API at https://host.test/API and `AWS S3`. npm V8 UNKNOWN." />);
  // The spelled-out form moves into the mark rather than being repeated beside it.
  expect(container.textContent).toContain("EC2Elastic Compute Cloud. APIApplication Programming Interface at https://host.test/API and `AWS S3`. npm V8 UNKNOWN.");
  expect(container.querySelector('abbr[title="Elastic Compute Cloud"]')).toHaveTextContent("EC2");
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
