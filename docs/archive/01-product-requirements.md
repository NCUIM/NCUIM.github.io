# Product Requirements

## 1. Purpose

The app helps freshmen start conversations, exchange lightweight profiles, form temporary teams, complete social activities, follow individual/team progress, and participate in an optional laboratory-station draw during an on-site welcome mixer. A separate offline side station hosts the individual hidden-flag activity.

Success means attendees can join quickly, interact without staff assistance, and redeem eligible rewards exactly once. The app is an event tool, not a permanent social network.

## 2. Product goals

1. A checked-in attendee can reach their home screen within two minutes.
2. Two attendees can record an encounter using a QR code without installing an app.
3. Attendees can edit a small public profile and avatar.
4. Staff can monitor participation and recover common failures from a desktop-friendly admin view.
5. Every attendee can discover and submit a personalized hidden flag.
6. Reward redemption is attributable, auditable, and resistant to duplicate claims.
7. Attendees can self-form or receive a fair system-assigned social group.
8. Organizers can run an auditable laboratory-station allocation without silently coupling it to social scores.

## 3. Non-goals

- App Store or Play Store distribution
- Direct messaging, friend graphs, or a permanent alumni network
- Continuous location tracking
- Payments
- AI image editing or automatic content moderation
- High-stakes identity verification
- Full offline interaction or offline reward redemption
- Rich analytics or a general-purpose CMS
- Using mixer scores to influence consequential academic placement

## 4. Actors

| Actor | Description | Authentication |
| --- | --- | --- |
| Participant | A checked-in freshman using the mobile web app | Anonymous Firebase account bound to one participant record |
| Staff | A trusted helper who checks in attendees and redeems gifts | Google or email sign-in with a `staff` claim |
| Admin | An organizer who configures the event and manages users | Google or email sign-in with an `admin` claim |

## 5. Assumptions

- Attendees bring a smartphone with a current browser and camera.
- The venue provides usable mobile data or Wi-Fi.
- Each physical attendee receives one check-in code or equivalent staff-assisted binding.
- The event has a defined start and end time in `Asia/Taipei`.
- Organizers configure expected attendance and reward inventory before launch.

## 6. Priority definitions

- **P0:** required for the event to operate safely.
- **P1:** valuable and expected if schedule permits.
- **P2:** optional enhancement; must not delay P0 readiness.

## 7. Functional requirements

### 7.1 Entry and check-in

- **P0** The landing page explains the event, supported languages, data use, and participation rules.
- **P0** A participant can enter or scan a one-time check-in code.
- **P0** The default check-in credential is a pre-generated anonymous participant card containing a QR URL, a 16-character fallback code, and a human-readable card serial; it contains no name or student number.
- **P0** A successful check-in binds one stable `participantId` to the current Firebase UID.
- **P0** A consumed code cannot be reused without an admin recovery action.
- **P0** The client never receives the stored check-in-code hash or another participant's private record.
- **P0** A failed, expired, or already-used code produces a localized recovery message.
- **P0** Lost browser sessions are recovered by staff after checking the attendee's physical check-in evidence; there is no self-service identity takeover flow.

### 7.2 Profile

- **P0** A participant can set a display name of 1–40 Unicode characters and an optional introduction of at most 160 characters after trimming.
- **P0** A participant can upload, crop, rotate, replace, or remove an avatar.
- **P0** The app converts accepted images to WebP, limits the longest edge to 1080 px, and targets a maximum upload size of 1 MB.
- **P0** Only JPEG, PNG, and WebP source images up to 10 MB are accepted. SVG, executable content, malformed images, and arbitrary files are rejected.
- **P0** User-generated text is rendered as plain text and is never interpreted as HTML.
- **P0** Staff can hide an inappropriate profile or avatar without deleting the participant's event history.
- **P1** A participant can choose up to five organizer-defined interests or conversation prompts.

### 7.3 Encounters

- **P0** Each participant can display a QR code representing a server-issued interaction token.
- **P0** Another participant can use the phone's native camera to open the interaction URL.
- **P0** The scanning participant must confirm before an encounter is recorded.
- **P0** Self-interactions, expired tokens, suspended users, and duplicate pairs are rejected.
- **P0** Repeating the same request is idempotent and does not create extra encounters or points.
- **P0** A successful result clearly identifies the other participant and confirms server acknowledgement.
- **P1** NFC NDEF URL tags may open the same HTTPS flow, but NFC cannot be required to participate.

### 7.4 Activities and status

- **P0** The home screen shows the attendee's profile completion, encounter count, activity progress, and reward state.
- **P0** Server-authoritative actions display pending, success, and failure states; the UI never reports success before acknowledgement.
- **P0** The admin view can distinguish online, offline, stale, and unknown status.
- **P0** Status tracking is limited to connection state, `lastSeenAt`, current activity state, and operational flags. GPS is not collected.
- **P1** Organizers can configure simple event tasks and point values without redeploying the client.

### 7.5 Hidden flag and rewards

- **P0** Every bound participant can request a signed ticket for the separate on-site challenge station.
- **P0** The challenge station can operate without Firebase connectivity and returns a signed completion proof to the main app.
- **P0** A flag valid for one participant is invalid for every other participant.
- **P0** Flag generation secrets never appear in browser assets, Firestore, Storage, or client-readable configuration.
- **P0** Participants submit the flag as text at the challenge station; screenshots are not accepted as proof.
- **P0** The main app submits the station's signed completion proof and creates at most one reward claim per participant and challenge.
- **P0** The participant receives a one-time redemption token or QR code.
- **P0** Staff redemption is atomic and records who redeemed the reward and when.
- **P0** Exhausted inventory and already-redeemed claims produce explicit staff-facing outcomes.

