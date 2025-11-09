import { Router } from "express";
import type { Request, Response } from "express";
import { runManager } from "../agents";

const chatRouter = Router();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

chatRouter.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages = [], userProfile } = req.body as {
      messages?: ChatMessage[];
      userProfile?: Record<string, unknown>;
    };

    const lastUser = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    const userText = lastUser?.content ?? "";
    if (!userText.trim()) {
      return res.status(400).json({
        error: "Missing user message",
      });
    }

    const finalOutput = await runManager(userText, { messages, userProfile });

    return res.json({
      replyText: finalOutput.replyText ?? "",
      widgetType: finalOutput.widgetType ?? "none",
      widgetParams: finalOutput.widgetParams ?? {},
    });
  } catch (error) {
    console.error("/api/chat error", error);
    return res.status(500).json({ error: "Unable to process chat right now." });
  }
});

export default chatRouter;
