# Development Workflow

NCUIM2026-Fresher uses lightweight agile delivery with risk-driven testing. Work is organized as small PRs against `main`; there is no long-lived `dev` branch.

## Branch Flow

1. Start from latest `main`.
2. Create a short-lived branch:
   - `feature/<short-name>` for product capability
   - `fix/<short-name>` for bug fixes
   - `docs/<short-name>` for documentation or process
   - `chore/<short-name>` for tooling and maintenance
3. Keep every commit atomic and make each PR one independently deliverable
   increment.
4. Rebase on `main` if the branch becomes stale.
5. Merge only after checks pass and review threads are resolved.

## Commit and PR Granularity

Granularity lives at two levels:

- **Commit — the atomic unit.** One commit makes exactly one logical change
  (one concern). Unrelated changes belong in separate commits.
- **PR — the deliverable unit.** A PR is the smallest increment that can be
  reviewed, merged, and reverted on its own: one vertical slice, feature,
  fix, or coherent docs change.

## Frontend Stack

- Ionic Framework (v8)
- React 18
- TypeScript (Strict Mode)
- Vite 6
- Vitest & Playwright (E2E)
- GitHub Pages (Static Hosting)

## Frontend Commands

```sh
npm install
npm run dev
npm run build
```

Ports are pinned in `package.json` scripts (single source of truth):

| Script | URL |
| --- | --- |
| `npm run dev` | `http://127.0.0.1:5173/` |
| `npm run preview` | `http://127.0.0.1:4173/` |
| `npm run dev:e2e` (Playwright server) | `http://127.0.0.1:4174/` |

Default local app URL: `http://127.0.0.1:5173/`.

## Frontend PR Verification

Every frontend PR must include:

- `npm run build` result
- Browser smoke test result
- Console error check
- Confirmation that generated artifacts are not staged

Smoke test checklist:

- App loads at the dev URL.
- Main navigation is visible.
- Primary workflow entry point is visible.
- Layout has no obvious overlapping text at desktop and mobile widths.
- Browser console has no errors.

## Risk-Driven Testing

Use stricter tests where mistakes can corrupt data, access control, or
challenge logic. The required evidence per change area is defined in exactly
one place — the [Testing Policy](testing-policy.md).

## Generated Artifacts

Do not commit generated or local-only files:

- `node_modules/`
- `dist/`
- `tmp/`
- `*.tsbuildinfo`
- Real `.env` files

Do not solve TypeScript config emission by ignoring generated files. Configure
the relevant TypeScript project with `noEmit` so those files are not generated.

## App-Shell Pause Rule

If process or tooling rules are missing, pause feature work and land the
workflow/process PR first. Preserve any in-progress feature work with a clearly
named stash or branch before switching back to `main`.
