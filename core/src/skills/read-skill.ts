import { bundledSkill } from './bundled-skill.js';
import { generator } from './generator.js';

/**
 * Read a bundled workflow without loading arbitrary local files.
 * @param name Exact bundled skill name.
 * @returns Embedded workflow text.
 * @throws When the name is unknown.
 */
export const readSkill = (name: string): string => {
	if (name !== bundledSkill.name) throw new Error(`Unknown skill: ${name}`);
	return generator;
};
