import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DecisionModel, DecisionResponse } from '../models/index.js';

const fingerprint = (value: unknown): string =>
	createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Cache exact model requests across workers; rejected requests are never retained. */
export const createCachedModel = (
	model: DecisionModel | undefined,
	directory: string,
	identity: unknown
): DecisionModel | undefined => {
	if (!model) return undefined;
	const pending = new Map<string, Promise<DecisionResponse>>();
	return {
		decide: (request) => {
			const key = fingerprint({ version: 1, identity, request });
			const existing = pending.get(key);
			if (existing) return existing;
			const response = (async () => {
				await mkdir(directory, { recursive: true });
				const path = join(directory, `${key}.json`);
				try {
					const answer = JSON.parse(await readFile(path, 'utf8')) as DecisionResponse;
					if (['pass', 'fail', 'unsure'].includes(answer.decision)) return answer;
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
						if (!(error instanceof SyntaxError)) throw error;
				}
				const answer = await model.decide(request);
				const temporary = `${path}.${randomUUID()}`;
				await writeFile(temporary, JSON.stringify(answer), { mode: 0o600 });
				await rename(temporary, path);
				return answer;
			})();
			pending.set(key, response);
			response.catch(() => pending.delete(key));
			return response;
		}
	};
};

/** Include the provider, model, endpoint and credential identity without persisting the credential. */
export const modelIdentity = (configuration: unknown, credential: string | undefined): string =>
	fingerprint({ configuration, credential });
