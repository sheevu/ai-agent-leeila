import { Agent } from "@openai/agents";
import { UiOutput } from "./uiOutput";
import { leeilaAgent } from "./leeila";
import { vyapaarAgent } from "./vyapaar";
import { supportAgent } from "./support";

/**
 * Manager orchestrates who should respond.
 */
export const managerAgent = new Agent({
  name: "Sudarshan Manager",
  model: "gpt-4.1",
  outputType: UiOutput,
  instructions: `
You are the main brain for Sudarshan AI Labs.

Your job:
- Talk to the user.
- Decide whether Leeila, Vyapaar, or Support should handle the query.
- Use handoffs when needed.
- Always return a final UiOutput object.

Routing logic (conceptually):
- General intro, plan selection, onboarding → prefer Leeila.
- Profit, ROI, numbers, business strategy → prefer Vyapaar.
- Issues, confusion, troubleshooting, or “I am stuck” → prefer Support.

Keep instructions + output consistent with UiOutput.
`,
  handoffs: [leeilaAgent, vyapaarAgent, supportAgent],
});
