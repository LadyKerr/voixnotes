"use client";

import { useRef, useState } from "react";
import { Trash2, ClipboardCopy, CheckCheck, Sparkles, Loader2, Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Note } from "@/types/note";
import { getAudioUrl } from "@/lib/storage";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onSummarize: (id: string) => Promise<void>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + " • " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function NoteCard({ note, onDelete, onSummarize }: NoteCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const MAX_TRANSCRIPT_LENGTH = 200;
  const shouldShowToggle = note.transcript && note.transcript.length > MAX_TRANSCRIPT_LENGTH;
  const displayTranscript = isExpanded ? note.transcript : note.transcript.substring(0, MAX_TRANSCRIPT_LENGTH);

  const copyTranscript = async () => {
    const text = showSummary && note.summary ? note.summary : note.transcript;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSummarize = async () => {
    if (note.summary) {
      setShowSummary(!showSummary);
      return;
    }
    setSummarizing(true);
    try {
      await onSummarize(note.id);
      setShowSummary(true);
    } finally {
      setSummarizing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !note.audio_path) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="border-b border-border pb-4 pt-4 first:pt-0">
      {/* Header: Date and time */}
      <p className="text-xs text-muted-foreground mb-3">{formatDate(note.created_at)}</p>

      {/* Body: Transcript or Summary */}
      <div className="mb-3">
        {showSummary && note.summary ? (
          <>
            <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Summary
            </p>
            <p className="text-sm leading-relaxed">{note.summary}</p>
            <button
              onClick={() => setShowSummary(false)}
              className="text-xs text-muted-foreground hover:text-foreground mt-2 underline underline-offset-2"
            >
              Show transcript
            </button>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed">
              {note.transcript ? (
                <>
                  {displayTranscript}
                  {shouldShowToggle && !isExpanded && "..."}
                </>
              ) : (
                <span className="italic text-muted-foreground">No transcript</span>
              )}
            </p>
            {shouldShowToggle && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-muted-foreground hover:text-foreground mt-2 underline underline-offset-2"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
            {note.summary && !shouldShowToggle && (
              <button
                onClick={() => setShowSummary(true)}
                className="text-xs text-muted-foreground hover:text-foreground mt-2 underline underline-offset-2"
              >
                Show summary
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer Row: Audio player and action buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Audio Player: Pill-shaped button */}
        {note.audio_path && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-3 h-7 gap-1 text-xs"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3 ml-0.5" />
            )}
            {formatDuration(note.duration)}
          </Button>
        )}
        <div className="flex-1" />

        {/* Action Buttons: Always visible */}
        <div className="flex items-center gap-1">
          {note.audio_path && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={getAudioUrl(note.audio_path)} download={`voixnote-${note.id}.webm`}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download audio</TooltipContent>
            </Tooltip>
          )}
          {note.transcript && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleSummarize}
                  disabled={summarizing}
                >
                  {summarizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{note.summary ? "Toggle summary" : "Summarize"}</TooltipContent>
            </Tooltip>
          )}
          {note.transcript && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={copyTranscript}
                >
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <ClipboardCopy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copied!" : "Copy transcript"}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(note.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {note.audio_path && (
        <audio
          ref={audioRef}
          src={getAudioUrl(note.audio_path)}
          onEnded={() => setIsPlaying(false)}
          preload="none"
        />
      )}
    </div>
  );
}
