import type { TypedSource } from '../source.ts';
import type { Param } from '../types.ts';

/** Match file content against any case-sensitive JavaScript regex, without flags. */
export class GrepEngine {
	public readonly run = async (source: TypedSource, param: Param): Promise<boolean> => {
		if (source.kind !== 'file') throw new Error(`grep requires a file: ${source.path}`);
		const patterns = [param].flat().map((pattern) => new RegExp(pattern));
		const content = await source.open();
		return patterns.some((pattern) => pattern.test(content));
	};
}
