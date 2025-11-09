import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { sendChat } from "../api/client";
import type { ChatResponse, Message } from "../types";

interface ChatWindowProps {
  onUiUpdate: (response: ChatResponse) => void;
  prefillText?: string | null;
  onPrefillConsumed?: () => void;
  onLastReply?: (text: string) => void;
  className?: string;
}

const starterMessage: Message = {
  role: "assistant",
  content:
    "Namaste! Main Leeila AI hoon. Batao aapka business kya karta hai aur kis shehar se operate karte ho?",
};

export function ChatWindow({
  onUiUpdate,
  prefillText,
  onPrefillConsumed,
  onLastReply,
  className,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([starterMessage]);
  const [currentInput, setCurrentInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefillText && prefillText.trim()) {
      setCurrentInput(prefillText.trim());
      onPrefillConsumed?.();
    }
  }, [prefillText, onPrefillConsumed]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!currentInput.trim() || isSending) return;
    setError(null);
    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: currentInput.trim() },
    ];
    setMessages(nextMessages);
    setCurrentInput("");
    setIsSending(true);

    try {
      const reply = await sendChat(nextMessages);
      const assistantMessage: Message = {
        role: "assistant",
        content: reply.replyText,
      };
      setMessages([...nextMessages, assistantMessage]);
      onUiUpdate(reply);
      onLastReply?.(reply.replyText);
    } catch (err) {
      console.error(err);
      setError("Server se connect nahi ho paaya. Thodi der baad try karein.");
      setMessages(nextMessages);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={classNames("chat-window", className)}>
      <div className="chat-scroll">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
            <span>{message.content}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {error && <div className="chat-error">{error}</div>}
      <div className="chat-input-row">
        <textarea
          value={currentInput}
          onChange={(event) => setCurrentInput(event.target.value)}
          placeholder="Type karein ya mic se bolein..."
          rows={2}
        />
        <button type="button" onClick={handleSend} disabled={isSending || !currentInput.trim()}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
