import { Mic, FileText, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-6">
          <Image src="/logo.svg" alt="Voixnotes logo" width={48} height={48} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Voixnotes</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-md">
          Record, transcribe, and summarize your voice notes — all in one place.
        </p>
        <div className="flex gap-3 mt-8">
          <Link
            href="/sign-up"
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="px-5 py-2.5 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="border-t bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 py-16 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Record</h3>
            <p className="text-sm text-muted-foreground">
              Tap to record voice notes with instant audio capture
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Transcribe</h3>
            <p className="text-sm text-muted-foreground">
              Live speech-to-text transcription as you speak
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Summarize</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered summaries of your notes in one click
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Built with ❤️ by <a href="https://www.instagram.com/itsthatlady.dev/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">@itsthatladydev</a>, Copilot CLI & Copilot SDK — your notes, your data
      </footer>
    </div>
  );
}
