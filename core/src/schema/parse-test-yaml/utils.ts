import { parseDocument } from 'yaml';

/** Decode one document without duplicate keys or aliases; sanitize all YAML parser failures. */
export const parseYaml = (text: string): unknown => {
	try {
		const document = parseDocument(text, { uniqueKeys: true });
		if (document.errors.length > 0) throw new Error('Invalid YAML');
		return document.toJS({ maxAliasCount: 0 });
	} catch {
		throw new Error('Invalid test YAML');
	}
};
