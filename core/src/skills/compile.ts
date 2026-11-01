import { realpath } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { readSkill } from './catalog.js';
import { findSource } from './find-source.js';
import { describeLayout } from './layout.js';

/** Print compilation material for one installed rule; never execute agents or change files. */
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
