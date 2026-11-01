# Agent-tests use cases

Agent-tests is intended to turn recurring review judgments into reusable,
benchmarked repository checks. These are proposed uses of the design described
in the [README](README.md); the CLI, compiler, and evaluation engine are not
implemented.

## 1. Preserve lessons from production incidents

**Rule:** Payment retries must preserve the original idempotency key.

Check newly added handlers and jobs against that lesson, including unfamiliar
implementations that existing unit tests do not exercise. Package known passing
and failing examples so the lesson survives changes in reviewers and agents.

## 2. Check whether product copy communicates correctly

**Rule:** Every payment error must explain whether money was taken and what the
customer should do next, in French.

Correct grammar and passing component tests do not establish that meaning.
Evaluate user-facing copy against explicit criteria and examples, including
cases where payment status is genuinely unknown.

## 3. Verify documentation matches implementation

**Rule:** Documented behavior must match the implementation being released.

An endpoint changes from immediate deletion to queued deletion, but documentation
still promises instant removal. Compare the documented promise with the
implementation, beyond checking types or response shapes.

## 4. Enforce architectural decisions requiring context

**Rule:** New checkout flows must reuse the existing pricing policy.

An agent duplicates discount logic without importing anything forbidden. An
import restriction misses this; the check evaluates whether business
responsibility was duplicated, using approved examples and legitimate exceptions.

## 5. Detect regressions in the AI checker itself

**Rule:** An evaluator upgrade must meet agreed acceptance criteria on fixed
benchmark cases.

Before switching evaluator models, replay approved examples: violations the
checker must catch and legitimate exceptions it must accept. Measure missed
problems and false alarms against the approved baseline. These are separate
evaluation runs, not checks automatically run against application changes.

## Business outcomes

These are proposed outcomes: checks identify where decisions and knowledge have
not reached downstream work. Automatic propagation and escalation would require
integrations around the check engine. Checks use dated, authoritative sources
and respect approved exceptions.

## 6. Instant strategy propagation

Turn strategy changes into checks across budgets, campaigns, sales, and hiring.
When leadership exits a customer segment, flag plans and commitments that still
invest in it.

## 7. Immediate business alignment

Check new business decisions against current policies and priorities.
When finance changes margin requirements, flag proposals whose discounts, free
services, or hidden concessions undermine them.

## 8. Cross-department synchronization

Keep departments working from the same current facts.
When product delays a launch, flag outdated promises in sales proposals,
partner materials, and marketing campaigns.

## 9. Customer memory across handovers

Preserve customer history, needs, decisions, and promises as ownership changes.
Check that handovers and delivery plans carry forward material commitments,
reasons for past decisions, and unresolved issues.

## 10. Automatic escalation of strategic signals

Surface important customer and market information to the people responsible for
acting on it. When a major renewal becomes conditional, flag forecasts and
spending plans that still assume certain revenue.

## Relationship to existing tools

Vitest can host custom checking logic, ESLint handles many deterministic rules,
and CodeRabbit already offers [custom pre-merge
checks](https://www.coderabbit.ai/blog/pre-merge-checks-built-in-and-custom-pr-enforced).
The proposed benefit is portable packages combining rules, execution, evidence,
and evaluator benchmarks. Naming conventions and forbidden imports alone do not
justify another tool. Semantic checks supplement executable behavior tests;
their judgments require validation and can be wrong.
