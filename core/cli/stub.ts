import type { Handler } from 'clinguini';

export const stubHandler =
	(name: string): Handler =>
	({ params, flags }) => {
		const values = Object.entries({ ...params, ...flags })
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => `${key}: ${typeof value} = ${JSON.stringify(value)}`);
		const id = params.id === undefined ? '' : ` ${params.id}`;
		console.log(`${name}${id} has been called, with params: [${values.join(', ')}]`);
	};
