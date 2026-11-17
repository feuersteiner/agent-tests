import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The built CLI entry, resolved from this file, not from the working directory. */
const CLI = fileURLToPath(new URL('../../dist/cli/index.js', import.meta.url));

/** The repository root, as a real path, resolved from this file; its `.env` holds a live key. */
const REPO = realpathSync(fileURLToPath(new URL('../../..', import.meta.url)));

/** Whether `dir` is the repository or a folder under it, compared on real paths. */
const isInRepo = (dir: string): boolean => {
	const path = relative(REPO, realpathSync(dir));
	return !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`);
};

/** One CLI run: exit code, raw streams, and the non-empty lines of stdout. */
interface CliResult {
	exitCode: number;
	stdout: string;
	stderr: string;
	lines: string[];
}

/**
 * Runs the built CLI on Node in `cwd`, which is required; the child sees only PATH, HOME, `env`, and the `.env` of `cwd`.
 * Its stdout is a pipe, never a terminal, so it holds no banner.
 * Throws when `dist/` is not built or `cwd` is inside the repository, where the CLI could load a real `.env`.
 */
export const runCli = (
	args: string[],
	{ cwd, env = {} }: { cwd: string; env?: Record<string, string> }
): CliResult => {
	if (!existsSync(CLI)) throw new Error(`Missing ${CLI}; run \`bun run build\` in core/ first`);
	if (isInRepo(cwd))
		throw new Error(
			`Refusing to run the CLI in ${cwd}: it is inside the repository, whose .env the CLI could load`
		);
	const result = spawnSync('node', [CLI, ...args], {
		cwd,
		encoding: 'utf8',
		timeout: 30_000,
		env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', ...env }
	});
	if (result.error) throw result.error;
	return {
		exitCode: result.status ?? 1,
		stdout: result.stdout,
		stderr: result.stderr,
		lines: result.stdout.split('\n').filter((line) => line.trim() !== '')
	};
};
