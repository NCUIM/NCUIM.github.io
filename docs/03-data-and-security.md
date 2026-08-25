# Data and Security Specification

## 1. Security model

Assume every browser asset, route, request shape, Firebase project identifier, and value returned to a participant can be inspected and modified. Security relies on authenticated identity, server-side validation, Security Rules, unguessable tokens, atomic writes, and audit records—not hidden UI.

## 2. Firestore model

All event-owned documents include `eventId`, `createdAt`, and `updatedAt` where applicable. Server timestamps are authoritative.

### `events/{eventId}`

Public operational configuration:

- `name`
- `state`: `draft | waiting | active | paused | ended`
- `startsAt`, `endsAt`, `graceEndsAt`
- `timeZone`: `Asia/Taipei`
- `supportedLocales`: initially `en`, `zh-TW`
- `defaultLocale`: `en`
- `features`: interaction, flag submission, and redemption switches
- public task and reward descriptions

Only admins can write. Participants can read fields required by the client.

### `participants/{participantId}`

Private canonical participant record:

- `ownerUid`
- `status`: `checked_in | active | suspended | withdrawn`
- `checkedInAt`, `lastActionAt`
- `profileComplete`
- internal moderation and recovery fields

The owner can read their own record. Staff receive only fields needed for operations. Admins have full access. Direct participant writes are denied except through narrowly scoped rules or Functions.

### `publicProfiles/{participantId}`

Participant-visible profile:

- `displayName`
- `intro`
- `interestIds`
- `avatarPath`
- `visibility`: `visible | hidden`

Authenticated, checked-in participants can read visible profiles. The owner can update allowed fields with length and type validation. Role, ownership, score, visibility, and audit fields cannot be changed by the owner.

### `checkInCodes/{codeHash}`

- `participantId`
- `expiresAt`
- `claimedAt`, `claimedByUid`
- `revokedAt`

No client read or write access. Functions hash submitted codes before lookup and claim them transactionally.

### `interactionTokens/{tokenHash}`

- `participantId`
- `expiresAt`
- `issuedAt`
- `revokedAt`

No client listing. Raw opaque tokens are returned once to the owner; only hashes are stored. Default validity is two minutes and is configurable per event.

### `encounters/{eventId_pairKey}`

- `participantIds`: two sorted stable IDs
- `initiatedByParticipantId`
- `createdAt`
- `interactionMethod`: `qr | nfc`

`pairKey` is derived from sorted participant IDs, making one encounter per pair naturally idempotent. Only `recordEncounter` creates these documents.

### `participantProgress/{eventId_participantId}`

- `encounterCount`
- `completedTaskIds`
- `score`
- `updatedAt`

Only Functions update server-authoritative counters and scores. Participants can read their own progress.

### `rewardClaims/{eventId_participantId_challengeId}`

- `participantId`, `challengeId`
- `solvedAt`
- `redemptionTokenHash`
- `redeemedAt`, `redeemedByUid`
- `status`: `available | redeemed | void`

Participants can read their own claim but cannot write it. Staff can redeem through a Function. Admins can void a claim with an audit reason.

### Grouping, scoring, and allocation collections

The following server-authoritative collections are defined in detail in [Grouping, leaderboard, and laboratory lottery](09-grouping-leaderboard-and-lottery.md):

- `groups/{groupId}` and `groupInvites/{inviteHash}`
- `scoreEvents/{scoreEventId}` and `leaderboardSnapshots/{snapshotId}`
- `labPreferences/{eventId_unitId}`
- `allocationRuns/{runId}` and `labAssignments/{eventId_unitId}`

Participants can read their own group, preferences, and assignment. Public leaderboard documents contain aliases and scores only. Direct client writes to score events, snapshots, allocation runs, and assignments are denied.

### `auditLogs/{logId}`

- `actorUid`, `actorRole`
- `action`
- `targetType`, `targetId`
- `reason`
- minimal before/after metadata
- `createdAt`

Clients cannot modify audit logs. Do not store raw flags, check-in codes, redemption tokens, avatar bytes, or unnecessary personal content in logs.

## 3. Realtime Database model

### `status/{uid}`

- `state`: `online | offline`
- `lastChanged`
- `eventId`

Users may write only their own status node. Staff/admin can read status for the active event. Old status nodes are removed by retention cleanup.

## 4. Storage model

```text
avatars/{participantId}/avatar.webp
```

- The authenticated owner can write and delete only the avatar whose participant record is bound to their UID.
- Authenticated checked-in participants can read an avatar only while its corresponding public profile is visible.
- Staff/admin can hide or delete abusive content.
- Rules restrict object size to 1 MB and content type to `image/webp` for final uploads.
- The client may accept JPEG, PNG, or WebP input but uploads only the processed WebP result.
- Replacing an avatar must not update the Firestore profile until the new upload succeeds.
- Storage Rules use the path `participantId` to check participant ownership and public-profile visibility in Firestore.

## 5. Identity binding

Firebase anonymous UID identifies a browser session, not a physical attendee. Physical uniqueness comes from `participantId` and a pre-generated anonymous participant card.

```text
physical attendee
  -> participant-card QR or 16-character fallback code
  -> claimCheckIn transaction
  -> stable participantId
  -> current ownerUid
```

The card contains no name or student number and has a human-readable serial such as `F-042`. Staff record card handoff against an offline organizer roster; that roster is not imported into Firebase. For recovery, staff verify the attendee against the offline roster and card serial, then an admin may rebind `ownerUid`. Rebinding revokes active interaction, group invite, challenge ticket, and redemption tokens and creates an audit log. Previous UIDs lose access immediately through Rules and function checks.

