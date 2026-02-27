# Voixnotes — Product Requirements Document

## Overview

**Voixnotes** is a Progressive Web App (PWA) for capturing, transcribing, and summarizing voice notes. The core use case is quick idea capture on mobile — tap to record, get an instant transcript, and optionally generate an AI summary. It works across desktop and mobile browsers, installs to the home screen, and supports offline access to previously loaded notes.

**Live URL:** https://voixnotes.com  
**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, Clerk, Deepgram, GitHub Copilot SDK

---

## Problem Statement

Capturing fleeting ideas on mobile is friction-heavy. Typing is slow, and existing voice note apps either lack transcription or require expensive subscriptions. Voixnotes provides a fast, lightweight way to record a thought, get it transcribed in real-time, and summarize it later — all from a mobile browser or home-screen PWA, with no app store required.

---

## Target Users

- Mobile-first users who want to capture ideas on the go
- Professionals who record meeting notes, reminders, or brainstorms
- Anyone who prefers speaking over typing

---

## Core Features

### 1. Voice Recording
- **Tap-to-record** microphone button with visual recording indicator (red pulse)
- **Spacebar hold** to record on desktop (push-to-talk)
- **Duration timer** displays elapsed time while recording
- Audio captured via MediaRecorder API with noise suppression, echo cancellation, and auto gain control
- Supports `audio/webm;codecs=opus` (Chrome/Android) and `audio/mp4` (Safari/iOS) with automatic format detection
- Audio chunks streamed at 250ms intervals for real-time transcription

### 2. Real-Time Transcription (Deepgram)
- Live transcription via Deepgram's `nova-3` model over WebSocket
- Interim results displayed as the user speaks (grey italic text)
- Final results accumulated into the full transcript
- Punctuation and smart formatting enabled
- Server-side API route generates short-lived Deepgram keys (60s TTL) to keep credentials secure
- Works on all browsers that support MediaRecorder (Chrome, Firefox, Safari, Edge — desktop and mobile)

### 3. Note Management
- Notes displayed in a chronological list grouped by date (Today, Yesterday, or formatted date)
- Each note shows: timestamp, transcript (expandable), optional summary, audio player, and action buttons
- **Actions per note:**
  - ▶️ Play audio (inline player with duration display)
  - ⬇️ Download audio file
  - ✨ Generate AI summary
  - 📋 Copy transcript to clipboard
  - 🗑️ Delete note
- Note count displayed in the header
- Empty state with mic icon and prompt ("No voice notes yet")

### 4. AI Summarization (GitHub Copilot SDK)
- One-click summary generation per note
- Powered by GitHub Copilot SDK (GPT-4.1 model)
- Summary is stored persistently and toggleable (Show/Hide summary)
- Rate limited to 10 requests per minute per user
- Requires a GitHub PAT with `copilot` and `read:packages` scopes

### 5. Authentication (Clerk)
- OAuth sign-in via GitHub, Google, and LinkedIn
- Email/password sign-in as fallback
- Protected routes: `/record` requires authentication
- Public routes: `/`, `/sign-in`, `/sign-up`
- Post-sign-in redirect to `/record`
- User avatar displayed in header via Clerk's `UserButton` component

### 6. PWA & Offline Support
- Installable to home screen (Android and iOS)
- Standalone display mode (no browser chrome)
- Service worker (`sw.js`) with cache-first strategy
- Caches static assets for offline access
- Portrait orientation lock
- Dark theme with `#09090b` background

---

## Data Model

### Note
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `user_id` | string | Clerk user ID |
| `transcript` | string | Full transcription text |
| `summary` | string \| null | AI-generated summary |
| `audio_path` | string \| null | Path in Supabase Storage (e.g., `user_id/uuid.webm`) |
| `duration` | number | Recording duration in seconds |
| `created_at` | timestamp | Auto-generated creation time |

### Storage
- **Database:** Supabase PostgreSQL — `notes` table
- **Audio files:** Supabase Storage — `audio` bucket, public access for playback
- **Client cache:** localStorage for userId (faster initial load on refresh)

---

## API Routes

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/notes` | GET | ✅ | 30/min | Fetch all notes for authenticated user, newest first |
| `/api/notes` | POST | ✅ | 30/min | Create note with transcript + optional audio (FormData) |
| `/api/notes/[id]` | PATCH | ✅ | 30/min | Update note (summary field only) |
| `/api/notes/[id]` | DELETE | ✅ | 30/min | Delete note and associated audio file |
| `/api/deepgram` | GET | ✅ | — | Generate temporary Deepgram API key (60s TTL) |
| `/api/summarize` | POST | ✅ | 10/min | Generate AI summary from transcript text |

All API routes use Clerk's `auth()` for authentication and return appropriate HTTP status codes (401, 429, 400, 500).

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client (PWA)                   │
│                                                  │
│  Record Page                                     │
│  ├─ useRecorder ──── MediaRecorder (mic audio)   │
│  │                    └─ 250ms chunks ──────────┐│
│  ├─ useTranscription  ◄── Deepgram WebSocket ◄──┘│
│  ├─ useNotes ──────── CRUD state management      │
│  └─ Components ────── RecordButton, NoteCard,    │
│                        NotesList, TranscriptView  │
├──────────────────────────────────────────────────┤
│                 Next.js 16 API Layer             │
│  ├─ /api/notes ────── Supabase DB + Storage      │
│  ├─ /api/deepgram ─── Temp key generation        │
│  └─ /api/summarize ── GitHub Copilot SDK         │
├──────────────────────────────────────────────────┤
│                  External Services               │
│  ├─ Supabase ──────── PostgreSQL + Object Storage│
│  ├─ Clerk ─────────── Auth (OAuth + email)       │
│  ├─ Deepgram ──────── Speech-to-text (nova-3)    │
│  └─ GitHub Copilot ── Summarization (GPT-4.1)    │
└──────────────────────────────────────────────────┘
```

---

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase admin access (bypasses RLS) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client | Clerk frontend SDK |
| `CLERK_SECRET_KEY` | Server only | Clerk backend auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Client | Sign-in page path (`/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Client | Sign-up page path (`/sign-up`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Client | Post-sign-in redirect (`/record`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Client | Post-sign-up redirect (`/record`) |
| `GITHUB_TOKEN` | Server only | GitHub PAT for Copilot SDK |
| `DEEPGRAM_API_KEY` | Server only | Deepgram API key for transcription |

---

## Deployment

- **Platform:** Netlify
- **Build:** `npm run build` (Next.js 16 with Turbopack)
- **Runtime:** Node.js 20+
- **Plugin:** `@netlify/plugin-nextjs` (auto-detected)
- **Custom headers:** `Permissions-Policy: microphone=(self)` for all routes
- **Auth proxy:** `proxy.ts` (Next.js 16 middleware replacement) handles Clerk auth with `authorizedParties` for production domain, localhost, and Netlify deploy previews

---

## Non-Functional Requirements

- **Performance:** Notes load instantly on refresh via cached userId; optimistic UI updates on save
- **Security:** All API keys server-side only; temporary Deepgram keys (60s TTL); Clerk auth on all API routes; rate limiting on all endpoints
- **Accessibility:** Semantic HTML, ARIA labels, keyboard support (spacebar recording)
- **Mobile-first:** Responsive layout, touch-friendly controls, PWA installable, portrait orientation
- **Offline:** Service worker caches static assets; previously loaded notes available offline

---

## Future Considerations

- Folder/tag organization for notes
- Search across transcripts
- Multi-language transcription support
- Shared/collaborative notes
- Audio playback speed control
- Export notes (PDF, Markdown)
- Push notifications for reminders
