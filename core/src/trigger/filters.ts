import { minimatch } from 'minimatch';
import type { MinimatchOptions } from 'minimatch';
import type { SourceFilter } from './types.ts';

/** Fixed so that neither the runtime nor the OS changes which paths match. */
const GLOB_OPTIONS: MinimatchOptions = { dot: true, platform: 'linux' };

/** Match the source path against alternative globs. */
const GlobFilter: SourceFilter = async (source, param) =>
	[param].flat().some((pattern) => minimatch(source.path, pattern, GLOB_OPTIONS));

/** Match source content against alternative regexes, compiling all of them before reading it. */
const GrepFilter: SourceFilter = async (source, param) => {
	const regexes = [param].flat().map((pattern) => new RegExp(pattern));
	const content = await source.open();
	return regexes.some((regex) => regex.test(content));
};

/** Score source content against alternative conditions, stopping at the first pass. */
const AskFilter: SourceFilter = async (source, param, { ai, threshold }) => {
	const input = await source.open();
	for (const condition of [param].flat()) {
		if ((await ai.run({ input, ask: condition })) >= threshold) return true;
	}
	return false;
};

const TriggerFilters = {
	AskFilter,
	GrepFilter,
	GlobFilter
};

export default TriggerFilters;
