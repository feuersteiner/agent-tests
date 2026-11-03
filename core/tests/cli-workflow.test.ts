import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
	cleanup,
	cli,
	commit,
	copyReference,
	project,
	referenceId,
	write
} from './cli-fixtures.js';

afterAll(cleanup);

describe('built CLI local catalog flow', () => {
	it('adds, compiles, validates, evaluates, runs, updates and removes the actual reference rule', () => {
		const catalog = project();
		copyReference(catalog, 'library');
		commit(catalog);
		const root = project();
		expect(cli(root, ['init', '--json']).status).toBe(0);
		write(
			root,
			'agent-tests.config.yaml',
			JSON.stringify({ library: { repository: catalog, ref: 'main' } })
		);
		write(root, 'src/help/welcome.md', 'We are gonna save your changes.');
		commit(root);
		const remote = cli(root, ['list', '--remote', '--json']);
		expect(remote.status, remote.stderr).toBe(0);
		expect(JSON.parse(remote.stdout).tests[0].id).toBe(referenceId);
		const added = cli(root, ['add', referenceId, '--json']);
		expect(added.status, added.stderr).toBe(0);
		const installed = JSON.parse(added.stdout).results[0];
		expect(installed).toMatchObject({
			id: referenceId,
			status: 'added',
			evals: { passed: 5, failed: 0 }
		});
		expect(installed.brief).toContain(`# Compile ${referenceId}`);
		const source = path.join(root, '.agents/tests', referenceId, '.agent-tests-source.json');
		expect(JSON.parse(readFileSync(source, 'utf8')).commit).toMatch(/^[a-f0-9]{40}$/);
		expect(cli(root, ['compile', referenceId]).stdout).toContain('Required source: sha256:');
		expect(cli(root, ['validate', referenceId]).status).toBe(0);
		const evaluated = cli(root, ['eval', referenceId, '--json']);
		expect(evaluated.status, evaluated.stderr).toBe(0);
		expect(JSON.parse(evaluated.stdout).results[0]).toMatchObject({ passed: 5, failed: 0 });
		const listed = cli(root, ['list']);
		expect(listed.stdout).toContain(`└── ${referenceId}`);
		const targets = cli(root, ['targets', referenceId, '--json']);
		expect(JSON.parse(targets.stdout).files).toEqual(['src/help/welcome.md']);
		const failed = cli(root, ['run', '--json']);
		expect(failed.status).toBe(1);
		expect(JSON.parse(failed.stdout).findings[0]).toMatchObject({
			file: 'src/help/welcome.md',
			level: 'fast'
		});
		write(root, 'src/help/welcome.md', 'We are going to save your changes.');
		expect(cli(root, ['run']).status).toBe(0);
		const updated = cli(root, ['update', referenceId, '--json']);
		expect(updated.status, updated.stderr).toBe(0);
		expect(JSON.parse(updated.stdout).results[0].status).toBe('unchanged');
		expect(cli(root, ['remove', referenceId, '--json']).status).toBe(0);
		expect(existsSync(source)).toBe(false);
	});
});
