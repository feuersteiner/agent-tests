import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach } from 'vitest';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const directories: string[] = [];
afterEach(() => {
	for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});
export const temporary = (): string => {
	const dir = mkdtempSync(join(tmpdir(), 'agent-tests-regression-'));
	directories.push(dir);
	return dir;
};
export const write = (dir: string, file: string, text: string): void => {
	mkdirSync(dirname(join(dir, file)), { recursive: true });
	writeFileSync(join(dir, file), text);
};
export const git = (dir: string, ...args: string[]): string =>
	execFileSync('git', ['-C', dir, ...args], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});
export const init = (dir: string): void => {
	git(dir, 'init', '-q', '-b', 'main');
	git(dir, 'config', 'user.name', 'Fixture');
	git(dir, 'config', 'user.email', 'fixture@example.invalid');
};
export const commit = (dir: string): void => {
	git(dir, 'add', '.');
	git(dir, '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture');
};
export const model = {
	api: 'openai' as const,
	url: 'https://api.openai.com/v1',
	model: 'gpt-6-luna',
	apiKeyEnv: 'AGENT_TESTS_FIXTURE_KEY'
};
export const config = {
	decision: model,
	reasoning: model,
	trigger: { threshold: 0.7 },
	check: { threshold: 0.7 }
};
export const yaml = `id: formal
title: Formal prose
description: Public help uses formal vocabulary.
triggers:
  - id: help
    description: Help documents.
    glob: 'src/help/**/*.md'
checks:
  - id: words
    description: Formal vocabulary.
    error: Replace gonna with going to.
    grep: '\\b[Gg]onna\\b'
evals:
  - { name: fail, path: src/help/a.md, content: gonna, expect: fail }
  - { name: pass, path: src/help/a.md, content: going to, expect: pass }
  - { name: skip, path: src/internal.ts, content: gonna, expect: skip }
`;
export const project = (): string => {
	const dir = temporary();
	init(dir);
	write(dir, '.gitignore', '.env\nnode_modules/\n');
	write(dir, '.agents/tests/formal/TEST.md', 'Formal prose.\n');
	write(dir, '.agents/tests/formal/test.yaml', yaml);
	write(dir, 'agent-tests.config.yaml', JSON.stringify(config));
	write(dir, 'src/help/a.md', 'going to');
	commit(dir);
	return dir;
};
export const cli = (dir: string, args: string[], env: NodeJS.ProcessEnv = {}) =>
	spawnSync(process.execPath, [join(root, 'core/dist/cli/index.js'), ...args], {
		cwd: dir,
		env: { ...process.env, AGENT_TESTS_FIXTURE_KEY: 'offline-fixture', ...env },
		encoding: 'utf8',
		timeout: 20000
	});
