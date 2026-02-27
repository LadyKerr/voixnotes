"use client";

import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  isRecording: boolean;
  duration: number;
  onStart: () => void;
  onStop: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function RecordButton({
  isRecording,
  duration,
  onStart,
  onStop,
}: RecordButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        size="lg"
        onClick={isRecording ? onStop : onStart}
        className={cn(
          "h-20 w-20 rounded-full transition-all duration-300",
          isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50"
            : "bg-primary hover:bg-primary/90"
        )}
      >
        {isRecording ? (
          <Square className="h-8 w-8 fill-white" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>
      {isRecording ? (
        <span className="text-sm text-red-500 font-mono font-medium">
          {formatDuration(duration)}
        </span>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-muted-foreground">Tap to record</span>
          <span className="text-xs text-muted-foreground">or press Space to record</span>
        </div>
      )}
    </div>
  );
}
