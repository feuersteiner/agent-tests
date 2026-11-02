import { createHash } from 'node:crypto';

/** Hash provider configuration and credential identity without persisting the credential. */
export const modelIdentity = (configuration: unknown, credential: string | undefined): string =>
	createHash('sha256').update(JSON.stringify({ configuration, credential })).digest('hex');
