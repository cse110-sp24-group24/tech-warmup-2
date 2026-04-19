# Sam's Research

**The "Currency":**
* Instead of dollars or coins, the currency could be "Compute Tokens" or "Compute Credits". 
* Every spin costs X Compute Tokens. 
* "Warning: You are running out of compute!"

**UI/UX thoughts (just some ideas to think about):**
* It should look a bit "techy" or cyberpunk, maybe dark mode with neon green text (like an old terminal).
* When you lose, instead of a standard "Try Again," it should say something like: *"As an AI language model, I cannot let you win this spin."*
* When you win, it should say: *"Prompt perfectly optimized. Payout generated."*

**Slot symbol ideas:**
Instead of cherries and 7s, what if the symbols were:
* A "GPU" (High value)
* "ChatGPT Logo" or just "LLM"
* "StackOverflow" (Low value)
* "Syntax Error" (Bad)

**Potential prompt alteration ideas
* **Spin Button/Lever:** The trigger. (Maybe we can animate a CSS lever?)
* **Bankroll/Balance:** How many tokens the user has left.
* **RNG (Random Number Generator):** The math behind the scenes that makes sure it's actually random.
* **Volatility:** How often it pays out vs. how big the payouts are. (High volatility = rare big wins. Low volatility = frequent small wins).

**Technical considerations (the SWE part)
* **HTML/CSS:** Needs to be semantic and responsive. We can't just have a giant block of `<div>`s. 
* **JavaScript:** We definitely need to split the logic (here are my ideas): 
    * One class/module for the **UI/Animation** (spinning the reels).
    * One class/module for the **Game State/Math** (RNG, calculating payouts, tracking the balance).
    * If we ask the AI to "build a slot machine," it will probably dump it all in one massive function just like the first test. We need to prompt it to build the Math Module first, THEN the UI module.
* **Testing:** We need to write unit tests for the Game State/Math module.

## Articles / Inspiration I looked at
I was looking around to see how actual slot machines are coded in JS to see what we should be asking the AI for.
* *How to Build a Slot Machine Game with JavaScript:* (Just a generic tutorial, but it showed me that using CSS `transform: translateY()` is the best way to animate the reels spinning smoothly, rather than swapping images).
* *Understanding Slot Machine Math:* (Made me realize we need a "Pay Table" object in our JS to define what combinations win what amounts).

## Questions to ask the whole team
1.  Are we using 3 reels or 5 reels? (I think we should use 5 just to stand out.).
2.  Who is writing the tests? Do we have the AI write the tests first (Test Driven Development)?
