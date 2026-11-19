import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { extractEslintCases } from '../src/eslint-cases.ts';
import { ESLINT_COMMIT, ESLINT_RULES } from '../src/eslint-rules.ts';
import type { BenchmarkMeta } from '../src/types.ts';

/**
 * Rewrites the linter tier from a checkout of ESLint at the pinned commit:
 * `bun run import:eslint <path to the eslint checkout>`. It reads the rule test files as text and
 * never runs them.
 */
const [checkout] = process.argv.slice(2);
if (!checkout) {
	console.error('Usage: bun run import:eslint <path to an eslint checkout>');
	process.exit(2);
}
const head = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], {
	encoding: 'utf8'
}).trim();
if (head !== ESLINT_COMMIT) {
	console.error(`Error: the checkout is at ${head}; check out ${ESLINT_COMMIT}`);
	process.exit(2);
}

const hashOf = (code: string): string =>
	createHash('sha256').update(code).digest('hex').slice(0, 6);

for (const { rule, title, statement, criterion, error, pass, fail } of ESLINT_RULES) {
	const id = `eslint-${rule}`;
	const folder = join('.agents/tests', id);
	const path = `tests/lib/rules/${rule}.js`;
	const cases = extractEslintCases(readFileSync(join(checkout, path), 'utf8'));
	const meta: BenchmarkMeta = {
		tier: 'linter',
		category: 'code',
		source: `ESLint rule tests, ${path}`,
		licence: 'MIT',
		url: `https://github.com/eslint/eslint/blob/${ESLINT_COMMIT}/${path}`,
		commit: ESLINT_COMMIT
	};
	rmSync(folder, { recursive: true, force: true });
	mkdirSync(folder, { recursive: true });
	writeFileSync(
		join(folder, 'TEST.md'),
		`# ${title}\n\n${statement}\n\nApplies to the JavaScript files under \`src/\`. The rule and its cases come from ESLint's \`${rule}\`.\n`
	);
	writeFileSync(
		join(folder, 'test.yaml'),
		stringify({
			version: 1,
			id,
			title,
			description: statement,
			select: { glob: 'src/**/*.js' },
			assert: [{ id: rule, description: statement, error, decide: criterion }]
		})
	);
	writeFileSync(join(folder, 'benchmark.yaml'), stringify(meta));
	for (const [expect, hashes] of [
		['pass', pass],
		['fail', fail]
	] as const)
		for (const hash of hashes) {
			const matches = [
				...new Set(cases.filter((item) => hashOf(item.code) === hash).map((item) => item.code))
			];
			const labels = new Set(
				cases.filter((item) => hashOf(item.code) === hash).map((item) => item.expect)
			);
			if (matches.length !== 1 || labels.size !== 1 || !labels.has(expect))
				throw new Error(`${rule}: ${hash} must name one snippet that ESLint labels ${expect}`);
			const root = join(folder, 'evals', `case-${hash}`);
			mkdirSync(join(root, 'src'), { recursive: true });
			writeFileSync(join(root, 'eval.yaml'), `expect: ${expect}\n`);
			writeFileSync(join(root, 'src/snippet.js'), `${matches[0]}\n`);
		}
	console.log(`${id}: ${pass.length} pass, ${fail.length} fail`);
}
