import type { RunScope } from '../types.js';

/** Canonical scope and selected relative paths ready for content reads. */
export interface CandidateSelection {
	root: string;
	gitRoot: string | undefined;
	scope: RunScope;
	filters: string[];
	paths: string[];
}
