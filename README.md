# IronVow

> Your AI training partner that actually knows you.

AI-powered workout generation and tracking app. Part of the Vow Suite.

## Status: Active Development

The app is fully functional with AI workout generation, GPS run tracking, comprehensive exercise library, and weekly workout planning.

## Features

### Workout Generation
- **AI Workout Generation** - Context-aware workouts based on your equipment, goals, and history
- **8 Workout Styles** - Traditional, Strength (5x5), HIIT, Circuit, WOD, Cardio, Mobility, Rehab
- **Weekly Planner Mode** - Generate balanced multi-day workout programs:
  - Select training days with day toggles (Mon-Sun)
  - Preset splits: Push/Pull/Legs, Upper/Lower, Full Body
  - Per-day muscle group customization
  - AI auto-balances based on training frequency

### Workout Tracking
- **FlexTimer** - Adjustable rest timer with swipe controls
- **Set Logging** - Weight, reps, RPE, set types (warmup, working, dropset, failure)
- **GPS Run Tracking** - Real-time tracking with voice announcements
- **Session Notes & Ratings** - Post-workout feedback

### Progress & Analytics
- **Weight Tracking** - Log weight, visualize trends, track vs goals
- **Strength Standards** - Compare lifts against experience-level benchmarks
- **Muscle Balance Map** - Interactive body visualization:
  - Head-to-toe muscle ordering
  - Front/Back view with hover-to-switch
  - Strength indicators per muscle
  - Volume tracking (30-day)
  - Imbalance detection

### Workout History
- **Expandable Cards** - Tap to expand inline exercise details
- **Detail Page** - Full workout breakdown with all sets
- **Bookmark & Save** - Save favorite workouts
- **Do Again** - One-tap to reload past workouts

### Library & Settings
- **Exercise Library** - 200+ exercises with muscle targeting
- **Movement Pattern Tags** - Injury-aware recommendations
- **Gym Profiles** - Save equipment by location
- **Offline Support** - Queue workouts for sync

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

- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [CONTEXT.md](./CONTEXT.md) - Full project context and development log
- [IRONVOW.md](./IRONVOW.md) - Original spec and planning doc
- [NOTES.md](./NOTES.md) - Development notes and ideas

## Related

- [YearVow](https://github.com/kaseltech/resolutions) - Resolution tracking app (sibling project)

---

*Part of the Vow Suite by KaselTech*
