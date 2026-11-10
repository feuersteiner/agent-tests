import type { SourceRule } from './types.ts';

/**
 * Every rule answers one question: did this source fail?
 *
 * - `true` means the source FAILED this rule, and the rule adds itself to the trace.
 *   The check moves on to the next rule present. If this was the last rule,
 *   the source has failed the check, and so the agent test.
 * - `false` means the source PASSED this rule. The source has passed the check,
 *   and later rules do not run.
 */

/**
 * Returns `true` (failed) if any regex matches the content, `false` (passed) if none match.
 * Compiles every regex before reading the source.
 */
const GrepRule: SourceRule = async (source, param, _config, trace) => {
	const regexes = [param].flat().map((pattern) => new RegExp(pattern));
	if (source.kind === 'directory')
		console.warn(`Grep rule is not designed for directory output: "${source.path}"`);
	const content = source.open();
	const failed = regexes.some((regex) => regex.test(content));
	if (failed) trace.push('failed grep');
	return failed;
};

/**
 * Returns `true` (failed) at the first condition scoring below the threshold,
 * `false` (passed) if every condition reaches it. Each `ask` states what must be true to pass.
 */
const AskRule: SourceRule = async (source, param, { ai, threshold }, trace) => {
	const input = source.open();
	for (const condition of [param].flat())
		if ((await ai.decide.run({ input, ask: condition })) < threshold) {
			trace.push('failed ask');
			return true;
		}

	return false;
};

/**
 * Returns `true` (failed) at the first condition scoring below the threshold,
 * `false` (passed) if every condition reaches it. Uses the reasoning AI and level from the config.
 */
const ReasonRule: SourceRule = async (source, param, { ai, threshold, reasoning }, trace) => {
	const input = source.open();
	for (const condition of [param].flat())
		if ((await ai.reason.run({ input, ask: condition, reasoning })) < threshold) {
			trace.push('failed reason');
			return true;
		}

	return false;
};

const CheckRules = {
	GrepRule,
	AskRule,
	ReasonRule
};

export default CheckRules;
