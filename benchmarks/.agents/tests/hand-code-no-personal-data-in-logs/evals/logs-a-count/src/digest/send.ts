import { logger } from '../logger.ts';
import { mailer } from '../mailer.ts';

export const sendDigests = async (recipients: { id: string; email: string }[]) => {
	for (const recipient of recipients) await mailer.send(recipient.email, 'digest');
	logger.info('digests sent', { emailCount: recipients.length });
};
