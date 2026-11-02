import { createHash } from 'node:crypto';

/** Create a stable opaque filename for the exact serialized model request and identity. */
export const fingerprint = (value: unknown): string =>
	createHash('sha256').update(JSON.stringify(value)).digest('hex');
