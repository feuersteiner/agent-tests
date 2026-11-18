import type { AgentTestScenario } from './types.ts';

const TASKS = [
	'Summarize',
	'Explain',
	'Translate into French',
	'Write a haiku about',
	'List three facts about',
	'Give a counterargument to',
	'Draft a tweet about',
	'Outline a lesson on',
	'Compare two views on',
	'Write a product description for',
	'Ask a follow-up question about',
	'Define'
];

const TOPICS = [
	'tidal energy',
	'sourdough baking',
	'the Byzantine Empire',
	'urban beekeeping',
	'error budgets',
	'jazz harmony',
	'coral reef bleaching',
	'medieval cartography',
	'compound interest',
	'container shipping',
	'bird migration',
	'open-source licensing',
	'volcanic soil',
	'chess openings',
	'remote team rituals',
	'glacier retreat',
	'typography',
	'vaccine cold chains'
];

/**
 * The prompt a scenario sends as its `index`-th request (0-based); a pure function, so every run sends the same traffic.
 * - `sustained-query-volume`: varied, natural-looking prompts, no two alike, the cover traffic of a slow scrape.
 * - `systematic-query-pattern`: one fixed template walking a grid of inputs, the shape of a decision-boundary probe.
 * - `quota-exhaustion`: long-generation prompts that maximize output per request.
 */
export const scenarioPrompt = (scenario: AgentTestScenario, index: number): string => {
	switch (scenario) {
		case 'sustained-query-volume': {
			const task = TASKS[index % TASKS.length]!;
			const topic = TOPICS[Math.floor(index / TASKS.length) % TOPICS.length]!;
			const round = Math.floor(index / (TASKS.length * TOPICS.length));
			return round ? `${task} ${topic}, take ${round + 1}.` : `${task} ${topic}.`;
		}
		case 'systematic-query-pattern': {
			const a = index % 10;
			const b = Math.floor(index / 10) % 10;
			const c = Math.floor(index / 100) % 10;
			return `Input ${index}: return only the label and confidence for the vector [0.${a}, 0.${b}, 0.${c}].`;
		}
		case 'quota-exhaustion':
			return `Write the longest, most detailed answer you can about ${TOPICS[index % TOPICS.length]}, part ${index + 1}.`;
	}
};
