import { z } from "zod";
import { ReasoningLevelSchema, SmartCheckSchema } from "../types/index.ts";

const scoreSchema = z.number().min(0).max(1);

/** AI input and passing condition; root model/reasoning values are inert placeholders. */
export const AiRequestSchema = z.strictObject({
  input: z.string(),
  ask: SmartCheckSchema.shape.ask,
  model: z.string().optional(),
  reasoning: ReasoningLevelSchema.optional(),
});
export type AiRequest = z.infer<typeof AiRequestSchema>;

/** Optional system-instruction override; an empty string explicitly removes the default. */
export const AiConfigSchema = z.strictObject({
  system: z.string().optional(),
});
export type AiConfig = z.infer<typeof AiConfigSchema>;

/** Quoted evidence must be a nonempty exact substring of the request input. */
export const FailInstanceSchema = z.strictObject({
  quote: z.string().min(1).describe("Exact substring of the request input"),
  reason: z.string().optional(),
});
export type FailInstance = z.infer<typeof FailInstanceSchema>;

/** Explanation of an existing score, with optional reasoning and quoted failures. */
export const AiExplanationSchema = z.strictObject({
  score: scoreSchema,
  reason: z.string().optional(),
  failures: z.array(FailInstanceSchema),
});
export type AiExplanation = z.infer<typeof AiExplanationSchema>;

/** Shared scoring/explanation operations implemented by explicit adapters. */
export interface AiAdapter {
  /** Return support for the passing condition, using optional system instructions. */
  run(request: AiRequest, config?: AiConfig): Promise<number>;
  /** Explain failures with optional system instructions, preserving the supplied score. */
  explain(request: AiRequest, score: number, config?: AiConfig): Promise<AiExplanation>;
}
