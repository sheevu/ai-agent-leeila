{Clone This Repo https://github.com/openai/openai-agents-js.git & delete the previous project.}
You are the AI engineer for this Codex project.

GOAL
Build a full-stack TypeScript app for “Sudarshan AI Labs – Multi-Agent UI with Voice” using the official OpenAI Agents SDK.

TECH STACK
- Backend: Node.js + TypeScript + Express.
- AI: @openai/agents + @openai/agents-openai + zod, model “gpt-4.1”.
- Audio: OpenAI Audio API (whisper-1 for STT, gpt-4o-mini-tts for TTS).
- Frontend: React + Vite (TypeScript).
- UI widgets: PlanCards, LeadForm, RoiCalculator.

ROOT PROJECT STRUCTURE
- /backend
  - package.json
  - tsconfig.json
  - src/
    - agents/
      - uiOutput.ts
      - leeila.ts
      - vyapaar.ts
      - support.ts
      - manager.ts
      - index.ts
    - routes/
      - chat.ts
      - stt.ts
      - tts.ts
    - server.ts
- /frontend
  - package.json
  - index.html
  - vite.config.ts
  - tsconfig.json
  - src/
    - main.tsx
    - App.tsx
    - api/client.ts
    - components/
      - ChatWindow.tsx
      - PlanCards.tsx
      - LeadForm.tsx
      - RoiCalculator.tsx
      - MicRecorder.tsx
      - AudioPlayer.tsx
    - types.ts

BACKEND SETUP (in /backend)
1. Initialise project and install dependencies:
   - npm init -y
   - npm install express cors dotenv @openai/agents @openai/agents-openai zod openai
   - npm install -D typescript ts-node nodemon @types/node @types/express
2. tsconfig.json:
   - Module: ESNext, Target: ES2020, moduleResolution: node, esModuleInterop: true, rootDir: src, outDir: dist.
3. package.json scripts:
   - "build": "tsc"
   - "dev": "nodemon --watch src --exec ts-node src/server.ts"
   - "start": "node dist/server.js"
4. Use environment variables:
   - Read process.env.PORT (default 4000).
   - Read process.env.OPENAI_API_KEY.
   - In a small config file or at startup, call:
     - import { setDefaultOpenAIKey } from "@openai/agents-openai";
     - setDefaultOpenAIKey(process.env.OPENAI_API_KEY || "");

UIOUTPUT SCHEMA (src/agents/uiOutput.ts)
1. Create a Zod schema:
   - import { z } from "zod";
   - export const UiOutput = z.object({
       replyText: z.string(),
       widgetType: z.enum(["plan_cards", "lead_form", "roi_calculator", "none"]),
       widgetParams: z.record(z.any()).optional()
     });
   - export type UiOutputType = z.infer<typeof UiOutput>;

AGENT DEFINITIONS (src/agents/*.ts)
1. Base notes:
   - Use: import { Agent } from "@openai/agents";
   - All agents should:
     - Set model: "gpt-4.1".
     - Set outputType: UiOutput.
     - Focus on concise, Hinglish answers for Indian MSMEs.

2. leeila.ts:
   - export const leeilaAgent = new Agent({
       name: "Leeila",
       model: "gpt-4.1",
       outputType: UiOutput,
       instructions: `
You are Leeila AI, a warm, expert customer-handling assistant for Sudarshan AI Labs.

- Talk in simple Hinglish (mix of Hindi + English).
- Target audience: Indian MSMEs, local dukandars, service providers, small startups.
- Company: Sudarshan AI Labs – building AI-powered uni-commerce & digital growth tools for 50M+ Indian businesses.
- Values: Seva, Satya, Samriddhi (service, truth, prosperity); Swadeshi AI; Digital Swaraj.

ALWAYS FOLLOW THIS FLOW:
1) Greet politely: ask their business type, city/area, and main problem (customers, online presence, operations, or confusion).
2) Understand needs: ask 1–3 clarifying questions.
3) Recommend: suggest 1–3 relevant Sudarshan offerings (e.g., Portal, digital bundles) in very simple bullets.
4) Map to a widget:
   - If they are choosing plans → widgetType = "plan_cards".
   - If they want to talk to team / callback / WhatsApp → widgetType = "lead_form".
   - If they ask “kitna fayda hoga” or ROI → widgetType = "roi_calculator".
   - Otherwise → widgetType = "none".

OUTPUT FORMAT (very important):
Return an object matching UiOutput:
- replyText: the final answer shown to the user in Hinglish.
- widgetType: one of "plan_cards", "lead_form", "roi_calculator", "none".
- widgetParams: optional extra info:
  - For "plan_cards": { budget?: "low" | "medium" | "high", goal?: "online_presence" | "sales" | "branding" }
  - For "lead_form": { intent: "callback" | "whatsapp" | "demo" }
  - For "roi_calculator": { hint?: string }.
Do not add other top-level fields.
`
     });

3. vyapaar.ts:
   - export const vyapaarAgent = new Agent({
       name: "Vyapaar",
       model: "gpt-4.1",
       outputType: UiOutput,
       instructions: `
You are Vyapaar AI, a practical business and ROI advisor for Sudarshan AI Labs.

- Help MSME owners think in numbers: customers/day, ticket size, margins, monthly profit.
- Explain simple formulas in Hinglish (no heavy finance jargon).
- When user wants to compare plans or estimate profit uplift, prefer widgetType = "roi_calculator" and give short guidance in replyText.
- Never promise guaranteed income; speak responsibly.

Always respect UiOutput: set replyText, widgetType, widgetParams as described for UiOutput.
`
     });

4. support.ts:
   - export const supportAgent = new Agent({
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

5. manager.ts (triage / orchestrator):
   - import { Agent } from "@openai/agents";
   - import { UiOutput } from "./uiOutput";
   - import { leeilaAgent } from "./leeila";
   - import { vyapaarAgent } from "./vyapaar";
   - import { supportAgent } from "./support";

   - export const managerAgent = new Agent({
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
       handoffs: [leeilaAgent, vyapaarAgent, supportAgent]
     });

6. index.ts:
   - Re-export all agents and a helper:
     - export { managerAgent, leeilaAgent, vyapaarAgent, supportAgent };
     - Optionally create a helper function runManager(input: string, context?: any) using `run` from "@openai/agents" that returns `UiOutputType`.

CHAT ROUTE (src/routes/chat.ts)
1. Create Express router:
   - POST /api/chat
   - Body: { messages: Array<{ role: "user" | "assistant"; content: string }>, userProfile?: any }
2. Implementation:
   - Extract last user message text (latest message with role "user").
   - Call run(managerAgent, lastUserText, { context: { messages, userProfile } }).
   - result.finalOutput should be UiOutputType.
   - Return JSON:
     {
       replyText: result.finalOutput?.replyText ?? "",
       widgetType: result.finalOutput?.widgetType ?? "none",
       widgetParams: result.finalOutput?.widgetParams ?? {}
     }
3. Add basic error handling and 500 response on errors.

VOICE ROUTES (STT + TTS)

STT: src/routes/stt.ts
1. Use express + any simple middleware to accept multipart/form-data (you may use a small dependency like multer).
2. POST /api/stt:
   - Accept an "audio" file (webm/ogg/mp3) recorded from browser.
   - Use OpenAI Node client:
     - import OpenAI from "openai";
     - const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   - Call:
     - const transcription = await client.audio.transcriptions.create({
         file: fs.createReadStream(tempPathOrBuffer),
         model: "whisper-1",
         language: "hi"
       });
   - Respond with { text: transcription.text }.

TTS: src/routes/tts.ts
1. POST /api/tts:
   - Body: { text: string }.
   - Use same OpenAI client.
   - Call:
     - const speech = await client.audio.speech.create({
         model: "gpt-4o-mini-tts",
         voice: "alloy",
         input: text
       });
   - Convert to Buffer and send with Content-Type: "audio/mpeg".

SERVER ENTRY (src/server.ts)
1. Create Express app:
   - Use express.json().
   - Use cors() (allow localhost frontend).
2. Mount routes:
   - app.use("/api", chatRouter);
   - app.use("/api", sttRouter);
   - app.use("/api", ttsRouter);
3. Listen on PORT env or 4000.

FRONTEND SETUP (in /frontend)
1. Initialise Vite + React + TS:
   - npm create vite@latest . -- --template react-ts
   - npm install axios
2. Basic layout in App.tsx:
   - Left/top: <ChatWindow />
   - Right/bottom: dynamic widget area showing PlanCards / LeadForm / RoiCalculator based on state.
   - Provide buttons for mic (🎤) and speaker (🔊).

types.ts
1. Define shared types:
   - export type Message = { role: "user" | "assistant"; content: string };
   - export type WidgetType = "plan_cards" | "lead_form" | "roi_calculator" | "none";
   - export interface ChatResponse { replyText: string; widgetType: WidgetType; widgetParams?: Record<string, any>; }

API CLIENT (src/api/client.ts)
1. Use axios with baseURL pointing to backend (e.g., http://localhost:4000).
2. Export helpers:
   - sendChat(messages): POST /api/chat.
   - transcribeAudio(formData): POST /api/stt.
   - synthesizeSpeech(text): POST /api/tts, return Blob/URL.

ChatWindow.tsx
1. Maintain state:
   - messages: Message[]
   - currentInput: string
   - lastAssistantReply: string
   - widgetType + widgetParams from last response
2. On send:
   - Push { role: "user", content: currentInput } into messages.
   - Call sendChat(messages).
   - Add assistant message from replyText.
   - Update widgetType + widgetParams.
   - Store lastAssistantReply for TTS.

PlanCards.tsx
1. Props: { params?: any }.
2. Create 3 example plans:
   - Use local array with name, price, bullets.
   - Optionally filter based on params.budget/goal.
3. Show responsive cards with CTA buttons ("Request callback", "WhatsApp").

LeadForm.tsx
1. Props: { params?: any }.
2. Fields: name, phone, businessType, city, preferredContact.
3. On submit:
   - For now, console.log form data.
   - Show success message inline.

RoiCalculator.tsx
1. Inputs: avgOrderValue, marginPercent, extraCustomersPerDay.
2. On calculate:
   - monthlyProfit = avgOrderValue * (marginPercent / 100) * extraCustomersPerDay * 30.
   - Show result and short explanatory text.
   - If widgetParams.hint present, show beneath.

MicRecorder.tsx
1. Provide 🎤 button.
2. Use navigator.mediaDevices.getUserMedia({ audio: true }) and MediaRecorder to capture audio.
3. On stop, send Blob via FormData to /api/stt and set returned text into ChatWindow’s input.

AudioPlayer.tsx
1. Provide 🔊 button.
2. When clicked and there is lastAssistantReply:
   - Call /api/tts with { text: lastAssistantReply }.
   - Create object URL from returned Blob and play via <audio>.

APP WIRING
1. In App.tsx:
   - Use ChatWindow state to decide which widget to render:
     - widgetType === "plan_cards" → <PlanCards params={widgetParams} />
     - "lead_form" → <LeadForm params={widgetParams} />
     - "roi_calculator" → <RoiCalculator params={widgetParams} />
2. Place MicRecorder near chat input and AudioPlayer near last assistant message or at top-right.

DOCUMENTATION
1. In root README.md, clearly document:
   - Required env:
     - OPENAI_API_KEY=sk-...
   - How to run backend:
     - cd backend && npm install && npm run dev
   - How to run frontend:
     - cd frontend && npm install && npm run dev
   - High-level explanation of agents:
     - Manager → Leeila / Vyapaar / Support, all returning UiOutput.

IMPORTANT
- Keep all code well-commented so a non-coder founder can find:
  - Agent instructions (for later editing).
  - UI components (for branding edits).
- Do not hard-code any secrets in frontend.
- Use Hinglish examples & MSME context for prompts when needed in comments.
