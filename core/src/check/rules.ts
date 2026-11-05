import type { SourceRule } from './types.ts';

/**
 * Every rule answers one question: did this source fail?
 *
 * - `true` means the source FAILED this rule. The check moves on to the next rule present.
 *   If this was the last rule, the source has failed the check, and so the agent test.
 * - `false` means the source PASSED this rule. The source has passed the check,
 *   and later rules do not run.
 */

/**
 * Returns `true` (failed) if any regex matches the content, `false` (passed) if none match.
 * Compiles every regex before reading the source.
 */
const GrepRule: SourceRule = async (source, param) => {
	const regexes = [param].flat().map((pattern) => new RegExp(pattern));
	const content = await source.open();
	return regexes.some((regex) => regex.test(content));
};

/**
 * Returns `true` (failed) at the first condition scoring below the threshold,
 * `false` (passed) if every condition reaches it. Each `ask` states what must be true to pass.
 */
const AskRule: SourceRule = async (source, param, { decisionAi, threshold }) => {
	const input = await source.open();
	for (const condition of [param].flat()) {
		if ((await decisionAi.run({ input, ask: condition })) < threshold) return true;
	}
	return false;
};

/**
 * Returns `true` (failed) at the first condition scoring below the threshold,
 * `false` (passed) if every condition reaches it. Uses the reasoning AI and level from the config.
 */
const ReasonRule: SourceRule = async (source, param, { reasoningAi, threshold, reasoning }) => {
	const input = await source.open();
	for (const condition of [param].flat()) {
		if ((await reasoningAi.run({ input, ask: condition, reasoning })) < threshold) return true;
	}
	return false;
};

const CheckRules = {
	GrepRule,
	AskRule,
	ReasonRule
};

export default CheckRules;
