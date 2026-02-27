"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { RecordButton } from "@/components/RecordButton";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { NotesList } from "@/components/NotesList";
import { useRecorder } from "@/hooks/useRecorder";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useNotes } from "@/hooks/useNotes";
import { AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

export default function RecordPage() {
  const { user } = useUser();

  // Cache userId in localStorage so notes load instantly on refresh
  const [cachedUserId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("voixnotes_uid") : null
  );
  useEffect(() => {
    if (user?.id) localStorage.setItem("voixnotes_uid", user.id);
  }, [user?.id]);
  const userId = user?.id ?? cachedUserId;

  const { isRecording, duration, startRecording, stopRecording } = useRecorder();
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();
  const { notes, isLoading, addNote, deleteNote, updateNote } = useNotes(userId);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note || !note.transcript) return;

    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: note.transcript }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "Failed to generate summary");
      return;
    }

    const { summary } = await res.json();
    await updateNote(id, { summary });
  };

  const handleStart = async () => {
    try {
      setError(null);
      resetTranscript();
      // Start speech recognition FIRST — on Android, the first consumer
      // of the mic gets priority. Transcription is the core feature.
      if (isSupported) {
        startListening();
      }
      // Small delay to let speech recognition claim the mic before MediaRecorder
      await new Promise((r) => setTimeout(r, 500));
      await startRecording();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not access microphone.";
      setError(msg + " Please allow microphone access and try again.");
    }
  };

  const handleStop = async () => {
    stopListening();
    const result = await stopRecording();
    const finalTranscript = transcript + (interimTranscript ? " " + interimTranscript : "");

    if (finalTranscript.trim()) {
      await addNote(finalTranscript.trim(), result.audioBlob, result.duration);
    }
    resetTranscript();
  };

  // Refs to maintain stable closures for event listeners
  const isRecordingRef = useRef(isRecording);
  const handleStartRef = useRef(handleStart);
  const handleStopRef = useRef(handleStop);

  // Sync refs with current state/functions
  isRecordingRef.current = isRecording;
  handleStartRef.current = handleStart;
  handleStopRef.current = handleStop;

  // Handle spacebar to toggle recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.code === "Space" && !isRecordingRef.current) {
        e.preventDefault();
        handleStartRef.current();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.code === "Space" && isRecordingRef.current) {
        e.preventDefault();
        handleStopRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Voixnotes logo" width={28} height={28} />
            <h1 className="text-xl font-semibold">Voixnotes ({notes.length})</h1>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Notes list */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-4 pb-48">
        {isSupported === null && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-muted bg-muted/30 p-3 mb-4 text-sm text-muted-foreground">
            <Image src="/logo.svg" alt="Loading" width={20} height={20} className="animate-pulse" />
            <p>Initializing…</p>
          </div>
        )}

        {isSupported === false && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 mb-4 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
            <p>
              Speech recognition is not supported in your browser. Try Chrome or Edge for live transcription.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 mb-4 text-sm">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <NotesList notes={notes} onDelete={deleteNote} onSummarize={handleSummarize} />
        )}
      </main>

      {/* Recording controls - fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="max-w-xl mx-auto px-4 py-4 flex flex-col items-center gap-3">
          <TranscriptDisplay
            transcript={transcript}
            interimTranscript={interimTranscript}
            isListening={isListening}
          />
          <RecordButton
            isRecording={isRecording}
            duration={duration}
            onStart={handleStart}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  );
}
