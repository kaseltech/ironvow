# IronVow - AI-Powered Workout App

## Project Overview
IronVow is an AI-powered workout generation and tracking app, part of the "Vow Suite" alongside YearVow (resolutions app). The app generates personalized workouts based on user profile, equipment, injuries, and historical lift data.

**Domain:** ironvow.app
**GitHub:** https://github.com/kaseltech/ironvow
**Owner:** Charles Kasel (kaseltech)

---

## Tech Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Mobile:** Capacitor 8 (iOS wrapper)
- **Backend:** Supabase (Auth, PostgreSQL, RLS)
- **AI:** Claude 3.5 Sonnet recommended for workout generation
- **Deployment:** Vercel

---

## Project Structure
```
ironvow/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main workout generator UI
│   │   ├── workout/page.tsx   # Active workout session
│   │   ├── progress/page.tsx  # Weight & strength tracking
│   │   ├── profile/page.tsx   # User profile with body map
│   │   ├── library/page.tsx   # Exercise database
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Logo.tsx           # IronVow wordmark
│   │   └── BodyMap.tsx        # SVG muscle visualization
│   └── lib/
│       └── supabase/
│           ├── client.ts      # Browser client
│           ├── server.ts      # Server client
│           └── types.ts       # TypeScript types for DB
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # Full database schema
│       └── 002_seed_data.sql       # Exercise & equipment data
├── public/
│   ├── manifest.json
│   └── favicon.svg
├── .env.local                 # Secrets (not in git)
├── .env.example               # Template for env vars
├── capacitor.config.ts
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Database Schema (Supabase)

### Core Tables
- **profiles** - User data (gender, age, height, experience level, units preference)
- **weight_goals** - Cut/bulk/maintain goals with start/target weights
- **weight_logs** - Daily body weight tracking
- **injuries** - Injury tracking with movements to avoid (for AI awareness)
- **equipment** - Master equipment list
- **user_equipment** - User's available equipment per location (home/gym)
- **exercises** - Master exercise library (50+ exercises with muscle mapping)
- **workouts** - Saved/AI-generated workout templates
- **workout_exercises** - Exercises within workouts (sets, reps, weight targets)
- **workout_sessions** - Completed workout logs
- **set_logs** - Individual sets with actual weight/reps performed
- **personal_records** - PRs (1RM, 5RM, etc.)
- **muscle_strength** - Calculated strength scores per muscle (for body map visualization)

### Key Features
- Row-Level Security (RLS) - users can only access their own data
- Auto-create profile on signup via trigger
- Estimated 1RM calculation function (Epley formula)
- Indexes on frequently queried columns

---

## App Pages

### 1. Home (/) - Workout Generator
- Location selector (Home/Gym/Travel)
- Muscle group picker (Push/Pull/Legs/Upper/Lower/Full Body)
- Duration slider (15-90 min)
- "Generate Workout" button → AI creates personalized workout
- Shows generated workout preview with exercises

### 2. Workout (/workout) - Active Session
- Current exercise display with set/rep targets
- **Weight adjustment UI**: Inline +/- 5lb, +/- 10lb buttons
- **Rep adjustment**: +/- 1 from target
- Rest timer between sets
- "Done — 165 × 8 ✓" confirmation button
- Progress bar through workout

### 3. Progress (/progress) - Tracking
- **Weight chart**: Line graph of body weight over time
- **Strength PRs**: Cards showing best lifts (Bench, Squat, Deadlift, OHP)
- **Volume chart**: Weekly training volume by muscle group
- Goal progress indicator (e.g., "Cut: 195 → 180 lbs")

### 4. Profile (/profile) - User Settings
- **Body Map**: Interactive SVG showing muscle strength/weakness by color
  - Green = strong, Yellow = moderate, Red = weak/undertrained
  - Tap muscle to see stats
  - Toggle front/back view
  - Gender toggle (male/female silhouette)
- **User Info**: Age, height, experience level
- **Weight Goal**: Start → Current → Target with goal type
- **Injuries**: List of injuries with movements AI should avoid
- **Saved Workouts**: Bookmarked workout templates
- **Workout History**: Past sessions

### 5. Library (/library) - Exercise Database
- Searchable/filterable exercise list
- Each exercise shows:
  - Name, primary/secondary muscles
  - User's PR for that lift
  - Trend (improving/maintaining/declining)
  - Average rest days between sessions
  - Preferred rep range based on history
  - Last 5 session history

---

## AI Workout Generation

### Recommended Provider
**Claude 3.5 Sonnet** via Anthropic API (~$3/1M input tokens, $15/1M output)
- Excellent at structured JSON output
- Good at understanding fitness context
- Can be instructed to respect injuries/limitations

### Prompt Structure
```typescript
const systemPrompt = `You are an expert personal trainer AI. Generate personalized workouts.

CONTEXT:
- User Profile: ${JSON.stringify(userProfile)}
- Available Equipment: ${JSON.stringify(equipment)}
- Location: ${location}
- Target Duration: ${duration} minutes
- Focus Areas: ${JSON.stringify(muscleGroups)}
- Weight Goal: ${weightGoal}

LIFT HISTORY (last 30 days):
${JSON.stringify(liftHistory)}

INJURIES TO AVOID:
${JSON.stringify(injuries)}

RULES:
1. Never program movements that aggravate listed injuries
2. Suggest safe alternatives with "substitution_reason"
3. Progress weights by 2.5-5% when trend shows "improving"
4. Include warmup sets (50%, 70% of working weight)
5. Rest times: Compound=90-180s, Isolation=60-90s

OUTPUT JSON:
{
  "workout": {
    "name": "Push Day A",
    "estimated_duration": 45,
    "exercises": [
      {
        "name": "Bench Press",
        "muscle_groups": ["chest", "triceps"],
        "sets": [
          { "type": "warmup", "target_weight": 95, "target_reps": 10 },
          { "type": "working", "target_weight": 165, "target_reps": 8 }
        ],
        "rest_seconds": 120,
        "notes": "Based on your PR of 175x6, targeting 165x8",
        "substitution_for": null
      }
    ]
  },
  "coaching_notes": "..."
}`;
```

---

## Design System

### Colors
- **Navy (background):** #1F3A5A
- **Dark Navy:** #0F2233
- **Gold (accent):** #C9A75A
- **Cream (text):** #F5F1EA
- **Body Gray (silhouette):** #4A5568

### Typography
- Clean, modern sans-serif
- Premium fitness app aesthetic (like Equinox, Nike Training Club)

### Assets Needed (via Midjourney)
See `/Users/charleskasel/Desktop/IronVow-ChatGPT-Prompts.txt` for full list:
- Body silhouettes (male/female, front/back) - DALL-E failed on female, use Midjourney
- App icon (IV monogram on navy)
- UI icons (dumbbell, barbell, kettlebell, timer, flame, trophy, etc.)
- Equipment icons
- Workout type illustrations

---

## Environment Variables

```bash
# .env.local (not in git)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_DB_PASSWORD=xxx  # For reference only, not used in app

