export type Message = { role: "user" | "assistant"; content: string };

export type WidgetType = "plan_cards" | "lead_form" | "roi_calculator" | "none";

export interface ChatResponse {
  replyText: string;
  widgetType: WidgetType;
  widgetParams?: Record<string, unknown>;
}

export type VoiceEvent =
  | { type: "assistant_audio"; audio: string }
  | { type: "assistant_text"; text: string; status?: string }
  | { type: "assistant_transcript_delta"; delta: string }
  | { type: "user_transcript"; transcript: string; itemId: string }
  | { type: "ready" }
  | { type: "error"; message: string };
