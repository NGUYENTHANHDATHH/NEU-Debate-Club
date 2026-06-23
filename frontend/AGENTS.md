# Frontend Repo Notes

This package is the `frontend/` workspace of a pnpm monorepo. It uses Next.js App Router under `src/app`, so prefer route groups, nested layouts, and `next/link` or `next/navigation` instead of react-router.

Use the existing project structure when adding code:

- App routes live in `src/app/**/page.tsx` and shared route layouts in `src/app/**/layout.tsx`.
- Reusable UI belongs in `src/components/` or `src/features/`.
- Cross-cutting utilities live in `src/lib/`, `src/hooks/`, `src/context/`, and `src/provider/`.
- Global styles are in `src/app/globals.css`.
- Prefer the workspace scripts from `frontend/package.json` and run commands through pnpm.

When editing UI, keep the existing component patterns and route conventions consistent with this repo.
