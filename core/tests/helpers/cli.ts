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

/** A banner rule: a full line of box-drawing dashes, as wide as the terminal or 80 when piped. */
const RULE = /^─+$/;

/** One CLI run: exit code, raw streams, stdout without the banner, and its non-empty lines. */
interface CliResult {
	exitCode: number;
	stdout: string;
	stderr: string;
	output: string;
	lines: string[];
}

/**
 * Stdout without the banner block clinguini prints first: `console.log(banner())`, where the banner is
 * `\n<rule>\n<art>\n<rule>\n`, so a blank line, a rule, the art, a rule, and one more blank line.
 */
const stripBanner = (stdout: string): string => {
	const lines = stdout.split('\n');
	if (lines[0] !== '' || !RULE.test(lines[1] ?? '')) return stdout;
	const end = lines.findIndex((line, index) => index > 1 && RULE.test(line));
	if (end === -1) return stdout;
	return lines.slice(lines[end + 1] === '' ? end + 2 : end + 1).join('\n');
};

/**
 * Runs the built CLI on Node in `cwd`, which is required; the child sees only PATH, HOME, `env`, and the `.env` of `cwd`.
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
	const output = stripBanner(result.stdout);
	return {
		exitCode: result.status ?? 1,
		stdout: result.stdout,
		stderr: result.stderr,
		output,
		lines: output.split('\n').filter((line) => line.trim() !== '')
	};
};
