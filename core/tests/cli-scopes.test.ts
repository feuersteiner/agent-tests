import { afterAll, describe, expect, it } from 'vitest';
import {
	cleanup,
	cli,
	commit,
	copyReference,
	git,
	project,
	referenceId,
	write
} from './cli-fixtures.js';

afterAll(cleanup);

describe('built CLI run scopes', () => {
	it('uses staged contents, changed working contents, path filters and -- delimiter', () => {
		const root = project();
		copyReference(root);
		write(root, 'src/help/welcome.md', 'We are going to save your changes.');
		commit(root);
		write(root, 'src/help/welcome.md', 'We are gonna save your changes.');
		git(root, ['add', 'src/help/welcome.md']);
		write(root, 'src/help/welcome.md', 'We are going to save your changes.');
		expect(cli(root, ['run', '--staged']).status).toBe(1);
		expect(cli(root, ['run', '--changed']).status).toBe(0);
		const filtered = cli(root, ['run', '--json', '--', 'src/other']);
		expect(JSON.parse(filtered.stdout)).toMatchObject({ checked: 0, findings: [] });
		expect(cli(root, ['run', '--', '--help']).stdout).toContain('0 checked');
		const targets = cli(root, ['targets', referenceId, '--staged', '--json']);
		expect(JSON.parse(targets.stdout).files).toEqual(['src/help/welcome.md']);
	});

	it('selects committed changes against --base and emits GitHub annotations separately from JSON', () => {
		const root = project();
		copyReference(root);
		write(root, 'src/help/welcome.md', 'We are going to save your changes.');
		commit(root);
		git(root, ['checkout', '--quiet', '-b', 'feature']);
		write(root, 'src/help/welcome.md', 'We are gonna save your changes.');
		commit(root);
		const result = cli(root, ['run', '--base=main', '--json'], { GITHUB_ACTIONS: 'true' });
		expect(result.status).toBe(1);
		expect(JSON.parse(result.stdout).findings).toHaveLength(1);
		expect(result.stderr).toContain('::error file=src/help/welcome.md,line=1');
		expect(result.stderr).toContain('formal-vocabulary');
	});
});
