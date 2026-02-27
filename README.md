# Voixnotes

Record, transcribe, and summarize your voice notes — all in one place.

## Features

- 🎙️ **Voice Recording** — tap or hold spacebar to record
- 📝 **Live Transcription** — real-time speech-to-text via Web Speech API
- ✨ **AI Summaries** — one-click note summarization powered by GitHub Copilot SDK
- 🔊 **Audio Playback & Download** — play back or download recordings
- 🔐 **Authentication** — sign in with Google, LinkedIn, or GitHub via Clerk
- ☁️ **Cloud Storage** — notes and audio stored in Supabase
- 📱 **PWA** — installable on mobile, works offline

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Audio Storage:** Supabase Storage
- **AI:** GitHub Copilot SDK
- **UI:** Tailwind CSS, shadcn/ui, Lucide icons
- **Deployment:** Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- A GitHub PAT with `copilot` and `read:packages` scopes

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.local.example` or create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/record
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/record

# GitHub (Copilot SDK)
GITHUB_TOKEN=your-github-pat
```

### 3. Set up Supabase

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  transcript TEXT NOT NULL,
  summary TEXT,
  audio_path TEXT,
  duration REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_user_id ON notes (user_id);
CREATE INDEX idx_notes_created_at ON notes (created_at DESC);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
```

Then create a **Storage bucket** named `audio` (public, with file size and MIME type restrictions).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── page.tsx                  # Landing page
├── record/page.tsx           # Recording page (authenticated)
├── sign-in/[[...sign-in]]/   # Clerk sign-in
├── sign-up/[[...sign-up]]/   # Clerk sign-up
├── api/
│   ├── notes/                # Notes CRUD (GET, POST)
│   │   └── [id]/             # Note by ID (PATCH, DELETE)
│   └── summarize/            # AI summarization
components/                   # UI components
hooks/                        # Custom React hooks
lib/                          # Supabase client, storage helpers, rate limiting
types/                        # TypeScript types
proxy.ts                      # Clerk auth proxy (Next.js 16)
```

## Deployment

Deployed on Netlify. Set all environment variables in Netlify → Site settings → Environment variables.

> **Note:** The `GITHUB_TOKEN` PAT expires every 30 days. When it expires, the summarize feature will show a friendly error message to users. Rotate the token in your Netlify dashboard.

## License

MIT
