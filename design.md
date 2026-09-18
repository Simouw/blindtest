# Design — Blindtest Live

## September 2026 redesign — current decisions

The app is a synchronous music quiz. Prioritize choosing a playlist, hearing the clip, answering, and comparing scores. The original studio-console direction below is historical; these decisions supersede it.

- Two playlist choices, remembered identity and sound settings, no account required.
- Creating a room enters it immediately. Invitation links join existing rooms and clearly report expired rooms. Custom rooms are public in the lobby.
- One two-second ready cue at game start. Four-second reveals go directly to the next song; the host may advance sooner.
- The answer field stays mounted during play and reveal. Enter submits; artist/title progress shows what remains. Each song clears the previous answer state.
- Passing preserves earned points. End early when every player has solved or passed.
- Host-only start and advance; controls transfer when the host leaves.
- Actual playback status, sound testing, autoplay recovery, retry, remembered volume and mute.
- Final scores, the songs played, replay, and another playlist. No forced replay.
- Phone layout puts answering before the scoreboard and chat. Reduced-motion preferences are respected.

### Visual system
Carbon black #050607 is the continuous canvas, with warm white text and orange #ff6a2a as the single interface accent. The interface avoids decorative texture: orange identifies primary actions, progress, focus, and sound. Sections use spacing and divider lines instead of grey containers. The lavender and terracotta typographic playlist covers remain the main card surfaces. The animated SVG sound mark uses solid bars. The quiz stage keeps one stable height across ready, listening, reveal, and results so the interface does not jump between states. Space Grotesk handles headings, Plus Jakarta Sans handles body copy, and scores and timers use tabular figures. Keyboard focus stays explicit and reduced-motion preferences stop the animation.

### Applying the three supplied transcripts
The relevant ideas are sensible defaults, early value, visible progress, personal ownership, feedback, and social competition. Applied through remembered identity, easy room entry, accurate round progress, private answer feedback, shared rooms, and live scores.
The shared 30-second round supplies an honest clock. Additional daily deadlines, streak penalties, fabricated progress, randomized payouts, and background losses do not serve this game. The videos' statistics and universal psychological claims are not treated as established evidence. Retention improvements have not been measured.

### References
- SongPop official site and product listing: music categories and the listening/answering task. https://songpop2.com/ and https://apps.apple.com/us/app/songpop-guess-the-song/id1528066727
- Kahoot: room invitations, explicit host start, late joining. https://support.kahoot.com/hc/en-us/articles/360039422694-How-to-host-a-live-kahoot
- Nielsen Norman Group: visible status, user control, consistency, error recovery, and minimal task-relevant information. https://www.nngroup.com/articles/ten-usability-heuristics/

### Verification boundaries
Automated checks cover round sequencing, score/answer resets, passing, late joins, permissions, host transfer, replay history, timing, track rotation, fuzzy matching, and multiplayer events. Browser checks cover room creation, real media playback, answer feedback, and narrow-screen layout. Audio URLs are external and their availability can change.
Rooms and scores remain in server memory. A disconnection requires rejoining with a new score; the UI explains this. Browser viewport testing does not establish physical iOS/Android behavior.

---

## Original visual direction (superseded)

## Genre
atmospheric / studio-tactile

## Macrostructure family
- Lobby: Hi-Fi Catalog Console (tactile archive modules, technical rotation meters)
- GameRoom: Broadcast Sound Deck (split studio rack, segmented LED countdown, recessed input deck)

## Theme
- `--color-paper`:      oklch(14% 0.006 280);   /* deep charcoal #0d0d10 */
- `--color-paper-2`:    oklch(18% 0.008 280);   /* console deck #14141c */
- `--color-paper-3`:    oklch(22% 0.010 280);   /* elevated module #1a1a24 */
- `--color-rule`:       oklch(28% 0.012 280);   /* precision hairline #262635 */
- `--color-ink`:        oklch(95% 0.005 280);   /* crisp chalk white #f1f5f9 */
- `--color-ink-2`:      oklch(70% 0.010 280);   /* muted technical slate #94a3b8 */
- `--color-accent`:     oklch(62% 0.19 295);    /* soft mauve signal #9370db */
- `--color-accent-dim`: oklch(25% 0.05 295);    /* indicator background */
- `--color-success`:    oklch(68% 0.17 145);    /* signal green for answers */
- `--color-amber`:      oklch(72% 0.16 65);     /* ember flame for streaks */

## Typography
- Display: "Space Grotesk", sans-serif; weight 700; style normal (no italic headers)
- Body:    "Plus Jakarta Sans", sans-serif; weight 400 & 500
- Mono:    "JetBrains Mono", monospace; weight 500 & 600
- Display tracking: -0.03em
- Type scale anchor: text-display = clamp(2.25rem, 4vw + 1rem, 3.75rem)

## Spacing
4-point named scale. Tactile hairlines and structured modules.

## Motion
Minimal, intentional, mechanical. Tactile button states. No floaty bouncy easings.

## Microinteractions stance
- Silent tactile button depression (`transform: translateY(1px)`).
- Strict 8-state discipline for interactive elements.
- Segmented LED meter for remaining time instead of generic continuous bars.

## CTA Voice
- Primary CTA: Solid mauve or high-contrast ink-filled, clean rectangular radius (8px to 12px), bold uppercase or title case.
- Secondary CTA: Muted slate border, dark paper background, crisp mono tag.

## What pages MUST share
- The solid typography logotype (no gradient text).
- Muted charcoal paper palette (`#0d0d10`).
- The 3-tier font discipline (Space Grotesk + Plus Jakarta Sans + JetBrains Mono).
- Restrained accent placement (≤ 5% viewport area).
