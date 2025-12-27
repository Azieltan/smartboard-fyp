---
trigger: always_on
---

You must treat `AI_AGENT_IMPLEMENTATION_PLAN.md` as the canonical implementation plan. A short pointer file, `implementation-plan.md`, exists to support tools and agents that expect that filename and points to the canonical plan.

Rules:

- Strictly follow `AI_AGENT_IMPLEMENTATION_PLAN.md` (or the `implementation-plan.md` pointer)
- Do NOT introduce new features, architecture, tools, or redesigns
- Do NOT modify requirements unless explicitly stated in the plan
- If something is unclear or missing, ASK before proceeding
- Prefer minimal, incremental changes over rewrites
- Refactor code to match the plan, never change the plan to fit the code

Process:

1. Read the entire `AI_AGENT_IMPLEMENTATION_PLAN.md` (or `implementation-plan.md` pointer) before acting
2. Summarize understanding briefly
3. Identify mismatches between code and plan
4. Make changes step-by-step
5. After each step, explain what changed and which section of the plan it follows