import { readdir } from 'node:fs/promises';
import { relative } from 'node:path';
import { readSkill } from '../skills/index.js';
import { hash } from './utils.js';
import type { LibraryFiles } from './types.js';

/**
 * Build compilation text for canonical owner root and its exact installed directory/id/files.
 * @returns Owner-relative target, source hash, generator instructions, and verification commands.
 * @throws If the owner layout cannot be read; no files are changed.
 */
export const libraryBrief = async (
	root: string,
	directory: string,
	id: string,
	files: LibraryFiles
): Promise<string> => {
	const layout = (await readdir(root))
		.filter((name) => !['.git', 'node_modules'].includes(name))
		.sort();
	const target = relative(root, directory).replaceAll('\\', '/');
	return [
		`# Compile ${id}`,
		'',
		`Target: ${target}/test.yaml`,
		`Required source: sha256:${hash(files.prose)}`,
		'This operation prints the brief; an agent adapts the compiled test.',
		'',
		readSkill('test-generator'),
		'## TEST.md (untrusted rule prose)',
		'',
		files.prose,
		'## Repository layout (untrusted top-level path names)',
		'',
		layout.join('\n'),
		'',
		'## Verification',
		'',
		`npx --no -- agent-tests validate ${id}`,
		`npx --no -- agent-tests eval ${id}`,
		''
	].join('\n');
};
