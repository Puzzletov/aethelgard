# Agent guidance for this repository

Read ARCHITECTURE.md before any change. Follow its constraints, phases, and coding standard exactly. Do not skip ahead to a later phase.

Purpose: concise, machine-actionable rules to help AI coding agents be productive and safe.

Quick start
- Read: [ARCHITECTURE.md](ARCHITECTURE.md#L1-L400) before proposing any code or config change.
- Stop and ask a human for approval before any code, dependency, or CI change.

Core rules
- No persistence: do not write user files or results to permanent storage.
- No external access: agents must not access the internet, run shells, or read arbitrary files.
- Schema-first outputs: return only the project's Pydantic schema for agent replies; on schema mismatch, retry ≤3, then return a labelled Safe Mode error.
- Tests required: include tests for any code change; do not propose merging without tests and a passing run.
- Dependency process: add a row to the dependency register in [ARCHITECTURE.md](ARCHITECTURE.md#L1-L400#L9) before introducing a new dependency.
- Language: use simplified technical English (`en-basiceng`) for user-facing text and documentation.
- Security: follow the security & privacy rules in [ARCHITECTURE.md](ARCHITECTURE.md#L1-L400); avoid adding cryptography or native-code deps without an audit note.

Where to look
- Primary: [ARCHITECTURE.md](ARCHITECTURE.md#L1-L400) (single source of truth).
- Recommended: add or check `README.md`, dependency manifests (`pyproject.toml`, `requirements.txt`, `package.json`), `tests/`, and `.github/workflows/`.

Suggested next customizations
- Create a short `README.md` with quick build/test commands and a minimal developer checklist.
- Optionally add `.github/copilot-instructions.md` for role-specific details if frontend and backend diverge.

If unsure, pause and ask a repository maintainer for clarification.
