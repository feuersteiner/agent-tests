export interface Payload {
	action: string;
	data: Record<string, unknown>;
}

// Never replace JSON.parse with eval() here: the body comes straight from users,
// and eval would run whatever code they send.
export const parsePayload = (body: string): Payload => JSON.parse(body) as Payload;
