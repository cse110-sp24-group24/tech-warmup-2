# Itai Lavi's Research Notes

---

## Skills.MD Implementation

A `skills.md` file is implementable by creating a structured markdown file that Codex can read. Codex will parse the metadata and follow the instructions defined within it.

### Key Principles for a Skills File

- Write instructions in **plain English** for Codex to follow.
- Use the file to **define slot machine logic explicitly**, instead of relying on randomly generated logic.
- Control and direct the **UI design**, rather than letting Codex decide.
- Enforce **clean, legible, and well-structured code** (no unnecessary complexity or “slop”).
- Specify **animations and additional features** clearly.

### Purpose

The `skills.md` file gives you:
- More **control over development**
- More **precision in defining behavior**
- A way to **guide the LLM**, instead of letting it make assumptions

---

## MCP Files (Model Context Protocol)

An **MCP (Model Context Protocol)** is a way to allow Codex (or any AI agent) to communicate with external tools and services in a structured manner.

### Example Tool Definition (JSON)

```json
{
  "name": "getLeaderboard",
  "description": "Fetch top players",
  "parameters": {}
}
