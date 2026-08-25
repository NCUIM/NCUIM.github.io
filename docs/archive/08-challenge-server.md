# Offline Challenge Server Specification

## 1. Purpose

The hidden flag becomes an optional on-site side activity hosted on a separate organizer-controlled server. Failure of this server must not block check-in, profiles, encounters, grouping, the leaderboard, or ordinary event operations.

The side activity teaches browser inspection skills while keeping the main Firebase project and participant data isolated from intentionally discoverable challenge behavior.

## 2. Deployment decision

Use one small local service at the activity station:

- Node.js LTS and TypeScript
- Fastify for HTTP routing and static challenge assets
- SQLite for local ticket/proof replay state
- One organizer-controlled laptop or mini PC
- One webcam or USB 2D scanner for participant ticket QRs
- A desktop Chromium browser with DevTools available to participants

The challenge browser and server may share the same machine. Participant phones do not need to connect to the local server, avoiding local HTTPS, captive portal, and venue Wi-Fi compatibility problems.

## 3. End-to-end flow

```text
Participant app
  -> issueChallengeTicket Firebase Function
  -> display signed ticket QR

Challenge station
  -> scan ticket QR
  -> verify Firebase signature offline
  -> start personalized browser challenge
  -> participant discovers and submits personal flag
  -> display signed proof URL as QR

Participant phone camera
  -> open https://<main-app>/rewards/proof?proof=<signed-proof>
  -> submitChallengeProof Firebase Function
  -> create reward claim once
```

The local server never receives a Firebase service-account key and never needs direct access to Firestore.

## 4. Challenge ticket

`issueChallengeTicket` returns a compact Ed25519-signed token containing:

- `iss`: Firebase event backend identifier
- `aud`: challenge server identifier
- `eventId`
- `challengeId`
- `subject`: stable pseudonymous challenge subject, not UID or `participantId`
- `nonce`: random ticket identifier
- `locale`: `en` or `zh-TW`
- `iat`, `exp`

The `subject` is derived server-side from `eventId` and `participantId` using a separate HMAC secret. The challenge station cannot reverse it to a participant identity.

Default ticket lifetime is 15 minutes. Issuing a new ticket invalidates no completed proof, but the station accepts a ticket nonce only once at a time.

## 5. Personalized challenge and flag

After validating the ticket, the station initializes an isolated challenge session. The default challenge preserves the approved discovery sequence:

1. A Console message hints that some responses are not rendered and mentions robots.
2. Local `/robots.txt` reveals `/freshman-debug`.
3. The hidden route makes a request that contains the personalized flag in a non-rendered response field.
4. The participant finds the flag with DevTools and submits it to the station.

The flag is deterministic for the challenge subject:

```text
IMIS{base64url(HMAC-SHA256(challengeSecret, eventId:subject:challengeId))[0:20]}
```

The challenge secret exists only on the local server. Raw flags are not logged.

## 6. Completion proof

After the station verifies the flag, it creates an Ed25519-signed proof containing:

- `iss`: challenge server identifier
- `aud`: Firebase event backend identifier
- `eventId`, `challengeId`, `subject`
- `proofId`: random 128-bit identifier
- `solvedAt`
- `exp`: event redemption grace end

The station stores `proofId`, subject, and timestamp in SQLite, but not the raw flag. It renders the proof as an HTTPS URL QR pointing back to the main app.

`submitChallengeProof` verifies the configured challenge-server public key, audience, event, expiry, subject ownership, and unique `proofId`. A transaction creates at most one reward claim for that participant and challenge.

The proof route must not load third-party analytics, fonts, images, or scripts. The app stores the proof only in memory, immediately replaces the browser URL to remove the `proof` query parameter, then submits it. Raw tickets and proofs are redacted from HTTP, application, analytics, crash, and QR-scanner logs.

## 7. Key ownership

Use two separate Ed25519 key pairs:

| Key | Private-key owner | Public-key consumer |
| --- | --- | --- |
| Challenge ticket signing | Firebase Cloud Function | Local challenge server |
| Completion proof signing | Local challenge server | Firebase Cloud Function |

- Private keys are never copied into browser assets.
- Firebase private keys use Cloud Secret Manager.
- The challenge private key is stored in an OS-protected local secret file readable only by the service account.
- Public keys and key IDs are versioned in event configuration.
- Key rotation creates a new `kid`; old public keys remain valid until outstanding tokens expire.

## 8. Station behavior

- A staff-only reset returns the browser to the ticket-scanning screen and clears session data.
- Each ticket opens a fresh temporary browser profile or equivalent isolated storage context; reset clears cookies, local/session storage, cache, Console, and Network history from the prior session.
- One active participant session is allowed per station browser.
- The station displays no participant name, avatar, UID, or private profile.
- The selected locale comes from the signed ticket and can be changed locally.
- The station shows explicit ticket-expired, already-solved, invalid-signature, and clock-error states.
- A visible privacy notice explains that the station receives only a pseudonymous challenge identity.
- Staff can pause new sessions without invalidating already-issued completion proofs.

## 9. Offline operation

Before doors open, the station must have:

- Challenge static assets
- Event/challenge identifiers
- Firebase ticket-signing public key
- Challenge proof private key
- Challenge HMAC secret
- Correct system time
- Empty or restored SQLite state

The station can verify tickets and issue completion proofs without internet. Participants may scan the proof immediately or before the grace deadline when their phone has internet access.

If the station loses power after issuing a proof, Firebase replay protection still prevents duplicate reward claims. SQLite is backed up before and after the event for troubleshooting, then deleted according to retention policy.

## 10. Network and physical security

- Bind the service to localhost when the browser and server share one machine.
- If multiple station clients are required, bind only to the dedicated event LAN and use an organizer-managed TLS certificate or reverse proxy.
- Do not expose the station directly to the public internet.
- Disable unrelated accounts, file sharing, notifications, password managers, and browser sync on the station.
- Lock access to the desktop outside the intended browser/DevTools experience.
- Keep the machine attended and provide a physical shutdown procedure.

## 11. Testing and acceptance

- Valid, expired, wrong-audience, altered, replayed, and wrong-event tickets are tested.
- The challenge produces different flags for different subjects.
- Sharing a discovered flag does not solve another participant's session.
- The station produces a proof while disconnected from the internet.
- Firebase accepts one valid proof and rejects replay, alteration, expiry, and another participant's proof.
- English and Traditional Chinese challenge paths have equivalent difficulty.
- Resetting the station removes the previous participant's visible and browser-session data.
- The main app removes the proof query parameter before any external request and does not retain the raw proof after import.
- Main event operations continue normally when the station is unavailable.
