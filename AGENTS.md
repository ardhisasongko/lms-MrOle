# LMS Mr Ole - Agent Instructions

## Agent Stack

This project uses two complementary frameworks:

1. **Superpowers** - Structured SDLC workflow (brainstorm → plan → execute → review)
2. **Ponytail** - Minimal code philosophy (YAGNI, reuse, stdlib first)

## Core Principles

### Before Writing Code (Superpowers + Ponytail)

1. **Brainstorm** - Clarify requirements before coding
   - Ask: "What are you really trying to do?"
   - Present design in digestible chunks
   - Get explicit approval before proceeding

2. **Plan** - Create structured task breakdown
   - Use git worktree for isolation (if complex)
   - Write micro-task plan with verification steps
   - Break down into atomic units

3. **Execute** - Minimal code (Ponytail ladder)
   - Does this need to exist? (YAGNI)
   - Already in codebase? Reuse it
   - Stdlib does it? Use it
   - Native platform feature? Use it
   - One line? Make it one line
   - Only then: minimum code that works

4. **Verify** - Quality gates before completion
   - Build passes
   - Tests pass
   - No unnecessary dependencies
   - Matches existing patterns

## Tool Usage

### For New Features
```
1. skill(name="brainstorming") - clarify requirements
2. skill(name="writing-plans") - create task breakdown
3. todowrite - track progress
4. task(subagent_type="general") - parallel execution
5. skill(name="verification-before-completion") - quality check
```

### For Bug Fixes
```
1. skill(name="systematic-debugging") - diagnose root cause
2. Fix minimally (Ponytail: root cause, not symptom)
3. Verify fix with tests
```

### For Refactoring
```
1. Assess current state
2. skill(name="writing-plans") - plan changes
3. Execute with subagents
4. skill(name="requesting-code-review") - review
```

## Code Style

### Ponytail Rules
- No unrequested abstractions
- No new dependencies if avoidable
- No boilerplate
- Deletion over addition
- Fewest files possible
- Shortest working diff

### Quality Standards
- Input validation at trust boundaries
- Error handling that prevents data loss
- Security measures
- Accessibility basics
- Test coverage for non-trivial logic

## Project Structure

```
lms-MrOle/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Route pages
│   ├── services/       # API service layer
│   └── utils/          # Utility functions
├── e2e/                # Playwright E2E tests
├── functions/          # Serverless functions
├── supabase/           # Database migrations
└── scripts/            # Build & automation scripts
```

## Existing Patterns

- **Services**: `src/services/*.js` - API calls wrapped in functions
- **Hooks**: `src/hooks/*.js` - React hooks with mutations
- **Components**: `src/components/common/*.jsx` - Reusable UI
- **Pages**: `src/pages/**/*.jsx` - Route components

## Verification Commands

```bash
npm run build          # Build check
npm run lint           # Lint check
npm test               # Run tests (vitest)
npm run test:e2e       # Run Playwright E2E tests (mobile + desktop)
npm run test:lighthouse # Run Lighthouse CI audit
npm run fix:auto       # Run auto-fix script
```

## Known Issues

### Librarian Agent Model Error (2026-07-27)

**Error:**
```
ProviderModelNotFoundError: Model not found: opencode/gpt-5-nano
Did you mean: gpt-5-nano, gpt-5.4-nano?
```

**Root Cause:** The built-in `librarian` agent is configured to use `opencode/gpt-5-nano` which doesn't exist. Correct model ID is `gpt-5-nano`.

**Fix Applied:** Added agent override in `opencode.json`:
```json
"agent": {
  "librarian": {
    "model": "gpt-5-nano"
  }
}
```

**⚠️ IMPORTANT:** Config changes require **restart opencode** to take effect. Running sessions keep using old config.

**Workaround:** Use `websearch` directly instead of delegating to librarian agent.
