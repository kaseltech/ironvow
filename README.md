# IronVow

> Your AI training partner that actually knows you.

AI-powered workout generation and tracking app. Part of the Vow Suite.

## Status: Active Development

The app is fully functional with AI workout generation, GPS run tracking, and comprehensive exercise library.

## Features

- **AI Workout Generation** - Context-aware workouts based on your equipment, goals, and history
- **8 Workout Styles** - Traditional, Strength (5x5), HIIT, Circuit, WOD, Cardio, Mobility, Rehab
- **GPS Run Tracking** - Real-time tracking with voice announcements
- **Exercise Library** - 200+ exercises including CrossFit, HIIT, Hyrox, and rehab movements
- **Movement Pattern Tags** - Injury-aware exercise recommendations
- **Offline Support** - Queue workouts for sync when back online

## Quick Start

```bash
npm install
npm run dev
```

### iOS Build

```bash
npm run build
npx cap sync
npx cap open ios
```

## Tech Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS
- **Mobile:** Capacitor 8 (iOS)
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions)
- **AI:** Claude 3 Haiku via Anthropic API

## Documentation

- [CONTEXT.md](./CONTEXT.md) - Full project context and development log
- [IRONVOW.md](./IRONVOW.md) - Original spec and planning doc
- [NOTES.md](./NOTES.md) - Development notes and ideas

## Related

- [YearVow](https://github.com/kaseltech/resolutions) - Resolution tracking app (sibling project)

---

*Part of the Vow Suite by KaselTech*
