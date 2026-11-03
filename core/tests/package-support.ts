import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface PackedFile {
	path: string;
}
interface PackResult {
	filename: string;
	files: PackedFile[];
}
export interface PackedProject {
	temporary: string;
	environment: NodeJS.ProcessEnv;
	offlineEnvironment: NodeJS.ProcessEnv;
	packed: PackResult;
}

/** Install the release tarball and its optional Vitest integration in a separate project. */
export const createPackedProject = (root: string): PackedProject => {
	const temporary = mkdtempSync(path.join(tmpdir(), 'agent-tests-package-'));
	const environment = { ...process.env, npm_config_cache: path.join(temporary, 'npm-cache') };
	if (!existsSync(path.join(root, 'core/dist-cli/index.js')))
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
	const packed = (JSON.parse(output) as PackResult[])[0]!;
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
			path.join(temporary, packed.filename),
			'vitest@5.0.5'
		],
		{ cwd: temporary, env: environment, stdio: 'pipe' }
	);
	return {
		temporary,
		environment,
		offlineEnvironment: { ...environment, npm_config_offline: 'true' },
		packed
	};
};
