import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/notes — fetch all notes for the authenticated user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(userId);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch notes:", error.message);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/notes — create a new note (with optional audio upload)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(userId);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const formData = await req.formData();
  const transcript = formData.get("transcript") as string;
  const duration = parseFloat(formData.get("duration") as string) || 0;
  const audioFile = formData.get("audio") as File | null;

  if (!transcript) {
    return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
  }

  let audioPath: string | null = null;

  if (audioFile && audioFile.size > 0) {
    const fileName = `${userId}/${crypto.randomUUID()}.webm`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("audio")
      .upload(fileName, audioFile, { contentType: "audio/webm" });

    if (uploadError) {
      console.error("Failed to upload audio:", uploadError.message);
    } else {
      audioPath = fileName;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .insert({
      user_id: userId,
      transcript,
      summary: null,
      audio_path: audioPath,
      duration,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save note:", error.message);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
