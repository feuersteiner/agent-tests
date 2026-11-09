import { GlobEngine } from '../shared/engines/glob.ts';
import { GrepEngine } from '../shared/engines/grep.ts';
import type { SourceFilter } from './types.ts';

/**
 * Every filter answers one question: did this source pass?
 *
 * - `true` means the source PASSED this filter. The trigger moves on to the next filter present.
 *   If this was the last filter, the source has passed the trigger.
 * - `false` means the source FAILED this filter, and the filter adds itself to the trace.
 *   The source has failed the trigger, and later filters do not run.
 */

const glob = new GlobEngine();
const grep = new GrepEngine();

/** Returns `true` (passed) if any glob matches the path, `false` (failed) if none match. */
const GlobFilter: SourceFilter = async (source, param, _config, trace) => {
	const passed = glob.run(source, param);
	if (!passed) trace.push('failed glob');
	return passed;
};

/**
 * Returns `true` (passed) if any regex matches the content, `false` (failed) if none match.
 * Compiles every regex before reading the source.
 */
const GrepFilter: SourceFilter = async (source, param, _config, trace) => {
	const passed = await grep.run(source, param);
	if (!passed) trace.push('failed grep');
	return passed;
};

/**
 * Returns `true` (passed) at the first condition reaching the threshold,
 * `false` (failed) if every condition scores below it.
 */
const AskFilter: SourceFilter = async (source, param, { ai, threshold }, trace) => {
	const input = await source.open();
	for (const condition of [param].flat()) {
		if ((await ai.decide.run({ input, ask: condition })) >= threshold) return true;
	}
	trace.push('failed ask');
	return false;
};

const TriggerFilters = {
	AskFilter,
	GrepFilter,
	GlobFilter
};

export default TriggerFilters;
