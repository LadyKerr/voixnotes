"use client";

import { useState, useRef, useCallback } from "react";

interface UseTranscriptionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  onAudioChunk: (chunk: Blob) => void;
}

export function useTranscription(): UseTranscriptionReturn {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const transcriptRef = useRef("");

  const startListening = useCallback(async () => {
    try {
      // Get a temporary Deepgram API key from our server
      const res = await fetch("/api/deepgram");
      if (!res.ok) {
        console.error("Failed to get Deepgram key:", res.status);
        return;
      }
      const { key } = await res.json();

      const params = new URLSearchParams({
        model: "nova-3",
        punctuate: "true",
        interim_results: "true",
        language: "en",
        smart_format: "true",
      });

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${params}`,
        ["token", key]
      );

      ws.onopen = () => {
        setIsListening(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "Results") return;

          const alt = data.channel?.alternatives?.[0];
          if (!alt) return;

          const text = alt.transcript;
          if (!text) return;

          if (data.is_final) {
            transcriptRef.current += text + " ";
            setTranscript(transcriptRef.current);
            setInterimTranscript("");
          } else {
            setInterimTranscript(text);
          }
        } catch {
          // ignore non-JSON messages
        }
      };

      ws.onerror = (err) => {
        console.error("Deepgram WebSocket error:", err);
      };

      ws.onclose = () => {
        setIsListening(false);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to start transcription:", err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (wsRef.current) {
      // Send close message to Deepgram to flush final results
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
      }
      // Close after a short delay to receive final transcript
      setTimeout(() => {
        wsRef.current?.close();
        wsRef.current = null;
      }, 500);
      setIsListening(false);
      setInterimTranscript("");
    }
  }, []);

  const onAudioChunk = useCallback((chunk: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(chunk);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    onAudioChunk,
  };
}
