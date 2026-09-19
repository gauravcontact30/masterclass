import { render, screen } from "@testing-library/react";
import { ExpandedText } from "@/components/expanded-text";
import { compactAbbreviations, expandAbbreviations } from "@/lib/abbreviations";

test("known terms become abbreviations whose full form stays in the title, not in the sentence", () => {
  const { container } = render(<p><ExpandedText text="Use AWS EC2, S3 and a JWT API." /></p>);
  // The sentence reads as written: no expansion is spelled out inline.
  expect(container.textContent).toBe("Use AWS EC2, S3 and a JWT API.");
  for (const full of ["Elastic Compute Cloud", "Simple Storage Service", "JSON Web Token"]) {
    expect(screen.queryByText(full)).not.toBeInTheDocument();
  }
  // Each one is still retrievable from the markup.
  expect(container.querySelector('abbr[title="Application Programming Interface"]')).toHaveTextContent("API");
  // "AWS EC2" is one term, not two, so four marks cover the five names.
  expect(container.querySelector('abbr[title="Elastic Compute Cloud"]')).toHaveTextContent("AWS EC2");
  expect(container.querySelectorAll("abbr")).toHaveLength(4);
});
test("an author's own parenthetical is absorbed into the title; code, URLs, unknown and ambiguous terms remain intact", () => {
  const { container } = render(<ExpandedText text="EC2 (Elastic Compute Cloud). API at https://host.test/API and `AWS S3`. npm V8 UNKNOWN." />);
  // The spelled-out form moves into the mark rather than being repeated beside it.
  expect(container.textContent).toBe("EC2. API at https://host.test/API and `AWS S3`. npm V8 UNKNOWN.");
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
