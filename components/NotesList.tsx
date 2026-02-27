"use client";

import { Note } from "@/types/note";
import { NoteCard } from "./NoteCard";
import { Mic } from "lucide-react";

interface NotesListProps {
  notes: Note[];
  onDelete: (id: string) => void;
  onSummarize: (id: string) => Promise<void>;
}

function getDateLabel(dateStr: string): string {
  const noteDate = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  noteDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  if (noteDate.getTime() === today.getTime()) {
    return "Today";
  } else if (noteDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return noteDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

function groupNotesByDate(notes: Note[]): Map<string, Note[]> {
  const grouped = new Map<string, Note[]>();

  // Sort notes by date (newest first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sortedNotes.forEach((note) => {
    const label = getDateLabel(note.created_at);
    if (!grouped.has(label)) {
      grouped.set(label, []);
    }
    grouped.get(label)!.push(note);
  });

  return grouped;
}

export function NotesList({ notes, onDelete, onSummarize }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Mic className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg">No voice notes yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tap the microphone to record your first note
        </p>
      </div>
    );
  }

  const groupedNotes = groupNotesByDate(notes);
  const dateLabels = Array.from(groupedNotes.keys());

  return (
    <div className="flex flex-col gap-6">
      {dateLabels.map((label) => (
        <div key={label}>
          {/* Section header */}
          <h2 className="text-sm font-semibold text-foreground mb-3">{label}</h2>
          {/* Notes in this group */}
          <div className="flex flex-col">
            {groupedNotes.get(label)!.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={onDelete} onSummarize={onSummarize} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
