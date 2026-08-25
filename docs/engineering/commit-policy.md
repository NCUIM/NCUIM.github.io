# Commit and PR Policy

## Status

**Resolved and enforced.** This document is the human-readable record of the
repository's commit/PR policy. The rules live in exactly one file:
`scripts/commit-policy.mjs`.

## Single source of truth

All enforced rules live in **exactly one file**: `scripts/commit-policy.mjs`.

Both enforcement gates execute that file, so they cannot drift. An advisory
pre-commit hook uses the same file for an early hint:

| Gate | File | Runs |
| --- | --- | --- |
| **Local (advisory)** | `scripts/hooks/pre-commit`, installed into `.git/hooks/pre-commit` by `npm run prepare` | `suggest-scope` tip from the staged files, before the message is written; **never blocks** |
| **Local (hard gate)** | `scripts/hooks/commit-msg`, installed into `.git/hooks/commit-msg` by `npm run prepare` (runs automatically on every `npm install`) | `message` mode on every `git commit` |
| **CI** | `.github/workflows/policy.yml` | `subject` mode on the PR title, `message` mode on every commit in the PR, plus `self-test` |

Because both gates run the same script, a message that passes locally passes
CI, and one that fails CI also fails locally. There is **no second copy of any
rule anywhere else**: `.gitmessage.txt`, `CONTRIBUTING.md`, and the PR
template reference this policy but do not restate the rules.

If local and CI ever disagree, that is a bug in the wiring (hook install or
workflow), not a rules problem — the rules themselves have one home.

## The rules (what both gates block)

### Subject format

Every commit subject and every PR title must match:

```text
<type>(<scope>): <description>
```

- The scope is **required** and must be from the allowlist below.
- The subject must be **at most 72 characters**.
- The description must **start with a lowercase letter or digit**.
- The subject must **not end with a period**.
- Vague descriptions are rejected: `update`, `misc`, `stuff`, `changes`,
  `fix bug`, `bug fix` (case-insensitive).
- Subjects are written in English.

### Allowed types

`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `security`

### Allowed scopes

`app`, `auth`, `firestore`, `functions`, `hosting`, `rules`, `ui`, `challenge`,
`admin`, `i18n`, `ci`, `deps`, `docs`, `test`, `security`, `spec`, `schema`,
`offline`, `qr`, `lottery`, `leaderboard`, `grouping`, `privacy`, `workflow`,
`quality`

Use a new scope only when none of the above fits, and add it to
`scripts/commit-policy.mjs` in the same commit.

### Body format

The commit body must contain a **numbered list in English** whose first item
starts with `1. ` or `1)`:

```text
feat(challenge): add weekly challenge system

1. Add challenge model and Firestore schema.
2. Wire up the challenge list view.
```

Git comment lines (starting with `#`) are ignored by the check, so the
`.gitmessage.txt` template's comment block does not affect validation.

### PR title

The PR title is validated with the same subject rules as commits.

## How to change a rule

1. Edit `scripts/commit-policy.mjs` **only** — this is the single source of
   truth for the rules.
2. Run `npm run test:policy` (built-in self-test).
3. Commit the change with a valid subject, e.g. `chore(ci): extend allowed
   commit scopes`. Both gates validate your own commit.
4. If the change affects the human-readable rule list, update this document
   in the same commit.

No other file needs a parallel edit, which is the point: the rules live in
one home and cannot drift apart.
