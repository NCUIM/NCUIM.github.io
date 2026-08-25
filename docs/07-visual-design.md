# Visual Design Specification

## 1. Direction

The approved direction is **NCUIM Pixel Quest**: a bright 16-bit campus adventure built on a modern, accessible mobile interface.

The visual balance is approximately:

- 80% clean contemporary mobile UI for reading, forms, navigation, and administration
- 20% pixel-inspired accents for quests, badges, progress, encounters, celebrations, and the hidden flag

The product must feel welcoming and social before it feels technical. It is not a dark hacker simulator, a CRT recreation, or a school administration portal.

## 2. Design principles

1. **Friendly before technical:** freshmen should understand the next action without learning game terminology.
2. **Game language as motivation:** quests, levels, badges, and unlock moments make interaction playful but never obscure system state.
3. **Pixel accents, modern controls:** decorative surfaces may be pixel-inspired; text fields, dialogs, navigation, and tables remain familiar and accessible.
4. **One special world:** the hidden debug route may use a stronger terminal treatment while the main app stays bright.
5. **Real people stay clear:** avatars and uploaded photos are never intentionally pixelated or degraded.
6. **Bilingual by construction:** English and Traditional Chinese must fit the same responsive component system.

## 3. Brand and legal boundary

The palette below is an event palette, not a claim that it reproduces NCU's official standard colors.

