import { existsSync, readFileSync } from 'node:fs';
import { command, type Command } from 'clinguini';
import { IdSchema } from '../../../src/types.ts';
import { TESTS_FOLDER, toTestFolder } from '../../config/paths.ts';
import { message } from '../../helpers/error.ts';
import { NEW_TEST_PROMPT, toCompilePrompt, toRulePrompt } from './prompts.ts';

/** The text of the Test's `TEST.md`; `undefined` when the file is missing or blank. */
const readTestMd = (id: string): string | undefined => {
	const path = `${toTestFolder(id)}/TEST.md`;
	if (!existsSync(path)) return undefined;
	const text = readFileSync(path, 'utf8');
	return text.trim() ? text : undefined;
};

/** Throws when there is no Tests folder or `id` is not kebab-case. */
const toPrompt = (id: string | undefined): string => {
	if (!existsSync(TESTS_FOLDER))
		throw new Error(`No ${TESTS_FOLDER}/ folder in the current directory`);
	if (id === undefined) return NEW_TEST_PROMPT;
	if (!IdSchema.safeParse(id).success)
		throw new Error(`Invalid test id: ${id}; use lowercase kebab-case, such as user-text-french`);
	const rule = readTestMd(id);
	if (rule === undefined) return toRulePrompt(id);
	return toCompilePrompt(id, rule);
};

export const compileCommand: Command = command({
	name: 'compile',
	description:
		'Print the prompt an agent needs to write a Test: its TEST.md when missing, then test.yaml and evals.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit to name a new Test.' }],
	handler: ({ params }): void => {
		try {
			console.log(toPrompt(params.id));
			process.exitCode = 0;
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});
