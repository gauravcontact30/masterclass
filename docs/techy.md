# Techy — Profissional Learn

Dashboard route: `/learning/techy`. The page follows the dashboard's sign-in check and presents a static curated learning library without document generation. A development-only preview is available at `/ui-review/techy`.

## Content

- Ten topics: AWS Services, Agentic AI, Next.js 16+, TanStack, Zustand, Vitest, Playwright Automation, React 19+, TypeScript, Docker & CI/CD.
- Each topic has four key feature cards, 20 short interview answers, and 20 multiple-choice questions with explanations.
- Interview and quiz modes test the same 20 concepts using recall and recognition respectively. Stars indicate editorial study priority, not an empirically measured interview-frequency ranking.
- Each topic has a connected multi-file teaching example, with dependencies and host-project requirements shown in the card. Examples are read-only and run locally using the supplied instructions. Some intentionally use labeled fixtures instead of remote services.
- Corporate English is a shared deck of 20 words, each with meaning, synonyms, contextual antonyms and a workplace sentence.

Quiz responses remain while the topic is open, including when changing learning sections. Switching topics or reloading resets practice. Interview drafts belong to the current card and clear when navigating.

## Sources and maintenance

Official reference links are attached to every topic. The selection is editorial rather than a popularity ranking. Version-sensitive points were checked against official documentation when authored on 2026-09-15. Review these links when updating the library:

- [AWS service overview](https://docs.aws.amazon.com/whitepapers/latest/aws-overview/amazon-web-services-cloud-platform.html)
- [Agent workflow design](https://www.anthropic.com/engineering/building-effective-agents)
- [Next.js 16 migration](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vitest](https://vitest.dev/guide/)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [React 19](https://react.dev/blog/2024/12/05/react-19)
- [TypeScript narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Docker containers](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)

Content lives in `lib/techy-content.ts`; examples in `lib/techy-examples.ts`; interactions and responsive styles in `components/techy.tsx` and `components/techy.module.css`.

## Validation

Run `npm test -- --runTestsByPath __tests__/techy.test.tsx __tests__/dashboard-shell.test.tsx` for content completeness, answer reveal, quiz scoring, repeat-answer protection, restart, file navigation, vocabulary fields, filtering and sidebar integration.
