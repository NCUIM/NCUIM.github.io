# System Architecture

## 1. Architecture decision

Use a static mobile-first single-page application backed by managed Firebase services. Two narrowly scoped offline tools are explicit exceptions: an on-site challenge station and a laboratory allocation runner. Neither receives Firebase service-account credentials or becomes a general application backend.

```text
Mobile browser / Admin browser
          |
          v
Ionic React + TypeScript + Vite
   |          |           |
   v          v           v
Firebase   Callable     Realtime Database
Auth       Functions    presence only
   |          |
   v          v
Cloud Firestore ---- Cloud Storage
          |
          v
Firebase Hosting + Security Rules + App Check

Signed ticket QR                 Frozen pseudonymous input
      |                                   |
      v                                   v
Offline Challenge Station        Python OR-Tools Runner
      |                                   |
      v                                   v
Signed completion proof          Signed allocation result
```

## 2. Frontend

- Ionic React provides touch-oriented mobile UI and responsive desktop layouts.
- TypeScript is required for application and Cloud Functions code.
- Vite builds the SPA.
- React Router manages routes.
- `i18next` with `react-i18next` manages locale resources.
- Firebase's modular Web SDK is imported by feature to limit bundle size.
- Native browser features are preferred over dependencies when practical: phone camera for QR links, `Intl` for dates and numbers, Canvas for basic avatar editing.

No server-side rendering is required. PWA installation and offline shell caching are P1; participants must not be required to install the app.

## 3. Proposed source boundaries

```text
src/
  app/                 app shell, routing, providers
  features/
    check-in/
    profile/
    encounters/
    activities/
    groups/
    leaderboard/
    laboratories/
    rewards/
    admin/
  i18n/
    index.ts
    locales/
      en.json
      zh-TW.json
  theme/
    tokens.css          semantic color, type, spacing, and motion tokens
    pixel.css           limited decorative pixel treatments
  lib/
    firebase/          SDK initialization and typed converters
  shared/              shared UI and small utilities only
functions/
  src/
    check-in.ts
    encounters.ts
    groups.ts
    scoring.ts
    challenge-tickets.ts
    rewards.ts
    allocation.ts
    admin.ts
services/
  challenge-station/    TypeScript, Fastify, SQLite, static challenge
tools/
  lab-allocation/       Python and OR-Tools CP-SAT runner
docs/examples/
  event-config.example.json
firestore.rules
storage.rules
database.rules.json
firebase.json
```

Avoid generic repositories, factories, or service interfaces with one implementation. Add shared abstractions only after two real features require the same behavior.

Design tokens are CSS custom properties consumed by Ionic theme variables and application components. Feature code must use semantic tokens such as `--color-primary` and `--color-danger`, not duplicate raw hex values. Pixel effects remain ordinary CSS and small approved assets; no canvas rendering engine or game framework is introduced.

## 4. Routes

| Route | Audience | Purpose |
| --- | --- | --- |
| `/` | Everyone | Event landing or participant home |
| `/check-in` | Participant | Bind a check-in code |
| `/profile` | Participant | Edit profile and avatar |
| `/me` | Participant | Display personal interaction QR |
| `/meet/:token` | Participant | Confirm an encounter |
| `/activities` | Participant | View progress and optional tasks |
| `/groups` | Participant | Create, join, or view a social group |
| `/leaderboard` | Participant | View individual and team ranking |
| `/laboratories` | Participant | Submit preferences and view published assignment |
| `/challenge` | Participant | Display a signed ticket for the offline challenge station |
| `/rewards/proof` | Participant | Import a signed station proof and show redemption state |
| `/rewards` | Participant | View claims and redemption state |
| `/admin` | Staff/Admin | Operational dashboard |

Firebase Hosting rewrites application routes to `index.html`. The intentionally discoverable `/freshman-debug` and its `robots.txt` live on the separate challenge station, not Firebase Hosting.

## 5. Firebase service ownership

| Service | Owns | Must not own |
| --- | --- | --- |
| Authentication | Anonymous participant sessions and staff/admin identity | Physical attendee uniqueness |
| Firestore | Event configuration, participants, profiles, encounters, groups, score events, preferences, allocation metadata, claims, audits | Image bytes, secrets, connection presence |
| Cloud Storage | Avatar objects | Profile metadata or flag values |
| Realtime Database | Online/offline presence and last connection change | Canonical participant or reward records |
| Cloud Functions | Trusted mutations, grouping/scoring, signed challenge tickets/proofs, redemption, allocation import, privileged operations | Challenge content, general page rendering |
| Hosting | Static SPA assets, HTTPS, routing | Secrets or dynamic authorization |

## 6. Required callable functions

