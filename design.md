# Design — Blindtest Live

A locked design system for this app. Every page redesign reads this file before emitting code.
Do not regenerate per page — extend or amend this file when the system needs to grow.

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
