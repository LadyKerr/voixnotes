import { Note } from "@/types/note";

export async function getNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) {
    console.error("Failed to fetch notes:", res.status);
    return [];
  }
  return res.json();
}

export async function saveNote(
  transcript: string,
  audioBlob: Blob | null,
  duration: number
): Promise<Note | null> {
  const formData = new FormData();
  formData.append("transcript", transcript);
  formData.append("duration", String(duration));
  if (audioBlob) {
    formData.append("audio", audioBlob, "recording.webm");
  }

  const res = await fetch("/api/notes", { method: "POST", body: formData });
  if (!res.ok) {
    console.error("Failed to save note:", res.status);
    return null;
  }
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  if (!res.ok) console.error("Failed to delete note:", res.status);
}

export async function updateNote(
  id: string,
  updates: Partial<Note>
): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) console.error("Failed to update note:", res.status);
}

/** Get the public URL for an audio file stored in Supabase Storage */
export function getAudioUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/audio/${path}`;
}
