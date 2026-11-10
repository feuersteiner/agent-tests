/** Fixed answers for fixture inputs; this is not a semantic evaluator. */
const answers: Record<string, { pass: string[]; fail: string[] }> = {
	'This source displays payment-error text to a customer.': {
		pass: ['data-channel="web"'],
		fail: ['data-channel="email"', 'const spacing = 8;']
	},
	'This source displays payment-error text in an email.': {
		pass: ['data-channel="email"'],
		fail: ['const spacing = 8;']
	},
	'All customer-facing text is in French.': {
		pass: ['Le paiement', 'Aucun montant'],
		fail: ['Payment failed']
	},
	'The payment error explains the charge status and the next action.': {
		pass: ['Aucun montant', 'Le paiement a échoué. Aucun débit'],
		fail: ['Une erreur est survenue.']
	},
	'An unknown payment status is described as unknown, without promising no charge.': {
		pass: ['status="declined"', 'Le paiement est en cours de vérification'],
		fail: ['status="unknown">Aucun montant']
	},
	'The documented deletion timing agrees with the included implementation contract.': {
		pass: ['Documentation: deletion is queued.'],
		fail: ['Documentation: deletion is immediate.']
	},
	'The checkout uses the shared pricing policy instead of duplicating discount logic.': {
		pass: ["from '../pricing/policy'"],
		fail: ['subtotal * 0.8']
	},
	'This plan respects the approved exit from the consumer segment.': {
		pass: ['Plan: invest in enterprise accounts.'],
		fail: ['Plan: acquire more consumer accounts.']
	},
	'The proposal preserves the required 30 percent margin after every concession.': {
		pass: ['Final margin: 35%.'],
		fail: ['Final margin: 20%.']
	},
	'The customer promise agrees with the approved December launch date.': {
		pass: ['Customer promise: December.'],
		fail: ['Customer promise: November.']
	},
	'The handover carries forward the promised EU data residency and unresolved migration.': {
		pass: ['Handover: EU residency; migration unresolved.'],
		fail: ['Handover: no outstanding commitments.']
	},
	'The forecast treats the conditional renewal as uncertain revenue.': {
		pass: ['Forecast: renewal revenue is uncertain.'],
		fail: ['Forecast: renewal revenue is guaranteed.']
	},
	'The copy uses formal language appropriate to the brand.': {
		pass: ['hey is an internal campaign identifier'],
		fail: ['hey folks, wanna buy?']
	}
};

export const score = (input: string, condition: string): number => {
	if (condition === 'This component directory contains exactly component.svelte and types.ts.') {
		const children = input.split('\n').filter((line) => line.startsWith('\t- '));
		return Number(
			children.length === 2 &&
				['component.svelte', 'types.ts'].every((name) =>
					children.some((line) => line.includes(`/${name}" of kind "file"`))
				)
		);
	}
	const answer = answers[condition];
	if (answer?.fail.some((fragment) => input.includes(fragment))) return 0;
	if (answer?.pass.some((fragment) => input.includes(fragment))) return 1;
	throw new Error(`No stub answer for condition: ${condition}`);
};

export const decisionScore = (input: string, instructions: string): number => {
	const condition = Object.keys(answers).find((condition) => instructions.endsWith(condition));
	if (!condition) throw new Error(`Unknown fixture instructions: ${instructions}`);
	return score(input, condition);
};
