import type { PluginArray } from './types.js';

/** Mask comments and strings, marking string starts; dynamic templates require manual integration. */
export const maskSource = (source: string): string | undefined => {
	const chars = source.split('');
	for (let i = 0; i < source.length; i++) {
		const char = source[i];
		if (char === '`') return undefined;
		if (char === '/' && source[i + 1] !== '/' && source[i + 1] !== '*') return undefined;
		if (char === '"' || char === "'") {
			const quote = char;
			chars[i] = '#';
			for (i++; i < source.length; i++) {
				chars[i] = source[i] === '\n' ? '\n' : ' ';
				if (source[i] === '\\') {
					chars[++i] = ' ';
					continue;
				}
				if (source[i] === quote) break;
			}
		} else if (char === '/' && source[i + 1] === '/')
			while (i < source.length && source[i] !== '\n') chars[i++] = ' ';
		else if (char === '/' && source[i + 1] === '*') {
			chars[i++] = ' ';
			while (i < source.length) {
				chars[i] = source[i] === '\n' ? '\n' : ' ';
				if (source[i] === '*' && source[i + 1] === '/') {
					chars[++i] = ' ';
					break;
				}
				i++;
			}
		}
	}
	return chars.join('');
};

/** Locate a matching bracket in already-masked source. */
export const closingBracket = (code: string, start: number): number | undefined => {
	const pairs: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
	const stack: string[] = [];
	for (let i = start; i < code.length; i++) {
		const char = code[i]!;
		if (pairs[char]) stack.push(pairs[char]!);
		else if (['}', ']', ')'].includes(char)) {
			if (stack.pop() !== char) return undefined;
			if (stack.length === 0) return i;
		}
	}
	return undefined;
};

/** Locate a literal root plugins array; refuse spreads and computed root keys that may override it. */
export const pluginArray = (code: string, start: number, end: number): PluginArray => {
	let found: PluginArray = {};
	let propertyStart = true;
	let propertyKey = true;
	for (let i = start + 1; i < end; i++) {
		if (/\s/.test(code[i]!)) continue;
		if (code[i] === ',') {
			propertyStart = true;
			propertyKey = true;
			continue;
		}
		if (propertyKey && ['[', '\\', '#'].includes(code[i]!)) return { unsupported: true };
		if (code[i] === ':') {
			if (propertyStart) return { unsupported: true };
			propertyKey = false;
		}
		propertyStart = false;
		if (code.slice(i, i + 3) === '...') return { unsupported: true };
		const property = code.slice(i).match(/^plugins\s*:\s*/);
		if (/^plugins\b/.test(code.slice(i)) && !/[\w$]/.test(code[i - 1] ?? '')) {
			if (!property || found.start !== undefined) return { unsupported: true };
			const open = i + property[0].length;
			if (code[open] !== '[') return { unsupported: true };
			found = { start: open, end: closingBracket(code, open) };
			if (found.end === undefined) return { unsupported: true };
			i = found.end;
			continue;
		}
		if (['{', '[', '('].includes(code[i]!)) {
			const close = closingBracket(code, i);
			if (close === undefined) return { unsupported: true };
			i = close;
		}
	}
	return found;
};

/** Escape a JavaScript binding before using it in a matching expression. */
export const escapeIdentifier = (name: string): string =>
	name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Find active agentTests import bindings, excluding comments and string examples. */
export const importedNames = (source: string, code: string): string[] => {
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
