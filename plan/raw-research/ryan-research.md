# Ryan's Slot Machine Research

**General Mechanics**

- A slot machine at its core is just an RNG, with each spin completely independent from the last.
- Casino games have an RTP (return to player) under 100% over the long run; designers can tune RTP and symbol weights to hit a target.
- Volatility defines how often and how large wins are: low volatility means frequent small wins; high volatility means rarer, larger wins.
- Losing spins on slot machines are often designed to _look_ close. That display has no reliable relationship to how “close” you were to winning; each spin is still random.
- Losses disguised as wins (LDWs) are outcomes where the machine celebrates or flashes “win” even though the payout is less than the cost of the spin. That affects how “winning” the session feels even when the balance goes down, and can influence the player.

**UI Considerations**

- Keep a paytable or one click away so users know what symbols pay before they spin.
- Show balance, bet per spin, and\*net result so small wins are not confused with profit.
- Clear bet controls. Let user determine how much they want to incremenet or decrement their bet. Min and Max can be decided before hand for lower or higher stakes
- Have animation both both big and small wins. Emphasize big wins heavier

**Prompting Considerations**

- Implement core game logic first (RNG, paytable, scoring, balance rules), then layer UI and animation so behavior is correct before polish.
- Prompt AI to generate test cases and unit tests so we can verify each part works individually and toegether
- Manually consider edge cases so AI doens't miss them (low balance, no balance)
- Include error handling


**Technical Aspects**

- Comparmentalize one folder/file to deal with all the internal logic of our slot machine (RNG part)
- Compartmentalize our frontend into componenets so that we can alter each part in isolation

**Key Takeaways**

- Audience drives feel and rules; align UI with the personas we chose.
- Separating internal workings from UI/design keeps the slot machine maintainable and matches how we want to use AI (small, testable steps).

**Potential Features/Considerations**
- With the user in mind, could when potentially allow them to log into their account? -> save earnings and profile information in database and load up within login.
