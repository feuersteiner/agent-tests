import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DecisionRequest, DecisionResponse } from '../../models/index.js';
import type { CachedModelState } from './types.js';

/** Read a valid answer or atomically publish a fresh one; model and filesystem failures propagate. */
export const readOrDecide = async (
	request: DecisionRequest,
	key: string,
	state: CachedModelState
): Promise<DecisionResponse> => {
	await mkdir(state.directory, { recursive: true });
	const path = join(state.directory, `${key}.json`);
	try {
		const answer = JSON.parse(await readFile(path, 'utf8')) as DecisionResponse;
		if (['pass', 'fail', 'unsure'].includes(answer.decision)) return answer;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
			if (!(error instanceof SyntaxError)) throw error;
	}
	const answer = await state.model.decide(request);
	const temporary = `${path}.${randomUUID()}`;
	await writeFile(temporary, JSON.stringify(answer), { mode: 0o600 });
	await rename(temporary, path);
	return answer;
};
