# Shubhi's Research

## Technical Structure

- Keep game logic separate from UI
  - `gameLogic.js` → handles RNG, payouts, rules
  - `app.js` → handles UI and interactions
- This separation makes debugging and testing easier
- Avoid tightly coupling animation with logic

## Overall Design and User Experience

- The slot machine should feel visually engaging but not super overwhelming. A lot of real examples lean heavily into flashing visuals, but too much can make the UI confusing.
- The slot area itself should be the main focus of the screen since that’s where the user’s attention is during gameplay.
- Smooth animations are important, especially during spins and when results are revealed. Even small delays or staggered reel stops can make the experience feel more intentional.
- Feedback should be very clear. The user should always know:
  - their current balance
  - their bet amount
  - whether they actually won or lost overall

## Player Experience and Intent

- **More “casino-like”**
  - Lower chance of winning
  - Bigger emphasis on anticipation and tension
  - Simpler feature set (focus on core spinning mechanic)

- **More for fun**
  - Higher chance of winning
  - Extra features like power ups, shops, and bonus rounds
  - More visually rewarding even for smaller wins

- For this project, a hybrid approach makes the most sense
  - We keep randomness and unpredictability
  - But still include fun elements, like bonuses or power-ups, to make the game more engaging

## Features and Ideas

- **Power-ups / Shop**
  - Temporary boosts (5x spin multiplier)
  - Encourages users to stay engaged and spend tokens strategically

- **Bonus / Recovery Systems**
  - Mystery chest or redemption system when balance reaches 0
  - Helps prevent the game from feeling like it just “ends”

- **Auto spin**
  - Useful for pacing and convenience
  - Needs clear feedback so users don’t lose track of results

- **Visual Feedback**
  - Confetti, background music, flashing lights, or effects for wins
  - Stronger effects for bigger wins vs smaller ones

## Game Logic Considerations

- Each spin should be independent (true RNG behavior)
- The outcome should be determined before animation plays, so visuals are just displaying the result
- Balance handling must be consistent:
  - deduct bet once
  - apply winnings once
  - avoid duplicate updates
- The game should never allow:
  - negative balance
  - softlocks, especially in edge cases like 0-token outcomes

## UI and Information Design

- Important information should always be visible like balance, bet, and the result of last spin
- The paytable should be easy to access
- Messages should reflect actual outcomes, especially for auto spin (net gain/loss instead of per-spin messages)

## Testing and Edge Cases

- Test for:
  - balance never going below zero
  - correct payout calculations
  - proper stopping of auto-spin when needed
  - bonus flows overriding normal gameplay when triggered
- Edge cases to consider:
  - balance = 0
  - selecting a 0 reward option
  - interrupted animations or errors mid-spin

## Takeaways

- Clarity and responsiveness matter more than just visual effects
- A good balance between randomness and user reward keeps the game engaging
- Structuring the code cleanly is important, especially since we are iterating with AI tools
- Thinking about edge cases early helps avoid bugs like softlocks later on
