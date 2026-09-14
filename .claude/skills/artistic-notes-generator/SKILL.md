---
name: artistic-notes-generator
description: Turns messy raw content (lecture transcripts, docs, chat logs, rough notes, code dumps) into a fast-learning Jupyter notebook and exports it through this app's /api/generate/notebook endpoint. Use when the user asks for a runnable study notebook, a hands-on revision notebook, or "artistic notes" in .ipynb form built from their own material.
---

# Artistic notes generator

You convert raw, unstructured content into one strict JSON payload for the
notebook export endpoint. The server builds the notebook; your job is the
**learning design**: choosing the concepts, writing recall prompts,
compressing prose into punchy fragments, and keeping every field inside the
schema.

The schema lives in `lib/artistic-notes/schema.ts` (zod, strict objects: an
unknown key is rejected with HTTP 400). The shape below is identical to it,
and `__tests__/artistic-notes-skill.test.ts` parses the example in this file
against that schema, so the example is always valid.

## Workflow

1. **Triage the raw content.** List every candidate concept, term, formula,
   procedure, misconception and code sample. Discard anecdotes, repetition and
   filler. Keep the user's terminology and facts; never invent facts, numbers
   or citations that are not in the source.
2. **Chunk.** Group the material into 3 to 9 concepts, ordered so each builds
   on the previous one. One concept = one notebook section.
3. **Write the payload** following the fast-learning rules below.
4. **Run the validation checklist** at the end of this file.
5. **Deliver**: call the endpoint (see "Calling the endpoint"), or give the
   user the JSON as a bundle `{"notebook": {...}}`, which the internal
   exporter at `/ui-review/notes-exporter` accepts pasted in its JSON tab.

## Fast-learning rules (mandatory)

These are not stylistic suggestions. A payload that breaks one is wrong even
if it validates.

1. **Active recall everywhere.** Every section has at least one `recall`
   item. Questions demand retrieval or prediction ("Why…", "What happens
   if…", "Predict the output of…"), never recognition ("Is X true?",
   yes/no). Answers are one or two sentences. The notebook hides answers
   behind "Reveal answer", so a question must make sense on its own.
2. **Punchy bold fragments.** Bold the 2 to 5 load-bearing words of a
   sentence with `**…**`, at most one fragment per sentence, never whole
   sentences. Takeaways are fragments, not paragraphs: no filler openers
   ("It is important to note that…"), no trailing period.
3. **Define key terms.** Every key term is defined in the section Markdown in
   bold, in one sentence (category + what makes it distinct), with a concrete
   example.
4. **Spaced summaries.** `summary` is 3 to 8 self-contained claims, each
   understandable without the rest. It is shown at the start (preview) and
   repeated at the end (review) with a 1-3-7-21-day review schedule, so write
   the things to remember in a week.
5. **Formulas.** LaTeX. Inline maths in Markdown with `$…$`; display formulas
   go in `formulas[].latex` **without** `$` delimiters and without blank
   lines. Escape backslashes in JSON (`"\\frac{a}{b}"`).
6. **Runnable Python.** Every code cell runs top to bottom in a fresh
   Python 3 kernel using only the standard library, unless the imports are
   declared in `setup` and the user confirmed the packages are available. Seed
   all randomness, print a visible result, keep a cell under about 25 lines,
   and never read files, touch the network or call `input()`. Later cells may
   use names defined by earlier ones (setup runs first).
7. **Name the trap.** Each section's most common misconception appears in its
   Markdown as a `> **⚠ Watch out:** …` line.

## Inline markup

- `markdown` and code `explanation`: real Markdown (lists, tables,
  `*italic*`, fenced code) plus `$…$` LaTeX. Headings, takeaways, questions
  and answers are plain text with `**bold**`.
- No control characters. Single-line fields (headings, takeaways,
  questions) must not contain line breaks.

## Schema: `POST /api/generate/notebook`

Jupyter notebook (nbformat 4.5, Python 3 kernel). Body limit 200,000 bytes.
The server builds: title and how-to-use cell, 60-second preview, optional
setup code cell, then per section a concept cell (Markdown + display
formulas), a "Try it" note plus code cell per example, a bold takeaways cell
and an active-recall cell with hidden answers; finally the spaced review with
a schedule and a runnable self-quiz cell generated from every recall item.

| Field | Type | Rules |
|:--|:--|:--|
| `title` | string | 1-120 chars, single line |
| `subtitle` | string, optional | 1-200 chars, single line |
| `theme` | enum, optional | `retro-cyberpunk`, `warm-academic`, `high-contrast-light` (default), `high-contrast-dark`; recorded in notebook metadata |
| `setup` | string, optional | 1-2000 chars of Python run first (imports, helpers) |
| `sections` | object[] | 1-30 sections |
| `sections[].heading` | string | 1-100 chars, single line |
| `sections[].markdown` | string | 1-4000 chars of Markdown with `$…$` LaTeX |
| `sections[].takeaways` | string[], optional | 0-5 items, each 1-200 chars, single line (rendered bold) |
| `sections[].formulas` | object[], optional | 0-6 of `{ "latex": 1-600 chars, no "$", no blank line; "caption" (optional): 1-200 chars, single line }` |
| `sections[].code` | object[], optional | 0-6 of `{ "source": 1-4000 chars of Python; "explanation" (optional): 1-600 chars Markdown }` |
| `sections[].recall` | object[], optional | 0-5 of `{ "question": 1-240 chars, single line; "answer": 1-600 chars }` |
| `summary` | string[] | 1-8 items, each 1-200 chars, single line |

