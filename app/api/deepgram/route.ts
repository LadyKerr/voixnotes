import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/deepgram — create a short-lived Deepgram API key for client-side streaming
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Deepgram not configured" }, { status: 500 });
  }

  try {
    // Get the project ID
    const projRes = await fetch("https://api.deepgram.com/v1/projects", {
      headers: { Authorization: `Token ${apiKey}` },
    });
    if (!projRes.ok) {
      throw new Error(`Failed to list projects: ${projRes.status}`);
    }
    const { projects } = await projRes.json();
    const projectId = projects[0]?.project_id;
    if (!projectId) {
      throw new Error("No Deepgram project found");
    }

    // Create a temporary API key (60 second TTL)
    const keyRes = await fetch(
      `https://api.deepgram.com/v1/projects/${projectId}/keys`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: "voixnotes-temp",
          scopes: ["usage:write"],
          time_to_live_in_seconds: 60,
        }),
      }
    );
    if (!keyRes.ok) {
      throw new Error(`Failed to create temp key: ${keyRes.status}`);
    }
    const { key } = await keyRes.json();

    return NextResponse.json({ key });
  } catch (err) {
    console.error("Deepgram key error:", err);
    return NextResponse.json({ error: "Failed to create streaming key" }, { status: 500 });
  }
}
