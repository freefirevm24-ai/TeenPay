# Design Brief

## Direction

Neon Vault — a Gen-Z meme-money arcade where fake rupees feel like arcade tokens, not banking.

## Tone

Playful maximalist dark-mode: chunky type, glass panels, and loud color executed with conviction.

## Differentiation

Amounts rendered as glowing arcade scoreboards with a coin-flip motion language, not bank statements.

## Color Palette

| Token      | OKLCH (dark)   | Role                            |
| ---------- | -------------- | ------------------------------- |
| background | 0.15 0.03 315  | Near-black plum canvas          |
| foreground | 0.96 0.01 320  | Primary text                    |
| card       | 0.2 0.035 315  | Glass panel base                |
| primary    | 0.68 0.26 340  | Neon magenta — CTAs, send       |
| accent     | 0.85 0.22 130  | Electric lime — money, received |
| muted      | 0.26 0.04 315  | Inactive surfaces               |
| warning    | 0.84 0.16 82   | Warm amber — celebration, coins |
| destructive| 0.66 0.23 22   | Errors, deductions              |

## Typography

- Display: Bricolage Grotesque — headings, balance figures, card titles
- Body: Plus Jakarta Sans — labels, body copy, buttons
- Mono: Geist Mono — amounts, roll numbers, transaction IDs
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl md:text-4xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Glassmorphism is the depth system: translucent panels over ambient blurred orbs, with `shadow-glass` and inset highlights instead of flat drop shadows.

## Structural Zones

| Zone    | Background              | Border         | Notes                                  |
| ------- | ----------------------- | -------------- | -------------------------------------- |
| Header  | `glass` sticky top      | `border-b`     | Balance chip + avatar, blurred backdrop |
| Content | `bg-background` + orbs  | —              | Alternating `glass` cards on canvas    |
| Footer  | `glass` bottom nav      | `border-t`     | Thumb-reach nav, active pill in primary |

## Spacing & Rhythm

Spacious 6/8-unit section gaps, tight 2/3-unit card internals, pill-shaped controls for a bouncy arcade rhythm.

## Component Patterns

- Buttons: full-pill, `gradient-primary` for send, `gradient-cash` for receive, `active:scale-95` press
- Cards: `rounded-3xl` glass panels with `shadow-glass`, neon gradient borders on featured cards
- Badges: pill chips, lime for incoming, magenta for outgoing, amber for streaks

## Motion

- Entrance: `animate-fade-up` staggered 60ms per item, `animate-pop-in` for modals
- Hover: lift + `shadow-pop` at 180ms with spring easing
- Decorative: floating orbs (`animate-float-slow`), coin spin on transfers, pulse-ring on QR scan, confetti burst on big transfers

## Constraints

- Dark mode is the primary experience; light tokens exist but are secondary
- Virtual money only — never imply real payment or banking
- No raw color literals in components; semantic tokens only
- No group transfers, bill splitting, or closed-app push notifications

## Signature Detail

The balance reads as a glowing arcade scoreboard with a spinning coin glyph — money as play, not finance.
