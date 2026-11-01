import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repository = fileURLToPath(new URL('../..', import.meta.url));
export const referenceId = 'no-informal-english';
const entry = path.join(repository, 'core/dist-cli/index.js');
const directories: string[] = [];

/** Create an independent real Git repository for built-CLI contract tests. */
export const project = (): string => {
	const root = mkdtempSync(path.join(tmpdir(), 'agent-tests-cli-'));
	directories.push(root);
	git(root, ['init', '--quiet', '--initial-branch=main']);
	git(root, ['config', 'user.email', 'cli-contract@example.invalid']);
	git(root, ['config', 'user.name', 'CLI contract']);
	return root;
};

/** Execute only local Git operations; no test pushes or remote service writes occur. */
export const git = (root: string, args: string[]): string =>
	execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });

/** Write a fixture file and create its parent directories. */
export const write = (root: string, relative: string, content: string): void => {
	const target = path.join(root, relative);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(target, content);
};

/** Copy the actual reference rule without replacing its approved evals or source hash. */
export const copyReference = (root: string, prefix = '.agents/tests'): void => {
	const directory = path.join(root, prefix, referenceId);
	mkdirSync(directory, { recursive: true });
	for (const name of ['TEST.md', 'test.yaml'])
		copyFileSync(path.join(repository, 'library', referenceId, name), path.join(directory, name));
};

/** Commit fixture state so changed/staged/base selection is exercised against actual Git. */
export const commit = (root: string): void => {
	git(root, ['add', '.']);
	git(root, ['commit', '--quiet', '-m', 'fixture']);
};

/** Run the built Node CLI from a consumer project and capture its underlying exit status. */
export const cli = (root: string, args: string[], environment: NodeJS.ProcessEnv = {}) => {
	const result = spawnSync(process.execPath, [entry, ...args], {
		cwd: root,
		encoding: 'utf8',
		timeout: 20_000,
		maxBuffer: 4 * 1024 * 1024,
		env: { ...process.env, OPENAI_API_KEY: '', GITHUB_ACTIONS: '', ...environment }
	});
	if (result.error) throw result.error;
	return result;
};

/** Remove only temporary repositories allocated by this test module. */
export const cleanup = (): void => {
	for (const directory of directories) rmSync(directory, { recursive: true, force: true });
};
