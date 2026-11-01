import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);

/** Runs an evaluation in an isolated Git repository and removes it even after a failure. */
export const withFixtureRepository = async <Result>(
	run: (directory: string) => Promise<Result>
): Promise<Result> => {
	const directory = await mkdtemp(join(tmpdir(), 'agent-tests-eval-'));
	try {
		await execute('git', ['init', '--quiet', directory]);
		return await run(directory);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
};
