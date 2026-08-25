# Admin and Operations Specification

## 1. Back-office approach

The admin interface is a responsive `/admin` area in the same Ionic React application. It shares authentication and typed Firebase access but uses desktop-friendly tables and filters. A separate admin project is not required for the event MVP.

The admin surface uses the same semantic color and typography tokens as the participant app, but keeps white/gray surfaces and dense conventional controls. Pixel styling is limited to event identity, small icons, and status badges; it must not slow scanning, filtering, check-in, or redemption.

## 2. Roles

| Capability | Participant | Staff | Admin |
| --- | ---: | ---: | ---: |
| View own profile/progress/claim | Yes | No | Yes |
| View operational participant list | No | Yes | Yes |
| Check in participant | No | Yes | Yes |
| Redeem reward | No | Yes | Yes |
| Hide public profile/avatar | No | Yes | Yes |
| Recover account binding | No | Assisted request | Yes |
| Suspend participant | No | No | Yes |
| Change event state/configuration | No | No | Yes |
| Adjust inventory or void claim | No | No | Yes |
| Create on-site group / assist join | No | Yes | Yes |
| Configure or publish automatic grouping | No | No | Yes |
| Configure scoring / freeze leaderboard | No | No | Yes |
| Freeze or publish laboratory allocation | No | No | Yes |
| View audit logs | No | Limited own actions | Yes |

Roles are Custom Claims. Admin assignment requires an out-of-band privileged script or controlled function and cannot be self-service.

## 3. Dashboard

The default dashboard shows:

- Event state and feature switches
- Expected, checked-in, active, suspended, and withdrawn participant counts
- Online, offline, stale, and unknown presence counts
- Profile completion and hidden-profile counts
- Encounter totals and recent activity
- Ungrouped participants, group-size distribution, and grouping deadline
- Individual/team leaderboard state and prize-freeze time
- Laboratory preference completion and allocation-run status
- Flag solved count
- Reward available, claimed, redeemed, void, and inventory-exhausted counts
- Current Firebase error, function failure, and cost/usage warnings when available

Counts must identify their time window and definition. Presence is operational context, not proof that a person is physically present.

## 4. Participant list

Staff can search or filter by approved operational fields:

- Display name
- Participant ID or check-in reference
- Check-in/profile state
- Online/stale state and last confirmed time
- Encounter and activity status
- Flag solved and reward redemption status
- Moderation or suspension state
- Group alias, leaderboard opt-out, and laboratory preference/assignment state

The list does not expose raw flags, check-in codes, redemption tokens, or unrelated personal information.

## 5. Required staff actions

### Check-in

- Scan or enter a one-time code.
- Confirm the intended participant before binding.
- Clearly report consumed, expired, revoked, or invalid codes.

### Moderation

- Hide or restore a public profile/avatar.
- Require a reason.
- Preserve the participant's event history.
- Notify the participant with a localized generic message.

### Reward redemption

- Scan the participant's redemption QR.
- Display reward type and participant display name before confirmation.
- Return a high-contrast, unambiguous result suitable for a busy desk.
- Use large icon, text, and color together for success, duplicate, invalid, expired, and inventory-exhausted results.

### On-site grouping

- Create a table group and show its join QR.
- Add participants by scanning anonymous participant cards.
- Report duplicate membership, full group, locked group, and deadline errors.
- Escalate post-lock movement to an admin.

## 6. Required admin actions

- Start, pause, resume, and end the event.
- Independently disable interactions, flag submission, or redemption.
- Suspend or restore a participant.
- Rebind a participant to a new authenticated UID after verification.
- Revoke active interaction and redemption tokens.
- Void or restore an unredeemed claim according to policy.
- Adjust reward inventory with a reason.
- Export the minimal operational or redemption audit.
- Trigger or verify retention cleanup.
- Configure group size/deadline/mode, preview system grouping, and publish reviewed groups.
- Configure score rules before scoring begins, hide/show leaderboards, and freeze prize snapshots.
- Freeze laboratory inputs, inspect allocation diagnostics, import the signed solver result, and publish one immutable run.

Every privileged mutation records actor, action, target, reason, and server timestamp.

## 7. Presence interpretation

- `online`: Realtime Database currently reports a connection.
- `offline`: an acknowledged disconnect exists.
- `stale`: last activity exceeds the configured threshold while connection data is inconclusive.
- `unknown`: no reliable status has been recorded.

Default stale threshold is five minutes. The UI shows `lastChanged` or `lastActionAt` rather than implying physical attendance.

## 8. Account recovery

1. Staff verifies the attendee using the original physical check-in evidence and event procedure.
2. The attendee opens a fresh authenticated session on the replacement browser.
3. An admin confirms the old participant record and new UID.
4. `recoverParticipantBinding` atomically changes ownership, revokes active tokens, and logs the action.
5. The old UID loses access; the new UID sees existing progress and claims.

Staff must not solve recovery by issuing a second participant identity.

The default physical evidence is the anonymous participant card serial plus the organizer's offline handoff roster. The app does not store the attendee's student number or roster identity.

## 9. Event runbook

### Before the event

- Confirm event dates, time zone, expected attendance, check-in codes, tasks, reward policy, inventory, retention, and organizer contact.
- Generate `expected attendance + 10` anonymous participant cards, test QR/fallback codes, and prepare the offline handoff roster.
- Verify staff/admin claims on the actual production site.
- Enable billing alerts and review Firebase quotas.
- Load test at `max(200, 2 × expected attendees)` simulated clients for the critical flows.
- Test both locales on target iOS and Android devices.
- Print or prepare QR/NFC material and its QR fallback.
- Verify the hidden challenge is solvable using the selected venue method.
- Test the challenge station disconnected from the internet and verify signed proof import after reconnection.
- Run grouping preview and the laboratory allocation fixture; record the final policy and public seed procedure.
- Export a staff contact and incident procedure that does not depend on this app being online.

### During the event

- Monitor check-in failures, Function errors, presence staleness, reward inventory, and abnormal request rates.
- Monitor ungrouped participants, leaderboard anomalies, preference completion, and challenge-station queue length.
- Pause only the affected capability where possible.
- Record manual decisions in audit notes.
- Do not edit authoritative Firestore fields directly except under the documented emergency procedure.

### After the event

- End interactions and submissions using server-side event state.
- Freeze/export leaderboard results and publish laboratory assignments only from the reviewed final run.
- Complete the configured redemption grace period.
- Export minimal redemption audit if required.
- Revoke staff access that is no longer needed.
- Run and verify retention cleanup.
- Review cost and error reports, then disable unused paid resources.

## 10. Incident priorities

1. Prevent unauthorized access or duplicate redemption.
2. Preserve participant and claim integrity.
3. Keep check-in and redemption available.
4. Restore encounters and optional activities.
5. Restore presence and nonessential analytics.

If integrity is uncertain, pause the affected feature and use the audited staff fallback rather than guessing or directly editing records.
