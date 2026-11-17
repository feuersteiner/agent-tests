import { every } from './scheduler.ts';
import { sendReminders } from './reminders.ts';
import { pruneSessions } from './sessions.ts';

const REMINDER_INTERVAL_MS = 90_000; // 90 seconds
const PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

every(REMINDER_INTERVAL_MS, sendReminders);
every(PRUNE_INTERVAL_MS, pruneSessions);