# For AI workout generation
ANTHROPIC_API_KEY=xxx
```

---

## Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/kaseltech/ironvow.git
cd ironvow
npm install
```

### 2. Supabase Setup
1. Create project at supabase.com
2. Run migrations in SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
3. Copy project URL and anon key to `.env.local`

### 3. Run Dev Server
```bash
npm run dev
```

### 4. Build for iOS
```bash
npm run build
npx cap sync
npx cap open ios
```

---

## TODO / Roadmap

### Phase 1: Core Functionality
- [ ] Connect mock UI to real Supabase data
- [ ] Implement auth (email + Apple Sign In)
- [ ] Wire up workout generation API endpoint
- [ ] Save/load workouts from database
- [ ] Log completed sets to database

### Phase 2: Intelligence
- [ ] Calculate muscle strength scores from logged data
- [ ] Implement PR detection and tracking
- [ ] Build progressive overload suggestions
- [ ] Add trend analysis per exercise

### Phase 3: Polish
- [ ] Generate app assets via Midjourney
- [ ] Implement body map with real data
- [ ] Add charts with real weight/volume data
- [ ] iOS app icon and splash screen

### Phase 4: Launch
- [ ] TestFlight beta
- [ ] App Store submission
- [ ] Marketing site at ironvow.app

---

## Related Projects
- **YearVow** (`~/apps/resolutions`) - Resolution tracking app, same tech stack

---

*Last updated: January 8, 2026*
