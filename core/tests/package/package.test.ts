import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pkg from '../../index.ts';

/** The package folder, core/, resolved from this file. */
const CORE = fileURLToPath(new URL('../..', import.meta.url));

/** The built output the package ships. */
const DIST = join(CORE, 'dist');

/** The package manifest, read from disk as the registry and Node see it. */
const manifest = JSON.parse(readFileSync(join(CORE, 'package.json'), 'utf8')) as {
	bin: Record<string, string>;
	exports: Record<string, Record<string, string>>;
	files: string[];
	engines: { node: string };
};

/** Every file path under dist/, relative to core/. */
const distFiles = (): string[] =>
	readdirSync(DIST, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile())
		.map((entry) => join(entry.parentPath, entry.name).slice(CORE.length));

describe('public exports', () => {
	test('index.ts exports exactly the expected runtime names', () => {
		expect(Object.keys(pkg).sort()).toEqual([
			'AgentTests',
			'AssertOrchestrator',
			'CONFIG_PATH',
			'DirectorySource',
			'EVAL_FILE',
			'EvalOrchestrator',
			'FileSource',
			'InMemorySource',
			'LATEST_VERSION',
			'ScopeOrchestrator',
			'SelectOrchestrator',
			'Source',
			'createEngines',
			'loadConfig',
			'loadDefinitions',
			'loadEvalDefinitions',
			'loadEvalFiles',
			'loadTestFiles',
			'parseConfig',
			'parseEval',
			'parseTest',
			'validateConfig',
			'validateEval',
			'validateTest'
		]);
	});
});

describe('package.json', () => {
	test.each(Object.entries(manifest.bin))('bin %s points at a built file', (_name, path) => {
		expect(path.startsWith('./dist/')).toBe(true);
		expect(existsSync(join(CORE, path))).toBe(true);
	});

	test.each(
		Object.entries(manifest.exports).flatMap(([entry, conditions]) =>
			Object.entries(conditions).map(([condition, path]) => [entry, condition, path] as const)
		)
	)('exports %s %s points at a built file', (_entry, _condition, path) => {
		expect(path.startsWith('./dist/')).toBe(true);
		expect(existsSync(join(CORE, path))).toBe(true);
	});

	test('the built CLI entry starts with the node shebang', () => {
		const entry = manifest.bin['agent-tests'] ?? '';
		const firstLine = readFileSync(join(CORE, entry), 'utf8').split('\n')[0];
		expect(firstLine).toBe('#!/usr/bin/env node');
	});

	test('files ships only dist, README.md and LICENSE', () => {
		expect([...manifest.files].sort()).toEqual(['LICENSE', 'README.md', 'dist']);
	});

	test('engines requires Node 22 or later', () => {
		expect(manifest.engines.node).toMatch(/^>=\s*22(\.0){0,2}$/);
	});
});

describe('dist', () => {
	test('contains no test files', () => {
		const testFiles = distFiles().filter(
			(path) => /\.(test|spec)\.[cm]?[jt]s$/.test(path) || path.split(sep).includes('tests')
		);
		expect(distFiles().length).toBeGreaterThan(0);
		expect(testFiles).toEqual([]);
	});
});
