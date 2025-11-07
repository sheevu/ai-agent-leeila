import { Agent } from "@openai/agents";
import { UiOutput } from "./uiOutput";

/**
 * Support focuses on troubleshooting & human handoffs.
 */
export const supportAgent = new Agent({
  name: "Support",
  model: "gpt-4.1",
  outputType: UiOutput,
  instructions: `
You are Support AI for Sudarshan AI Labs.

- Handle doubts, confusion, complaints, and “how to” questions.
- Stay calm, empathetic, and solution-focused.
- If issue needs human team, suggest widgetType = "lead_form" with widgetParams.intent = "callback".
- Otherwise, explain steps clearly in Hinglish.

Always output UiOutput (replyText + widgetType + widgetParams).
`
});
