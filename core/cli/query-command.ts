import {
	discoverTests,
	formatTestTree,
	listRemoteTests,
	listSkills,
	readSkill,
	targetFiles
} from 'agent-tests';
import { present } from './present.js';
import { scopeFor } from './scope.js';
import type { CommandOutput, ParsedCommand } from './types.js';
import { warningsText } from './utils.js';

/** Read listings, skills and trigger targets through the library's public entry. */
export const queryCommand = async (
	root: string,
	command: ParsedCommand
): Promise<CommandOutput> => {
	const json = Boolean(command.options.json);
	if (command.command === 'docs') {
		if (command.args[0]) {
			const content = readSkill(command.args[0]);
			return present(json, { name: command.args[0], content, exitCode: 0 }, content);
		}
		const skills = listSkills();
		return present(
			json,
			{ skills, exitCode: 0 },
			skills.map((skill) => `${skill.name}: ${skill.description}`).join('\n')
		);
	}
	if (command.command === 'targets') {
		const result = await targetFiles(root, command.args[0]!, scopeFor(command));
		return present(
			json,
			result,
			[
				...result.files,
				...warningsText(result.warnings),
				...result.skipped.map(
					(file) => `skip: ${result.testId} (${file}): trigger could not be decided`
				),
				`${result.files.length} targets selected`
			].join('\n'),
			result.exitCode
		);
	}
	if (command.options.remote) {
		const tests = await listRemoteTests(root);
		return present(
			json,
			{ tests, exitCode: 0 },
			tests.map((test) => `${test.id} (${test.commit})`).join('\n') || 'No remote tests.'
		);
	}
	const discovered = await discoverTests(root);
	const tests = discovered.map(({ id, owner, directory }) => ({ id, owner, directory }));
	return present(json, { tests, exitCode: 0 }, formatTestTree(discovered) || 'No tests installed.');
};
