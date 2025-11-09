import { run } from "@openai/agents";
import { managerAgent } from "./manager";
import { leeilaAgent } from "./leeila";
import { vyapaarAgent } from "./vyapaar";
import { supportAgent } from "./support";
import type { UiOutputType } from "./uiOutput";

/**
 * Helper to run the manager agent and always coerce to UiOutputType.
 */
export async function runManager(
  input: string,
  context?: Record<string, unknown>,
): Promise<UiOutputType> {
  const result = await run(managerAgent, input, { context });
  return (result.finalOutput ?? {}) as UiOutputType;
}

export { managerAgent, leeilaAgent, vyapaarAgent, supportAgent };
