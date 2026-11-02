import type { CompilationSource } from './types.js';

/**
 * @param matches Sources collected under the selected root.
 * @param id Requested test id used in failure messages.
 * @returns The sole installed source.
 * @throws When no source exists or multiple owners install the same id.
 */
export const selectSource = (matches: CompilationSource[], id: string): CompilationSource => {
	if (matches.length === 0) throw new Error(`No installed TEST.md found for ${id}`);
	if (matches.length > 1) throw new Error(`Test id ${id} is ambiguous; use its owning directory`);
	return matches[0]!;
};
