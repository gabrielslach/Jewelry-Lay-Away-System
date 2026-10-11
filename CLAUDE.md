# Mine Credit — jewelry lay-away SPA

React + Vite SPA. Specs live in `specs/` (`demo.html` is the visual/interaction source of truth; `epics.md` holds approved changes, latest approved epic wins).

Commands: `npm run dev` (mock API), `npm test` (Vitest), `npm run lint` (ESLint), `npm run format`.

# Three-agent workflow

For every implementation, the **parent** (the main Claude session) runs this loop using the subagents in `.claude/agents/`.

1. **`ux` (spec):** only when the task changes anything user-visible (layout, copy, styling, flow). For logic-only work, the parent states "no visual change" and skips this step.
2. **`developer`:** implements against the ux spec (passed verbatim by the parent). Ends with a short summary: changed files and user-visible screens affected.
3. **`ux` (review):** only if user-visible output changed. The parent passes the developer's summary and, if available, a screenshot path at mobile width.
4. **`reviewer`:** PASS/FAIL on the real git diff against the Code quality rules below. Does not implement.

Looping: on FAIL, send only the must-fix items back to `developer`, then re-run only the agent(s) that failed — re-run `ux` only if the fix touched UI. Stop after **3 loops** and report remaining issues to Gabriel instead of continuing.

When both pass, present findings and wait for Gabriel. The reviewer is not a merge gate.

Do not commit or push unless Gabriel explicitly asks.

# Code quality

Prioritize **readability** over cleverness. Smallest clear implementation. No speculative helpers, unused props, or comments that restate the code.

## Components

- Extract a reusable component when the same UI or interaction appears more than once (buttons, cards, modals, tables, form rows, badges). That extraction is in scope, not an extra refactor.
- Keep components focused: one job. Prefer composition (`children`, `className`) over a large variant API.
- Pages compose primitives; they do not duplicate markup.

## Tests

- Every new or materially changed **component**, **page**, and **service** needs a unit test.
- All tests live under `test/`, mirroring `src/`: `src/components/Foo.jsx` → `test/components/Foo.test.jsx`. No `*.test.*` files next to source.
- Use Vitest + Testing Library. Assert user-visible behavior (roles, labels, text), not implementation details.
- Run `npm test` and `npm run lint` before handing off. Code must pass `eslint.config.js`. Do not disable rules to silence a failure unless Gabriel asks.
