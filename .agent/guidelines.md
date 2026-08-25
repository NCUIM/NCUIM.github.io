# NCUIM2026-Fresher AI Agent Guidelines

This document defines core behavioral, architectural, and quality rules for AI agents operating in the NCUIM2026-Fresher codebase.

---

## 1. Problem-Solving Strategy

### Core Principle: **難題求一，得一求全**

遇到問題時，不要急著嘗試解法。先把問題縮到最簡單的形式，看懂它的運作機制，再回來解決原本的問題。

### Rules

1. **Stop and observe first**: Do NOT immediately try random fixes. Each failed attempt without understanding the system is wasted effort.
2. **Read the error message, read the source code, read the documentation**: Understand *why* it fails before attempting a fix.
3. **Normalize to base case**: What is the minimum unit you can verify? Get that working first, then scale back to the full problem.
4. **Self-check**: Ask yourself "Am I solving the problem, or just trying random solutions?" The difference is observation vs. trial-and-error.

### Example

**Problem**: Firebase Security Rules reject client writes.

**Wrong approach (brute force)**:
1. Try different rule syntax → Error
2. Add more allow rules → Error
3. Remove all rules → Security hole
4. Give up

**Right approach**:
1. Stop. Do not touch the rules file.
2. Read the current Security Rules — understand the model.
3. Read the error message in Firebase Console — which specific rule is failing?
4. Test with Firebase Emulator locally to see the exact validation error.
5. Fix the specific condition that's failing.
6. Verify with emulator before deploying.

---

## 2. Communication Protocol

### Diff Summary

Before ending a turn, if there are file changes:
- List affected files and approximate line counts.
- Briefly state what changed and why.

### Draft Labeling

Your output is a **draft**, not a final result:
1. Label suggestions as "suggested" or "draft" — do not assume completion.
2. Wait for explicit user confirmation before treating anything as decided.
3. High-risk decisions (Security Rules, Firestore schema changes, Cloud Functions deploy) require user approval before execution.
4. Low-risk operations (UI tweaks, component refactoring) can proceed with notification.

---

## 3. Code Stability

### Incremental Changes

- **Preserve existing structure** by default. If refactoring is needed, explain the reason and scope to the user first.
- **i18n required**: All user-facing strings must use the i18n system (en, zh-TW). Never hardcode strings in components.
- **Type safety**: TypeScript strict mode. No `any` types without documented justification.
- **Firebase Emulator**: Test all Firestore/Functions changes locally before deploying.

### Quality Findings

When a quality or performance issue is discovered but fixing it is out of scope:
1. Record it immediately in a `TECH_DEBT.md` or equivalent tracking file.
2. Include: affected file/method, current issue details, date, and reason for deferral.
3. Commit it with the current change so the next developer can pick it up.

---

## 4. Test Strategy (Match Test to Risk)

| Risk Level | Worst Case | Test Requirement |
|-----------|------------|------------------|
| Low | UI tweak, doc update | Build + smoke test |
| Medium | Feature broken, UX degraded | Unit test + manual verification |
| High | Data loss, privacy leak, scoring wrong | Acceptance test + automated verification |

### Firebase-Specific Risk Zones

- **Security Rules**: HIGH risk — a misconfigured rule can expose all user data.
- **Cloud Functions (scoring, lottery)**: HIGH risk — incorrect logic affects event fairness.
- **Firestore schema changes**: HIGH risk — data migration can lose existing data.
- **UI components**: MEDIUM risk — visual bugs affect UX but not data integrity.
- **i18n files**: LOW risk — missing translations degrade experience but don't break functionality.

---

## 5. Architecture Conventions

### Component Structure
- Use functional components with hooks.
- Separate container logic from presentational components.
- Co-locate test files with components (`ComponentName.test.tsx`).

### Firebase Structure
- `src/firebase/` — Firebase config, initialization, and SDK setup.
- `src/services/` — Business logic that calls Firebase APIs.
- `src/hooks/` — Custom React hooks for data access (useAuth, useFirestore, etc.).
- `functions/` — Cloud Functions (separate Node.js project).

### File Naming
- Components: `PascalCase.tsx` (e.g., `QRScanner.tsx`)
- Hooks: `camelCase.ts` starting with `use` (e.g., `useAnonymousAuth.ts`)
- Services: `camelCase.ts` (e.g., `encounterService.ts`)
- Types: `PascalCase.types.ts` or co-located in the same file

---

## 6. Offline Challenge Station Rules

The challenge station runs independently on a local machine:
- **SQLite** for local data storage.
- **Signed proofs** for integrity verification.
- Must operate **without internet connectivity**.
- Proof verification must happen server-side (Cloud Functions) when connectivity is restored.
- Never trust client-side validation alone for score submission.
