import * as section from './sections.ts';
import * as step from './steps.ts';

/** Stands for the id the agent has yet to choose. */
const ID = '<id>';

/** For a Test with a rule: write `test.yaml` and evals, then prove them. */
export const toCompilePrompt = (id: string, rule: string): string =>
	[
		section.toCompileIntro(id),
		section.toQuote(id, rule),
		section.toSteps([
			step.READ_RULE,
			step.LOOK,
			step.WRITE_TEST_YAML,
			step.WRITE_EVALS,
			step.toValidate(id),
			step.toEval(id),
			step.REPORT
		]),
		section.LIMITS,
		section.TEST_YAML,
		section.RUN,
		section.GLOB,
		section.GREP,
		section.MODELS,
		section.EVALS,
		section.EXAMPLE
	].join('\n\n');

/** For a named Test whose `TEST.md` is missing or blank: write it, then compile. */
export const toRulePrompt = (id: string): string =>
	[
		section.toRuleIntro(id),
		section.toSteps([
			step.FIND_RULE,
			step.LOOK,
			step.toReadFolder(id),
			step.toWriteTestMd(id),
			step.toCompile(id)
		]),
		section.TEST_MD
	].join('\n\n');

/** For no id: name the Test, write its `TEST.md`, then compile. */
export const NEW_TEST_PROMPT = [
	section.NEW_TEST_INTRO,
	section.toSteps([
		step.FIND_RULE,
		step.LOOK,
		step.toName(ID),
		step.toWriteTestMd(ID),
		step.toCompile(ID)
	]),
	section.TEST_MD
].join('\n\n');
