# Sudarshan AI Labs – Multi-Agent Voice + Chat Stack

This monorepo hosts a TypeScript Express backend and a Vite + React frontend for the **Leeila** customer experience. It follows the OpenAI Agents SDK playbook with multi-agent orchestration, structured UI outputs, and a realtime voice path.

## 🧱 Project layout

```
/backend   ← Express + Agents SDK server (chat + voice + STT/TTS)
/frontend  ← React UI with chat, widgets, and voice controls
```

## 🔐 Environment variables

Create a `.env` file in `backend/` with:

```
OPENAI_API_KEY=sk-...
PORT=4000 # optional
```

Frontend can optionally point to remote servers by defining:

```
VITE_BACKEND_URL=https://your-backend-host
VITE_BACKEND_WS_URL=wss://your-backend-host
```

## 🚀 Running locally

### Backend

```bash
cd backend
npm install
npm run dev
```

This starts an Express server at `http://localhost:4000` with:

- `POST /api/chat` – manager agent orchestrates Leeila, Vyapaar, Support returning `UiOutput`.
- `POST /api/stt` – Whisper transcription for recorded mic blobs.
- `POST /api/tts` – `gpt-4o-mini-tts` speech synthesis.
- `WS /api/voice-session` – realtime streaming audio bridge using `RealtimeAgent` (`gpt-4.1-mini`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the React app at <http://localhost:5173>. Chat connects to `/api/chat`, the mic button records speech for STT or realtime voice, and the speaker button replays assistant replies via TTS.

## 🧠 Agent architecture

| Agent | Role | Notes |
| --- | --- | --- |
| **Leeila** | Friendly Hinglish concierge | Guides MSMEs through plans, lead capture, ROI widgets. |
| **Vyapaar** | Numbers & ROI coach | Prefers the ROI calculator widget and pragmatic advice. |
| **Support** | Troubleshooting helper | Escalates to lead form when human help is needed. |
| **Manager** | Triage brain | Routes to the right specialist and enforces the shared `UiOutput` schema. |

Voice interactions use a dedicated `RealtimeAgent` (`gpt-4.1-mini`, alloy voice) with streaming audio over WebSockets so visitors can speak and hear Leeila instantly.

## 🎨 UI overview

- Glossy gradient themes (`Lotus Glow`, `Sunrise Rush`, `Aurora Mint`) tailored for Sudarshan branding.
- `ChatWindow` pairs with mic + speaker controls for dual-mode conversations.
- Widget area hosts `PlanCards`, `LeadForm`, or `RoiCalculator` based on agent responses.
- Live transcript tiles display realtime speech recognition and assistant narration.

## ✅ Build commands

From the repo root:

```bash
# Type-check + emit backend
cd backend && npm run build

# Production build for frontend
cd frontend && npm run build
```

Run both servers simultaneously for full voice + chat demos.
