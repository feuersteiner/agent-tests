import { readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cli, commit, config, git, project, write, yaml } from './support.ts';

describe('source CLI through Bun', () => {
	it('validates and evaluates without model calls and reports located findings as JSON', () => {
		const dir = project();
		expect(cli(dir, ['validate']).status).toBe(0);
		expect(cli(dir, ['eval']).status).toBe(0);
		write(dir, 'src/help/a.md', 'Okay.\ngonna');
		const result = cli(dir, ['run', '--json']);
		expect(result.status).toBe(1);
		expect(JSON.parse(result.stdout).results[0].flagged[0]).toMatchObject({
			path: 'src/help/a.md',
			findings: [{ line: 2, column: 1 }]
		});
		expect(result.stderr).toBe('');
	});
	it('reads staged and working content independently and includes staged edits in changed mode', () => {
		const dir = project();
		write(dir, 'src/help/a.md', 'gonna');
		git(dir, 'add', 'src/help/a.md');
		expect(cli(dir, ['run', '--changed']).status).toBe(1);
		write(dir, 'src/help/a.md', 'going to');
		expect(cli(dir, ['run', '--staged']).status).toBe(1);
		expect(cli(dir, ['run', '--changed']).status).toBe(0);
		write(dir, 'src/help/new file.md', 'gonna');
		expect(cli(dir, ['run', '--changed', '--', 'src/help/new file.md']).status).toBe(1);
		expect(cli(dir, ['run', '--', '--help']).status).toBe(0);
	});
	it('reads base config and committed content even when the PR rewrites its own config', () => {
		const dir = project();
		git(dir, 'checkout', '-qb', 'feature');
		write(dir, 'src/help/a.md', 'gonna');
		write(dir, 'agent-tests.config.yaml', 'private-value');
		commit(dir);
		write(dir, 'src/help/a.md', 'going to');
		const result = cli(dir, ['run', '--base', 'main', '--json']);
		expect(result.status).toBe(1);
		expect(JSON.parse(result.stdout).results[0].flagged[0].path).toBe('src/help/a.md');
		expect(cli(dir, ['run']).status).toBe(2);
	});
	it('fails every test on bad config, does not leak secrets, and preserves real env precedence', () => {
		const dir = project();
		write(dir, '.agents/tests/second/TEST.md', 'Second');
		write(dir, '.agents/tests/second/test.yaml', yaml.replace('id: formal\n', 'id: second\n'));
		write(dir, '.env', 'AGENT_TESTS_FIXTURE_KEY=private-value\n');
		const missing = cli(dir, ['run', '--json'], { AGENT_TESTS_FIXTURE_KEY: '' });
		expect(missing.status).toBe(2);
		expect(JSON.parse(missing.stdout).results.every((entry: any) => entry.exitCode === 2)).toBe(
			true
		);
		expect(missing.stdout + missing.stderr).not.toContain('private-value');
		write(dir, 'agent-tests.config.yaml', JSON.stringify({ ...config, apiKey: 'private-value' }));
		const invalid = cli(dir, ['validate', '--json']);
		expect(invalid.status).toBe(2);
		expect(invalid.stdout + invalid.stderr).not.toContain('private-value');
	});
	it('loads .env as a fallback and rejects a stale source hash', () => {
		const dir = project();
		write(dir, '.env', 'AGENT_TESTS_FIXTURE_KEY=offline-fixture\n');
		expect(cli(dir, ['validate'], { AGENT_TESTS_FIXTURE_KEY: undefined }).status).toBe(0);
		write(
			dir,
			'.agents/tests/formal/test.yaml',
			yaml.replace('triggers:', `source: sha256:${'0'.repeat(64)}\ntriggers:`)
		);
		const result = cli(dir, ['validate', '--json']);
		expect(result.status).toBe(2);
		expect(JSON.parse(result.stdout).results[0].error).toContain('stale');
	});
	it('scopes nested tests and skips metadata, binaries, deleted files and symlinks', () => {
		const dir = project();
		write(dir, 'app/.agents/tests/formal/TEST.md', 'Formal');
		write(dir, 'app/.agents/tests/formal/test.yaml', yaml);
		write(dir, 'app/src/help/a.md', 'gonna');
		write(dir, 'src/help/bytes.md', '\0gonna');
		symlinkSync(join(dir, 'src/help/a.md'), join(dir, 'src/help/link.md'));
		const result = cli(dir, ['run', '--json']);
		expect(result.status).toBe(1);
		const results = JSON.parse(result.stdout).results;
		expect(results.find((entry: any) => entry.owner === 'app').flagged[0].path).toBe(
			'src/help/a.md'
		);
		expect(
			results
				.flatMap((entry: any) => entry.flagged)
				.some((entry: any) => entry.path.endsWith('link.md') || entry.path.endsWith('bytes.md'))
		).toBe(false);
		expect(readFileSync(join(dir, 'src/help/a.md'), 'utf8')).toBe('going to');
	});
	it.each([
		['run', '--changed', '--staged'],
		['run', '--base'],
		['run', '--base', '--json'],
		['validate', '--staged'],
		['run', '--json=true'],
		['run', '--json', '--json'],
		['eval', '--json', '--verbose'],
		['vote'],
		['vote', 'formal', '--up', '--down'],
		['unknown', '--help']
	])('rejects unsupported syntax %j', (...args) => {
		const result = cli(project(), args);
		expect(result.status).toBe(2);
	});
});
