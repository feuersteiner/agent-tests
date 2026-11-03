import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LibraryFiles, LibraryOptions, LibraryTransport } from '../types.js';

export const fixtureId = 'no-informal-english';
export const fixtureCommit = 'a'.repeat(40);
export const nextCommit = 'b'.repeat(40);

export const reference = async (): Promise<LibraryFiles> => {
	const directory = fileURLToPath(
		new URL('../../../../library/no-informal-english/', import.meta.url)
	);
	return {
		prose: await readFile(join(directory, 'TEST.md'), 'utf8'),
		yaml: await readFile(join(directory, 'test.yaml'), 'utf8')
	};
};

export const fixtureTransport = (
	files: LibraryFiles,
	commit = fixtureCommit,
	ids = [fixtureId]
): LibraryOptions & { closed: () => number } => {
	let closed = 0;
	const transport: LibraryTransport = {
		open: async () => ({
			commit,
			ids,
			readTest: async () => files,
			close: async () => {
				closed++;
			}
		})
	};
	return { transport, closed: () => closed };
};

export const withRoot = async (action: (root: string) => Promise<void>): Promise<void> => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-library-test-'));
	try {
		await action(root);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
};
