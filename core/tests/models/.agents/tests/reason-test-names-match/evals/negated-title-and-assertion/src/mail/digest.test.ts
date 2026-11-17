import { expect, it, vi } from 'vitest';
import { sendDigest } from './digest.ts';

it('does not send the digest to a user who opted out', async () => {
	const send = vi.fn();
	await sendDigest({ email: 'ada@example.com', digestOptOut: true }, send);
	expect(send).not.toHaveBeenCalled();
});

it('sends the digest to a user who did not opt out', async () => {
	const send = vi.fn();
	await sendDigest({ email: 'grace@example.com', digestOptOut: false }, send);
	expect(send).toHaveBeenCalledTimes(1);
});
