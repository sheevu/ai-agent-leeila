import { z } from "zod";

/**
 * Shared schema describing how every agent should respond to the UI.
 * Reply text stays Hinglish friendly for Indian MSME founders.
 */
export const UiOutput = z.object({
  replyText: z.string(),
  widgetType: z.enum(["plan_cards", "lead_form", "roi_calculator", "none"]),
  widgetParams: z.record(z.any()).optional(),
});

export type UiOutputType = z.infer<typeof UiOutput>;
