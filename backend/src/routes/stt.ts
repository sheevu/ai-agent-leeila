import { Router } from "express";
import multer from "multer";
import OpenAI from "openai";

const upload = multer({ storage: multer.memoryStorage() });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sttRouter = Router();

sttRouter.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    const transcription = await client.audio.transcriptions.create({
      file: await OpenAI.toFile(req.file.buffer, req.file.originalname || "input.webm"),
      model: "whisper-1",
      language: "hi",
    });

    return res.json({ text: transcription.text });
  } catch (error) {
    console.error("/api/stt error", error);
    return res.status(500).json({ error: "Unable to transcribe audio" });
  }
});

export default sttRouter;
