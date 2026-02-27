import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

// PATCH /api/notes/[id] — update a note
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(userId);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const updates = await req.json();

  // Only allow updating summary
  const safeUpdates: Record<string, unknown> = {};
  if (typeof updates.summary === "string") {
    safeUpdates.summary = updates.summary;
  }

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: "No valid updates" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("notes")
    .update(safeUpdates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update note:", error.message);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/notes/[id] — delete a note and its audio
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(userId);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;

  // Fetch note to get audio_path before deleting
  const { data: note } = await supabaseAdmin
    .from("notes")
    .select("audio_path")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (note?.audio_path) {
    await supabaseAdmin.storage.from("audio").remove([note.audio_path]);
  }

  const { error } = await supabaseAdmin
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete note:", error.message);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
