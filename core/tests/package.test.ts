import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { root, temporary } from './support.ts';

describe('published Node distribution', () => {
	it('packs and installs only runtime artifacts and exposes usable public declarations', () => {
		const dir = temporary();
		const packed = JSON.parse(
			execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', dir], {
				cwd: join(root, 'core'),
				encoding: 'utf8'
			})
		)[0];
		const files = packed.files.map((file: { path: string }) => file.path);
		expect(files).toEqual(
			expect.arrayContaining([
				'dist/index.js',
				'dist/index.d.ts',
				'dist/types.js',
				'dist/src/types.d.ts',
				'dist/cli/index.js'
			])
		);
		expect(files.some((file: string) => /^(src|cli|tests)\//.test(file))).toBe(false);
		writeFileSync(join(dir, 'package.json'), '{"private":true,"type":"module"}');
		execFileSync(
			'npm',
			[
				'install',
				'--ignore-scripts',
				'--no-audit',
				'--no-fund',
				'--package-lock=false',
				'--omit=dev',
				join(dir, packed.filename)
			],
			{ cwd: dir, stdio: 'pipe' }
		);
		const installed = JSON.parse(
			readFileSync(join(dir, 'node_modules/agent-tests/package.json'), 'utf8')
		);
		expect(Object.keys(installed.dependencies)).toEqual(['zod']);
		const output = execFileSync(
			process.execPath,
			[
				'--input-type=module',
				'-e',
				"import {AgentTest, Source} from 'agent-tests'; import {AgentTestConfigSchema} from 'agent-tests/types'; console.log(typeof AgentTest, typeof Source, typeof AgentTestConfigSchema.parse)"
			],
			{ cwd: dir, encoding: 'utf8' }
		);
		expect(output.trim()).toBe('function function function');
		const entry = join(dir, 'node_modules/agent-tests/dist/cli/index.js');
		expect(readFileSync(entry, 'utf8').startsWith('#!/usr/bin/env node')).toBe(true);
		expect(
			execFileSync(process.execPath, [entry, '--help'], { cwd: dir, encoding: 'utf8' })
		).toContain('--staged');
		writeFileSync(
			join(dir, 'consumer.ts'),
			"import { AgentTest, Source } from 'agent-tests'; import type { AgentTestConfig } from 'agent-tests/types'; export const create = (config: AgentTestConfig, definition: unknown) => new AgentTest([new Source('a.md', async () => 'text')], definition, config);\n"
		);
		execFileSync(
			process.execPath,
			[
				join(root, 'node_modules/typescript/bin/tsc'),
				'--noEmit',
				'--strict',
				'--target',
				'ES2022',
				'--module',
				'NodeNext',
				'--moduleResolution',
				'NodeNext',
				'consumer.ts'
			],
			{ cwd: dir, stdio: 'pipe' }
		);
	}, 60000);
});
