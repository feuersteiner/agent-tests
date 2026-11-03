import { describe, expect, it } from 'vitest';
import { createMockModel } from '../models/index.js';
import { evaluateChecks } from './evaluate-checks.js';
import { formatGitHubAnnotations } from './annotations/index.js';
import { referenceTest } from './test-support/fixture.js';

const target = { path: 'src/page.txt', content: 'Formal.' };

describe('missing and failed models', () => {
	it('skips unresolved model checks and retains successful fast checks', async () => {
		const definition = referenceTest();
		definition.checks.push({
			id: 'judgment',
			message: 'Informal.',
			fix: 'Rewrite.',
			smart: { ask: 'Check.' }
		});
		const result = await evaluateChecks(definition, target);
		expect(result).toMatchObject({ outcome: 'skip', checked: 1, findings: [] });
		expect(result.warnings[0]).toContain('Model unavailable');
		expect(result.skipped[0]).toMatchObject({ testId: definition.id, file: target.path });
	});

	it('retains definite failures when another check needs credentials', async () => {
		const definition = referenceTest();
		definition.checks.push({
			id: 'judgment',
			message: 'Informal.',
			fix: 'Rewrite.',
			deep: { ask: 'Check.' }
		});
		const result = await evaluateChecks(definition, { ...target, content: 'gonna' });
		expect(result.outcome).toBe('fail');
		expect(result.findings).toHaveLength(1);
		expect(result.skipped).toHaveLength(1);
	});

	it('never exposes provider errors or credential text', async () => {
		const model = createMockModel(() => {
			throw new Error('Secret sk-example-credential');
		});
		await expect(
			evaluateChecks(referenceTest({ deep: { ask: 'Check.' } }), target, model)
		).rejects.toThrow(/^Model evaluation failed for check formal-only at deep\.$/);
	});

	it('rejects invalid confidence instead of accepting a false pass', async () => {
		const model = createMockModel([{ decision: 'pass', confidence: Number.NaN }]);
		await expect(
			evaluateChecks(referenceTest({ smart: { ask: 'Check.' } }), target, model)
		).rejects.toThrow('Model evaluation failed');
	});
});

describe('GitHub annotations', () => {
	it('escapes command data and properties so findings cannot inject workflow commands', async () => {
		const result = await evaluateChecks(referenceTest(), {
			path: 'src/a,b:c%\n.txt',
			content: 'gonna'
		});
		result.findings[0]!.message = 'Bad%\n::error::injected\r';
		result.findings[0]!.fix = 'Use formal text.';
		const annotation = formatGitHubAnnotations(result.findings);
		expect(annotation).toContain('file=src/a%2Cb%3Ac%25%0A.txt,line=1,col=1');
		expect(annotation).toContain('Bad%25%0A::error::injected%0D');
		expect(annotation.split('\n')).toHaveLength(1);
	});
});
