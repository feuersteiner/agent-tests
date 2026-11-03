import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse, stringify } from 'yaml';
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

describe('built CLI explained outcomes', () => {
	it('reports missing-model skips and unrun evals without calling them passes', () => {
		const root = project();
		copyReference(root);
		const file = path.join(root, '.agents/tests', referenceId, 'test.yaml');
		const definition = parse(readFileSync(file, 'utf8'));
		definition.checks[0].smart = { ask: 'Does this prose contain informal vocabulary?' };
		write(root, `.agents/tests/${referenceId}/test.yaml`, stringify(definition));
		write(root, 'src/help/welcome.md', 'We are going to save your changes.');
		commit(root);
		const run = cli(root, ['run', '--json']);
		expect(run.status).toBe(0);
		const result = JSON.parse(run.stdout);
		expect(result.checked).toBe(0);
		expect(result.skipped).toHaveLength(1);
		expect(result.warnings.join('\n')).toMatch(/model/i);
		const evaluated = cli(root, ['eval', referenceId]);
		expect(evaluated.status).toBe(1);
		expect(evaluated.stdout).toContain('unrun: Formal customer documentation');
		expect(evaluated.stdout).toMatch(/warning:.*model/i);
		definition.triggers.path.ask = 'Is this customer-facing prose?';
		write(root, `.agents/tests/${referenceId}/test.yaml`, stringify(definition));
		const targets = cli(root, ['targets', referenceId, '--json']);
		expect(JSON.parse(targets.stdout)).toMatchObject({
			files: [],
			skipped: ['src/help/welcome.md']
		});
		expect(cli(root, ['targets', referenceId]).stdout).toContain(
			'skip: no-informal-english (src/help/welcome.md)'
		);
	});

	it('returns validation disagreement exit 1 and hides invalid configuration values', () => {
		const root = project();
		copyReference(root);
		write(
			root,
			`.agents/tests/${referenceId}/TEST.md`,
			'Changed prose makes the compiled rule stale.'
		);
		const validation = cli(root, ['validate', referenceId, '--json']);
		expect(validation.status).toBe(1);
		expect(JSON.parse(validation.stdout).results[0].valid).toBe(false);
		const privateValue = 'fixture-private-configuration-value';
		write(root, 'agent-tests.config.yaml', `apiKey: ${privateValue}\n`);
		const invalid = cli(root, ['eval', referenceId, '--json'], { CLI_PRIVATE_VALUE: privateValue });
		expect(invalid.status).toBe(2);
		expect(invalid.stdout + invalid.stderr).not.toContain(privateValue);
		expect(JSON.parse(invalid.stderr).exitCode).toBe(2);
	});

	it('explains each fast finding with location, check, level and fix', () => {
		const root = project();
		copyReference(root);
		write(root, 'src/help/welcome.md', 'Formal introduction.\nWe are gonna save your changes.');
		const result = cli(root, ['run']);
		expect(result.status).toBe(1);
		expect(result.stdout).toContain('src/help/welcome.md:2:');
		expect(result.stdout).toContain(`${referenceId}/formal-vocabulary (fast)`);
		expect(result.stdout).toContain('Replace gonna, wanna, or gotta');
	});
});
