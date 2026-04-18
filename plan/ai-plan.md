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

## 3. Research-Based Reqiurements/Critera
Based on our domain and user research, we want the slot machine app to prioritize:
[TODO: add research-based stuff here]

## 4. Prompting Strategy
Our prompting approach will emphasize small, well-defined tasks. Additionally we want
to test following every iteration.

### Prompting Rules/Guidelines
- Break work into small increments
- Require modular code, and no magic numbers
- Require JSDoc with type annotations
- Request tests from the AI on each iteration (i.e. generate appropriate tests for this feature)
- Reprompt at least once before manual editing

(TODO: define a standard prompt template including task, constraints, file targets, testing expectations, and acceptance criteria)

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