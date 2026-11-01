import { execFile } from 'node:child_process';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { promisify } from 'node:util';
import type { LibraryCatalog, LibraryTransport } from './types.js';
import { assertId } from './paths.js';

const execute = promisify(execFile);
const git = async (root: string, args: string[]): Promise<string> => {
	try {
		const result = await execute('git', ['-C', root, ...args], {
			maxBuffer: 4 * 1024 * 1024,
			env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
		});
		return result.stdout;
	} catch {
		throw new Error('Cannot read the library Git catalog; check repository access and ref.');
	}
};

const remoteSource = async (repository: string, ref: string): Promise<string> => {
	if (!ref || ref.startsWith('-') || /[\0\r\n]/.test(ref))
		throw new Error('Library ref must be a Git reference or commit.');
	if (isAbsolute(repository)) return realpath(repository);
	const parts = repository.split('/');
	if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(part)))
		throw new Error('Library repository must be an owner/repository GitHub identity.');
	return `https://github.com/${repository}.git`;
};

const open = async (repository: string, ref: string): Promise<LibraryCatalog> => {
	const remote = await remoteSource(repository, ref);
	const directory = await mkdtemp(join(tmpdir(), 'agent-tests-catalog-'));
	try {
		await git(directory, ['init', '--bare', '--quiet']);
		await git(directory, ['fetch', '--quiet', '--depth=1', '--no-tags', '--', remote, ref]);
		const commit = (await git(directory, ['rev-parse', '--verify', 'FETCH_HEAD^{commit}'])).trim();
		const entries = await git(directory, ['ls-tree', '-z', `${commit}:library`]);
		const ids = entries
			.split('\0')
			.filter(Boolean)
			.flatMap((entry) => {
				const [metadata, id = ''] = entry.split('\t');
				return metadata?.startsWith('040000 ') && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ? [id] : [];
			})
			.sort();
		return {
			commit,
			ids,
			readTest: async (id) => {
				assertId(id);
				if (!ids.includes(id)) throw new Error(`Library test '${id}' does not exist.`);
				const read = async (file: string): Promise<string> => {
					const object = `library/${id}/${file}`;
					const mode = await git(directory, ['ls-tree', commit, '--', object]);
					if (!mode.startsWith('100644 ') && !mode.startsWith('100755 '))
						throw new Error('Library tests must contain regular TEST.md and test.yaml files.');
					return git(directory, ['show', `${commit}:${object}`]);
				};
				return { prose: await read('TEST.md'), yaml: await read('test.yaml') };
			},
			close: async () => rm(directory, { recursive: true, force: true })
		};
	} catch (error) {
		await rm(directory, { recursive: true, force: true });
		throw error;
	}
};

/** Read GitHub through native HTTPS Git authentication without changing project remotes. */
export const gitLibraryTransport: LibraryTransport = { open };
