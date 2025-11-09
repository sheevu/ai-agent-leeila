import axios from "axios";
import type { ChatResponse, Message } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:4000",
});

export async function sendChat(messages: Message[]): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>("/api/chat", { messages });
  return response.data;
}

export async function transcribeAudio(formData: FormData): Promise<string> {
  const response = await api.post<{ text: string }>("/api/stt", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.text;
}

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const response = await api.post("/api/tts", { text }, { responseType: "blob" });
  return response.data as Blob;
}

export function createVoiceSocket(): WebSocket {
  const baseURL = import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:4000";
  return new WebSocket(`${baseURL.replace(/^http/, "ws")}/api/voice-session`);
}
