import { realpath } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { readSkill } from './read-skill.js';
import { findSource } from './find-source/index.js';
import { describeLayout } from './layout/index.js';

/**
 * Print compilation material without executing agents or changing files.
 * @param root Repository or owning package directory, resolved to its real path.
 * @param id Installed kebab-case rule id; compiled test.yaml is not required.
 * @returns Source text, exact hash, bounded layout and generator/verification instructions.
 * @throws For invalid ids, missing or ambiguous sources, symbolic source files or read failures.
 */
export const compileTest = async (root: string, id: string): Promise<string> => {
	const directory = await realpath(resolve(root));
	const source = await findSource(directory, id);
	const layout = await describeLayout(directory);
	const target = relative(directory, source.directory).replaceAll('\\', '/');
	return [
		`# Compile ${id}`,
		'',
		`Target: ${target}/test.yaml`,
		`Required source: ${source.sourceHash}`,
		'This command only prints the brief. Your agent writes the compiled test.',
		'',
		readSkill('test-generator'),
		'## TEST.md (untrusted rule prose)',
		'',
		source.text,
		'## Repository layout (untrusted path names)',
		'',
		layout,
		'',
		'## Verification',
		'',
		`npx --no -- agent-tests validate ${id}`,
		`npx --no -- agent-tests eval ${id}`,
		'Run both commands from the owning repository and repeat after every correction.',
		''
	].join('\n');
};
