# Nishant's Research

Since everyone covered the basics, I'm focusing on what feels underexplored: the moment-to-moment player experience and a few concrete decisions we should make early.

## What Makes a Spin Feel Good

- **Stagger the reel stops.** All three stopping at once feels flat. Reel 1 → 2 → 3 with a slight delay builds suspense even on a loss.
- **Differentiate win sounds.** One generic ding for every win gets tuned out. Small win vs. jackpot should sound meaningfully different.
- **Near-misses look intentional even when they're not** — two matching symbols on the payline, third just above or below. Worth knowing this exists so we can decide whether to lean in or stay neutral.

## Theme + Symbols

Building on Sam's compute-token idea — the reels represent the model's "thought process." The metaphor actually fits: inference is uncertain, outputs vary, compute costs tokens.

- Weights — Jackpot
- GPU — High
- Context Window — Mid
- Hallucination — Low
- Rate Limit — Loss (no payout)

"Rate Limit" as the loss state is good flavor — getting rate limited is exactly what losing feels like.

## 3 Reels, Not 5

Voting 3 reels. Simpler payline logic, cleaner prompts, easier to test. If we want more complexity later, add rows (3x3) rather than more reels.

## Two UX Details

**Show the delta on balance.** Instead of `Balance: 340`, show `Balance: 340 (+40)` — fades after a second. Players shouldn't have to do mental math to know if they won.

**Spin history strip** — last 5–8 results as colored dots (green/red/grey). No numbers, just the pattern. Easy to implement, adds a lot of session feel.

## Prompting Notes

- Lock the pay table as a data object *before* writing any code. Everything downstream depends on it.
- Prompt for one reel animation at a time, then duplicate — don't ask for all three at once.
- Ask AI to explain its symbol weighting before accepting the RNG output. It can drift from intended probabilities silently.

## Edge Cases to Spec Early

- Balance hits 0 → disable spin, show end screen
- Bet exceeds balance → auto-cap or block
- Starting balance suggestion: 200 tokens

## Questions for the Team

1. Auto-spin or manual only for v1? (I'd say manual)
2. Any bonus/free spin mechanic, or single payline only?
3. Who finalizes the pay table? Should happen before any code gets written.