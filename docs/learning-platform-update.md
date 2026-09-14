# Learning platform implementation

## Dashboard and reader

- Searchable sidebar with five differently colored main groups: government, entrance, boards, languages, courses/interviews. The active page's group comes first. Main groups start closed and open exclusively as an accordion. Membership and Connections are available only through the account menu, not the sidebar. Animated submenus expose selected classes, exams, technologies and twelve system-design cases. The collapse control is next to the logo; mobile has a dedicated preparation drawer.
- Dashboard and My Library share a search input (Ctrl/Cmd K). Preparation, class, subject and sort filters narrow school/exam/system-design guides. The default learning order keeps core subjects before supplementary language material. Compact rows open Learn in App directly; coverage is available per row.
- CBSE, NCERT, ICSE and ISC have separate dashboard routes. Class links carry `preparation`; case-study links carry `course`. Server authorization still checks access independently of URL filters.
- The study reader has header lesson controls, collapsible contents, six or more key points per chapter, objective/subjective answers, short timed practice, sample drills, importance and historical-source sections. Browser notes/bookmarks are scoped to account, course and language.
- Twelve system-design blueprints contain eight chapters each: WhatsApp, Facebook, Instagram, food delivery, college management, e-commerce, payments, AI automation, ride hailing, streaming, URL shortening and ticket booking. These are proposed educational designs, not disclosures of private company architectures.
- Technical guides use the light multi-file code reader documented in `learning-reader.md`.

## Content coverage and remaining editorial work

There are 168 school/resource guide entries, 20 exam/preparation entries and 12 system-design entries. School material spans CBSE/NCERT Classes 6–12, ICSE Classes 6–10 and ISC Classes 11–12. NCERT is a resource pathway, not a separate examination board. Lower-grade Physics and Chemistry are labelled parts of integrated Science; vocabulary/IELTS/synonyms/antonyms are labelled supplements.

School/exam entries reuse bilingual foundation concepts and original worked questions. They are **not complete chapter-by-chapter syllabi**, full examination papers, or a comprehensive previous-year archive. Completing all boards, subjects and Indian government examinations remains substantial editorial work. Membership and landing copy disclose this before purchase.

Two paraphrased Mathematics questions (Q1 and Q4) from [JEE Advanced 2025 Paper 1](https://jeeadv.ac.in/past_qps/2025_1_English.pdf) have original worked explanations and identified exam/year/page provenance. Ask ratings count observations within the identified one-paper corpus; they are not future-exam probabilities or evidence of high frequency across all examinations.

Reference entry points: [CBSE curriculum](https://cbseacademic.nic.in/curriculum_2027.html), [NCERT textbooks](https://ncert.nic.in/textbook.php), [CISCE](https://cisce.org/), [UPSC papers](https://upsc.gov.in/examinations/previous-question-papers), [SSC](https://ssc.gov.in/), [JEE archive](https://jeeadv.ac.in/archive.html), [NEET](https://neet.nta.nic.in/), [IELTS preparation](https://ielts.org/take-a-test/preparation-resources/sample-test-questions).

## Membership and preparation access

- Monthly/yearly are the only offered plans. Authentication slide four, landing pricing and Membership use those plans. Retired one-time download purchase requests are rejected.
- The persisted legacy tier value `free` means **not subscribed**, has zero generation allowance, and grants no study pack, technical document/progress/download or notebook-export access. Existing database values need no destructive migration.
- Checkout requires validated preparation selections, saved in Supabase Auth user metadata. Selection never confers paid status. Server-verified subscription reconciliation grants access after payment.
- A verified exact email `garvcontact30@gmail.com` bypasses preparation filtering and reading subscriptions. User-editable metadata cannot grant that role.
- Unfinished checkout resumes only its matching billing cycle. A terminal subscription can be replaced after its paid period ends; compare-and-swap and remote cancellation handle concurrent replacement. Old subscription webhooks cannot overwrite the replacement.
- Switching an active billing cycle is not offered as an immediate plan change. Cancellation and access through the paid period remain available.
- No live charge, production deployment or destructive data migration was performed.

## Landing visuals and interactions

Four full-width image slides autoplay with navigation, pause, hover/focus handling and reduced-motion support. A clickable category marquee pauses on hover/focus and opens bilingual overview key points. Pricing is a compact two-column monthly/yearly section. The footer has four aligned navigation columns, a membership invitation and a smooth Move to top control that respects reduced motion.

The review carousel uses real Pexels stock photos, no illustrated avatars. It is visibly labelled **sample reviews/ratings and illustrative profiles**, because no verified customer statements or student identities were supplied. The pictured people do not endorse MasterClass. Replace these examples with consented customer material before presenting them as actual reviews. No college affiliation or customer aggregate rating is invented.

Photo sources, downloaded locally on 2026-09-12 under the [Pexels license](https://www.pexels.com/license/):

| Local file | Photographer and source |
| --- | --- |
| `public/images/reviews/student-woman.jpg` | [Votso Sothu — Student](https://www.pexels.com/photo/student-22915923/) |
| `public/images/reviews/student-man.jpg` | [Sanket Mishra — Young Indian photographer](https://www.pexels.com/photo/young-indian-photographer-holding-a-professional-dslr-camera-15547664/) |
| `public/images/reviews/portrait-woman.jpg` | [Shovan Datta — Young woman portrait](https://www.pexels.com/photo/close-up-portrait-of-a-young-brunette-woman-17184869/) |

## Generated hero assets

Mode: built-in image generation; four independent new images. Original outputs were copied to the project and are served through Next Image.

Shared prompt brief: premium photorealistic landscape editorial hero for an Indian Learn in App platform. Subjects on the right, soft ivory negative space on the left for live bilingual text. Sage, olive, forest, ivory and oak palette; natural skin and restrained expressions; realistic anatomy; no logos, watermark, captions, readable words or collage.

| Asset | Scene prompt |
| --- | --- |
| `public/images/learning/school.png` | Indian young woman and man around eighteen studying maths with a tablet, geometry tools and unbranded notebooks in an airy library. |
| `public/images/learning/exams.png` | Indian adult woman preparing for competitive examinations with a tablet, notebook and clock in a quiet study room. |
| `public/images/learning/systems.png` | Two Indian engineering students in their twenties working on abstract code and a glass architecture diagram. |
| `public/images/learning/language.png` | Indian adult woman in headphones and a sage sweater practising spoken English with a tablet and notebook. |

## Validation

Focused tests cover subscription gating/checkout, preparation storage and filtering, bilingual content, answer grading, reader persistence, code-project reader, dashboard filters and shortcuts, carousel behavior, and footer scrolling. Development-only `/ui-review/landing`, `/ui-review/auth`, `/ui-review/dashboard`, and `/ui-review/study` isolate visual checks; they return 404 outside development.

Browser checks verified desktop and mobile landing layouts without horizontal overflow, all four hero images loading, compact pricing, sample-review photography and the reorganized footer. The dashboard browser check confirmed main categories are closed initially and Membership/Connections are absent from the sidebar.

Repository-wide TypeScript checking still reports legacy tests for deleted PDF/PPTX modules and earlier component interfaces. Application/component/library TypeScript and targeted lint checks are checked separately; this is not a claim that the entire legacy test suite or production build passes.