### 7.6 Localization

- **P0** All first-party participant and admin UI supports `en` and `zh-TW`.
- **P0** Missing or unsupported locales fall back to English.
- **P0** Users can switch language without signing out or losing their current task.
- **P0** The preference persists on the device.
- **P0** Validation errors, loading states, accessibility labels, confirmation dialogs, and notifications are translated.
- **P0** User-generated content and flag values are not translated.

### 7.7 Visual identity and experience

- **P0** The participant experience follows the NCUIM Pixel Quest direction defined in the [Visual design specification](07-visual-design.md).
- **P0** The main app remains bright, friendly, and readable; pixel styling is an accent rather than a replacement for familiar controls.
- **P0** The challenge station's hidden debug route may use a stronger dark terminal treatment without changing the visual language of the main app.
- **P0** Avatars, QR codes, body text, form controls, consent, validation, and admin tables are not pixelated or visually degraded.
- **P0** English and Traditional Chinese are designed and reviewed in the same layouts.
- **P0** The organizer-approved official NCU emblem is used only from approved source assets and is not redrawn or pixelated.
- **P1** Short encounter, task-completion, and reward animations reinforce successful social actions.
- **P2** Full-app dark mode may be added only after the P0 light experience is accepted.

### 7.8 Event lifecycle

- **P0** Before the configured start time, participants see a waiting state and cannot create encounters or submit rewards.
- **P0** After the configured end time, profiles remain readable for the configured grace period, but new encounters and submissions are blocked.
- **P0** Admins can pause interactions or reward redemption independently during an incident.
- **P0** Event state is determined by server time and event configuration, not by the participant's device clock.

### 7.9 Groups and leaderboard

- **P0** Participants can create or join a social group by QR code or short code before the grouping deadline.
- **P0** Default group size is 4–6 with a target of 5.
- **P0** Hybrid formation preserves valid self-formed groups and assigns remaining participants through a deterministic seeded process.
- **P0** A participant belongs to at most one active group.
- **P0** The system does not use sensitive or inferred personal traits to form groups.
- **P0** Individual score is capped by configured server-authoritative rules; team score uses average member score plus capped team missions.
- **P0** Participants may opt out of public ranking without losing private progress or ordinary reward eligibility.
- **P0** Prize ranking freezes at a published time.
- **P1** Staff can create a group for people standing together by scanning participant cards or using a table QR.

### 7.10 Laboratory station assignment

- **P0** Participants or locked groups can submit ranked laboratory-station preferences before a published deadline.
- **P0** The system freezes roster, group, capacity, preference, policy, and random-seed inputs before a final run.
- **P0** Assignment respects capacity, keeps locked groups intact, and records reproducible run metadata.
- **P0** Admins review a dry run before publishing one immutable final result.
- **P0** Leaderboard score has no effect on the default laboratory assignment.
- **P0** If a future allocation affects an academic opportunity, mixer participation and leaderboard score must have zero influence and a separate approved fairness policy is required.
- **P1** The leaderboard can control the order of the on-stage reveal without changing the precomputed result.

Detailed behavior is normative in [Grouping, leaderboard, and laboratory lottery](09-grouping-leaderboard-and-lottery.md).

## 8. Privacy and retention requirements

- The consent notice lists collected fields, purposes, retention, and organizer contact information.
- Student numbers, legal names, phone numbers, precise location, and unrelated identifiers are not collected unless the organizer separately approves a documented requirement.
- Public profiles expose only the display name, introduction, interests, and approved avatar.
- Presence details are visible only to staff and admins.
- Default retention: delete avatars, presence data, public profiles, and raw activity data within 30 days after the event.
- Keep minimal redemption audit data for up to 90 days, then delete or anonymize it.
- Admins must be able to export the minimal redemption audit before deletion.

## 9. Degraded and failure behavior

- The app shows a reconnecting state when Firebase is unreachable.
- Trusted mutations may be retried only with an idempotency key.
- Flag submission and reward redemption are online-only and never queued as successful offline actions.
- If an image upload fails, the existing avatar remains unchanged.
- If presence is stale, the admin UI shows the last confirmed timestamp instead of asserting that the user is offline.
- Staff can complete check-in, identity recovery, and redemption from the admin interface when a participant device fails.
- Challenge-station failure does not block any core mixer feature; staff can pause only the side activity.

## 10. Product acceptance

The P0 product scope is accepted when:

1. A fresh mobile browser can check in, create a profile, display a QR code, record an encounter, join a group, view progress, complete the challenge handoff, and present a reward code.
2. A different account cannot reuse that flag or reward code.
3. Staff can monitor the participant, recover the account binding, moderate the profile, and redeem the reward.
4. The complete flow works in both English and Traditional Chinese and follows the approved visual specification.
5. All P0 launch gates in [Quality and launch](06-quality-and-launch.md) pass.
6. Placeholder configuration can demonstrate grouping, both leaderboards, laboratory preferences, an allocation dry run, and result publication without production participant data.
