"use client";

import { useState, useRef, useCallback } from "react";

interface UseRecorderReturn {
  isRecording: boolean;
  duration: number;
  mimeType: string;
  startRecording: (onChunk?: (chunk: Blob) => void) => Promise<void>;
  stopRecording: () => Promise<{ audioBlob: Blob | null; duration: number }>;
}

export function useRecorder(): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mimeType, setMimeType] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const onChunkRef = useRef<((chunk: Blob) => void) | null>(null);

  const startRecording = useCallback(async (onChunk?: (chunk: Blob) => void) => {
    try {
      onChunkRef.current = onChunk ?? null;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Media devices not available. Make sure you're using HTTPS and a supported browser."
        );
      }

      if (navigator.permissions) {
        try {
          const permResult = await navigator.permissions.query({ name: "microphone" as PermissionName });
          if (permResult.state === "denied") {
            throw new Error(
              "Microphone permission is denied. Please enable it in your browser/device settings."
            );
          }
        } catch {
          // permissions.query may not support 'microphone' on all browsers — continue anyway
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Pick a supported MIME type (Android Chrome may not support all)
      const selectedMime = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type)) || "";

      setMimeType(selectedMime);

      const mediaRecorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          onChunkRef.current?.(e.data);
        }
      };

      mediaRecorder.start(250); // 250ms chunks for smooth streaming
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, []);

  const stopRecording = useCallback((): Promise<{ audioBlob: Blob | null; duration: number }> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve({ audioBlob: null, duration: 0 });
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setIsRecording(false);
        setDuration(finalDuration);

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        resolve({ audioBlob: blob, duration: finalDuration });
      };

      mediaRecorder.stop();
    });
  }, []);

  return { isRecording, duration, mimeType, startRecording, stopRecording };
}
