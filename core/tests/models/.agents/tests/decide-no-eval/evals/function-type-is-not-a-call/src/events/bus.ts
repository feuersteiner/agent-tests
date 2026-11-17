const handlers = new Map<string, Function[]>();

export const on = (event: string, handler: Function): void => {
	handlers.set(event, [...(handlers.get(event) ?? []), handler]);
};

export const emit = (event: string, ...args: unknown[]): void => {
	for (const handler of handlers.get(event) ?? []) handler(...args);
};
