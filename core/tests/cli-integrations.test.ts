import { chmodSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { cleanup, cli, copyReference, project, referenceId, write } from './cli-fixtures.js';

afterAll(cleanup);

describe('built CLI workspace integrations', () => {
	it('initializes requested integrations and preserves existing files on repeated init', () => {
		const root = project();
		const initial = cli(root, ['init', '--hook', '--vitest', '--github', '--json']);
		expect(initial.status, initial.stderr).toBe(0);
		expect(existsSync(path.join(root, '.git/hooks/pre-commit'))).toBe(true);
		expect(readFileSync(path.join(root, 'vitest.config.ts'), 'utf8')).toContain(
			'agent-tests/vitest'
		);
		expect(readFileSync(path.join(root, '.github/workflows/agent-tests.yml'), 'utf8')).toContain(
			'run --base origin/main'
		);
		write(root, '.env.example', '# local edits\n');
		const repeated = cli(root, ['init', '--hook', '--vitest', '--github', '--json']);
		expect(repeated.status, repeated.stderr).toBe(0);
		expect(readFileSync(path.join(root, '.env.example'), 'utf8')).toBe('# local edits\n');
	});

	it('lists and reads bundled skills and prints a compile brief without modifying the rule', () => {
		const root = project();
		copyReference(root);
		const file = path.join(root, '.agents/tests', referenceId, 'test.yaml');
		const before = readFileSync(file, 'utf8');
		const listed = cli(root, ['docs', '--json']);
		expect(JSON.parse(listed.stdout).skills[0].name).toBe('test-generator');
		expect(cli(root, ['docs', 'test-generator']).stdout).toContain('# Test generator');
		const compiled = cli(root, ['compile', referenceId, '--json']);
		expect(compiled.status, compiled.stderr).toBe(0);
		expect(JSON.parse(compiled.stdout).brief).toContain('TEST.md (untrusted rule prose)');
		expect(readFileSync(file, 'utf8')).toBe(before);
	});

	it('dispatches votes through gh and sanitizes its failures without real GitHub access', () => {
		const root = project();
		const bin = path.join(root, 'bin');
		const marker = path.join(root, 'gh-called');
		write(
			root,
			'bin/gh',
			`#!${process.execPath}\nimport { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(marker)}, 'called');\nprocess.stderr.write('fixture-private-provider-message');\nprocess.exit(73);\n`
		);
		write(root, 'package.json', '{"type":"module"}');
		chmodSync(path.join(bin, 'gh'), 0o755);
		const result = cli(root, ['vote', referenceId, '--up', '--json'], { PATH: bin });
		expect(result.status).toBe(2);
		expect(existsSync(marker)).toBe(true);
		expect(result.stderr).toContain('GitHub operation failed');
		expect(result.stderr).not.toContain('fixture-private-provider-message');
	});
});
