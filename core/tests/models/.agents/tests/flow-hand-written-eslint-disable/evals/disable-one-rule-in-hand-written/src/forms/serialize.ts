/* eslint-disable @typescript-eslint/no-explicit-any */
export const serializeForm = (form: HTMLFormElement): Record<string, any> => {
	const values: Record<string, any> = {};
	for (const [name, value] of new FormData(form)) {
		values[name] = typeof value === 'string' ? value.trim() : value;
	}
	return values;
};
