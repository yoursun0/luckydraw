# Lucky Draw — Spec

> Derived from grilling session, 2026-08-09.  
> Updated with multi-round support and auto-generated participants.  
> Visual direction validated via prototype: **Variant C — Particle Galaxy** chosen.

## Architecture

| Decision | Answer |
|---|---|
| App structure | Single Next.js web app: setup page → fullscreen display. One device, projected. |
| Multi-tenancy | Anyone configures and runs draws. Generic, fits all contexts. |
| Tech stack | Next.js 16 + PixiJS + Framer Motion + Tailwind CSS. Deploy Vercel. |

## Mechanics

| Decision | Answer |
|---|---|
| Participants | 3–1000 per session. Can be named or auto-generated numbers. |
| Rounds | 1–N rounds per session (e.g., 10 prizes, each is a round) |
| Winners per round | 1–N, configurable (e.g., 2 people win each prize) |
| Winner filter | If ON, winners from previous rounds are excluded from future rounds. If OFF, same person can win multiple rounds. |
| Draw trigger | One click per round. No buildup, no wheel. |
| Reveal | Instant — all winners for this round appear at once. |
| Winner display | All winners at once per round, spring-physics settle. Previous rounds' winners remain visible on screen (accumulated). |

## Visual direction

| Decision | Answer |
|---|---|
| Aesthetic | Celestial/cosmic — stars, particles, light |
| Inspiration | Daiki Fujita (daiki-design.com) — particle responsiveness, morphing, idle behavior, restrained palette |
| Rejected | Spinning wheel (distracts from winner), long buildup (wastes time) |
| Color palette | **Restrained cosmic:** deep space black (`#020208`) + cool blue particles (`#5090ff` → `#80c0ff`) + warm gold winners (`#ffd700`). No purple nebula, no rainbow. Two-color discipline. |
| Pre-draw screen | Living particle galaxy of all **eligible** participants — gentle spiral rotation. Particles respond to cursor position (attract/swirl). After ~30s of idle cursor, galaxy enters "sleep" state: rotation slows, particles dim. Cursor movement wakes it. |
| Reveal transition | Galaxy rotation accelerates → particles collapse toward center → winning particles **morph** from tiny dots into luminous gold name cards (~1.2s). Non-winners fade. Winner cards materialize with a ~200ms pixel-dissolve texture. |
| Post-reveal | Winners from this round join the accumulated winners display. Eligible pool shrinks (if filter ON). Galaxy reforms with remaining participants, cursor-interactive again. |
| Winner cards | Names/numbers + any custom fields. Spring-physics settle. Golden glow. |

## Data input

