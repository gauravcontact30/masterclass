# API reference generation

API Docs and API Reference use the same `ApiDetail` component for both topic routes and older query-string links. Built-in references, including Next.js `usePathname`, load without an AI request. Other catalog topics use `/api/pro-learn/api-detail` after authentication and rate-limit checks.

## Reliability

- The shared JSON generator supplies the actual Zod-derived response schema, including array and text limits, for references, lessons, quizzes, and interviews.
- Invalid JSON, schema errors, and truncated output receive one correction attempt. Provider errors and cancelled requests are not retried as content errors.
- Reference responses must include a project, vocabulary, and both interview question formats. Invalid responses are not cached as successful content.
- Generation routes declare a 180-second hosting duration and a 165-second overall request budget. Each model call has a 75-second timeout. The hosting plan must support the declared duration.
- UI errors distinguish expired sessions, rate limits, provider configuration/access, timeouts, and connectivity. They do not expose provider response bodies or credentials.

## Troubleshooting

For `ai_unavailable`, check that `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and the production database limiter are configured in the application environment. For `ai_provider_unavailable`, check provider credentials, model access, and credits. For `ai_rate_limited`, allow the provider/request window to reset. For `reference_timeout`, inspect hosting limits and model latency.

The screenshot alone does not identify which upstream failure occurred. Local regression tests verify validation repair and UI recovery, but a live provider request is needed to verify the deployed credentials/model and provider response. That verification remains subject to approval for the external diagnostic request.

## Checks

`npm test -- --runTestsByPath __tests__/ai-json.test.ts __tests__/api-docs.test.tsx __tests__/api-learning.test.tsx __tests__/pro-learn.test.tsx`

These tests use mocked generation and make no external AI requests.
