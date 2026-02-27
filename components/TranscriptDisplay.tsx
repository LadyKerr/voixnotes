"use client";

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
}

export function TranscriptDisplay({
  transcript,
  interimTranscript,
  isListening,
}: TranscriptDisplayProps) {
  if (!isListening && !transcript && !interimTranscript) return null;

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border bg-card p-4 min-h-[80px]">
      <p className="text-sm text-muted-foreground mb-1 font-medium">
        {isListening ? "Listening..." : "Transcript"}
      </p>
      <p className="text-sm leading-relaxed">
        {transcript}
        {interimTranscript && (
          <span className="text-muted-foreground italic">
            {interimTranscript}
          </span>
        )}
        {isListening && !transcript && !interimTranscript && (
          <span className="text-muted-foreground italic">
            Start speaking...
          </span>
        )}
      </p>
    </div>
  );
}
