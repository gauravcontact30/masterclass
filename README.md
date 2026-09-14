This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Learning materials: in-app notes

Every learning material is a set of study notes, read in the **Learn in App** notes reader (`components/notes-modal.tsx`): a lesson list, reading progress saved per lesson, a completion toggle and personal notes. Notes can also be copied or downloaded as a UTF-8 text file. The PDF and PowerPoint formats are retired.

Every library is seeded with hand-authored guides (`lib/generation/default-library.ts`), each grounded in its technology's official documentation and citing it at the end:

- Python · Claude Skills, Plugins & MCP · LLMs, MCP, Context, Loop Engineering & Memory
- Jest · React Testing Library · Vitest · Playwright & automation
- Next.js 16+ Hooks · React 19+ Hooks · Zustand · JavaScript ES2026 · TypeScript 7
- AWS popular services · DevOps services · TanStack Start
- The complete Next.js 16 and React 19 paths

The technology guides live in `lib/generation/guides/`, one module per technology. Bump a guide's `version` in `DEFAULT_GUIDES` when its content changes, and existing libraries refresh their seeded copy. Apply `supabase/migrations/0013_notes_library.sql` so the catalog knows the new technologies and topics.

Documents created before notes became the only format are hidden from the library. To delete them and their stored files, run `npm run purge:legacy` (a dry run) and then `npm run purge:legacy -- --apply`.

Note downloads are served through the authenticated application endpoint, ownership-checked, with `private, no-store` responses.
