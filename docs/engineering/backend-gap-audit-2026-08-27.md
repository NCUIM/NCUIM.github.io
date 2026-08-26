# Backend Gap Audit

Date: 2026-08-27  
Scope: UI branch `feat/design-system-theme`  
Status: design inventory, not an implementation plan or evidence of Firebase configuration.

## 1. Purpose and boundary

This document records the backend work each currently routed page needs before it can be presented as live. It deliberately separates:

- **No backend required**: a browser-only tool or static event content.
- **Firestore or Storage read/write**: data that can be safely read or edited by the owner under Rules.
- **Trusted Function**: any operation that establishes identity, changes score, allocates a seat, redeems a prize, or grants staff authority.

The current UI must continue to label unfinished flows as `Demo` or `Coming soon`. A hidden route, disabled button, or client-side state is never authorization.

## 2. Cross-cutting foundations

These foundations should be completed once before converting individual pages from demo data.

| Gap | Required minimum | Owner / trust boundary |
| --- | --- | --- |
| Firebase environments | Separate development and production projects, web configuration through environment variables, Hosting deployment, budget and quota alerts | Operations |
| Identity | Anonymous Firebase Authentication plus `claimCheckIn(code)` to bind one stable `participantId` to the browser UID | Trusted Function and Firestore transaction |
| Event state | `events/{eventId}` exposes locale, schedule, feature switches, and `draft / waiting / active / paused / ended` state | Admin writes; participants read only public fields |
| Authorization | Staff and admin Custom Claims, Firestore / Storage / Realtime Database Rules, Emulator Rules tests | Claims are assigned outside the participant client |
| Presence and audit | Realtime Database `status/{uid}` with `onDisconnect()`; Firestore `auditLogs` for privileged actions | Staff/admin read only; clients cannot edit audit records |
| Localization | English is the source locale; `en` and `zh-TW` strings, locale stored in the event and selected by the participant | Static bundles first; remote copy only if organisers need live edits |
| Content safety | App Check, HTTPS, CSP, function input validation and rate limits | Do not expose Admin SDK, raw tokens, flags, or roster data to the client |

## 3. Route-by-route inventory

| Route | Current UI evidence | Missing backend or data work | Priority |
| --- | --- | --- | --- |
| `/` Home | Module cards are hard-coded in `HomePage.tsx` | None for MVP. Optional: read event title, feature availability, and notices from the public event document so a paused module is not advertised. | P2 |
| `/guide` Survival guide | Checklist state exists only in React state; several campus resources are disabled | Static bilingual content can ship in the bundle. If organisers need per-person completion, store allowed checklist IDs in the owner's progress document; external resource links need verified URLs, not Firebase. | P2 |
| `/cards` Activity cards / check-in | Button only changes `checkedIn` local state | Anonymous sign-in; `claimCheckIn` with one-time QR/fallback code; participant/profile/progress reads; `issueInteractionToken` and `recordEncounter` for QR/NFC exchanges. Token use, duplicate encounters, and score changes must be Function-owned. | P0 |
| `/leaderboard` | `MOCK_RANKINGS`, `MY_RANK`, and a timer simulate updates | Public leaderboard projection or snapshot, private self-progress read, and server-owned `scoreEvents`. Need rank/opt-out/suspension handling and event-state gating. Do not let the browser submit scores. | P1 |
| `/seats` Research-room seat map | Room list and capacities are hard-coded; maps are placeholders | Public room-layout configuration is enough for static viewing. If used with lottery results, read only the caller's published `labAssignments` result and seat map; never expose every participant's identity or make seats client-writable. | P1 |
| `/stage/lottery` Participant result | Fixed group 8, room 313, seats, and member list | Read the caller's published assignment and its group/seat view in real time. Needs assignment publication state so no attendee sees a partial run. The server/admin workflow, not this page, creates assignments. | P0 |
| `/admin/lottery` Staff lottery console | File input only displays a filename; publish button is disabled | Admin claim and route guard; XLSX upload to Storage; trusted parse/validate/import step; capacity and duplicate diagnostics; immutable allocation run and audited publish. The client must never parse-and-publish authoritative assignments by itself. | P0 |
| `/timetable` | Courses, rooms, and periods are hard-coded | No participant backend needed. Ship bilingual versioned schedule content with the app unless organisers need live edits; then use a public read-only schedule document. Course enrolment data must not be inferred or collected. | P2 |
| `/food` | Area chips are local; no venues or recommendation data | No Firebase needed for an MVP: use a versioned bilingual static list and browser-side random selection. Add a public content document only if staff need event-day edits. Do not imply opening hours are live without a verified source. | P3 |
| `/tools/credit` | Demo courses and selected credits remain browser state | No event backend needed. Keep calculations local; only add import/export after a separate privacy decision. It must not use or claim access to the university's academic record system. | P3 |

## 4. Not yet routed but already in product scope

| Capability | Missing frontend/backend boundary | Priority |
| --- | --- | --- |
| Profile and avatar | Participant profile editor; browser-side crop/compress; Cloud Storage upload to `avatars/{participantId}/avatar.webp`; Firestore stores metadata only. Enforce owner, WebP, and 1 MB rules. | P1 |
| Flag Easter egg and gift claim | Participant-facing discovery/submit flow; offline challenge station; server verifies signed proof or recomputes personalised flag; claim and redemption are transactional. No raw flag, secret, or winning criterion may be shipped in the app bundle. | P1 |
| Groups | Create/join/lock flow, short-lived QR invite, group display, and optional system grouping preview/publish. Membership and group score changes require trusted operations. | P1 when group activities are confirmed |
| Admin dashboard | Operational participant list, presence, check-in, moderation, redemption, audit, feature switches, and allocation lifecycle. All staff/admin mutations need Custom Claims, reason capture where appropriate, and audit logging. | P1 |

## 5. Lottery delivery sequence

The shortest safe implementation order is:

1. Establish Firebase projects, Rules, anonymous sign-in, and one-time participant check-in.
2. Define read-only room layouts and the published assignment document shape.
3. Make `/stage/lottery` render the authenticated participant's published result, with a waiting state before publication.
4. Protect `/admin/lottery`; add XLSX upload, server-side validation, and a review screen.
5. Import one reviewed allocation run, then atomically publish it to participants and record an audit event.

An XLSX import must validate: required columns, duplicate participant IDs, unique group membership, known rooms, valid seats in that room layout, capacity, and every assigned participant's checked-in identity. Invalid rows must be reported without publishing any partial result.

## 6. Definition of done before the event

- No route displays fixed identities, assignments, scores, or "synced" wording as though it were live data.
- Every participant sees only their own private record, assignment, claims, and allowed group information.
- Every staff page is claim-protected and every privileged mutation is server-validated and audited.
- Event pause/end state prevents new check-in, interaction, flag, and redemption writes as configured.
- Rules and Functions are tested with Firebase Emulator; a test import includes duplicate, over-capacity, invalid-seat, and rollback cases.
- English and Traditional Chinese are present for all participant and staff-visible strings.

## 7. Deliberately deferred

- A separate backend for timetable, food recommendations, guide links, or credit calculation is not justified for the temporary event MVP.
- Direct integration with university course, identity, or academic-record systems is out of scope.
- The existing offline challenge server remains a separate local service by design; it receives no Firebase credentials or participant PII.
