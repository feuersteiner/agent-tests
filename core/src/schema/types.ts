/** Outcomes shared by checks and labeled evaluation examples. */
export type TestOutcome = 'pass' | 'fail' | 'unsure' | 'skip';

/** A glob/regex pattern or an ordered list of alternatives. */
export type Patterns = string | string[];

/** Filters run in the same order as their YAML keys. */
export interface TriggerFilter {
	match?: Patterns;
	ask?: string;
}

/** Path and content filters are combined in written order. */
export interface Trigger {
	path?: TriggerFilter;
	content?: TriggerFilter;
}

/** Deterministic checks use regular expressions. */
export interface FastCheck {
	match?: Patterns;
	maybe?: Patterns;
}

/** A model classifies violations with optional confidence bounds. */
export interface SmartCheck {
	ask: string;
	bounds?: [number, number];
}

/** The final model judgment can request a reasoning effort. */
export interface DeepCheck {
	ask: string;
	reasoning?: 'low' | 'medium' | 'high';
}

/** One rule checked against each selected file. */
export interface CheckDefinition {
	id: string;
	message: string;
	fix: string;
	'human-tiebreak'?: boolean;
	fast?: FastCheck;
	smart?: SmartCheck;
	deep?: DeepCheck;
}

/** A labeled example evaluated using the real trigger and check pipeline. */
export interface EvalDefinition {
	name: string;
	path: string;
	content: string;
	expect: TestOutcome;
}

/** Public compiled test.yaml contract. Missing source is diagnosed by validation. */
export interface TestDefinition {
	id: string;
	title: string;
	description: string;
	source?: string;
	triggers: Trigger | Trigger[];
	checks: CheckDefinition[];
	evals: EvalDefinition[];
}
