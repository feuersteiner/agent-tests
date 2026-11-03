/** One pattern or alternative patterns, in their written order. */
export type Patterns = string | string[];

/** Ordered glob/regex and model filters for one file attribute. */
export interface TriggerFilter {
  match?: Patterns;
  ask?: string;
}

/** File attributes that must all pass, in their written order. */
export interface Trigger {
  path?: TriggerFilter;
  content?: TriggerFilter;
}

/** Pattern-only check stage. */
export interface FastCheck {
  match?: Patterns;
  maybe?: Patterns;
}

/** Classifier check stage with optional confidence thresholds. */
export interface SmartCheck {
  ask: string;
  bounds?: [number, number];
}

export type ReasoningLevel = "low" | "medium" | "high";

/** Final model check stage. */
export interface DeepCheck {
  ask: string;
  reasoning?: ReasoningLevel;
}

/** A named rule with at least one check stage. */
export interface Check {
  id: string;
  message: string;
  fix: string;
  "human-tiebreak"?: boolean;
  fast?: FastCheck;
  smart?: SmartCheck;
  deep?: DeepCheck;
}

/** Expected result for a test's labeled file example. */
export type TestOutcome = "pass" | "fail" | "unsure" | "skip";

/** Labeled file example for a test. Empty file content is valid. */
export interface Eval {
  name: string;
  path: string;
  content: string;
  expect: TestOutcome;
}

/** Validated test.yaml data; optional fields have no implicit defaults. */
export interface AgentTest {
  id: string;
  title: string;
  description: string;
  source?: string;
  triggers: Trigger | Trigger[];
  checks: Check[];
  evals: Eval[];
}
