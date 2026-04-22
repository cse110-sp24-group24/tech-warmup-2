# AI Plan

## 1. Chosen Tool and Model

**Tool:** OpenAI Codex  
**Model:** GPT-5.3-Codex

## 2. Team Workflow

We will use a collaborative workflow rather than having one person do all AI interaction.

(TODO: Might want to delete this section)

### Roles

- Driver:
- Prompt Reviewer:
- Tester/Verifier:
- Logger:

## 3. Research-Based Criteria

Based on our domain and user research, we want the slot machine app to prioritize:

- **Accurate and understandable game logic.** The game should use clear RNG-based logic, a defined paytable, and well-scoped payout rules so the core mechanics are easy to reason about, test, and maintain.
- **A clear theme with consistent symbols and feedback.** Our research points toward an AI/cyberpunk-inspired concept with themed symbols, UI copy, and outcome states that make the game visually distinct without becoming confusing.
- **Strong user feedback and readability.** Important information such as balance, current bet, and recent result should always be visible, and the game should provide distinct visual/audio feedback for normal wins, large wins, and losses.
- **A modular engineering approach.** The project should be built in small, separated parts, especially keeping core state/game logic separate from UI/animation logic, so AI-generated code is easier to verify and refine.
- **Incremental testing and controlled scope.** Research suggests that we should define key rules early, test edge cases as features are added, and avoid overcommitting to stretch features before the MVP is stable.

## 4. Prompting Strategy

Our prompting approach will emphasize small, well-defined tasks. Additionally we want
to test following every iteration.

### Prompting Rules/Guidelines

- Break work into small increments
- Require modular code, and no magic numbers
- Require JSDoc with type annotations
- Request tests from the AI on each iteration (i.e. generate appropriate tests for this feature)
- Reprompt at least once before manual editing

### Standard Prompt Template

For each AI-assisted task, we will try to structure prompts using the following format:

**Task:**  
Describe the specific feature, bug fix, refactor, or testing needed.

**Context:**  
Briefly explain the current state of the project, relevant game behavior, and any important background from earlier work.

**Requirements / Constraints:**

- Keep the change small and focused
- Use modular, readable JavaScript
- Avoid magic numbers
- Include JSDoc with type annotations
- Preserve existing behavior unless the prompt says otherwise
- Do not introduce unnecessary features or layout changes

**Testing Expectations:**

- Generate or update appropriate unit tests for this feature
- If relevant, suggest or update Playwright tests
- Ensure the code is written so it can be linted and tested cleanly

**Acceptance Criteria:**  
List the exact conditions the output must satisfy.

**Output Instructions:**  
Ask for code changes only for the requested scope, plus a short explanation of what was changed and why.

## 5. Quality Control

To ensure the generated code meets software engineering expectations, we will verify it
after each iteration involving a feature add or bug fix.

### Tests We Will Run

- ESLint
- HTML validation
- Unit tests
- Playwright tests
- Manual readability review

### Code Quality Standards

- Meaningful names
- No repetitive code (DRY)
- Error handling
- Modularity

## 6. Manual Editing Policy

We may read and evaluate the code at any time. However, manual editing will not be our default approach. If AI-generated code is incorrect or incomplete, we will first attempt to correct it through additional prompting. Manual edits will only be made after failed AI attempts, and any such edits will be documented in the AI use log.

## 7. Documentation Plan

We will document our work in the repository as follows:

- `plan/raw-research/` for research artifacts
- `plan/research-overview.md` for research summary and team contributions
- `plan/ai-plan.md` for strategy
- `plan/ai-use-log.md` for AI usage entries
- Git commits for code evolution
- `final-report/FINAL-REPORT.md` for final findings

## 8. Success Criteria

We will consider this experiment successful if:

- we build a significantly improved slot machine game
- the codebase is readable, modular, testable, and maintainable
- linting and tests are used throughout development
- we maintain clear documentation of our AI process
