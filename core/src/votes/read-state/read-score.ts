import { api, scoreRows } from '../utils.js';
import { requireRegularScore } from './read-mode.js';
import type { GhRunner } from '../types.js';
import type { ContentFile, ScoreState, VoteSnapshot } from './types.js';

/**
 * Read a declarative test and its optional score at the pinned commit, without writes.
 * @param snapshot Validated repository, commit and login.
 * @param id Library test ID.
 * @param gh Read-only GitHub transport.
 * @returns Canonical score, optional blob SHA and current author membership.
 * @throws Rejects missing tests, unsafe/incomplete score metadata, invalid encoding
 * or malformed/duplicate rows; propagates read failures.
 */
export const readScore = async (
	snapshot: VoteSnapshot,
	id: string,
	gh: GhRunner
): Promise<ScoreState> => {
	const { repository } = snapshot;
	const directory = `repos/${repository}/contents/library/${id}`;
	const files = await api<ContentFile[]>(gh, `${directory}?ref=${snapshot.commit}`);
	if (
		!Array.isArray(files) ||
		!files.some((file) => file.name === 'test.yaml' && file.type === 'file')
	)
		throw new Error('The requested library test does not exist on main.');
	let score = 'github_handle\n';
	let scoreSha: string | undefined;
	if (files.some((file) => file.name === 'score.csv')) {
		await requireRegularScore(repository, id, snapshot.commit, gh);
		const content = await api<{ encoding: string; content: string; sha: string }>(
			gh,
			`${directory}/score.csv?ref=${snapshot.commit}`
		);
		if (content.encoding !== 'base64') throw new Error('Unsupported score.csv encoding.');
		score = Buffer.from(content.content, 'base64').toString('utf8');
		scoreSha = content.sha;
	}
	const rows = scoreRows(score);
	return {
		score,
		...(scoreSha ? { scoreSha } : {}),
		current: rows.some((row) => row.toLowerCase() === snapshot.login.toLowerCase())
	};
};
