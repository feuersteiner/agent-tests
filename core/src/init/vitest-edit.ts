import { closingBracket, maskSource, pluginArray } from './config-structure.js';
import type { ConfigEdit } from './types.js';

const manual =
	'Preserved dynamic Vitest config. Import { agentTests } from agent-tests/vitest and add agentTests() to its root plugins array.';

const escapeIdentifier = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const importedNames = (source: string, code: string): string[] => {
	const names: string[] = [];
	const imports = source.matchAll(/import\s*{([^}]+)}\s*from\s*['"]agent-tests\/vitest['"]/g);
	for (const match of imports) {
		if (match.index === undefined || code.slice(match.index, match.index + 6) !== 'import')
			continue;
		const opening = code.indexOf('{', match.index);
		const closing = code.indexOf('}', opening);
		for (const entry of code.slice(opening + 1, closing).split(',')) {
			const name = entry.trim().match(/^agentTests(?:\s+as\s+([\w$]+))?$/);
			if (name) names.push(name[1] ?? 'agentTests');
		}
	}

	return names;
};

/** Add the plugin to a literal exported configuration, preserving unrelated source and behavior. */
export const editVitestConfiguration = (source: string): ConfigEdit => {
	const code = maskSource(source);
	if (code === undefined || /['"]plugins['"]\s*:/.test(source)) return { reason: manual };
	const match = code.match(/export\s+default\s+(?:defineConfig\s*\(\s*)?{/);
	if (!match || match.index === undefined) return { reason: manual };
	const start = match.index + match[0].lastIndexOf('{');
	const end = closingBracket(code, start);
	if (end === undefined) return { reason: manual };
	const array = pluginArray(code, start, end);
	if (array.unsupported || (array.start !== undefined && array.end === undefined))
		return { reason: manual };
	const names = importedNames(source, code);
	if (array.start !== undefined && array.end !== undefined) {
		const body = code.slice(array.start + 1, array.end);
		if (
			names.some((name) => new RegExp(`(?:^|[^\\w$])${escapeIdentifier(name)}\\s*\\(`).test(body))
		)
			return {};
	}
	let name = names[0] ?? 'agentTestsPlugin';
	if (names.length === 0) while (new RegExp(`\\b${name}\\b`).test(code)) name = `_${name}`;

	let changed: string;
	if (array.start !== undefined && array.end !== undefined) {
		const body = code.slice(array.start + 1, array.end).trim();
		const comma = body && !body.endsWith(',') ? ',' : '';
		changed = `${source.slice(0, array.end)}${comma}\n\t\t${name}()\n\t${source.slice(array.end)}`;
	} else {
		const comma = code.slice(start + 1, end).trim() ? ',' : '';
		changed = `${source.slice(0, start + 1)}\n\tplugins: [${name}()]${comma}${source.slice(start + 1)}`;
	}
	if (names.length === 0)
		changed = `import { agentTests as ${name} } from 'agent-tests/vitest';\n${changed}`;
	return { content: changed };
};
