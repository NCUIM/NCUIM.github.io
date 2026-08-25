# Quality and Launch Specification

## 1. Internationalization

### Supported locales

- `en`: English and runtime fallback
- `zh-TW`: Traditional Chinese

Locale resolution order:

1. Saved user preference
2. Supported match from `navigator.languages`
3. Map Traditional Chinese variants such as `zh-Hant` and `zh-HK` to `zh-TW`
4. Fall back to `en`

### Implementation rules

- Store messages in `src/i18n/locales/en.json` and `zh-TW.json` with identical keys.
- Use stable semantic keys, for example `encounter.error.expired`, not English sentences as keys.
- Do not concatenate translated fragments to build sentences.
- Use interpolation and plural rules for dynamic values.
- Use `Intl.DateTimeFormat`, `Intl.NumberFormat`, and `Intl.RelativeTimeFormat` for locale-sensitive output.
- Keep route paths, identifiers, log keys, flag values, and API field names locale-independent.
- Every interactive control has a translated accessible name.
- A CI check fails when locale keys are missing, extra, empty, or contain unresolved placeholders.
- Documentation is English by default. A translated document uses the same base name with `.zh-TW.md`.

### Translation acceptance

- No raw translation key appears in the UI.
- Switching language updates the current screen without losing unsaved profile input.
- English and Traditional Chinese layouts work at 320 CSS px width without clipped actions.
- Reviewers test check-in, profile, encounter, challenge, reward, admin, error, and empty states in both languages.

## 2. Accessibility and mobile UX

- Target WCAG 2.2 AA for participant and admin interfaces.
- Interactive targets are at least 44 by 44 CSS px where practical.
- Text and meaningful UI meet contrast requirements.
- Do not communicate status using color alone.
- Respect safe-area insets and browser chrome on notched devices.
- Support 200% text zoom without blocking primary actions.
- Forms have persistent labels, inline errors, and error summaries when multiple fields fail.
- Focus moves to meaningful content after navigation, dialogs trap focus, and all flows are keyboard operable.
- Loading, success, failure, online, and offline states are announced to assistive technology where appropriate.
- Respect `prefers-reduced-motion`.
- QR and redemption codes have text alternatives and manual-entry fallbacks.

## 3. Browser and device support

Required at launch:

- Safari on the latest two major iOS versions available at the launch freeze
- Chrome on the latest two major Android versions available at the launch freeze
- Current desktop Chrome or Edge for staff/admin

The launch report records the exact tested OS, browser, and device versions. Unsupported browsers receive a localized explanation and a plain link to staff assistance.

Do not depend on Web NFC, in-browser QR scanning, or another non-baseline API for a P0 flow.

## 4. Performance targets

Measured on a representative mid-range phone and throttled 4G profile:

- Landing screen usable within 3 seconds at the 75th percentile after DNS/TLS connection.
- Route transitions provide feedback within 100 ms.
- A server mutation displays pending state immediately and a timeout/retry path after 10 seconds.
- Initial compressed JavaScript target: at most 500 KiB; exceeding it requires a measured justification and route-level lazy loading.
- Final avatar upload: at most 1 MB and 1080 px longest edge.
- Admin lists paginate or virtualize before rendering more than 200 rows.

## 5. Reliability rules

- All trusted mutations are idempotent.
- UI success means the server acknowledged the mutation.
- Retryable and terminal errors are distinguishable and localized.
- Existing data remains intact when image replacement, profile update, or token refresh fails.
- Event state and deadlines use server timestamps.
- Reward redemption and challenge-proof import are online-only. The separate challenge station can verify ticket and flag submissions while offline.
- The previous Hosting release is retained for rollback.
- Feature switches can pause interactions, submissions, and redemption independently.

## 6. Testing strategy

### Unit tests

- Locale resolution and key parity
- Token normalization and expiry helpers
- Pair-key generation
- Image resize/format constraints
- Role and event-state decision helpers

### Emulator integration tests

- Check-in claim and account recovery
- Firestore, Storage, and Realtime Database Rules
- Interaction token issuance and encounter transaction
- Challenge-ticket issuance and participant-bound completion-proof verification
- Reward claim and concurrent redemption
- Suspension, pause, expiry, rate-limit, and inventory behavior

### End-to-end tests

