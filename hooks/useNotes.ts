"use client";

import { useState, useEffect, useCallback } from "react";
import { Note } from "@/types/note";
import {
  getNotes,
  saveNote,
  deleteNote as removeNote,
  updateNote as patchNote,
} from "@/lib/storage";

export function useNotes(userId: string | null | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const data = await getNotes();
    setNotes(data);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [userId, refresh]);

  const addNote = useCallback(
    async (transcript: string, audioBlob: Blob | null, duration: number) => {
      if (!userId) return null;
      const saved = await saveNote(transcript, audioBlob, duration);
      await refresh();
      return saved;
    },
    [userId, refresh]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!userId) return;
      await removeNote(id);
      await refresh();
    },
    [userId, refresh]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      if (!userId) return;
      await patchNote(id, updates);
      await refresh();
    },
    [userId, refresh]
  );

  return { notes, isLoading, addNote, deleteNote, updateNote };
}
