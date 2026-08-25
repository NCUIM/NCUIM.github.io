# Testing Policy

This document defines what verification evidence each change area requires. It
is the single source of truth for test expectations — the development workflow
and PR review checklist reference it but do not restate the mapping.

## Risk Areas

| Area | Description | Risk |
|------|-------------|------|
| **Auth** | Login, signup, password reset, role-based access | High |
| **Firestore** | Data models, queries, security rules | High |
| **Security Rules** | Firestore/Storage rules, access control | Critical |
| **Challenge** | Weekly challenges, progress tracking, XP calculation | High |
| **Admin** | Admin dashboard, user management | High |
| **UI** | Pages, components, styling, layout | Medium |
| **Functions** | Cloud Functions, API endpoints | Medium |
| **i18n** | Internationalization, locale handling | Low |
| **Hosting** | Deployment, redirects, headers | Low |
| **Config** | Environment, build config, tooling | Low |

## Required Evidence by Risk

### Critical Risk (Security Rules)

- Unit tests for every rule path
- Integration tests with emulator
- Manual review of deny rules
- No silent permissive rules

### High Risk (Auth, Firestore, Challenge, Admin)

- Unit tests for business logic
- Integration tests for data flow
- Edge case coverage (empty state, error state)
- TypeScript strict mode passes

### Medium Risk (UI, Functions)

- Unit tests for complex logic
- Visual smoke test (desktop + mobile)
- No console errors
- `npm run build` passes

### Low Risk (i18n, Hosting, Config)

- `npm run build` passes
- `npm run typecheck` passes
- Manual verification of changed behavior

## Test Commands

```sh
npm run typecheck    # TypeScript strict check
npm run build        # Production build
npm run test         # Unit tests (vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run test:policy  # Commit policy self-test
npm run test:docs    # Doc link check
npm run test:zap     # OWASP ZAP baseline scan (requires Docker)
```

## Security Scanning

OWASP ZAP baseline scans run automatically on a weekly schedule via GitHub
Actions (`.github/workflows/zap-scan.yml`). Developers can also run scans
locally:

```sh
npm run test:zap     # Builds app, starts preview server, runs ZAP, stops server
```

ZAP performs passive scanning (header analysis, information disclosure,
cookie issues, etc.) against the running app. Reports are saved to
`zap-reports/` (git-ignored). The CI workflow uploads reports as artifacts
with 30-day retention.

## Generated Artifacts

Do not commit generated or local-only files:

- `node_modules/`
- `dist/`
- `tmp/`
- `*.tsbuildinfo`
- Real `.env` files
