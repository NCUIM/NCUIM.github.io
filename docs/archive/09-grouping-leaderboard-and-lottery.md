# Grouping, Leaderboard, and Laboratory Lottery Specification

## 1. Scope and policy boundary

This specification supports three related but distinct features:

1. Temporary social groups for mixer activities
2. Individual and team leaderboards for event engagement
3. Assignment or drawing of laboratory stations

The default laboratory mode is an **event station lottery** using placeholder laboratory names. If the result affects a formal academic opportunity, research placement, course choice, or other consequential allocation, leaderboard score has zero influence and the organizer must approve a separate fairness policy before collecting preferences.

## 2. Default demonstration assumptions

- 120 participants
- Social groups of 4–6, target size 5
- Hybrid group formation: preserve valid self-formed groups, then assign remaining participants
- Four placeholder laboratory stations with 30 seats each
- Ranked preferences from first to fourth choice
- One published final allocation run
- Individual and team leaderboards visible during the event
- Leaderboard placement does not change laboratory assignment probability

These values are replaceable event configuration, not claims about the real cohort or laboratories.

## 3. Social group lifecycle

Group states:

```text
forming -> locked -> active -> completed
             |         |
             v         v
          cancelled  dissolved-by-admin
```

- A participant belongs to at most one active social group.
- Default minimum size is 4, target size is 5, and maximum size is 6.
- A group has a public event alias, short join code, QR invite, leader, member list, state, and timestamps.
- Join codes are random, short-lived, rate-limited, and invalid after the group locks.
- Group membership is private to participants in the event; public leaderboards show aliases rather than member rosters.

## 4. Formation modes

### 4.1 Self-formed

1. A participant creates a group and becomes leader.
2. The app shows a join QR and short fallback code.
3. Other checked-in participants preview the group alias and join.
4. The leader may lock a valid group before the deadline.
5. Leaving a locked group requires staff assistance.

### 4.2 System-assigned

The system assigns ungrouped participants using a published seed:

1. Freeze the eligible participant list.
2. Compute feasible group sizes between 4 and 6, preferring size 5.
3. Seed and shuffle participants deterministically.
4. Greedily place participants to minimize repeated encounter pairs and balance group size.
5. Do not use gender, age, nationality, academic score, disability, or inferred sensitive traits.
6. Produce a preview and diagnostics for admin approval.
7. Publish once; post-publication changes are audited staff actions.

### 4.3 Hybrid — default

- Preserve self-formed groups that meet the size rules.
- Optionally fill an unlocked self-formed group only when its leader opted into system fill.
- Assign all remaining participants through the system algorithm.
- If the final remainder cannot satisfy minimum size, rebalance only unlocked groups and show the proposed changes before publication.

### 4.4 On-site staff grouping

Staff may create a group for people standing together by scanning participant cards or having participants scan one table QR. The same size, uniqueness, lock, and audit rules apply.

## 5. Placeholder scoring model

The demonstration individual score is capped at 100:

| Action | Points | Limit |
| --- | ---: | ---: |
| Complete public profile | 10 | Once |
| Meet a unique participant | 5 | First 10 people, maximum 50 |
| Complete `Conversation Combo` | 15 | Once |
| Complete `Team Sync` | 15 | Once |
| Complete the offline network challenge | 10 | Once |

Only server-authoritative events change score. Duplicate encounters, self-interactions, hidden profiles, or client-submitted score values do not award points.

Team score avoids rewarding larger teams:

```text
teamScore = round(average(memberIndividualScore)) + teamMissionPoints
```

Team mission points are capped at 50. A team must have at least four active members to appear in ranked results unless an admin records an approved exception.

## 6. Leaderboard behavior

- Provide separate individual and team tabs.
- Show event alias, avatar or team icon, score, rank, and last score update.
- Participants can opt out of public ranking while retaining private progress and reward eligibility.
- Suspended or withdrawn participants are removed from public ranking.
- Ties share the same displayed rank; time-to-score is not a hidden tie-breaker for prizes.
- Freeze the prize leaderboard at a configured timestamp and publish the freeze time in advance.
- Late event corrections remain visible in audit history but do not silently change awarded prizes.
- Admins can hide the leaderboard without disabling scoring.

Leaderboard data may be used to sequence the on-stage reveal—for example, the highest-ranked team presses the draw button first—but the displayed order does not alter precomputed laboratory results.

## 7. Laboratory modes

### 7.1 Event station lottery — default

Use when laboratories are temporary visit stations or tea-party activities. Groups or individuals submit ranked preferences. The assignment is optimized under capacity constraints and revealed with a game-like draw animation.

The leaderboard does not affect the default assignment. If organizers later enable a leaderboard bonus, it must be documented before scoring begins, apply only to a non-consequential event activity, and have a strict published cap.

### 7.2 Consequential academic allocation

Use when the assignment affects a formal learning or research opportunity.

- Leaderboard and social-activity score have zero influence.
- Participation in the mixer cannot improve or reduce academic placement odds.
- Criteria, capacities, preference handling, tie-breaks, appeals, and reruns require organizer approval before preference collection.
- Only necessary identity fields are used, and results are disclosed privately unless policy says otherwise.

## 8. Preference collection

