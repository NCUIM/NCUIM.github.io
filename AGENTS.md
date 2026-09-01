# NCUIM2026-Fresher Agent Authorization Gate

This file is the mandatory first-read rule for every agent working in NCUIM2026-Fresher.

---

## 🚦 Action Classification Before Any Tool Call

Before performing any tool call, categorize the action into one of three tiers:

1. **Read-only**:
   - Inspect files, Git status/history, test results, CI status, or external state.
   - *Status*: **Allowed by default**.
2. **Local edit**:
   - Modify or create files only when explicitly requested by the user.
   - *Status*: Allowed for the requested task. **Does not imply permission to commit, push, or publish**.
3. **External mutation / Git commits**:
   - Any branch operation, commit, push/force-push, tag modification, PR operation, release creation, or workflow dispatch.
   - *Status*: **Requires explicit authorization from the user** in the current conversation turn.

---

## 🛡️ Critical Invariants & Non-Negotiable Rules

### 1. Authorization Non-Transitivity

Authorization for task A never extends to task B. Always report verification evidence and confirm before proceeding to irreversible state changes.

Examples of separate operations requiring separate authorization:
- create, switch to, rename, or delete a branch
- commit, push, force-push, create, move, or delete a tag
- create, edit, merge, close, or delete a pull request
- create, edit, delete, rerun, dispatch, or cancel a GitHub Actions workflow or release

Before any external action:
1. Quote the user authorization and list the exact operation(s) it covers.
2. Check the current target (repository, branch, tag, PR, workflow, or release).
3. Stop and ask if the next required operation is not explicitly covered.
4. Execute one authorized mutation at a time and report its result before considering another.

### 2. No Autonomous Push

**NEVER** run `git push` automatically. Only commit locally.
Only push when the user explicitly requests it.

### 3. Strict Atomic Commits

One commit = one logical change. Apply the "revert test": if two changes can be independently reverted without breaking the other, they are separate purposes and require separate commits.

- Never mix code changes with static asset changes (e.g., screenshots, localization docs) in a single commit.
- Even within a single file, changes with different purposes must be committed separately (use `git add -p`).
- Rename files using `git mv` — never delete and re-add.
- Run `git status` before committing to verify no unrelated files are staged.

### 4. Branch Naming Convention

Branches must follow: `<type>/<kebab-case-description>`

- `<type>` must be one of the allowed commit types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `security`
- `<description>` must be a short kebab-case summary of the branch purpose.
- Examples: `feat/timetable-improvements`, `fix/cis-session-refresh`, `style/hero-badge-and-brand-assets`

### 5. Commit Message Format

All commit messages must follow Conventional Commits:

```
<type>(<scope>): <short description>

1. <Numbered detail 1 in English>
2. <Numbered detail 2 in English>
```

- **Header**: Must not exceed 72 characters; must not end with a period.
- **Allowed types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `security`
- **Allowed scopes**: `app`, `auth`, `firestore`, `functions`, `hosting`, `rules`, `ui`, `admin`, `i18n`, `ci`, `deps`, `docs`, `test`, `security`, `spec`, `schema`, `offline`, `qr`, `leaderboard`, `grouping`, `privacy`, `workflow`, `quality`
- **Body**: Must be a numbered English list starting with `1. `, separated from header by a blank line.

Example:
```
feat(auth): implement anonymous sign-in with QR code entry

1. Add Firebase anonymous auth flow triggered by QR scan.
2. Generate display name from random noun-adjective pair.
```

### 6. Authorization Failure Escalation

If an authorized operation fails and fixing it requires a new branch, code change, PR, merge, workflow change, or release change, stop and report the evidence. Do not expand the authorization to unblock the task.

### 7. User Revocation = Immediate Stop

If the user objects to or revokes an action, stop all mutations immediately. Do not revert, delete, cancel, or force-push as "cleanup" without separate authorization.

---

## 📐 Technical Context

This project is a **mobile-first web app** built with:
- Ionic React + TypeScript + Vite
- Firebase (Auth, Firestore, Cloud Storage, Realtime Database, Cloud Functions, Hosting)

### Firebase-Specific Guardrails
- Security Rules changes require careful review — they affect all client access.
- Cloud Functions handle all trusted operations (scoring, flag validation, lottery).
- Never expose Firebase Admin SDK or service account keys to client code.
- Firestore writes from client must respect Security Rules; test with Firebase Emulator.
