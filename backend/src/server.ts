import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, type RawData } from "ws";
import { setDefaultOpenAIKey } from "@openai/agents-openai";
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebSocket,
  utils as realtimeUtils,
  type TransportLayerAudio,
} from "@openai/agents-realtime";

import chatRouter from "./routes/chat";
import sttRouter from "./routes/stt";
import ttsRouter from "./routes/tts";

const PORT = Number(process.env.PORT) || 4000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. Voice and chat endpoints will fail until configured.");
}

setDefaultOpenAIKey(OPENAI_API_KEY ?? "");

const app = express();
app.use(cors({ origin: [/localhost/], credentials: true }));
app.use(express.json());

app.use("/api", chatRouter);
app.use("/api", sttRouter);
app.use("/api", ttsRouter);

const httpServer = createServer(app);

const voiceAgent = new RealtimeAgent({
  name: "Leeila Voice",
  instructions:
    "You are Leeila, the Sudarshan AI Labs voice guide. Talk in warm Hinglish, ask about business goals, and keep answers under 3 short sentences.",
  voice: "alloy",
});

const wss = new WebSocketServer({ server: httpServer, path: "/api/voice-session" });

const bufferToArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
};

const toBuffer = (data: RawData): Buffer => {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.from(data as Uint8Array);
};

wss.on("connection", async (socket) => {
  if (!OPENAI_API_KEY) {
    socket.send(
      JSON.stringify({ type: "error", message: "Server missing OpenAI API key. Please contact support." }),
    );
    socket.close();
    return;
  }

  const transport = new OpenAIRealtimeWebSocket({ useInsecureApiKey: true });
  const session = new RealtimeSession(voiceAgent, {
    transport,
    model: "gpt-4.1-mini",
    context: { channel: "voice" },
  });

  const sendAudioToClient = (event: TransportLayerAudio) => {
    const audioBase64 = realtimeUtils.arrayBufferToBase64(event.data);
    socket.send(JSON.stringify({ type: "assistant_audio", audio: audioBase64 }));
  };

  session.on("audio", sendAudioToClient);

  session.on("transport_event", (event) => {
    if (event.type === "transcript_delta") {
      socket.send(JSON.stringify({ type: "assistant_transcript_delta", delta: event.delta }));
    }
    if (event.type === "conversation.item.input_audio_transcription.completed") {
      socket.send(
        JSON.stringify({
          type: "user_transcript",
          transcript: event.transcript,
          itemId: event.item_id,
        }),
      );
    }
  });

  session.on("history_added", (item) => {
    if (item.type === "message" && item.role === "assistant") {
      const textContent = item.content.find((content) => content.type === "output_text");
      if (textContent && "text" in textContent) {
        socket.send(
          JSON.stringify({
            type: "assistant_text",
            text: textContent.text,
            status: item.status,
          }),
        );
      }
    }
  });

  session.on("error", (errorEvent) => {
    console.error("Realtime session error", errorEvent);
    socket.send(JSON.stringify({ type: "error", message: "Voice session encountered an error." }));
  });

  try {
    await session.connect({ apiKey: OPENAI_API_KEY, model: "gpt-4.1-mini" });
    socket.send(JSON.stringify({ type: "ready" }));
  } catch (error) {
    console.error("Failed to connect realtime session", error);
    socket.send(JSON.stringify({ type: "error", message: "Unable to start voice session." }));
    socket.close();
    return;
  }

  socket.on("message", (data, isBinary) => {
    try {
      if (isBinary) {
        const buffer = toBuffer(data);
        session.transport.sendAudio(bufferToArrayBuffer(buffer), { commit: false });
        return;
      }

      const payload = JSON.parse(data.toString());
      if (payload.type === "audio_chunk" && payload.audio) {
        const audioBuffer = Buffer.from(payload.audio, "base64");
        session.transport.sendAudio(bufferToArrayBuffer(audioBuffer), { commit: !!payload.commit });
      } else if (payload.type === "commit_audio") {
        session.transport.sendAudio(new ArrayBuffer(0), { commit: true });
      } else if (payload.type === "interrupt") {
        session.transport.interrupt();
      }
    } catch (error) {
      console.error("Failed to process client message", error);
    }
  });

  socket.on("close", () => {
    session.transport.close();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Sudarshan backend listening on http://localhost:${PORT}`);
});
