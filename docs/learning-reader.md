# Learning reader and topic projects

The Learn in App header contains the previous/next controls, progress, contents toggle, completion, copy and download actions. Contents can be expanded and collapsed at desktop and mobile widths. Mobile lesson selection closes the contents panel. Notes and completion retain the existing account/local-storage persistence.

Every seeded technology guide has two complete **topic-level** projects in its overview: a core concept and a practical application. The 17 guides share 30 distinct project definitions (the React and Next.js hook guides reuse their corresponding framework projects). Individual lesson snippets remain next to their lessons and are explicitly labelled as excerpts. They are not presented as complete runnable projects.

The editor displays authored project files, full project-relative paths, comments, syntax colors, line numbers, copy feedback, setup commands, expected results and API contracts. Build outputs and dependencies such as `node_modules`, `.next` and generated route trees are described in setup instructions instead of pasted into the source tree. Copy/download includes both projects and every file.

`lib/generation/topic-projects.ts` contains the project definitions. The curriculum schema accepts topic-level projects and optional lesson-level project pairs. New AI-generated curricula must include two complete topic projects and 6–10 key-point cards per lesson, with every tone represented. Existing curricula remain compatible; key points are expanded from their own facts without inventing new claims. Seed versions are bumped so existing seeded guides refresh through the normal library initialization flow.

## Verification

```sh
npm test -- --runTestsByPath __tests__/learning-content.test.ts __tests__/learning-reader.test.tsx __tests__/download-link.test.tsx
node scripts/verify-learning-projects.cjs
```

The project verifier validates all unique project schemas and JavaScript/TypeScript syntax, and executes available Python, Node, Jest and TypeScript/React/Next.js checks. It writes fixtures under ignored `.next` and `node_modules/.cache` paths. It does not install external framework dependencies, download browser binaries, invoke a model, publish a plugin, start cloud resources or deploy infrastructure. Vitest, RTL, Playwright, Zustand, TanStack, Docker and cloud integrations require their documented environments for a complete runtime check.

The repository-wide type check has existing failures in tests that still target removed PDF/PPTX modules and earlier component interfaces. The new reader tests and application source are checked separately. Browser visual verification was unavailable because the browser connection stopped responding; responsive layout has therefore not been screenshot-verified.

## Reference material

Examples use original teaching code and the guides' existing source references. Implementation conventions were additionally checked against the installed Next.js documentation and these primary sources:

- [React useState](https://react.dev/reference/react/useState)
- [Python modules and packages](https://docs.python.org/3/tutorial/modules.html)
- [Vitest setup](https://vitest.dev/guide/)
- [React Testing Library setup](https://testing-library.com/docs/react-testing-library/setup/)
- [Playwright web servers](https://playwright.dev/docs/test-webserver)
- [TanStack Start project structure](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
- [CloudFormation S3 bucket resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-s3-bucket.html)
