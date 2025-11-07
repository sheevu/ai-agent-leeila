import { useState } from "react";
import { synthesizeSpeech } from "../api/client";

interface AudioPlayerProps {
  text?: string;
  className?: string;
}

export function AudioPlayer({ text, className }: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlay = async () => {
    if (!text) {
      setError("Assistant reply available nahi hai.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const audioBlob = await synthesizeSpeech(text);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Voice playback mein dikkat aayi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className ? `audio-player ${className}` : "audio-player"}>
      <button type="button" onClick={handlePlay} disabled={isLoading}>
        {isLoading ? "Loading..." : "🔊 Suno"}
      </button>
      {error && <span className="audio-error">{error}</span>}
    </div>
  );
}

export default AudioPlayer;
