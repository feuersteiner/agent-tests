import { afterAll, describe, expect, it } from 'vitest';
import { cleanup, cli, project } from './cli-fixtures.js';

afterAll(cleanup);

describe('built CLI argument contracts', () => {
	it('lists every command and supports command help without performing writes', () => {
		const root = project();
		for (const command of [
			'init',
			'add',
			'update',
			'remove',
			'compile',
			'validate',
			'list',
			'targets',
			'eval',
			'run',
			'docs',
			'vote'
		]) {
			const result = cli(root, [command, '--help']);
			expect(result.status, result.stderr).toBe(0);
			expect(result.stdout).toContain('Usage: agent-tests');
		}
		expect(cli(root, ['--version']).stdout.trim()).toBe('0.0.1');
	});

	it.each([
		['init', 'extra'],
		['init', '--remote'],
		['list', 'extra'],
		['list', '--staged'],
		['add'],
		['add', 'one', '.', 'extra'],
		['remove'],
		['update', 'one', 'two'],
		['compile'],
		['compile', 'one', 'two'],
		['targets'],
		['eval', 'one', 'two'],
		['validate', '--changed'],
		['docs', '--github'],
		['docs', 'one', 'two'],
		['vote', 'one', '--up', '--down'],
		['run', '--changed', '--staged'],
		['run', '--base'],
		['run', '--json=true'],
		['run', '--json', '--json'],
		['unknown', '--help'],
		['docs', 'one', 'two', '--help'],
		['--version', 'extra']
	])('rejects unsupported syntax %j before executing a command', (...args) => {
		const result = cli(project(), [...args, '--json']);
		expect(result.status).toBe(2);
		expect(JSON.parse(result.stderr)).toMatchObject({ exitCode: 2 });
	});
});
