import { isExcludedDirectory } from './is-excluded-directory.js';

/** Exclude generated, dependency, Git, and test-definition path components. */
export const isCandidatePath = (path: string): boolean =>
	!path.split('/').some(isExcludedDirectory);