- Admins configure laboratories, capacity in seats, localized descriptions, eligibility, and accessibility constraints.
- Participants or locked groups rank available laboratories before the deadline.
- Group preferences are submitted by the leader and require member acknowledgement.
- A participant can review and change preferences until the deadline.
- Missing preferences follow a disclosed policy; the default is treat all unranked laboratories equally below ranked choices.
- The final submission time and preference snapshot hash are recorded.

## 9. Allocation algorithm

Use a small Python runner with [Google OR-Tools CP-SAT](https://developers.google.com/optimization/assignment) only for the laboratory allocation run. The solver is justified by indivisible groups, variable group sizes, capacities, ranked preferences, and hard constraints.

Decision variable:

```text
x[unit, lab] = 1 when an individual or intact group is assigned to a lab
```

Hard constraints:

- Every eligible unit is assigned exactly once unless total capacity is insufficient.
- Assigned seats do not exceed laboratory capacity.
- Locked groups remain intact when group allocation is enabled.
- Explicit eligibility and approved accessibility constraints are honored.

Placeholder preference values:

| Preference | Utility |
| --- | ---: |
| First | 100 |
| Second | 60 |
| Third | 30 |
| Fourth | 10 |
| Unranked | 0 |
| Unassigned | -10000 |

Preference utility and unassigned penalty are multiplied by the number of participants in a unit, so a six-person group represents six participants rather than one oversized ballot.

Objective order:

1. Minimize unassigned participants.
2. Maximize total preference utility.
3. Minimize the number receiving an unranked choice.
4. Apply a published seeded random tie-break among equal optima.

The final run uses a fixed seed, one solver worker, and pinned solver/algorithm versions to make the result reproducible.

The solver must report infeasible inputs, unused seats, unassigned units, preference distribution, and objective value. Admins correct configuration rather than silently splitting a group or relaxing a hard constraint.

The runner signs its frozen-input hash, result hash, algorithm version, seed, and run ID with a dedicated Ed25519 key. Its private key stays with the offline runner; Firebase stores only the corresponding public key and key ID. This key is separate from both challenge key pairs.

## 10. Reproducibility and publication

Every allocation run stores:

- Run ID and algorithm version
- Mode and policy version
- Frozen participant/group snapshot hash
- Laboratory/capacity snapshot hash
- Preference snapshot hash
- Public random seed
- Solver status and diagnostics
- Result hash
- Creator, reviewer, and timestamps

Workflow:

```text
draft configuration
  -> freeze inputs
  -> dry run
  -> admin review
  -> final run
  -> publish
```

Published results are immutable. A correction creates a new run linked to the previous run, records a reason, and clearly notifies affected participants.

## 11. Data model additions

### `groups/{groupId}`

- `eventId`, localized alias, leader participant ID
- member participant IDs
- formation mode, system seed
- state, join-code hash, timestamps

### `groupInvites/{inviteHash}`

- group ID, expiry, maximum uses, revoked timestamp

### `scoreEvents/{scoreEventId}`

- participant ID, optional group ID
- rule ID, points, source reference, server timestamp
- idempotency key and reversal reference

### `leaderboardSnapshots/{snapshotId}`

- scope, frozen time, ranked aliases and scores, source watermark

### `labPreferences/{eventId_unitId}`

- unit type and ID
- ranked lab IDs, member acknowledgements
- submitted timestamp and version

### `allocationRuns/{runId}`

- frozen hashes, seed, algorithm/policy version
- status, diagnostics, result hash, audit metadata

### `labAssignments/{eventId_unitId}`

- run ID, unit ID, lab ID, rank received, publication timestamp

## 12. Required trusted operations

- `createGroup`, `joinGroup`, `leaveGroup`, `lockGroup`
- `previewAutoGrouping`, `publishAutoGrouping`
- `recordScoreEvent`, `reverseScoreEvent`
- `createLeaderboardSnapshot`
- `submitLabPreferences`, `freezeAllocationInputs`
- `importAllocationResult`, `publishAllocation`

The OR-Tools runner receives a frozen pseudonymous input file and returns a signed result file. It does not receive Firebase credentials or participant names. A Firebase admin operation validates the runner signature and input/result hashes before importing assignments.

## 13. Admin controls

- Configure group sizes, deadlines, mode, and system-fill consent.
- Preview group balance and repeated-pair diagnostics.
- Move a participant with a required reason before activity start.
- Configure scoring rules and leaderboard visibility before scoring begins.
- Freeze and export prize leaderboard snapshots.
- Configure laboratory capacities, preference deadline, allocation mode, and policy version.
- Run validation and dry-run allocation before final publication.
- Pause publication without deleting preferences or results.

## 14. Acceptance criteria

- No participant belongs to two active groups.
- Hybrid grouping respects valid self-groups and assigns every feasible remaining participant.
- Running system grouping twice with identical inputs and seed returns identical groups.
- Score events are idempotent and cannot exceed configured caps.
- Team score is not increased merely by adding more members.
- Public leaderboard opt-out does not remove private progress.
- Allocation never exceeds laboratory capacity or silently splits a locked group.
- Identical frozen inputs, algorithm version, and seed reproduce the same result.
- A published result identifies the exact run and policy used.
- Consequential allocation ignores every leaderboard and mixer score field.
