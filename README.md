# NCUIM 2026 Fresher Mixer

A mobile-first web app for NCU Information Management freshmen to meet one another during the 2026 welcome mixer.

The project is currently in the specification phase. It will be delivered as a web app rather than an App Store or Play Store application.

[繁體中文說明](README.zh-TW.md)

## Product principles

- Open from a link or QR code without installation.
- Optimize for current mobile Safari and Chrome.
- Keep the event usable without creating a permanent account.
- Use QR codes as the primary interaction mechanism and NFC URL tags only as an optional shortcut.
- Keep trusted operations server-side while avoiding a custom long-running backend.
- Collect only data required to run the event.

## Selected stack

- Ionic React, TypeScript, and Vite
- Firebase Authentication
- Cloud Firestore
- Cloud Storage for Firebase
- Firebase Realtime Database for presence only
- Cloud Functions for trusted operations
- Firebase Hosting, Security Rules, and App Check
- Offline TypeScript challenge station with SQLite and signed proofs
- Optional Python OR-Tools runner for laboratory allocation

## Canonical specifications

The English documents below are normative. Localized documents are navigation aids unless they explicitly say otherwise.

| Document | Responsibility |
| --- | --- |
| [Product requirements](docs/01-product-requirements.md) | Scope, actors, user journeys, priorities, and acceptance criteria |
| [System architecture](docs/02-system-architecture.md) | Runtime boundaries, routes, Firebase services, functions, and deployment |
| [Data and security](docs/03-data-and-security.md) | Data model, authorization, privacy, uploads, secrets, and abuse controls |
| [Interactions and rewards](docs/04-interactions-and-rewards.md) | QR/NFC encounters, the hidden flag challenge, submission, and redemption |
| [Admin and operations](docs/05-admin-and-operations.md) | Back-office roles, monitoring, recovery, moderation, and event runbook |
| [Quality and launch](docs/06-quality-and-launch.md) | i18n, accessibility, browser support, testing, performance, and release gates |
| [Visual design](docs/07-visual-design.md) | Pixel Quest direction, design tokens, typography, screens, motion, and required artifacts |
| [Offline challenge server](docs/08-challenge-server.md) | Isolated station, signed tickets/proofs, offline operation, and security |
| [Grouping, leaderboard, and laboratory lottery](docs/09-grouping-leaderboard-and-lottery.md) | Group formation, scoring, ranking, preference allocation, and fairness |
| [Demo event configuration](docs/examples/event-config.example.json) | Replaceable seed data for 120 fake participants and four placeholder labs |

## Language policy

- Product locales: English (`en`) and Traditional Chinese (`zh-TW`) at minimum.
- Runtime fallback locale: English.
- The user can change language at any time; the choice persists on the device.
- Documentation defaults to English. Traditional Chinese files use the `.zh-TW.md` suffix.

## Repository status

No application scaffold has been generated yet. Implementation should begin only after the P0 requirements and launch configuration in these documents are accepted.