- English and Traditional Chinese participant happy paths
- Staff check-in and redemption
- Self, system, hybrid, and staff-assisted grouping
- Individual/team leaderboard, opt-out, caps, freeze, and score reversal
- Laboratory preference, dry-run, import, publication, and immutable result
- Admin moderation, pause, recovery, and audit trail
- Offline/reconnect and failed image replacement
- Direct navigation to protected participant and admin routes

### Manual device tests

- Native camera opens QR interaction links
- Clipboard, keyboard, safe area, large text, dark/light environment, and screen-reader basics
- Challenge-station desktop browser, DevTools, phone ticket/proof QR handoff, and queue flow
- Offline challenge-station ticket, flag, proof, reset, and later proof import
- NFC tag behavior and QR fallback, if NFC is deployed
- Pixel animation with and without `prefers-reduced-motion`
- QR scanning at the minimum target size under expected venue lighting
- English and Traditional Chinese text fit in every high-fidelity critical-path layout

### Visual regression and review

- Capture participant screens at 320, 390, and 480 CSS px widths in both locales.
- Capture admin monitoring and redemption screens at the supported desktop width.
- Check semantic color contrast, focus indicators, loading, empty, offline, suspended, failure, and success states.
- Confirm body text, forms, avatars, and QR codes are unaffected by decorative pixel filters.
- Confirm the debug route is visually distinct without suggesting real privileged access.
- Any use of official university marks has recorded approval and uses approved source assets without pixel-art alteration.

## 7. CI requirements

Every proposed release must pass:

- Formatting and linting
- TypeScript type checking
- Unit and emulator integration tests
- Locale key parity validation
- Production build
- Security Rules tests
- Secret and credential scan
- Dependency audit with reviewed findings
- Challenge-station build, SQLite migration/self-check, and offline protocol tests
- Laboratory allocator fixture, feasibility diagnostics, signature, and deterministic-result test

Do not deploy from a working tree with uncommitted generated credentials or attendee data.

## 8. Launch configuration to finalize

The demo defaults are recorded in [event-config.example.json](examples/event-config.example.json). The organizer must replace or explicitly approve them before the launch freeze:

- Event ID, public name, date, start/end/grace times, and organizer contact
- Expected attendance and maximum issued check-in codes
- Profile fields and content rules
- Encounter token lifetime and whether encounters affect rewards
- Task definitions and score rules
- Group mode, size limits, deadline, system-fill consent, and public grouping seed procedure
- Leaderboard visibility, opt-out, prize-freeze time, and correction policy
- Flag challenge ID, clue wording, and venue inspection method
- Challenge-station count, hardware, keys, reset procedure, queue limit, and offline fallback
- Reward types, quantities, reservation policy, and redemption desk procedure
- Staff/admin accounts and emergency contacts
- Data retention/export approval
- Firebase project, region, quotas, billing alerts, and App Check enforcement time
- Laboratory mode, real laboratory names/descriptions/capacities, preference deadline, policy version, solver reviewer, and public seed
- Exact supported device/browser matrix
- Replace or explicitly accept the demonstration event name, wordmark, and slogan
- Acquire the approved NCU emblem source file and record its educational-use approval; do not redraw it as pixel art
- Produce the Query Cat sprite and repository-owned functional SVG icon set from the approved palette and font direction
- Signed-off bilingual wireframes and critical-path high-fidelity prototypes

## 9. P0 launch gates

Launch is allowed only when:

1. Every P0 requirement has an owner and passing evidence.
2. Firestore, Storage, Realtime Database, and Functions reject unauthorized access in emulator tests.
3. No production data service is in open test mode.
4. App Check has completed monitor review and is enforced for protected resources.
5. Check-in, encounter, flag, claim, concurrent redemption, recovery, and moderation pass on production-like infrastructure.
6. Grouping, score caps, leaderboard freeze, laboratory dry-run, signed result import, and reproducibility tests pass.
7. The challenge station completes a signed flow while offline and contains no Firebase credentials or participant PII.
8. Both locales pass content, layout, validation, and accessibility review.
9. Required iOS, Android, and admin desktop browsers pass smoke tests.
10. Load testing meets the configured attendance target without correctness failures.
11. Reward inventory, staff roles, budget alerts, rollback, and incident procedures are verified.
12. A staff fallback exists for check-in and redemption if participant devices fail.
13. The visual design artifacts are approved, bilingual critical paths pass visual review, and QR scanning passes under venue conditions.
