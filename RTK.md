# RTK - Runtime Toolkit for LMS Mr Ole

Agent framework integrating Superpowers + Ponytail for structured development workflow.

## Agent Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Workflow** | Superpowers | Structured SDLC: brainstorm → plan → execute → review |
| **Code Quality** | Ponytail | Minimal code, YAGNI, reuse existing patterns |
| **Execution** | OpenCode subagents | Parallel task execution |

## Superpowers Workflow

### Phase 1: Brainstorming
- Before writing code, clarify requirements
- Ask: "What are you really trying to do?"
- Present design in digestible chunks

### Phase 2: Planning
- Create git worktree for isolation
- Write micro-task plan with verification steps
- Break down into atomic units

### Phase 3: Execution
- Use subagents for parallel work
- Each task has clear success criteria
- Verify after each unit

### Phase 4: Review
- Code review before completion
- Check for over-engineering (Ponytail lens)
- Verify tests pass

## Skill Integration

### From Superpowers
- `brainstorming` - Requirement clarification
- `writing-plans` - Task breakdown
- `executing-plans` - Parallel execution
- `test-driven-development` - TDD workflow
- `systematic-debugging` - Debug methodology
- `verification-before-completion` - Quality gates

### From Ponytail
- YAGNI - Does this need to exist?
- Reuse - Already in codebase?
- Stdlib first - Native before custom
- Minimal code - Shortest working diff

## Tool Mapping (Superpowers → OpenCode)

| Superpowers Action | OpenCode Tool |
|-------------------|---------------|
| Create todo | `todowrite` |
| Dispatch subagent | `task(subagent_type="general")` |
| Invoke skill | `skill` tool |
| Read file | `read` |
| Edit file | `edit` |
| Run command | `bash` |
| Search | `grep`, `glob` |

## When to Use Each Workflow

| Request Type | Workflow |
|--------------|----------|
| New feature | Brainstorm → Plan → Execute → Review |
| Bug fix | Debug → Fix → Verify |
| Refactor | Assess → Plan → Execute → Review |
| Quick fix | Direct execution (skip brainstorm) |

## Verification Checklist

Before marking task complete:
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] No new dependencies added unnecessarily
- [ ] Code follows Ponytail ladder (minimal, reused, stdlib)
- [ ] Changes match existing patterns
