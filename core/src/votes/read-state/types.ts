import type { VoteState } from '../types.js';

/** Repository fields needed to pin reads and choose a writable destination. */
export interface RepositoryData {
	default_branch: string;
	permissions?: { push?: boolean };
}

/** Main snapshot metadata before score and pending PR discovery. */
export type VoteSnapshot = Pick<
	VoteState,
	'repository' | 'login' | 'branch' | 'commit' | 'canPush'
>;

/** Validated score contents and current author membership. */
export type ScoreState = Pick<VoteState, 'score' | 'scoreSha' | 'current'>;

/** Directory response fields used to locate declarative test and score files. */
export interface ContentFile {
	name: string;
	type: string;
}

/** Git tree metadata required before decoding any existing score blob. */
export interface GitTree {
	truncated?: boolean;
	tree: { path: string; mode: string; type: string }[];
}
