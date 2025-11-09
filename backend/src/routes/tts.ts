import { Router } from "express";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ttsRouter = Router();

ttsRouter.post("/tts", async (req, res) => {
  try {
    const { text } = req.body as { text?: string };
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(audioBuffer);
  } catch (error) {
    console.error("/api/tts error", error);
    return res.status(500).json({ error: "Unable to synthesize speech" });
  }
});

export default ttsRouter;
