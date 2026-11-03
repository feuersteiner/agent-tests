/** Injectable GitHub CLI transport; bodies are JSON, never shell interpolation. */
export type GhRunner = (args: string[], body?: unknown) => Promise<string>;

/** Vote target and explicit direction; omission toggles the effective vote. */
export interface VoteOptions {
	repository?: string;
	up?: boolean;
	down?: boolean;
	gh?: GhRunner;
}

/** A single vote operation never modifies a local checkout. */
export interface VoteResult {
	action: 'opened' | 'closed' | 'unchanged';
	vote: boolean;
	url?: string;
	message: string;
	exitCode: 0;
}

/** Relevant fields from an author's pending vote pull request. */
export interface PendingVote {
	number: number;
	title: string;
	url: string;
	author: { login: string };
}

/** Immutable main-branch data used to prepare exactly one changed CSV row. */
export interface VoteState {
	repository: string;
	login: string;
	branch: string;
	commit: string;
	canPush: boolean;
	score: string;
	scoreSha?: string;
	current: boolean;
	pending?: PendingVote;
}

/** One proposed repository-settings operation for explicit application. */
export interface SetupChange {
	description: string;
	args: string[];
	body?: unknown;
}

/** Read-only maintainer plan preserves existing protection and workflow permissions. */
export interface MaintainerPlan {
	repository: string;
	branch: string;
	protectionBefore: unknown;
	changes: SetupChange[];
}