The organizer has confirmed educational-use permission for the official NCU emblem and school identity. Use source assets from the [NCU Brand Identity guidance](https://www.ncu.edu.tw/p/412-1000-98.php?Lang=en) and retain an internal record of that approval.

- Use the official emblem unmodified as a small institutional trust mark on the landing and About surfaces.
- Do not redraw, animate, recolor, or recreate the NCU emblem in pixel art.
- Keep the event wordmark visually separate: `NCUIM / FRESHER QUEST 2026` and `中大資管 / 新生任務 2026`.
- Do not imply that the activity app is an official academic or administrative system.
- Keep official assets and event assets in separate directories and tokens.

## 4. Color system

### 4.1 Approved P0 event palette

| Token | Value | Primary use |
| --- | --- | --- |
| `color-canvas` | `#F7F5EE` | Warm main background |
| `color-surface` | `#FFFFFF` | Cards, sheets, and forms |
| `color-ink` | `#172033` | Main text, borders, and hard shadows |
| `color-primary` | `#3157C8` | Primary actions, links, selected navigation |
| `color-star` | `#FFD45A` | Quest highlights, badges, celebrations |
| `color-success` | `#55CFA5` | Confirmed encounters and completed tasks |
| `color-danger` | `#CC3D4A` | Destructive actions and failures |
| `color-muted` | `#667085` | Secondary text |
| `color-terminal` | `#101522` | Hidden debug-page background |
| `color-terminal-text` | `#B9F6CA` | Hidden debug-page foreground |

These are the frozen P0 implementation values. Verified reference pairs are: canvas/ink 14.91:1, surface/ink 16.27:1, primary/white 6.31:1, star/ink 11.48:1, success/ink 8.41:1, danger/white 4.85:1, surface/muted 4.97:1, and terminal/terminal-text 14.84:1. Interactive state variants still require automated contrast checks when implemented.

### 4.2 Usage rules

- Use warm canvas and white surfaces for the participant experience.
- Use `color-primary` for one dominant action per screen.
- Use yellow as a highlight, never as small body text on white.
- Use success and danger colors with an icon and text label; color alone never communicates state.
- Reserve the dark terminal palette for the challenge station's `/freshman-debug` and small diagnostic elements.
- Do not apply global CRT overlays, scanlines, chromatic aberration, or persistent glitch effects.
- QR codes remain pure dark-on-light with no palette substitution.

## 5. Typography

### 5.1 Functional text

- Use self-hosted [`Noto Sans TC`](https://github.com/notofonts/noto-cjk) at weights 400, 500, and 700, followed by system UI and sans-serif fallbacks.
- Body text starts at 16 CSS px with a Traditional Chinese line height of at least 1.5.
- Inputs must not use text smaller than 16 CSS px on iOS, avoiding automatic zoom.
- Numeric status, timestamps, and tables may use tabular numerals.

### 5.2 Pixel display text

- Use the self-hosted [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font) `zh_hant` build for short bilingual display labels, level numbers, counters, and celebratory text.
- Pixel fonts are not used for paragraphs, instructions, validation, buttons with long labels, or admin tables.
- Traditional Chinese defaults to Noto Sans TC except for reviewed decorative phrases. Subset the pixel font to shipped strings and preserve its OFL license notice.
- Decorative phrases such as `WELCOME, PLAYER`, `CONNECTED!`, and `ACHIEVEMENT UNLOCKED` always have a localized plain-language explanation nearby.

Both selected families permit open educational use under their published open-font terms. Font files are self-hosted; no runtime request to a remote font CDN is required.

## 6. Shape, spacing, and elevation

- Use a 4 px base unit and compose normal layout spacing in 8 px increments.
- Participant cards use an 8 px corner radius, 2 px `color-ink` borders, and an optional `4px 4px 0` hard shadow.
- Buttons use an 8 px radius and must retain a familiar pressed, disabled, loading, and focus state.
- Small tags and badges may use a 4 px radius.
- The debug surface may use square corners.
- Avoid rounded cards nested inside rounded cards; use spacing and dividers for hierarchy.
- Hard shadows are decorative and disappear in dense admin tables or reduced-visual-complexity contexts.

## 7. Iconography and imagery

- Pixel icons use a consistent 16 px or 24 px source grid and integer scaling.
- Use pixel icons for quests, stars, gifts, connection, locks, badges, and decorative arrows.
- Use conventional recognizable icons for navigation, settings, language, close, delete, camera, and accessibility-critical controls.
- Do not mix multiple unrelated pixel-art styles.
- Raster pixel assets use nearest-neighbor scaling only at integer multiples.
- Avatars use a crisp game-card frame but preserve the original processed photo quality.
- Decorative art must not reduce text contrast or overlap QR quiet zones.
- The guide mascot is **Query Cat / 查詢貓**: a small navy pixel cat with a yellow cursor-shaped tail. It appears in onboarding, empty states, quest hints, and the challenge handoff, but never in consent, destructive confirmation, or admin incident screens.
- Functional icons are repo-owned SVG assets with hard-edged pixel geometry. Query Cat uses a repo-owned 32×32 PNG sprite sheet rendered at integer scale with `image-rendering: pixelated`; its short motions use CSS `steps()` rather than a game engine.

## 8. Participant layout system

- Optimize the primary flow for 320–480 CSS px viewport widths.
- Center participant content in a maximum-width 480 px column on wider screens.
- Respect top and bottom safe-area insets.
- Keep the primary action within comfortable thumb reach when possible.
- Use a maximum of four persistent bottom-navigation destinations:
  - Home
  - Activities
  - My QR
  - Rewards
- Profile and language settings are accessed from the avatar/header area.
- One screen should have one visually dominant action.
- Empty, loading, failure, offline, suspended, and completed states receive designed layouts rather than raw text placeholders.

## 9. Screen treatments

### 9.1 Landing and check-in

- Use a bright title panel and short event explanation.
- Present language selection before or alongside check-in.
- Make the check-in action visually dominant.
- Explain that the experience is a web app and does not require installation.
- Consent content remains plain and readable, without game language that hides its meaning.

### 9.2 Home

- Use a short localized welcome message.
- Show a `Quest Log` card with the next recommended action.
- Show profile completion, encounter count, and reward state as separate readable modules.
- The main CTA is contextual, such as completing the profile or displaying the personal QR.

### 9.3 Profile

- Present the profile as a digital character card without implying an official student ID.
- Show a clear avatar-edit affordance and upload progress.
- Keep editable fields in conventional form controls.
- Interest tags may use pixel badges but remain readable in both locales.

### 9.4 Personal QR

- Render the QR code at a target size of at least 240 CSS px when the viewport permits.
- Preserve a quiet zone of at least four QR modules.
- Do not overlay logos, avatars, gradients, textures, rounded modules, or animation on the QR itself.
- Frame the code with pixel corners and show a visible expiration countdown outside the quiet zone.
- Provide brightness guidance and a manual-link fallback.

### 9.5 Encounter confirmation

- Clearly show the target avatar and display name before confirmation.
- On success, show both avatars with a short pixel connection animation and `CONNECTED!` treatment.
- Also display a localized plain-language confirmation.
- Already-met, self-scan, expiry, and failure states have distinct icons and text, not just colors.

### 9.6 Activities

- Use a quest-log hierarchy: available, active, completed, and locked.
- Progress bars and badges may use pixel styling while labels and instructions remain modern text.
- Locked tasks explain their unlock condition when disclosure is allowed.

### 9.7 Groups

- Present each group as a party card with alias, member slots, target size, and lock state.
- The create/join action remains conventional; invite QR and fallback code follow the same clean scan rules.
- Empty member slots use Query Cat prompts rather than fake people.
- System-assigned groups explain that the seed-based process avoids sensitive personal traits.

### 9.8 Leaderboard

- Use separate individual and team tabs with clear frozen/live state.
- Show rank, alias, score, and update time without exposing hidden roster information.
- The public opt-out control uses plain privacy language rather than a game penalty.
- Top-rank pixel decoration must not make lower-ranked participants appear to have failed the event.

### 9.9 Laboratory preferences and reveal

- Preference entry uses reorderable ranked cards with an accessible button alternative to drag-and-drop.
- Capacity and eligibility information remain plain, localized text.
- The draw ceremony may animate sealed pixel cards, but the result is precomputed and the animation cannot alter it.
- The result screen shows assigned laboratory, preference rank received, group state, and the exact allocation-run reference.
- Consequential allocations remove celebratory ranking language and use a neutral private result surface.

### 9.10 Hidden debug route

- The challenge station's `/freshman-debug` is the only screen allowed to use the full dark terminal palette.
- Use monospace functional text; a pixel font remains optional decoration.
- A subtle cursor or step animation is allowed, but no continuous flicker or unreadable glitch effect.
- The page must still meet contrast, reduced-motion, keyboard, and screen-reader requirements.
- The stronger style must not imply that the page grants privileged system access.

### 9.11 Rewards

- A successful solve uses an `ACHIEVEMENT UNLOCKED` panel and pixel gift icon.
- The actual claim state and redemption instructions use plain localized language.
- The redemption QR follows the same strict QR rendering rules.
- Already-redeemed and unavailable states are visually clear without shaming the participant.

### 9.12 Admin

- Use neutral white/gray surfaces, compact tables, filters, and clear hierarchy.
- Pixel styling is limited to small status icons, badges, and the event identity.
- Operational states prioritize speed and clarity over decoration.
- Success and failure screens at the redemption desk use large text, icon, and color together.

## 10. Motion and feedback

- Standard transitions last 120–240 ms.
- Use step-based motion only for short unlock, connection, and reward moments.
- Do not use infinite decorative animation on operational screens.
- Avoid rapid flashing, screen shake, fake error glitches, or animation that blocks the next action.
- Every animation has a static equivalent when `prefers-reduced-motion` is enabled.
- Haptic feedback is not required because browser support varies; visible feedback is authoritative.

## 11. Responsive and bilingual behavior

- Design English and Traditional Chinese together; do not treat one locale as a later translation pass.
- Components allow labels to wrap to two lines without clipping.
- Do not set fixed widths based on English text.
- Pixel display labels may be replaced by functional sans-serif when the translation is too long.
- Test at 320 px width, 200% text zoom, and long localized content.
- User-generated content wraps safely and cannot shift controls outside the viewport.

## 12. Dark mode

Full-app dark mode is P2 and is not required for the event MVP. The debug route has its own dark treatment. If full dark mode is later approved, it requires a complete semantic-token palette and separate QR contrast testing; automatic color inversion is forbidden.

## 13. Required design artifacts

Before implementation freeze, create and approve:

- One moodboard showing the bright campus-RPG direction
- Event wordmark or text lockup with usage rules
- Final color and typography tokens
- Pixel icon starter set
- Mobile wireframes for landing/check-in, home, profile, QR, encounter, activities, challenge ticket/proof, and rewards
- Desktop challenge-station wireframes for ticket scan, browser challenge, proof QR, reset, and errors
- Group creation/joining, leaderboard, laboratory preference, draw reveal, and assignment-result wireframes
- Desktop wireframes for participant monitoring and reward redemption
- High-fidelity prototypes for the encounter and redemption critical paths
- English and Traditional Chinese content samples in the same layouts

## 14. Design decisions still required

- Replace the approved placeholder event name, slogan, and dates if organizers choose different production copy
- Produce the approved Query Cat sprite sheet, icons, illustrations, and motion assets
- Final navigation labels and information architecture after wireframe testing
- Venue lighting conditions and minimum tested QR display size
- Full-app dark-mode decision after P0 launch
