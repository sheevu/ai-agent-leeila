import { useMemo, useState } from "react";
import ChatWindow from "./components/ChatWindow";
import PlanCards from "./components/PlanCards";
import LeadForm from "./components/LeadForm";
import RoiCalculator from "./components/RoiCalculator";
import MicRecorder from "./components/MicRecorder";
import AudioPlayer from "./components/AudioPlayer";
import type { ChatResponse, VoiceEvent, WidgetType } from "./types";

const themes = [
  { id: "lotus", label: "Lotus Glow", description: "Rose-gold & lotus pink glossy gradients" },
  { id: "sunrise", label: "Sunrise Rush", description: "Orange to fuchsia sky" },
  { id: "aurora", label: "Aurora Mint", description: "Teal-purple neon sheen" },
];

function WidgetPreview({ type, params }: { type: WidgetType; params?: Record<string, unknown> }) {
  if (type === "plan_cards") {
    return <PlanCards params={params} />;
  }
  if (type === "lead_form") {
    return <LeadForm params={params} />;
  }
  if (type === "roi_calculator") {
    return <RoiCalculator params={params} />;
  }
  return (
    <div className="widget-card empty">
      <h3>Need-based widget yahin dikhega</h3>
      <p>Leeila aapke sawaalon ke basis par right panel ko customise karti hai.</p>
    </div>
  );
}

function App() {
  const [widgetType, setWidgetType] = useState<WidgetType>("none");
  const [widgetParams, setWidgetParams] = useState<Record<string, unknown> | undefined>();
  const [lastAssistantReply, setLastAssistantReply] = useState<string>("");
  const [prefillText, setPrefillText] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [assistantVoiceText, setAssistantVoiceText] = useState<string>("");
  const [themeId, setThemeId] = useState<string>(themes[0].id);

  const currentTheme = useMemo(() => themes.find((theme) => theme.id === themeId) ?? themes[0], [themeId]);

  const handleUiUpdate = (response: ChatResponse) => {
    setWidgetType(response.widgetType);
    setWidgetParams(response.widgetParams);
  };

  const handleVoiceEvent = (event: VoiceEvent) => {
    if (event.type === "user_transcript") {
      setVoiceTranscript(event.transcript);
    }
    if (event.type === "assistant_text") {
      setAssistantVoiceText(event.text);
    }
    if (event.type === "assistant_transcript_delta") {
      setAssistantVoiceText((prev) => `${prev}${event.delta}`);
    }
    if (event.type === "error") {
      setAssistantVoiceText(`⚠️ ${event.message}`);
    }
  };

  return (
    <div className={`app-shell theme-${currentTheme.id}`}>
      <header className="app-header">
        <div>
          <h1>Leeila – Sudarshan AI Labs</h1>
          <p>Hinglish AI partner for Indian MSMEs. Voice + Chat dono ready!</p>
        </div>
        <div className="theme-switcher">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={themeId === theme.id ? "active" : ""}
              onClick={() => setThemeId(theme.id)}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </header>

      <main className="layout">
        <section className="chat-panel">
          <div className="chat-header">
            <h2>Text & Voice Chat</h2>
            <span className="theme-description">{currentTheme.description}</span>
          </div>
          <ChatWindow
            onUiUpdate={handleUiUpdate}
            prefillText={prefillText}
            onPrefillConsumed={() => setPrefillText(null)}
            onLastReply={setLastAssistantReply}
          />
          <div className="voice-toolkit">
            <MicRecorder
              onTranscript={(text) => setPrefillText(text)}
              onVoiceEvent={handleVoiceEvent}
            />
            <AudioPlayer text={lastAssistantReply} />
          </div>
          <div className="voice-stream">
            <div>
              <h4>Live User Transcript</h4>
              <p>{voiceTranscript || "(Mic band hote hi yahan text dikhega)"}</p>
            </div>
            <div>
              <h4>Assistant Voice Transcript</h4>
              <p>{assistantVoiceText || "(Assistant ki awaaz ka live text yahan)"}</p>
            </div>
          </div>
        </section>

        <aside className="widget-panel">
          <WidgetPreview type={widgetType} params={widgetParams} />
        </aside>
      </main>
    </div>
  );
}

export default App;
