// TODO: Assemble the planned AgentTests composition facade; see ../PLAN.md for scope and open APIs.
export { parseTestDefinition, parseTestYaml } from './src/parser/index.ts';
export * from './src/types/index.ts';
export { Engine, ScoreSchema } from './src/check/engine/index.ts';
export type { Score } from './src/check/engine/index.ts';
export { FastEngine, FastEngineParamsSchema } from './src/check/engine/fast.ts';
export type { FastEngineParams } from './src/check/engine/fast.ts';
export { SmartEngine, SmartEngineParamsSchema } from './src/check/engine/smart.ts';
export type { SmartEngineParams } from './src/check/engine/smart.ts';
export { DeepEngine, DeepEngineParamsSchema } from './src/check/engine/deep.ts';
export type { DeepEngineParams } from './src/check/engine/deep.ts';
export {
	AI,
	AiConfigSchema,
	AiRequestSchema,
	FailInstanceSchema,
	AiExplanationSchema
} from './src/ai/index.ts';
export type { AiConfig, AiRequest, FailInstance, AiExplanation } from './src/ai/index.ts';
