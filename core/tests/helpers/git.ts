import { execFileSync } from 'node:child_process';
import { devNull } from 'node:os';
import { inTempDir } from './temp.ts';

/** Runs Git in `cwd`, ignoring the developer's global and system config and any inherited `GIT_*` variable, such as the author a Git hook exports, and returns its trimmed stdout; throws on failure. */
export const git = (cwd: string, ...args: string[]): string =>
	execFileSync('git', args, {
		cwd,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
		env: {
			...Object.fromEntries(
				Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_'))
			),
			GIT_CONFIG_GLOBAL: devNull,
			GIT_CONFIG_NOSYSTEM: '1'
		}
	}).trim();

/** Creates a repository on branch `main` with a local identity and unsigned commits. */
export const initRepo = (cwd: string): void => {
	git(cwd, 'init', '--quiet', '--initial-branch=main');
	git(cwd, 'config', 'user.name', 'Agent Tests');
	git(cwd, 'config', 'user.email', 'agent-tests@example.invalid');
	git(cwd, 'config', 'commit.gpgsign', 'false');
};

/** Stages every file and commits, even when nothing changed. */
export const commitAll = (cwd: string, message = 'commit'): void => {
	git(cwd, 'add', '--all');
	git(cwd, 'commit', '--quiet', '--allow-empty', '--no-verify', '--message', message);
};

/** `inTempDir`, with the directory made a repository holding one commit of `files`. */
export const inTempRepo = async <T>(
	files: Record<string, string>,
	run: (dir: string) => T | Promise<T>
): Promise<T> =>
	inTempDir(files, (dir) => {
		initRepo(dir);
		commitAll(dir);
		return run(dir);
	});
