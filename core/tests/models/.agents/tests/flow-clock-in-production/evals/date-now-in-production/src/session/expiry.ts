import type { Session } from './types.ts';

const IDLE_LIMIT_MS = 30 * 60 * 1000;

export const isExpired = (session: Session): boolean =>
	Date.now() >= session.expiresAt || Date.now() - session.lastSeenAt > IDLE_LIMIT_MS;
