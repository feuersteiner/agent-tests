import { generator } from './generator.js';
import type { SkillSummary } from './types.js';

const skill: SkillSummary = {
	name: 'test-generator',
	description: 'Compile TEST.md and iterate on validation and labeled evaluations.'
};

/** List bundled skills without reading or writing the current repository. */
export const listSkills = (): SkillSummary[] => [{ ...skill }];

/** Read a bundled skill; unknown names fail without loading arbitrary local files. */
export const readSkill = (name: string): string => {
	if (name !== skill.name) throw new Error(`Unknown skill: ${name}`);
	return generator;
};
