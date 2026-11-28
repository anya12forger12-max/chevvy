# Chevvy

A local-first planner for tasks, notes, and habit insights — with a separate Flutter privacy-policy module for the mobile track.

The web app in this repository is React 19 + TypeScript + Vite 8, with Capacitor scaffolding for Android. It currently runs entirely in the browser: [`src/services/db.ts`](src/services/db.ts) seeds demo profiles and stores users, tasks, notes, audit logs, and sessions in `localStorage`, with salted SHA-256 hashing through WebCrypto. [`src/firebase-config.ts`](src/firebase-config.ts) holds Firebase placeholders, but the running web app uses the local service rather than a hosted backend.

> The seeded accounts and browser-only persistence are a demo setup, not a production authentication system. See [Security notes](#security-notes).

## Features

- **Task scheduling** — priorities, colors, due dates, reminders before a task, recurrence, snooze counts, and optional alarm music.
- **Day planning** — start-of-day plan and end-of-day review dialogs with configurable times.
- **Notes** — folders, favorites, search, and sorting by title, creation, or last edit.
- **Habit insights** — `analyzeHabits()` derives productive hours/days, snooze patterns, completion rates by priority, and suggested schedule changes from logged tasks.
- **Note-to-task suggestions** — `detectTasksFromNote()` uses rule-based patterns in English, Telugu, and Hindi to propose tasks with due dates; the user approves them before they are scheduled.
- **Accessibility controls** — high contrast, large text, reduced motion, three color-blind modes, keyboard/semantic hints, and screen-reader announcements via `aria-live`.
- **Voice-note and music simulations** — a microphone-permission flow with a canvas visualizer, plus a simulated Spotify-style player for alarm tracks. These are UI simulations, not integrations with Spotify or a speech service.
- **Admin role and audit view** — role-based navigation and an audit log panel for the seeded administrator profile.
- **Privacy gate** — explicit policy acceptance is required before proceeding.

## Quick start

Node.js 22+ is recommended (Vite 8 requires Node 20.19+).

```bash
git clone https://github.com/anya12forger12-max/chevvy.git
cd chevvy

npm install
npm run dev

# Quality checks and production build
npm run lint
npm run test:run
npm run build
npm run preview
```

[`install.sh`](install.sh) performs the same dependency install. For a containerized static deployment:

```bash
cp .env.example .env   # fill in your own values; .env is ignored by git
docker compose build
docker compose up -d
```

[`DEPLOYMENT.md`](DEPLOYMENT.md) documents the nginx image, build-time `VITE_FIREBASE_*` variables, and the Firebase Hosting workflow. Those values are embedded into the JavaScript bundle at build time, so never put real credentials in tracked files.

## Mobile tracks

- [`android/`](android) and [`capacitor.config.ts`](capacitor.config.ts) provide Capacitor scaffolding for the React web app (`appId: com.chevvy.app`, `webDir: www`).
- [`chevvy/`](chevvy) contains a separate Flutter module: a Material 3 privacy-policy screen with Firebase Auth/Firestore integration, secure storage, GoRouter guards, and its own [README](chevvy/README.md), [SETUP](chevvy/SETUP.md), and [license](chevvy/LICENSE).

These are two implementation tracks in one repository, not a single published app build.

## Project structure

```text
src/
├── App.tsx                 # navigation, scheduling, notes, settings, admin UI
├── main.tsx                # React entry point and database initialization
├── services/
│   ├── db.ts               # LocalStorage data layer, demo seed, audit logging
│   ├── habit.ts            # completion/snooze-based habit analysis
│   └── ai.ts               # rule-based note-to-task suggestions
├── __tests__/              # Vitest smoke test
└── assets/                 # bundled images
chevvy/lib/                 # Flutter privacy-policy module
android/                    # Capacitor Android project
```

## Security notes

The demo accounts are seeded in source and the data layer uses browser `localStorage`; both are unsuitable for real credentials or sensitive data. WebCrypto hashing is used for the demo, but there is no server-side session management, rate limiting, or account recovery. Replace the data layer before treating Chevvy as a production app, and never reuse real passwords with the demo profiles. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) and [SECURITY.md](SECURITY.md) for the project's stated policies.

## License and credits

- Root web app: MIT License, Copyright (c) 2026 Chevvy — see [`LICENSE`](LICENSE).
- Flutter module: MIT License, Copyright (c) 2026 anyaforger123456 — see [`chevvy/LICENSE`](chevvy/LICENSE).

Additional guides: [CONTRIBUTING.md](CONTRIBUTING.md), [ONBOARDING.md](ONBOARDING.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
