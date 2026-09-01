# Contributing to NCUIM2026-Fresher

NCUIM2026-Fresher uses a strict commit and pull request policy. The goal is to keep history easy to review, easy to bisect, and useful for future AI-assisted maintenance.

## Branch Rules

- `main` must stay deployable.
- Do not push directly to `main`.
- Do not create a long-lived `dev` branch.
- Create topic branches from `main`:
  - `feature/<short-name>` for features
  - `fix/<short-name>` for bug fixes
  - `docs/<short-name>` for documentation-only work
  - `chore/<short-name>` for maintenance
- Keep branches short-lived. Rebase on `main` before opening a PR if the branch is stale.

## Commit Format

Every commit and PR title must follow the [repository commit policy](docs/engineering/commit-policy.md):

```text
<type>(<scope>): <description>
```

Example:

```text
feat(challenge): add weekly challenge system
```

The allowed types, scopes, length, and body requirements are defined in the
policy doc — **do not restate them here**. The policy is enforced identically
by the local `commit-msg` hook and by CI, and the rules live in exactly one
file (`scripts/commit-policy.mjs`). To change a rule, edit that file only (see
the policy doc).

## Atomic Commit Rules

One commit must represent one logical change.

- Separate unrelated features.
- Separate refactors from behavior changes.
- Separate generated files from manual source changes when that makes review easier.
- Use `git mv` for renames so history stays readable.
- Do not mix secret/config examples with real credentials.

## Pull Request Rules

PR titles must follow the same commit policy (enforced by CI and the local
hook). Fill the PR description using the sections defined in
[`.github/pull_request_template.md`](.github/pull_request_template.md).

Small PRs are preferred. If a PR touches more than one subsystem, explain why it should be reviewed together.

## Verification Expectations

Before requesting review, include the checks you ran. The required evidence
per change area is defined in exactly one place — the
[Testing Policy](docs/engineering/testing-policy.md) — and the commands are
defined in `package.json`.

## Privacy & Security Rules

- Never commit `.env` files, real API keys, credentials, or personal student records.
- Use `.env.example` or sanitized placeholders when configuration templates are needed.
- Test fixtures and mock data must be synthetic and non-personal.
- All code changes must pass automated typecheck and unit tests before requesting review.
