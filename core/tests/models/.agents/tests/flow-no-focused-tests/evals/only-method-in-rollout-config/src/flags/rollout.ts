import { flag } from './flag.ts';

/** Which accounts see each feature while it rolls out. */
export const rollout = {
	newCheckout: flag('new-checkout').only(['beta-testers', 'staff']),
	darkMode: flag('dark-mode').everyone(),
	bulkExport: flag('bulk-export').only(['enterprise'])
};
