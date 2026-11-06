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
const GrepRule: SourceRule = async (source, param, config, trace) => {
	const regexes = [param].flat().map((pattern) => new RegExp(pattern));
	const content = await source.open();
	const failed = regexes.some((regex) => regex.test(content));
	if (failed) {
		trace.push('failed grep');
		for (const regex of config.report ? regexes : []) {
			for (const match of content.matchAll(new RegExp(regex.source, 'g')))
				config.report?.({ quote: match[0] }, match.index);
		}
	}
	return failed;
};

/**
 * Returns `true` (failed) at the first condition scoring below the threshold,
 * `false` (passed) if every condition reaches it. Each `ask` states what must be true to pass.
 */
const AskRule: SourceRule = async (source, param, { ai, threshold, report }, trace) => {
	const input = await source.open();
	for (const condition of [param].flat()) {
		const request = { input, ask: condition };
		const score = await ai.decide.run(request);
		if (score < threshold) {
			if (report)
				for (const failure of (await ai.decide.explain(request, score)).failures) report(failure);
			trace.push('failed ask');
			return true;
		}
	}
	return false;
};

/**
 * Returns `true` (failed) at the first condition scoring below the threshold,
 * `false` (passed) if every condition reaches it. Uses the reasoning AI and level from the config.
 */
const ReasonRule: SourceRule = async (
	source,
	param,
	{ ai, threshold, reasoning, report },
	trace
) => {
	const input = await source.open();
	for (const condition of [param].flat()) {
		const request = { input, ask: condition, reasoning };
		const score = await ai.reason.run(request);
		if (score < threshold) {
			if (report)
				for (const failure of (await ai.reason.explain(request, score)).failures) report(failure);
			trace.push('failed reason');
			return true;
		}
	}
	return false;
};

const CheckRules = {
	GrepRule,
	AskRule,
	ReasonRule
};

export default CheckRules;
