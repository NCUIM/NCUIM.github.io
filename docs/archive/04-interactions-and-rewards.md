# Interactions and Rewards Specification

## 1. Encounter design

QR codes are the required mechanism because current mobile operating systems can open HTTPS QR links without an in-app camera implementation. NFC is an optional equivalent entry point and never the only available path.

## 2. QR encounter flow

### Displaying a QR code

1. The participant opens `/me`.
2. The client calls `issueInteractionToken`.
3. The Function verifies authentication, participant binding, event state, and suspension state.
4. It returns an opaque token valid for two minutes.
5. The client renders `https://<event-host>/meet/<token>` as a QR code and shows its expiration state.
6. The client refreshes only when the current token approaches expiration or the user requests it.

The token must not contain a UID, participant ID, name, score, or HMAC secret.

### Recording an encounter

1. The scanning participant opens `/meet/:token` using the native camera.
2. The app restores or creates the participant's authenticated session.
3. The client resolves a safe preview containing the target display name and avatar.
4. The scanner presses a localized confirmation button.
5. `recordEncounter` validates both participants and the token.
6. A transaction creates the deterministic encounter document and updates progress.
7. Both clients receive the updated state through Firestore listeners.

### Outcomes

The UI distinguishes:

- Success
- Already met
- Own QR code
- Expired or revoked token
- Target or scanner suspended
- Event not active
- Network failure or pending retry

No failure exposes private identifiers. Retrying an acknowledged request returns the same logical result.

## 3. NFC behavior

- NFC uses an NDEF HTTPS URL and enters the same route and server validation flow.
- The product does not call Web NFC APIs for required functionality.
- If organizers issue static NFC badges, they must understand that static URLs can be copied; static NFC must not award security-sensitive points without a second confirmation or server-issued challenge.
- Every NFC interaction has a visible QR fallback.

## 4. Hidden flag challenge

### Learning objective

Introduce basic browser inspection without encouraging attacks on real privileged systems. The intended skills are reading Console output, inspecting `robots.txt`, navigating to an unlinked route, and viewing an API response in the Network panel.

### Station handoff

1. The participant opens `/challenge` in the main app.
2. `issueChallengeTicket` returns a short-lived signed pseudonymous ticket.
3. The app displays the ticket as a QR code.
4. The separate challenge-station browser scans the ticket and starts an isolated personalized session.

### Station discovery path

1. A harmless Console message says that not every local server response appears on screen and mentions robots.
2. The station's `/robots.txt` contains `Disallow: /freshman-debug`.
3. The station's `/freshman-debug` displays a normal localized diagnostic result.
4. The page makes a local request whose response contains the personalized flag in a non-rendered field:

```json
{
  "status": "healthy",
  "latencyMs": 42,
  "_debug": {
    "flag": "IMIS{personalized-value}"
  }
}
```

The route and request are intentionally discoverable. They run only on the isolated station, grant no Firebase access, expose no organizer secret, and return no participant identity.

### Mobile accessibility

The selected solution is an attended desktop challenge station with Chromium DevTools. Participant phones are used only to present the signed ticket and scan the signed completion-proof URL. At least one spare station or documented queue/pause procedure is required.

Detailed protocol, offline operation, keys, and station hardening are normative in [Offline challenge server](08-challenge-server.md).

## 5. Flag and proof submission

1. The participant enters the discovered flag as text at the challenge station.
2. The station trims surrounding whitespace, recomputes the personalized expected flag, and rate-limits failures.
3. A correct flag produces a signed completion-proof URL as a QR code.
4. The participant scans that QR with the phone's native camera, opening `/rewards/proof` in the main app.
5. `submitChallengeProof` verifies signature, audience, event, challenge, expiry, subject ownership, and unused proof ID.
6. A transaction creates the unique reward claim. Re-submission returns the existing claim without creating another reward.

Do not accept screenshots or uploaded images as proof. Firebase never receives or validates the raw flag.

## 6. Redemption

1. A solved participant sees a random one-time redemption QR code.
2. Staff scan it from `/admin`.
3. `redeemReward` validates staff role, event state, token hash, claim status, and inventory.
4. A Firestore transaction marks the claim redeemed and records `redeemedByUid` and server timestamp.
5. The staff screen shows an unmistakable success, already redeemed, invalid, expired, or inventory-exhausted state.

The participant's flag is never required at the gift desk. Staff never manually edit `redeemedAt` from the Firebase console during normal operation.

## 7. Reward inventory

- Inventory is configured per reward type.
- The event declares whether inventory is reserved at solve time or consumed at redemption time; the default is consume at redemption.
- The admin dashboard shows available, reserved, redeemed, and void counts.
- Manual adjustments require an admin, a reason, and an audit log.
- When inventory reaches zero, existing claims follow the configured organizer policy; the client must not promise an unavailable physical gift.

## 8. Visual treatment

- The personal QR is surrounded by a bright pixel quest-card frame, but the QR remains pure dark-on-light with at least a four-module quiet zone and no overlay.
- A successful encounter shows both avatars, a brief pixel connection animation, and a localized plain-language confirmation.
- Activities use quest-log structure and pixel badges without replacing readable instructions.
- The challenge station's hidden debug route is the only full dark terminal surface.
- A solved challenge uses an `ACHIEVEMENT UNLOCKED` treatment, while redemption instructions remain conventional and explicit.
- Reduced-motion users receive the same confirmation through static icon, text, and state changes.
- Detailed tokens and screen rules are normative in the [Visual design specification](07-visual-design.md).

## 9. Localization and content

- Clues preserve equivalent meaning and difficulty in English and Traditional Chinese.
- Technical literals such as `/robots.txt`, route paths, header names, JSON keys, and flag values are not translated.
- The challenge page, submission errors, and redemption status are localized.
- Organizers review both language paths to ensure one translation does not accidentally reveal a later clue.

## 10. Acceptance scenarios

- Two valid participants create one encounter and cannot duplicate it.
- A participant cannot meet themselves or use an expired token.
- Sharing a valid flag or signed proof does not help a different participant.
- Repeated proof submissions return one claim.
- Two staff devices scanning the same reward code produce exactly one successful redemption.
- The complete challenge is solvable at the offline station in both locales, and station failure does not block the mixer.
- Pixel decoration never reduces QR scanning reliability, text readability, or the clarity of success and failure states.
