# AI Plan

## 1. Chosen Tool and Model
**Tool:** OpenAI Codex  
**Model:** GPT-5.3-Codex

## 2. Team Workflow
We will use a collaborative workflow rather than having one person do all AI interaction.

### Roles
- Driver:
- Prompt Reviewer:
- Tester/Verifier:
- Logger:

## 3. Prompting Strategy
Our prompting approach will emphasize small, well-defined tasks. Additionally we want
to test following every iteration.

### Prompting Rules
- Break work into small increments
- Require modular code, and no magic numbers
- Require JSDoc with type annotations
- Request tests from the AI on each iteration (i.e. generate appropriate tests for this feature)
- Reprompt at least once before manual editing

## 4. Quality Control Strategy
To ensure AI-generated code meets software engineering expectations, we will verify output continuously.

### Checks We Will Run
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

## 5. Manual Editing Policy
We may read and evaluate the code at any time. However, manual editing will not be our default approach. If AI-generated code is incorrect or incomplete, we will first attempt to correct it through additional prompting. Manual edits will only be made after failed AI attempts, and any such edits will be documented in the AI use log.

## 6. Documentation Plan
We will document our work in the repository as follows:
- `plan/raw-research/` for research artifacts
- `plan/research-overview.md` for research summary and team contributions
- `plan/ai-plan.md` for strategy
- `plan/ai-use-log.md` for AI usage entries
- Git commits for code evolution
- `final-report/FINAL-REPORT.md` for final findings

## 7. Success Criteria
We will consider this experiment successful if:
- we build a significantly improved slot machine game
- the codebase is readable, modular, and testable. ensure future maintainability
- linting and tests are used throughout development
- we maintain clear documentation of our AI process