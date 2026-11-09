---
name: enforce-project-rules
description: Turn a project rule your coding agent keeps breaking (from CLAUDE.md, AGENTS.md, a review comment, or a correction) into an agent test, a TEST.md plus test.yaml under .agents/tests/, prove it fails on a violation and passes on compliant code, then check the repository against it. Use when the user says things like "make this a rule", "stop the agent doing X again", or "check the codebase for X".
---

# Enforce project rules

Turn one rule into one agent test, prove it works, and then check the code with it.
An agent test only reports findings. Never change application code while
running a check. Fix code only when the user asks you to.

## Status of agent-tests (read first)

As of agent-tests 0.8.0, the `agent-tests` CLI prints its help text but has
no working commands: `init`, `validate`, `eval`, and `run` do nothing yet. The
library API (`AgentTest`, `validateTest`) does work. This skill runs it through
`scripts/run.ts`, which requires Bun and a local checkout of
`feuersteiner/agent-tests`.

The README describes `message`, `fix`, and `fast` / `smart` / `deep`. Those are
planned. Write `test.yaml` against the schema that the code accepts today,
shown below. Otherwise validation fails.

## Prerequisites

1. Install Bun: `bun --version` must succeed.
2. Get a checkout of agent-tests with its dependencies installed:
   `git clone https://github.com/feuersteiner/agent-tests && cd agent-tests && bun install --ignore-scripts --frozen-lockfile --linker=hoisted`.
   Set `AGENT_TESTS_CORE=/path/to/agent-tests/core`.
3. Create `agent-tests.config.yaml` at the repository root, even if the rule
   uses only regex. Both models are required, and their key variables must be
   set in the environment:

   ```yaml
   decision:
     api: openai # openai | jev
     url: https://api.openai.com/v1
     model: <classifier model>
     apiKeyEnv: OPENAI_API_KEY
   reasoning:
     api: anthropic # openai | anthropic
     url: https://api.anthropic.com/v1
     model: <reasoning model>
     apiKeyEnv: ANTHROPIC_API_KEY
   trigger: { threshold: 0.5 }
   check: { threshold: 0.5 }
   ```

If a prerequisite is missing, say which one and stop. Don't report results
from a run that didn't happen.

## Workflow

1. **Pin down the rule.** Get it in one sentence that can be tested, for example
   "Database queries only happen in `src/lib/server/repositories/`". If the
   source is vague ("write clean code"), ask the user for the specific behavior
   or decline. Not every instruction can be tested.
2. **Look at the repository.** Find where the rule applies (paths, file types)
   and collect one real violation and one real compliant example if they exist.
3. **Write `.agents/tests/<id>/TEST.md`.** Use prose: the rule, why it exists,
   examples, exceptions, and how to fix a violation. Describe the rule. Don't
   address the models that will read it.
4. **Write `.agents/tests/<id>/test.yaml`** in the current schema:

   ```yaml
   id: no-db-outside-repositories # lowercase kebab-case, matches the directory
   title: No database access outside repositories
   description: Database queries live in the repository layer.
   triggers: # optional; OR between triggers
     - id: server-code
       description: Server TypeScript outside the repository layer.
       glob: ['src/**/*.ts'] # AND within a trigger: glob, then grep, then ask
       grep: 'db\.|prisma\.|sql`'
   checks: # at least one
     - id: query-outside-repository
       description: Flags direct query calls.
       error: Database query outside src/lib/server/repositories/.
       grep: '\b(prisma|db)\.\w+\.(find|create|update|delete)\w*\('
       ask: 'This file performs no database query itself; it only calls repository functions.'
   evals: # labeled examples: pass | fail | skip
     - {
         name: Route queries Prisma directly,
         path: src/routes/api/users/+server.ts,
         content: 'await prisma.user.findMany()',
         expect: fail
       }
     - {
         name: Route calls repository,
         path: src/routes/api/users/+server.ts,
         content: 'await usersRepo.list()',
         expect: pass
       }
     - {
         name: Repository itself,
         path: src/lib/server/repositories/users.ts,
         content: 'await prisma.user.findMany()',
         expect: skip
       }
   ```

   How a check decides: rules run in the order `grep`, then `ask`, then
   `reason`. A source **passes** at the first rule it passes. It is flagged
   only if it fails every rule present. `grep` fails when a pattern matches.
   `ask` and `reason` take a statement that must be true for the file to pass.
   Use `grep` alone when a pattern settles the question. Add `ask` (a
   classifier) or `reason` (an LLM) only when the rule needs judgment, and put
   grep in front of them so models run only on suspicious files.
   Trigger `glob` patterns must exclude the files where the rule allows the
   behavior. Cover those files with a `skip` eval.

5. **Prove the test works.** Run
   `bun scripts/run.ts eval .agents/tests/<id>`. Include at least one `fail`,
   one `pass`, and one `skip` eval. Repeat until every eval matches its label.
   Fix the test, not the labels. Change a label only if the user agrees it was
   wrong.
6. **Check the code.** Run `bun scripts/run.ts run .agents/tests/<id>` (all
   files tracked by git), or list specific files after the directory. Report
   each flagged file with the check's `error`.
7. **Report.** Give the rule, the test path, eval results (N/N matched), and
   the flagged files. List anything you did not run.

## Rules

- Never say an eval or check passed unless you ran it and saw the output.
- Never weaken a check, or delete an eval, to make results come out green.
- One rule per test. Split compound rules.
- Keep tests declarative: no scripts inside `.agents/tests/`.
- Don't commit API keys. `agent-tests.config.yaml` only names environment variables.
