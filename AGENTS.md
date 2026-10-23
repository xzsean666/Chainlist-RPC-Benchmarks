# AGENTS.md

## Project Working Guidelines

This repository follows the AI Agent Development Protocol defined in the repository prompt.

### 1. Source of Truth
- `AGENTS.md`: Repository conventions and agent rules
- `docs/AI/GOAL.md`: Overall project objective
- `docs/AI/TASK_INDEX.md`: Index of tasks and their statuses
- `docs/AI/SESSION_STATE.md`: Real-time session state and handoff context
- `docs/AI/ARCHITECTURE.md`: Technical architecture and data flow
- `docs/AI/DECISIONS.md`: Architectural decision records (ADR)
- `docs/AI/tasks/TASK-xxx.md`: Individual granular task specifications

### 2. Core Principles
1. One Goal and one Task at a time per session.
2. Keep tasks focused, atomic, and testable.
3. Output the pre-modification plan before making code changes.
4. Update `SESSION_STATE.md` before concluding each session.
5. All verification must be based on actual command execution output.

### 3. Account & Environment Rules
- Repository path: `/ssd0/git/Chainlist-RPC-Benchmarks` -> GitHub CLI account must be `xzsean666`.
- Package manager: `npm` with Node 20+.