```json notebook-request
{
  "title": "Bayes' theorem, hands-on",
  "subtitle": "Derive it, compute it, then watch the base-rate trap happen",
  "theme": "high-contrast-light",
  "setup": "import random\nfrom fractions import Fraction",
  "sections": [
    {
      "heading": "From the product rule to Bayes",
      "markdown": "Both $P(H \\cap E) = P(E \\mid H)\\,P(H)$ and $P(H \\cap E) = P(H \\mid E)\\,P(E)$ describe the **same joint event**, so they are equal. Divide both sides by $P(E)$:",
      "formulas": [
        { "latex": "P(H \\mid E) = \\frac{P(E \\mid H)\\,P(H)}{P(E)}", "caption": "Posterior = likelihood × prior ÷ evidence" },
        { "latex": "P(E) = P(E \\mid H)\\,P(H) + P(E \\mid \\neg H)\\,P(\\neg H)" }
      ],
      "takeaways": ["Bayes is the product rule written both ways.", "P(E) only rescales; it never changes which hypothesis wins."],
      "code": [
        {
          "explanation": "Exact arithmetic with `Fraction` shows the posterior without rounding noise.",
          "source": "prior = Fraction(1, 100)\nsensitivity = Fraction(99, 100)\nfalse_positive = Fraction(5, 100)\nevidence = sensitivity * prior + false_positive * (1 - prior)\nposterior = sensitivity * prior / evidence\nprint(posterior, float(posterior))"
        }
      ],
      "recall": [
        { "question": "Which two expressions for the joint probability give Bayes' theorem?", "answer": "P(E | H)·P(H) and P(H | E)·P(E): set them equal and divide by P(E)." }
      ]
    },
    {
      "heading": "Simulate the base-rate trap",
      "markdown": "Simulation is the fastest way to *feel* a posterior: generate a population, test everyone, and count how many positives are real.\n\n| Quantity | Value |\n|:--|--:|\n| Prevalence | 1% |\n| Sensitivity | 99% |\n| False-positive rate | 5% |",
      "code": [
        {
          "source": "random.seed(7)\npopulation = 100_000\nsick = [random.random() < 0.01 for _ in range(population)]\npositive = [random.random() < (0.99 if s else 0.05) for s in sick]\ntrue_positives = sum(1 for s, p in zip(sick, positive) if s and p)\nprint(f\"P(sick | positive) = {true_positives / sum(positive):.3f}\")"
        }
      ],
      "recall": [
        { "question": "Roughly what fraction of positives are truly sick in the simulation, and why?", "answer": "About 17%: false positives from the 99% healthy majority outnumber the true positives." }
      ]
    }
  ],
  "summary": ["Posterior ∝ likelihood × prior.", "P(E) rescales; it does not change which hypothesis wins.", "Rare condition + imperfect test ⇒ many false alarms."]
}
```

## Validation checklist

Run through every item before sending or handing over a payload.

- [ ] Only the fields listed above, spelled exactly; no extra keys anywhere.
- [ ] Every length limit respected (count characters, including `**`).
- [ ] Single-line fields contain no `\n`; no control characters anywhere.
- [ ] `theme` is one of the four names, or omitted.
- [ ] Every section has a `recall` item; key terms are defined in bold; each section names its trap; `summary` has 3-8 items.
- [ ] LaTeX formulas have no `$` and no blank lines; backslashes are doubled in JSON; every code cell runs in order on a fresh Python 3 kernel with only the standard library plus `setup`; randomness is seeded; each cell prints something.
- [ ] Bold fragments are 2-5 words, at most one per sentence.
- [ ] Every fact, number and formula comes from the user's material (or is standard, uncontroversial knowledge you are sure of).
- [ ] The JSON parses (no trailing commas, no comments).

## Calling the endpoint

`POST /api/generate/notebook` is same-origin and authenticated with the
user's Supabase session cookie. Success is `200`,
`application/x-ipynb+json; charset=utf-8`, rate-limited to 20 per minute per
user, with `Content-Disposition: attachment; filename="<slug>.ipynb"` (slug
derived from `title`) and `Cache-Control: private, no-store`.

Errors are JSON `{ "error": "<code>" }`:

| Status | `error` | Meaning |
|:--|:--|:--|
| 400 | `invalid_request` | Body is not JSON or fails the schema (re-run the checklist) |
| 401 | `signin_required` | No signed-in session cookie |
| 403 | `invalid_origin` | `Origin` header differs from the app's origin |
| 413 | `request_too_large` | Body over the 200,000-byte limit |
| 429 | `rate_limited` | Too many exports in the last minute |
| 503 | `setup_required` | Auth or database not configured |
| 500 | `service_error` | Building failed; retry once, then report |

From a browser session on the app (the exporter UI does exactly this):

```js
const response = await fetch("/api/generate/notebook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
if (!response.ok) throw new Error((await response.json()).error);
const file = await response.blob();
```

From a terminal against a local dev server, reuse the browser's session cookie
(copy the `sb-…-auth-token` cookie from dev tools) and save the payload to a
file first:

```bash
curl -sS -X POST http://localhost:3000/api/generate/notebook \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -H "Cookie: sb-<project>-auth-token=<value>" \
  --data-binary @notes.notebook.json \
  -o notes.ipynb -w "%{http_code}\n"
```

For a quick visual check without a terminal, open `/ui-review/notes-exporter`
in `next dev`, switch to the "JSON payloads" tab, paste the bundle and use the
download button.
