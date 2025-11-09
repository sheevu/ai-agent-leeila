import { run } from "@openai/agents";
import { managerAgent } from "./manager";
import { leeilaAgent } from "./leeila";
import { vyapaarAgent } from "./vyapaar";
import { supportAgent } from "./support";
import { UiOutput, type UiOutputType } from "./uiOutput";

/**
 * Helper to run the manager agent and always coerce to UiOutputType.
 */
export async function runManager(
  input: string,
  context?: Record<string, unknown>,
): Promise<UiOutputType> {
  const result = await run(managerAgent, input, { context });
  try {
    return UiOutput.parse(result.finalOutput ?? {});
  } catch (error) {
    console.error("Manager output failed schema validation", error);
    return {
      replyText: "Maaf kijiye, system mein thodi dikkat aa gayi. Dubara try karein ya team se baat karne ko bolein?",
      widgetType: "lead_form",
      widgetParams: { intent: "callback" },
    };
  }
}

export { managerAgent, leeilaAgent, vyapaarAgent, supportAgent };