| Function | Caller | Responsibility |
| --- | --- | --- |
| `claimCheckIn` | Participant | Validate one-time code and bind `participantId` to authenticated UID |
| `issueInteractionToken` | Participant | Return a short-lived opaque token for the participant QR |
| `recordEncounter` | Participant | Validate token, reject self/duplicate use, and atomically record the encounter |
| `createGroup`, `joinGroup`, `leaveGroup`, `lockGroup` | Participant | Enforce one-group membership, invite validity, size, and deadline |
| `previewAutoGrouping`, `publishAutoGrouping` | Admin | Deterministically assign ungrouped participants and publish reviewed groups |
| `recordScoreEvent`, `reverseScoreEvent` | Function/Admin | Apply capped, idempotent scoring rules with audit history |
| `issueChallengeTicket` | Participant | Return a signed pseudonymous ticket for the offline challenge station |
| `submitChallengeProof` | Participant | Verify station proof, reject replay/wrong owner, and create one reward claim |
| `redeemReward` | Staff/Admin | Validate a redemption token and atomically mark the claim redeemed |
| `submitLabPreferences` | Participant/Group leader | Validate and version ranked laboratory preferences |
| `freezeAllocationInputs` | Admin | Freeze and hash the roster, capacities, groups, preferences, policy, and seed |
| `importAllocationResult`, `publishAllocation` | Admin | Validate the signed solver result and publish an immutable allocation run |
| `recoverParticipantBinding` | Admin | Rebind a participant after staff verifies identity |
| `moderateProfile` | Staff/Admin | Hide or restore public profile content with an audit reason |
| `setEventState` | Admin | Start, pause, end, or selectively disable event capabilities |

All trusted functions derive the caller from the verified Firebase token. A client-supplied UID, role, score, participant ownership, or redemption state is never authoritative.

## 7. Independent services

### Challenge station

The local TypeScript service verifies Firebase-signed tickets with a public key, hosts the intentionally discoverable challenge, verifies personalized flags, and signs completion proofs. It stores replay state in SQLite and can operate offline. See [Offline challenge server](08-challenge-server.md).

### Laboratory allocation runner

The Python OR-Tools runner receives a frozen pseudonymous JSON input, solves the capacity and preference assignment, and returns a signed result plus diagnostics. The Firebase admin flow verifies hashes and signature before import. The runner is invoked only for dry runs and final allocation; it is not an always-on server. See [Grouping, leaderboard, and laboratory lottery](09-grouping-leaderboard-and-lottery.md).

## 8. Presence path

```text
Authenticated browser
  -> watch Realtime Database /.info/connected
  -> register onDisconnect(status/{uid} = offline)
  -> set status/{uid} = online
  -> admin subscribes to status/*
```

Firestore stores durable `lastActionAt` values. Realtime Database stores volatile connection status. Do not mirror presence into Firestore unless a later query requires it.

## 9. Environments and configuration

- Local development uses Firebase Emulator Suite.
- Production uses one dedicated Blaze-plan Firebase project and Hosting site.
- Firestore, Cloud Functions, and the primary Storage bucket use `asia-east1` (Taiwan) where product configuration permits, minimizing cross-region latency. Confirm supported placement against the current [Firestore](https://firebase.google.com/docs/firestore/locations) and [Cloud Functions](https://firebase.google.com/docs/functions/locations) location lists when provisioning.
- Realtime Database presence uses `asia-southeast1` (Singapore), the closest currently supported [Realtime Database region](https://firebase.google.com/docs/database/locations) to Taiwan; its location is independent from Firestore.
- Web App Check uses [reCAPTCHA Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider) with automatic token refresh. Roll out in metrics-only mode, then enforce before the production event.
- Hosting preview channels may be used for pre-event acceptance testing.
- Public Firebase client configuration is environment-specific but is not a secret.
- Firebase ticket-signing keys, pseudonymous-subject HMAC keys, and other sensitive values use Cloud Secret Manager and are bound only to necessary functions.
- Event name, times, locales, scoring, groups, leaderboard, laboratories, rewards, and feature switches live in admin-writable configuration based on [the demo seed](examples/event-config.example.json).
- Timestamps are stored in UTC; event rules use `Asia/Taipei`; clients display with `Intl` in the selected locale.

## 10. Deployment

1. Type-check, lint, and test the frontend and Functions.
2. Run Security Rules tests against emulators.
3. Build the production SPA.
4. Build and test the challenge station, including offline signed ticket/proof flow.
5. Test the allocation runner with frozen fixtures and reproducibility checks.
6. Deploy rules, indexes, Functions, Storage rules, Realtime Database rules, and Hosting from version-controlled configuration.
7. Run smoke tests against the deployed URL in both locales.
8. Keep the previous Hosting release available for rollback.

Cloud Storage and Cloud Functions require a billing-enabled Firebase project. Configure budget alerts and operational quotas before production use.
