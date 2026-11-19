import { createHash } from 'node:crypto';
import { createEngines } from '../../core/index.ts';
import type { AgentTestEnv } from '../../core/types.ts';
import type { Case, Contender } from './types.ts';

/** Answers one case in one repeat with the probability that the file passes. */
export type Decider = (item: Case, repeat: number) => Promise<number>;

/**
 * The package's own decide engine for the contender, so a decision takes the path a real run
 * takes: the same prompt, the same SDK call. The reasoning section is required by the engines'
 * config but never used: benchmark Tests have no `reason`, and its model is created lazily.
 */
export const createDecider = (contender: Contender, env: AgentTestEnv): Decider => {
	const { decide } = createEngines(
		{
			decision: contender.decision,
			reasoning: { ...contender.decision, api: 'openai', model: 'unused' }
		},
		env
	);
	return ({ content, criterion }) => decide(content, criterion);
};

/** A number in [0, 1) fixed by `seed`. */
const noise = (seed: string): number =>
	createHash('sha256').update(seed).digest().readUInt32BE(0) / 2 ** 32;

/**
 * A fake model for dry runs: usually right, sometimes wrong, sometimes unsure, and now and then it
 * throws, all fixed by the contender, case and repeat. It exists to exercise the pipeline without
 * keys; what it produces says nothing about any real model.
 */
export const createFakeDecider =
	(contender: Contender): Decider =>
	async ({ id, expect }, repeat) => {
		await new Promise((resolve) =>
			setTimeout(resolve, 1 + noise(`wait ${contender.id} ${id}`) * 4)
		);
		if (noise(`throw ${contender.id} ${id} ${repeat}`) < 0.01) throw new Error('Fake failure');
		const wrong = noise(`wrong ${contender.id} ${id}`) < 0.12;
		const unsure = noise(`unsure ${contender.id} ${id}`) < 0.1;
		const jitter = noise(`jitter ${contender.id} ${id} ${repeat}`);
		const confidence = unsure ? 0.35 + jitter * 0.3 : 0.8 + jitter * 0.2;
		return (expect === 'pass') !== wrong ? confidence : 1 - confidence;
	};
