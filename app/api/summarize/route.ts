import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { CopilotClient } from "@github/copilot-sdk";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(userId, { maxRequests: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Missing transcript" },
        { status: 400 }
      );
    }

    const client = new CopilotClient();
    await client.start();

    const session = await client.createSession({ model: "gpt-4.1" });

    let summary = "";

    session.on("assistant.message", (event: { data: { content: string } }) => {
      summary += event.data.content;
    });

    await session.send({
      prompt: `Summarize the following voice note transcript in 1-3 concise sentences. Focus on the key themes and main points. Do not include any preamble or labels, just the summary itself.\n\nTranscript:\n${transcript}`,
    });

    // Wait for the session to finish processing
    await new Promise<void>((resolve) => {
      session.on("session.idle", () => resolve());
    });

    await session.destroy();
    await client.stop();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
