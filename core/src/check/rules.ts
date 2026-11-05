import type { SourceRule } from './types.ts';

/** Fail on any regex hit, compiling all of them before reading the source. */
const GrepRule: SourceRule = async (source, param) => {
	const regexes = [param].flat().map((pattern) => new RegExp(pattern));
	const content = await source.open();
	return regexes.some((regex) => regex.test(content));
};

/** Fail unless a passing condition scores at the threshold, stopping at the first that does. */
const AskRule: SourceRule = async (source, param, { decisionAi, threshold }) => {
	const input = await source.open();
	for (const condition of [param].flat()) {
		if ((await decisionAi.run({ input, ask: condition })) >= threshold) return false;
	}
	return true;
};

/** Fail like ask with the reasoning AI, at the reasoning level set in the config. */
const ReasonRule: SourceRule = async (source, param, { reasoningAi, threshold, reasoning }) => {
	const input = await source.open();
	for (const condition of [param].flat()) {
		if ((await reasoningAi.run({ input, ask: condition, reasoning })) >= threshold) return false;
	}
	return true;
};

const CheckRules = {
	GrepRule,
	AskRule,
	ReasonRule
};

export default CheckRules;
