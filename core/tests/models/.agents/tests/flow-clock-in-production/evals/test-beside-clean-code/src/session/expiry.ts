import { clock } from '../../lib/clock.ts';
import type { Session } from './types.ts';

const IDLE_LIMIT_MS = 30 * 60 * 1000;

export const isExpired = (session: Session): boolean => {
	const now = clock.now().getTime();
	return now >= session.expiresAt || now - session.lastSeenAt > IDLE_LIMIT_MS;
};
