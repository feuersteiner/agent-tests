/* eslint-disable no-bitwise */
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Generates an 8-character id for share links. */
export const generateShortId = (): string => {
	const bytes = crypto.getRandomValues(new Uint8Array(8));
	let id = '';
	for (const byte of bytes) id += ALPHABET[(byte >>> 0) % ALPHABET.length];
	return id;
};
