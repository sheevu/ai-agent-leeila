import { useCallback, useEffect, useRef, useState } from "react";
import { createVoiceSocket, transcribeAudio } from "../api/client";
import type { VoiceEvent } from "../types";

interface MicRecorderProps {
  onTranscript: (text: string) => void;
  onVoiceEvent?: (event: VoiceEvent) => void;
  className?: string;
}

type RecorderMode = "transcribe" | "realtime";

const TARGET_SAMPLE_RATE = 24000;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function pcm16ToWav(pcm: ArrayBuffer, sampleRate = TARGET_SAMPLE_RATE): ArrayBuffer {
  const pcmView = new Uint8Array(pcm);
  const wavBuffer = new ArrayBuffer(44 + pcmView.length);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcmView.length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcmView.length, true);
  new Uint8Array(wavBuffer, 44).set(pcmView);
  return wavBuffer;
}

export function MicRecorder({ onTranscript, onVoiceEvent, className }: MicRecorderProps) {
  const [mode, setMode] = useState<RecorderMode>("transcribe");
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<string>("Tap mic to speak");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlaybackTimeRef = useRef(0);

  const cleanupCapture = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    captureContextRef.current?.close();
    captureContextRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const closeSocket = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  const handleVoiceEvent = useCallback(
    (event: VoiceEvent) => {
      if (event.type === "assistant_audio") {
        const arrayBuffer = base64ToArrayBuffer(event.audio);
        const wav = pcm16ToWav(arrayBuffer);
        const playbackContext =
          playbackContextRef.current ?? new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
        playbackContextRef.current = playbackContext;
        playbackContext.resume();
        playbackContext.decodeAudioData(wav.slice(0)).then((audioBuffer) => {
          const source = playbackContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(playbackContext.destination);
          const startTime = Math.max(playbackContext.currentTime, nextPlaybackTimeRef.current);
          source.start(startTime);
          nextPlaybackTimeRef.current = startTime + audioBuffer.duration;
        });
      }
      onVoiceEvent?.(event);
    },
    [onVoiceEvent],
  );

  const handleRealtimeMessage = useCallback(
    (raw: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(raw.data) as VoiceEvent;
        handleVoiceEvent(payload);
      } catch (error) {
        console.error("Failed to parse voice event", error);
      }
    },
    [handleVoiceEvent],
  );

  const ensureSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return socketRef.current;
    }
    const socket = createVoiceSocket();
    socketRef.current = socket;
    socket.addEventListener("message", (event) =>
      handleRealtimeMessage(event as MessageEvent<string>),
    );
    socket.addEventListener("close", () => setStatus("Voice session disconnected"));
    socket.addEventListener("open", () => setStatus("Voice session ready"));
    socket.addEventListener("error", () => setStatus("Voice socket error"));
    return socket;
  }, [handleRealtimeMessage]);

  useEffect(() => () => {
    cleanupCapture();
    closeSocket();
    playbackContextRef.current?.close();
  }, [cleanupCapture, closeSocket]);

  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);
    if (mode === "transcribe") {
      mediaRecorderRef.current?.stop();
      captureContextRef.current?.close();
      captureContextRef.current = null;
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      audioChunksRef.current = [];
      const formData = new FormData();
      formData.append("audio", blob, "speech.webm");
      try {
        setStatus("Transcribing...");
        const text = await transcribeAudio(formData);
        if (text) {
          onTranscript(text);
          setStatus("Transcript ready – edit before sending");
        } else {
          setStatus("No speech detected");
        }
      } catch (error) {
        console.error(error);
        setStatus("Transcription failed");
      }
    } else {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "commit_audio" }));
      }
      cleanupCapture();
      setStatus("Voice turn sent");
    }
  }, [cleanupCapture, mode, onTranscript]);

  const startTranscribeMode = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
  }, []);

  const downsampleAndSend = useCallback((buffer: Float32Array, sampleRate: number) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const ratio = sampleRate / TARGET_SAMPLE_RATE;
    const newLength = Math.floor(buffer.length / ratio);
    const pcmBuffer = new ArrayBuffer(newLength * 2);
    const view = new DataView(pcmBuffer);
    let offset = 0;
    for (let i = 0; i < newLength; i += 1) {
      const sample = buffer[Math.floor(i * ratio)];
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped * 0x7fff, true);
      offset += 2;
    }
    socket.send(pcmBuffer);
  }, []);

  const startRealtimeMode = useCallback(async () => {
    const socket = ensureSocket();
    if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
      throw new Error("Voice socket not ready");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const audioContext = new AudioContext();
    captureContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    processor.onaudioprocess = (event) => {
      const channelData = event.inputBuffer.getChannelData(0);
      downsampleAndSend(channelData, audioContext.sampleRate);
    };
    source.connect(processor);
    processor.connect(audioContext.destination);
  }, [downsampleAndSend, ensureSocket]);

  const handleStartRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      setStatus(mode === "transcribe" ? "Recording..." : "Streaming live...");
      if (mode === "transcribe") {
        await startTranscribeMode();
      } else {
        await startRealtimeMode();
      }
    } catch (error) {
      console.error(error);
      setIsRecording(false);
      setStatus("Mic permission ya device issue");
    }
  }, [mode, startRealtimeMode, startTranscribeMode]);

  const toggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  useEffect(() => {
    if (mode === "realtime") {
      ensureSocket();
    } else {
      closeSocket();
    }
    return () => {
      if (mode === "transcribe") {
        cleanupCapture();
      }
    };
  }, [mode, ensureSocket, closeSocket, cleanupCapture]);

  return (
    <div className={className ? `mic-recorder ${className}` : "mic-recorder"}>
      <div className="mode-toggle">
        <button
          type="button"
          className={mode === "transcribe" ? "active" : ""}
          onClick={() => setMode("transcribe")}
        >
          🎤 Text Mode
        </button>
        <button
          type="button"
          className={mode === "realtime" ? "active" : ""}
          onClick={() => setMode("realtime")}
        >
          🛜 Voice Mode
        </button>
      </div>
      <button type="button" className={isRecording ? "mic-button active" : "mic-button"} onClick={toggleRecording}>
        {isRecording ? "Stop" : "Start"}
      </button>
      <p className="mic-status">{status}</p>
    </div>
  );
}

export default MicRecorder;
