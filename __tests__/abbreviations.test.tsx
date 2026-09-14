import { render, screen } from "@testing-library/react";
import { ExpandedText } from "@/components/expanded-text";
import { compactAbbreviations, expandAbbreviations } from "@/lib/abbreviations";

test("AWS and technology names show pastel pills without parentheses and semantic abbreviations", () => {
  const { container } = render(<p><ExpandedText text="Use AWS EC2, S3 and a JWT API." /></p>);
  expect(screen.getByText("Elastic Compute Cloud")).toBeInTheDocument();
  expect(screen.getByText("Simple Storage Service")).toBeInTheDocument();
  expect(screen.getByText("JSON Web Token")).toBeInTheDocument();
  const pills = [...container.querySelectorAll("span[data-tone]")];
  expect(pills.every(pill => !/[()]/.test(pill.textContent ?? ""))).toBe(true);
  expect(new Set(pills.map(pill => pill.getAttribute("data-tone"))).size).toBeGreaterThan(1);
  expect(container.querySelector('abbr[title="Application Programming Interface"]')).toHaveTextContent("API");
});
test("existing full forms render once; code, URLs, unknown and ambiguous terms remain intact", () => {
  render(<ExpandedText text="EC2 (Elastic Compute Cloud). API at https://host.test/API and `AWS S3`. npm V8 UNKNOWN." />);
  expect(screen.getAllByText("Elastic Compute Cloud")).toHaveLength(1);
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
