import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

interface PackedFile {
	path: string;
}

interface PackResult {
	filename: string;
	files: PackedFile[];
}

const root = fileURLToPath(new URL('../..', import.meta.url));
const temporary = mkdtempSync(path.join(tmpdir(), 'agent-tests-package-'));
const cache = path.join(temporary, 'npm-cache');
const environment = { ...process.env, npm_config_cache: cache };
const offlineEnvironment = { ...environment, npm_config_offline: 'true' };
let packed: PackResult;

/** Build and install the release artifact; command execution below is offline. */
beforeAll(() => {
	execFileSync('npm', ['run', 'build', '--workspace', 'agent-tests'], {
		cwd: root,
		env: environment,
		stdio: 'pipe'
	});
	const output = execFileSync(
		'npm',
		['pack', '--ignore-scripts', '--json', '--pack-destination', temporary],
		{ cwd: path.join(root, 'core'), env: environment, encoding: 'utf8' }
	);
	packed = (JSON.parse(output) as PackResult[])[0]!;
	writeFileSync(
		path.join(temporary, 'package.json'),
		JSON.stringify({ name: 'package-contract', private: true, type: 'module' })
	);
	execFileSync(
		'npm',
		[
			'install',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			'--package-lock=false',
			'--omit=dev',
			path.join(temporary, packed.filename)
		],
		{ cwd: temporary, env: environment, stdio: 'pipe' }
	);
}, 120_000);

afterAll(() => rmSync(temporary, { recursive: true, force: true }));

describe('published package', () => {
	it('ships Node JavaScript, public declarations, and an executable bin entry', () => {
		const files = packed.files.map((file) => file.path);
		expect(files).toContain('dist/index.js');
		expect(files).toContain('dist/index.d.ts');
		expect(files).toContain('dist-cli/index.js');
		expect(files.some((file) => /^(src|cli|tests)\//.test(file))).toBe(false);
		const entry = readFileSync(
			path.join(temporary, 'node_modules/agent-tests/dist-cli/index.js'),
			'utf8'
		);
		expect(entry.startsWith('#!/usr/bin/env node')).toBe(true);
	});

	it('runs npx help offline and lists every V1 command', () => {
		const output = execFileSync('npx', ['--offline', '--no', '--', 'agent-tests', '--help'], {
			cwd: temporary,
			env: offlineEnvironment,
			encoding: 'utf8'
		});
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
		])
			expect(output).toMatch(new RegExp(`^  ${command}(?: |$)`, 'm'));
	});

	it('imports the public library in a separate Node project offline', () => {
		const output = execFileSync(
			process.execPath,
			[
				'--input-type=module',
				'-e',
				"import { createRunResult, formatJson } from 'agent-tests'; console.log(formatJson(createRunResult()));"
			],
			{ cwd: temporary, env: offlineEnvironment, encoding: 'utf8' }
		);
		expect(JSON.parse(output)).toMatchObject({ exitCode: 0, checked: 0, findings: [] });
	});

	it('returns structured usage failures with exit 2', () => {
		const output = spawnSync(
			'npx',
			['--offline', '--no', '--', 'agent-tests', 'unknown', '--json'],
			{
				cwd: temporary,
				env: offlineEnvironment,
				encoding: 'utf8'
			}
		);
		expect(output.status).toBe(2);
		expect(JSON.parse(output.stderr)).toMatchObject({ exitCode: 2 });
	});
});
