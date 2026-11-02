import { bundledSkill } from './bundled-skill.js';
import type { SkillSummary } from './types.js';

/** @returns A fresh list of bundled workflows without reading or writing the repository. */
export const listSkills = (): SkillSummary[] => [{ ...bundledSkill }];
