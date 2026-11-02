import {
	closingBracket,
	escapeIdentifier,
	importedNames,
	maskSource,
	pluginArray
} from './utils.js';
import type { ConfigurationInspection } from './types.js';

const manual =
	'Preserved dynamic Vitest config. Import { agentTests } from agent-tests/vitest and add agentTests() to its root plugins array.';

/** Inspect a literal root config; unsafe keys and dynamic shapes require manual integration. */
export const inspectConfiguration = (source: string): ConfigurationInspection => {
	const code = maskSource(source);
	if (code === undefined) return { edit: { reason: manual } };
	const match = code.match(/export\s+default\s+(?:defineConfig\s*\(\s*)?{/);
	if (!match || match.index === undefined) return { edit: { reason: manual } };
	const start = match.index + match[0].lastIndexOf('{');
	const end = closingBracket(code, start);
	if (end === undefined) return { edit: { reason: manual } };
	const array = pluginArray(code, start, end);
	if (array.unsupported || (array.start !== undefined && array.end === undefined))
		return { edit: { reason: manual } };
	const names = importedNames(source, code);
	if (array.start !== undefined && array.end !== undefined) {
		const body = code.slice(array.start + 1, array.end);
		if (
			names.some((name) => new RegExp(`(?:^|[^\\w$])${escapeIdentifier(name)}\\s*\\(`).test(body))
		)
			return { edit: {} };
	}
	return { edit: {}, context: { code, start, end, array, names } };
};
