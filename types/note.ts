export interface Note {
  id: string;
  user_id: string;
  transcript: string;
  summary: string | null;
  audio_path: string | null;
  duration: number;
  created_at: string;
}

/** Convenience type for creating a new note (server sets id, created_at) */
export type NoteInsert = Omit<Note, "id" | "created_at">;
