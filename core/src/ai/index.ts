import { AiConfigSchema, AiExplanationSchema, AiRequestSchema } from "./types.ts";
import type { AiConfig, AiExplanation, AiRequest } from "./types.ts";

export {
  AiConfigSchema,
  AiExplanationSchema,
  AiRequestSchema,
  FailInstanceSchema,
} from "./types.ts";
export type { AiConfig, AiExplanation, AiRequest, FailInstance } from "./types.ts";

/** WIP shared AI stubs: validate inputs; perform no provider or network calls. */
export const ai = {
  /**
   * Validate a request/config and return a random dummy score for its passing condition.
   * @param request - Input, prompt, and optional inert model/reasoning values.
   * @param config - Optional system instructions, validated but unused by this stub.
   * @returns A placeholder score of 0.1 or 0.9.
   * @throws Request or config validation errors, as a rejected promise.
   */
  run: async (request: AiRequest, config: AiConfig = {}): Promise<number> => {
    AiRequestSchema.parse(request);
    AiConfigSchema.parse(config);
    return Math.random() > 0.5 ? 0.9 : 0.1;
  },

  /**
   * Validate a request and existing score, then return dummy explanation output.
   * @param request - The request associated with the supplied score.
   * @param score - Existing finite score in [0, 1]; scoring is never rerun.
   * @param config - Optional system instructions, validated but unused by this stub.
   * @returns The unchanged score, no reason, and an empty dummy failures list.
   * @throws Request, score, or config validation errors, as a rejected promise.
   */
  explain: async (
    request: AiRequest,
    score: number,
    config: AiConfig = {},
  ): Promise<AiExplanation> => {
    AiRequestSchema.parse(request);
    AiConfigSchema.parse(config);
    return AiExplanationSchema.parse({ score, failures: [] });
  },
};
