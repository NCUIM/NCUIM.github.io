# PR Review Checklist

Use this checklist to keep NCUIM2026-Fresher PR reviews focused. The goal is to catch auth, security, challenge, and data regressions without restarting product brainstorming in every review.

## Review Scope

Every PR should state:

- what user problem or engineering problem it solves
- which spec or task it implements
- what files or modules are intentionally in scope
- what is explicitly out of scope
- how it was verified

If a PR implements a feature spec, the PR should link to the relevant `docs/specs/<feature-name>/` folder and list completed tasks.

If a PR changes behavior that conflicts with a spec, update the spec first or in the same PR.

## Required Checks For All PRs

- The branch is focused on one concern.
- Generated artifacts are not staged.
- New dependencies are justified.
- Existing user data assumptions are not silently changed.
- User-facing text is clear and consistent.
- Documentation links still point to valid files.
- Review threads from prior rounds are resolved before merge.

## Auth And Access Control Checks

Apply when a PR touches auth, roles, permissions, or user management.

- Login and signup flows work correctly.
- Role-based access is enforced in Security Rules and frontend.
- Session expiration is handled gracefully.
- No hardcoded credentials or service account keys.

## Firestore And Data Checks

Apply when a PR touches Firestore models, queries, or data flow.

- Data models match the schema.
- Queries use correct indexes.
- Security Rules allow only intended access patterns.
- No silent data loss on error paths.
- Amounts use correct precision.

## Security Rules Checks

Apply when a PR touches Firestore or Storage Security Rules.

- Every rule path is tested.
- No overly permissive rules (e.g., `allow read, write: if true`).
- Deny rules are explicit and cover all unauthorized paths.
- Rules are consistent between development and production.

## Challenge System Checks

Apply when a PR touches challenges, progress, or XP.

- XP calculation is correct and idempotent.
- Progress tracking does not allow作弊.
- Weekly reset behavior is correct.
- Leaderboard sorting is deterministic.

## UI And Accessibility Checks

Apply to frontend PRs.

- `npm run build` passes.
- Browser smoke test passes.
- Console has no errors.
- Desktop layout has no overlapping text.
- Mobile layout has no overlapping text.
- Primary actions use clear controls and labels.
- Buttons and icon buttons have accessible names.
- Empty states are helpful and informative.

## Security Scan Checks

Apply when ZAP scan results are available (weekly CI or local `npm run test:zap`).

- Review any new HIGH or MEDIUM risk alerts since the last scan.
- Verify false positives are documented in `.zap/rules.tsv` with a comment.
- Check that security headers (CSP, HSTS, X-Content-Type-Options) are present.
- Verify no sensitive information is leaked in error messages or comments.

## Test Expectations By Risk

The required verification evidence per risk area is defined in exactly one
place — the [Testing Policy](testing-policy.md). This checklist
does not restate the mapping so the two cannot drift.

## When To Block A PR

Block merge when:

- Security Rules can be bypassed
- Auth can be spoofed
- Data can be silently lost
- XP/currency can be manipulated
- A required spec is missing for high-risk work
- Verification evidence is missing for the touched risk area

Do not block merge only because a future feature is not implemented, unless the PR claims it is implemented or makes later implementation harder.

## Suggested Review Prompt

Use this prompt for external reviewers:

```text
Please review only the changed files and the linked spec.
Focus on whether the PR satisfies the spec, preserves auth/security correctness,
does not weaken data integrity, and has enough verification evidence.
Please avoid proposing new product scope unless it blocks the current behavior.
```
