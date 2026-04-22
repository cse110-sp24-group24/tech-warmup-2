# FINAL REPORT

## 1. The Process & Approach

### Initial Strategy: The `skills.md` Foundation
We began our project by heavily investing in the Research & Planning phase. We documented domain jargon, visual themes, and user personas in our `raw-research` directory. We synthesized this into a foundational `skills.md` file. 

For **Entry 01**, we used a single overarching prompt: *"Read through our skills.md. Implement the slot machine based on everything in this markdown strictly as we specified."* This allowed the LLM to generate the entire architectural baseline of the app. 

We successfully integrated complex features like an auto-spin system, audio contexts, and a completely separate physics-based mini-game ("Flappy Blob") entirely through AI prompting. 

---

## 2. Data & Usage Overview

Over the course of our development, we logged **24 distinct interaction turns**. 

* **Token Scaling:** As the codebase grew, context window demands skyrocketed. We started at ~15,000 to ~50,000 tokens per prompt in the early stages (Entries 01-10). By the time we implemented the Flappy Blob mini-game and customized the UI (Entries 22-24), our token usage peaked at over **113,000 tokens per prompt**.
* **Time Taken:** Initial codebase generation took 6m 42s. As the context grew, generation times fluctuated between 2 to 4.5 minutes.
* **Verification:** The AI was remarkably consistent at generating code that passed W3C HTML/CSS validators and basic linters/tests. However, **manual app checks failed frequently** (Entries 01, 12, 13, 14, 15, 16) due to logical bugs or broken UI connections that linters could not catch.

---

## 3. Addressing the Learning Goals

### What challenges are we likely to run into when using AI to build SWE-quality software?
1. **Persistent State Management Bugs:** The AI struggled significantly with state logic. A double-deduction display bug (where the bet was subtracted twice in the UI) persisted from Entry 01 all the way to Entry 09. The AI could not "see" the bug conceptually until we provided a highly precise, step-by-step pseudo-code breakdown of the balance ownership in our prompt (Entry 05).
2. **"Blind" Overwrites:** When asked to add audio in Entry 12, the AI unexpectedly broke all buttons and reverted the background. It frequently lost track of previous context if not explicitly reminded. 
3. **Merge Conflicts & Tooling:** In Entry 17, a teammate's concurrent work resulted in severe merge conflicts. The AI is oblivious to version control states outside of its immediate context. We had to dedicate an entire prompt (Entry 18) purely to debugging and repairing the broken functionality post-merge.

### How important is research to developing the software model?
Research was critical. Without our initial domain research and the `skills.md` file, the AI would have hallucinated standard, generic slot rules. By defining the rules, symbols, payouts, and project structure beforehand, we forced the AI into our architectural constraints rather than letting it dictate the architecture to us.

### How do planning and precision directly influence outcomes?
Vague prompts yielded poor results. When we asked the AI to "add cheerful default music" (Entry 12), it broke the UI and provided terrible audio. When we gave precise instructions regarding the physics and state of the Flappy Bird game—specifically outlining that it must pause the slot game, open in a modal, and require a spacebar press to start (Entry 20)—the AI executed the logic almost flawlessly. **The AI writes code exactly as precisely as the prompt it is given.**

### How is user and domain-centered thinking required for success?
Our persona and user story research dictated our feature roadmap. Realizing users would get bored of a simple RNG spinner, we prioritized interactivity. We added a shop with payout boosts (Entry 06), a "Flappy Blob" mini-game for skill-based token recovery (Entry 19), and engaging UI feedback (confetti, custom cursors, light/dark mode themes). The AI can write the code, but the *human engineers* must decide what brings value to the user.

### How are team norms and discipline required for good outcomes?
Entries 17 and 18 were our hardest lessons in team discipline. Generative AI makes it easy to generate hundreds of lines of code in seconds. When multiple team members do this concurrently without strict branch management and communication, massive merge conflicts occur. AI accelerates the coding process, which means it also accelerates the creation of technical debt and repository conflicts if team norms are not strictly enforced.

### If and how AI will be used in our team's software engineering process going forward
Moving forward, we view AI as a powerful **tactical implementer**, but a poor **strategic architect**. 
* We **will** use AI to rapidly prototype boilerplate, generate unit tests, write JSDocs, and scaffold UI components.
* We **will not** rely on AI to independently manage complex global state or fix nuanced async logic without heavy human oversight. 
AI requires a human "driver" who understands the codebase well enough to write highly targeted, localized prompts to fix specific functions.

---

## 4. Key Findings & Discussion

* One of our most distinct observations was the AI's tendency to break an existing, working feature while trying to implement a new one. For example, implementing audio (Entry 12) broke the spin buttons. Adding a shop boost caused balance calculation errors (Entry 06). Comprehensive automated testing (like Playwright E2E tests) is an absolute necessity when using AI, as manual regression testing every feature after every prompt is unscalable.
* By Entry 24, we were feeding the AI over 100k tokens per prompt just to change text colors. While this ensured the AI had the full picture of the codebase, it is computationally inefficient. In a real-world scenario, we would need to learn how to compartmentalize our code better so we can pass the AI smaller, isolated modules (e.g., just passing `shop.js` instead of the whole app).
* If an edge case is not explicitly mentioned (e.g., what happens to auto-spin if the user runs out of tokens in Entry 05), the AI will ignore it or write logic that crashes the app. The developer must think through all edge cases *before* prompting.

## 5. Conclusion
We learned that AI does not replace software engineering fundamentals; rather, it makes them more important. Clean code, DRY principles, modularity, and strict version control are the only things that prevent an AI-assisted codebase from collapsing under its own weight. We are walking away from this warm-up with a shared understanding of how to safely, cleanly, and effectively leverage LLMs as coding co-pilots for our upcoming projects.
