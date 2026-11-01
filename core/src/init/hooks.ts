import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { createFile } from './files.js';
import { hook } from './templates.js';
import type { InitResult } from './types.js';

const execute = promisify(execFile);

/** Install only a missing default Git hook; custom hooksPath and existing hooks are preserved. */
export const installHook = async (result: InitResult): Promise<void> => {
	try {
		await execute('git', ['rev-parse', '--git-dir'], { cwd: result.root });
	} catch {
		result.warnings.push(
			'Pre-commit hook requires a Git repository; initialize Git and rerun --hook.'
		);
		result.exitCode = 2;
		return;
	}
	try {
		const configured = await execute('git', ['config', '--get', 'core.hooksPath'], {
			cwd: result.root
		});
		if (configured.stdout.trim()) {
			result.warnings.push(
				'Existing core.hooksPath is preserved. Add npx --no -- agent-tests run --staged to your hook.'
			);
			return;
		}
	} catch (error) {
		if ((error as { code?: number }).code !== 1) throw error;
	}
	const resolved = await execute('git', ['rev-parse', '--git-path', 'hooks'], { cwd: result.root });
	const name = relative(result.root, resolve(result.root, resolved.stdout.trim(), 'pre-commit'));
	if (isAbsolute(name) || name === '..' || name.startsWith(`..${sep}`)) {
		result.warnings.push(
			'Shared Git hooks are outside this checkout; install run --staged manually.'
		);
		return;
	}
	await createFile(result, name, hook, 0o755);
};
