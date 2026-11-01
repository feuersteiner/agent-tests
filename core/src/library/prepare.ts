import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateTest } from '../evals/index.js';
import { parseTestYaml } from '../schema/index.js';
import { validateTest } from '../validation/index.js';
import type { DecisionModel } from '../models/index.js';
import type { EvalResult } from '../evals/index.js';
import type { LibraryFiles } from './types.js';

/** Verify remote bytes and run the real eval pipeline before changing an installed test. */
export const prepareTest = async (
	id: string,
	files: LibraryFiles,
	model?: DecisionModel
): Promise<EvalResult> => {
	const temporary = await mkdtemp(join(tmpdir(), 'agent-tests-install-'));
	try {
		const directory = join(temporary, id);
		await mkdir(directory);
		await Promise.all([
			writeFile(join(directory, 'TEST.md'), files.prose),
			writeFile(join(directory, 'test.yaml'), files.yaml)
		]);
		const validation = await validateTest(directory);
		if (!validation.valid)
			throw new Error(
				`Library test '${id}' failed validation: ${validation.issues.map((issue) => issue.code).join(', ')}.`
			);
		return await evaluateTest(parseTestYaml(files.yaml), model);
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
};