| Decision | Answer |
|---|---|
| Methods | Textarea paste (names, one per line), CSV upload, manual add, **auto-generate by count** |
| Auto-generate | Host enters a number (e.g., 100) → system creates entries "1", "2", …, "100". No names needed. |
| Smart detection | If pasted text looks like a simple number list (all numeric), treat as generated. If commas/tabs present, detect columns. |
| Participant fields | Identifier (name or number, required) + optional custom fields (ticket #, department, photo, etc.) |

## User flow

```
SETUP PAGE                              DISPLAY PAGE (fullscreen, projected)
┌──────────────────────────┐           ┌──────────────────────────────────────┐
│ Event title              │           │                                      │
│                          │           │   Round 1 of 10                      │
│ Participants:            │           │   Living particle galaxy             │
│  [100]  ← just a number │           │   (100 particles, spiral rotation)    │
│  or paste 100 names     │           │   Cursor attracts particles ▸         │
│                          │           │   Idle 30s → sleep mode 🌙           │
│ Rounds:       [10]      │  ──►───→  │                                      │
│ Winners/rd:   [2]       │  "Start"  │   ┌──────────────────────────┐       │
│ Winner-filter: [ON]     │           │   │ Host clicks "Draw"       │       │
│                          │           │   │ → Galaxy collapses       │       │
│ [Start] ─────────────────┘           │   │ → Particles morph into   │       │
│                                      │   │   "Peter" & "Mary" cards │       │
│                                      │   │   (pixel-dissolve 200ms) │       │
│                                      │   └──────────────────────────┘       │
│                                      │                                      │
│                                      │   Round 2 of 10                      │
│                                      │   Galaxy reforms with 98 particles   │
│                                      │   (Peter & Mary removed)             │
│                                      │                                      │
│                                      │   [Draw] → next 2 winners            │
│                                      │   ...repeat 10 rounds...             │
│                                      │                                      │
│                                      │   Round 10 complete.                 │
│                                      │   All 20 winners shown. Done.        │
└──────────────────────────┘           └──────────────────────────────────────┘
```

## Pages

### 1. Setup page (`/`)
- **Event title** — text input
- **Participant entry** — flexible input:
  - Textarea: paste names (one per line) or just a single number to auto-generate
  - CSV upload tab (structured data with custom fields)
  - Manual add button
  - Preview: shows count + first few entries
- **Rounds** — number input (default: 1)
- **Winners per round** — number input (default: 1)
- **Winner filter** — toggle (default: ON). When ON, winners cannot win again.
- **"Start" button** → transitions to fullscreen display

### 2. Display page (fullscreen)
- **Pre-draw (per round):** Particle galaxy of eligible participants. Round indicator (e.g., "Round 3 of 10"). Accumulated winners from previous rounds displayed subtly (sidebar or constellation corner).
  - **Cursor interaction:** Particles gently attract toward or swirl around the cursor position. Feels alive and responsive. Works naturally with a mouse on the host laptop or a laser pointer on a projected screen.
  - **Idle behavior:** After ~30s of no cursor movement, galaxy enters "sleep": rotation slows to near-static, particles dim to ~40% brightness. On cursor movement, wakes instantly (spring-physics snap back to full brightness/speed).
- **Draw trigger:** "Draw" button + keyboard shortcut (Space/Enter). Triggers reveal for current round.
- **Reveal animation** (~1.2s): Galaxy rotation accelerates → particles collapse toward center → winning particles **morph** from dots into luminous gold name cards. Pixel-dissolve texture (~200ms) as cards materialize. Non-winning particles fade out briefly then fade back in to reform the filtered galaxy.
- **Post-reveal:** This round's winners prominently displayed with golden glow. Previous winners remain visible but distinct. If more rounds remain, galaxy reforms with filtered pool, cursor-interactive again, and "Draw" button reappears with updated round number.
- **Final state:** All rounds complete. All winners displayed as golden constellation. "New Draw" button returns to setup.

## State machine

```
IDLE ──[Start]──→ PRE_DRAW ──[Draw]──→ REVEALING ──[done]──→ ROUND_COMPLETE
                    ↑   ↑                                         │
                    │   └──[next round, pool > 0]─────────────────┘
                    │                                             │
                    └──[all rounds done or pool empty]──→ FINISHED
```

Per-round state:
- `PRE_DRAW` — galaxy of eligible participants rotating. Round N of M shown.
- `REVEALING` — collapse → burst animation (~1.2s)
- `ROUND_COMPLETE` — winners displayed. If rounds remain → back to PRE_DRAW with filtered pool + incremented round counter.

## Component tree

```
App
├── SetupPage
│   ├── EventTitleInput
│   ├── ParticipantEditor
│   │   ├── QuickCountInput (auto-generate from number)
│   │   ├── TextareaTab (default: paste names)
│   │   ├── CsvUploadTab
│   │   └── ParticipantPreview (count badge + first 5 names)
│   ├── RoundConfig (rounds, winners/round, winner-filter toggle)
│   └── StartButton
│
└── DisplayPage (fullscreen)
    ├── RoundIndicator ("Round 3 of 10")
    ├── GalaxyCanvas (PixiJS)
    │   ├── ParticleSystem (spiral, eligible only, cursor-responsive)
    │   ├── CursorForceField (attract/swirl particles toward pointer)
    │   ├── IdleBehavior (sleep/wake on cursor inactivity)
    │   ├── CollapseAnimation (accelerate → contract to center)
    │   └── MorphReveal (particle dots → name cards, ~200ms pixel-dissolve)
    ├── WinnerCards (Framer Motion, spring-physics)
    │   ├── CurrentRoundWinners (prominent, animated)
    │   └── PreviousWinners (accumulated, subtle)
    ├── DrawButton (overlay, Space/Enter)
    └── ProgressBar (rounds completed / total)
```

## Out of scope (for now)

- Google Sheets live sync
- Multi-language support
- Sound effects
- Winner export / history persistence
- Authentication / saved draws
- Separate display URL (single-device projection is sufficient)