## 6. Authorization

- Participant access requires authentication plus a participant document whose `ownerUid` matches `request.auth.uid`.
- Staff access requires the `staff` or `admin` custom claim.
- Admin-only operations require the `admin` custom claim.
- Custom claims are set only from a privileged environment using the Admin SDK.
- Hiding an admin route is never treated as authorization.
- Functions verify role, event state, target ownership, and input schema on every request.

## 7. Challenge isolation and proof security

- Firebase derives a pseudonymous challenge subject from `eventId` and `participantId`; the offline station never receives UID, participant ID, name, or profile.
- `issueChallengeTicket` signs subject, event, challenge, nonce, locale, audience, and expiry with an Ed25519 private key held in Cloud Secret Manager.
- The station verifies tickets using the Firebase public key and creates the personalized HMAC flag using a station-only secret.
- After local flag verification, the station signs a completion proof with its own Ed25519 private key.
- `submitChallengeProof` verifies the station public key, maps the subject to the caller, rejects replayed `proofId`, and creates one reward claim transactionally.
- Neither environment stores raw flags in Firestore, SQLite, analytics, or logs.
- The local station has no Firebase service-account credentials and no direct data access.
- Key IDs and public keys are versioned; private keys remain in their owning environment.

The full protocol and offline failure behavior are normative in [Offline challenge server](08-challenge-server.md).

## 8. Token requirements

- Check-in, interaction, group-invite, challenge, and redemption tokens are generated with a cryptographically secure random source.
- Human-entered check-in codes use 16 unambiguous Base32 characters grouped for readability, providing about 80 bits of entropy; case and separators are normalized before hashing.
- Interaction and redemption tokens contain at least 128 bits of entropy.
- Databases store token hashes, not raw token values.
- Interaction tokens are short-lived and revocable.
- Redemption tokens are single-use and expire after the event grace period.
- Errors do not reveal whether an arbitrary participant or token identifier exists.

## 9. Abuse and threat controls

| Threat | Control |
| --- | --- |
| Sharing a flag or proof | Flag is bound to the pseudonymous subject; Firebase accepts the signed proof only for its owning participant |
| Creating new anonymous accounts | Physical check-in code creates the stable participant identity |
| Editing score in DevTools | Scores and progress are Function-owned |
| Replaying encounter requests | Short-lived token plus deterministic pair key and transaction |
| Sharing a participant QR screenshot | Two-minute token lifetime; admin can revoke tokens |
| Reusing a reward QR | Single-use token and atomic redemption transaction |
| Calling Functions from scripts | Authentication, App Check enforcement, rate limits, and input validation |
| Compromising the challenge station | Station receives no PII or Firebase credentials; proof replay and subject ownership are verified in Firebase |
| Manipulating leaderboard score | Immutable idempotent score events, configured caps, server-owned aggregation, and audited reversal |
| Biasing a laboratory assignment | Frozen pseudonymous inputs, published policy/seed, solver diagnostics, signed result, and immutable run version |
| Uploading malicious files | Client conversion, Storage size/type rules, no SVG, restrictive rendering and CSP |
| Guessing hidden routes | Hidden route is intentionally discoverable and contains no privileged capability |
| Accessing `/admin` directly | Claims and Rules enforce authorization independently of routing |

Suggested rate limits per participant:

- Check-in attempts: 10 per 15 minutes
- Flag submissions: 5 per minute and 30 per event
- Interaction recording: 30 per 10 minutes
- Interaction-token issuance: 10 per minute
- Redemption: 10 attempts per 15 minutes per staff account

Limits are operational defaults and may be raised after load testing. Repeated violations are logged without storing submitted raw flags or tokens.

## 10. Browser and content security

- Serve only over HTTPS.
- Configure a Content Security Policy that restricts scripts, frames, connections, images, and form destinations to required origins.
- Do not use `dangerouslySetInnerHTML` for participant content.
- Prevent the app from being framed unless a confirmed requirement exists.
- Avoid third-party analytics and trackers for the MVP.
- Never commit service-account keys, production secrets, attendee exports, or local emulator data.
- Enable App Check in monitor mode first, review metrics, then enforce it before the event.

## 11. Privacy and deletion

- Obtain clear consent before check-in binding and avatar upload.
- Provide a participant-visible way to remove the avatar and leave the optional activity.
- Staff can withdraw a participant; withdrawal blocks new interactions and hides the public profile.
- Automated cleanup removes data according to the retention periods in the product requirements.
- Challenge-station SQLite state is deleted within 30 days after the event after operational review.
- Pseudonymous allocation inputs and outputs follow the activity-data retention period unless a consequential allocation policy requires another approved period.
- Backups and exports follow the same retention intent and remain access-controlled.

## 12. Required security tests

- Rules tests prove participant isolation, staff/admin boundaries, input validation, and denied direct writes to authoritative fields.
- Function tests cover replay, duplicate, expired, self-target, wrong-owner, suspended-user, paused-event, group-membership races, score caps, proof ownership, allocation-result hashes, and exhausted-inventory cases.
- Upload tests cover oversized files, wrong MIME type, SVG, malformed images, and replacement failure.
- Challenge-station tests cover altered tickets, offline verification, different-subject flags, proof signing, reset, and deletion of visible session data.
- Allocation tests prove capacity, intact groups, deterministic reproduction, infeasibility reporting, and zero leaderboard influence in consequential mode.
- No production launch occurs with Firestore, Realtime Database, or Storage in open test mode.
