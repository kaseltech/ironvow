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

### Phase 1: Core Functionality ✅
- [x] Connect mock UI to real Supabase data
- [x] Implement auth (email + Apple Sign In)
- [x] Wire up workout generation API endpoint (Edge Function)
- [x] Save/load workouts from database
- [x] Log completed sets to database

### Phase 2: Intelligence ✅
- [x] AI-powered workout generation with Claude 3 Haiku
- [x] Muscle group expansion (UI groups → specific muscles)
- [x] Injury awareness in generation
- [x] Equipment-aware filtering
- [x] Bodyweight exercise filtering for outdoor

### Phase 3: Gym Profiles & Equipment ✅
- [x] Multi-select gym presets (combine Commercial + Powerlifting + CrossFit, etc.)
- [x] Equipment merging from multiple presets
- [x] Expanded equipment library (100+ items)
- [x] 14 comprehensive equipment presets
- [x] New gym types (olympic, home, hiit, calisthenics, outdoor)

### Phase 4: Workout Styles ✅
- [x] 5 workout styles: Traditional, Strength (5x5), HIIT, Circuit, WOD
- [x] Style-specific sets/reps/rest programming
- [x] Style-aware AI prompts
- [x] Workout style selector UI

### Phase 5: Hybrid AI ✅
- [x] Free-form AI generation (not constrained to DB)
- [x] Fuzzy matching AI exercises to database
- [x] Unmatched exercise logging for DB improvement
- [x] Self-improving exercise database

### Phase 6: Comprehensive Libraries ✅
- [x] Deep-dive CrossFit exercise library (30+ Olympic/skill exercises)
- [x] HIIT/Conditioning exercises (25+ movements)
- [x] Hyrox-specific movements (18 exercises)
- [x] 5x5/Strength program exercises (35+ variations)

### Phase 7: Polish
- [ ] Generate app assets via Midjourney
- [ ] Implement body map with real data
- [ ] Add charts with real weight/volume data
- [ ] iOS app icon and splash screen

### Phase 8: Launch
- [ ] TestFlight beta
- [ ] App Store submission
- [ ] Marketing site at ironvow.app

---

## Development Log

### January 8, 2026 - Session 2: AI Generation Improvements

**Issues Fixed:**
1. **Muscle Group Mismatch** - UI sent broad groups ("arms", "legs") but DB had specific muscles ("biceps", "quads"). Added muscle mapping expansion in Edge Function.

2. **Outdoor Workout Bug** - Gym equipment was appearing in outdoor workouts. Added `isBodyweightExercise()` helper and bodyweight exercise filtering.

3. **Missing Bodyweight Exercises** - Created `005_bodyweight_exercises.sql` migration with 25+ bodyweight exercises.

**Features Added:**

**Gym Profiles (Multi-Select Presets):**
- Rewrote `GymManager.tsx` with 3-step flow: List → Select Presets → Customize
- Multi-select presets with checkbox UI
- Equipment merging from all selected presets
- "Start from scratch" option

**Equipment Expansion (`006_expanded_equipment.sql`):**
- 100+ new equipment items across categories
- Specialty barbells (Olympic, Safety Squat Bar, Buffalo Bar, etc.)
- Full commercial gym machine lineup
- CrossFit/Hyrox equipment (Sleds, Sandbags, SkiErgs)
- 14 comprehensive presets:
  - Large Commercial Gym, Basic Commercial Gym
  - CrossFit Box, Hyrox Training, Powerlifting Gym
  - Olympic Weightlifting, Strength Training (5x5)
  - HIIT/Circuit Training, Calisthenics/Street Workout
  - Hotel/Travel, Full Home Gym, Home Basics
  - Bodyweight Only, Outdoor/Park Workout

**Workout Styles:**
- Added `WorkoutStyle` type: traditional, strength, hiit, circuit, wod
- Style-specific AI prompts with detailed programming instructions
- Style-specific sets/reps/rest in local fallback
- Workout style selector UI on main page
- Style-aware naming (e.g., "5x5 Push Power", "HIIT Full Body Blast")

**Files Modified:**
- `supabase/functions/generate-workout/index.ts` - Muscle mapping, bodyweight filtering, workout styles
- `supabase/migrations/005_bodyweight_exercises.sql` - 25+ bodyweight exercises
- `supabase/migrations/006_expanded_equipment.sql` - Equipment + presets expansion
- `src/lib/generateWorkout.ts` - WorkoutStyle type, style-aware local generation
- `src/lib/supabase/types.ts` - New gym types
- `src/components/GymManager.tsx` - Multi-select preset UI
- `src/app/page.tsx` - Workout style selector UI

### January 8, 2026 - Session 3: Hybrid AI Implementation

**Hybrid AI with Fuzzy Matching:**
- AI now generates exercises freely (not constrained to DB)
- Fuzzy matching algorithm matches AI exercises to database:
  - `normalizeExerciseName()` - standardizes names (db→dumbbell, ohp→overhead press, etc.)
  - `calculateSimilarity()` - word-based matching with partial match support
  - `findBestMatch()` - finds best DB match above 0.5 threshold
- Unmatched exercises logged to `unmatched_exercises` table for DB improvement

**Database Changes (`007_unmatched_exercises.sql`):**
- `unmatched_exercises` table with occurrence tracking
- `log_unmatched_exercise()` function for upsert operations
- Status workflow: pending → added/rejected/merged
- View for admin to review most requested exercises

**Files Modified:**
- `supabase/functions/generate-workout/index.ts` - Fuzzy matching utilities, free-form AI prompt
- `supabase/migrations/007_unmatched_exercises.sql` - Unmatched exercise logging

### January 9, 2026 - Session 4: Comprehensive Exercise Library

**Exercise Library Expansion (`008_comprehensive_exercises.sql`):**
Added 106 new exercises across four categories:

**CrossFit/Olympic Lifting (30+):**
- Full Olympic lifts: Clean, Snatch, Clean & Jerk (with power/hang variations)
- Overhead: Push Press, Push Jerk, Split Jerk
- Gymnastics: Muscle-ups, HSPU, Toes-to-Bar, Rope Climbs
- WOD Staples: Thrusters, Wall Balls, Double Unders, Pistols

**HIIT/Conditioning (25+):**
- Cardio machines: Assault Bike, Echo Bike, Ski Erg
- Battle ropes (waves, slams)
- Locomotion: Bear Crawl, Crab Walk, Inchworm
- Plyometrics: Squat/Lunge/Tuck Jumps, Plyo Push-ups
- Complex movements: Devil Press, Man Makers, Burpee Box Jump

**Hyrox-Specific (18):**
- Sled Push/Pull
- Carries: Farmers, Sandbag
- Sandbag movements: Lunges, Shoulder, Clean, Over Shoulder
- Kettlebells: Swing, Snatch, Clean, Clean & Press
- Event distances: Rowing 1000m, Ski Erg 1000m

**Strength/5x5 Variations (35+):**
- Squat variations: Low/High Bar, Pause, Box, Safety Bar, Zercher
- Deadlift variations: Sumo, Deficit, Block Pull, Trap Bar, Snatch Grip
- Bench variations: Pause, Close/Wide Grip, Floor Press, Spoto, Larsen
- Overhead variations: Strict, BTN, Z Press, Pin Press
- Row variations: Pendlay, Seal, Meadows, Kroc, T-Bar
- Accessories: Good Mornings, Reverse Hyper, Belt Squat, Hack Squat

**Files Modified:**
- `supabase/migrations/008_comprehensive_exercises.sql` - 106 new exercises

### January 9, 2026 - Session 5: Goals, Logging, and Freeform AI

**Major Features:**

1. **Fitness Goal Setting:**
   - Added `fitness_goal` column to profiles (cut/bulk/maintain/endurance/general)
   - Goal selector UI in Profile Settings page
   - AI prompts now adjust based on goal (reps, rest, volume)

2. **AI Request Logging:**
   - Created `workout_requests` table to log all AI generation requests
   - Logs both structured and freeform requests
   - Tracks: prompt, response, generation time, success/failure
   - View for admin to review freeform requests

3. **Freeform AI Input:**
   - Toggle to switch between structured and freeform modes
   - Text input where users can describe their ideal workout
   - Examples: "Army-style PT", "Quick pump before work", "Something brutal"
   - AI interprets request while respecting equipment/injury constraints

4. **New Workout Styles:**
   - Added `cardio` style (running intervals, sprints, conditioning)
   - Added `mobility` style (stretching, foam rolling, recovery)
   - 7 total styles: Traditional, Strength, HIIT, Circuit, WOD, Cardio, Mobility

5. **More Exercises (`009_goals_logging_exercises.sql`):**
   - 15 Cardio/Running exercises (intervals, tempo runs, fartlek)
   - 28 Mobility/Stretching exercises (dynamic, static, foam rolling)
   - 24 Military/Bootcamp exercises (8-count bodybuilders, flutter kicks, etc.)

**Database Changes:**
- `profiles.fitness_goal` - User's current training goal
- `workout_requests` table - AI request/response logging
- 67 new exercises in migration 009

**Files Modified:**
- `supabase/migrations/009_goals_logging_exercises.sql` - Goals, logging, exercises
- `supabase/functions/generate-workout/index.ts` - Goal-aware prompts, freeform handling
- `src/lib/generateWorkout.ts` - Added cardio/mobility styles, freeformPrompt
- `src/lib/supabase/types.ts` - Added fitness_goal to Profile type
- `src/app/page.tsx` - Freeform AI input toggle and textarea
- `src/app/profile/page.tsx` - Fitness goal selector in Settings tab

### January 9, 2026 - Session 6: Run Tracking, Set Logging, and AI Fixes

**Major Features:**

1. **GPS Run Tracking:**
   - New `/run` page with real-time GPS tracking via Capacitor Geolocation
   - Voice announcements using Web Speech API (configurable: quarter/half/full mile)
   - Live stats: distance, pace, elapsed time, current speed
   - Pause/resume/finish controls with split times
   - Run summary screen with mile splits
   - iOS permissions for location (foreground and background)

2. **Improved Workout Set Logging:**
   - Fixed exercise_id to use real UUIDs (was using exercise name)
   - Offline queue with localStorage for logging sets without connection
   - Edit/delete logged sets during workout
   - Tappable set chips showing completed sets
   - Pending sync indicator for offline sets

3. **AI Workout Generator Fixes:**
   - Fixed 401 auth error - Supabase anon key was in wrong format (publishable vs JWT)
   - Deployed Edge Function with `--no-verify-jwt` flag
   - Added time budget constraints to AI prompts
   - AI now calculates realistic workout duration: (sets × 40s) + rest ≤ total time
   - 15-min workout now correctly generates 2-3 exercises instead of 5+

4. **UI Improvements:**
   - Logo component now supports `href` prop for navigation
   - Clickable IronVow logo returns to home from any page
   - "Go for a Run" button on main page

**Database Changes:**
- `run_sessions` table for storing run data with route_data JSONB
- `run_goals` table for run targets (future use)
- Migration: `011_run_tracking.sql`

**Files Modified:**
- `src/app/run/page.tsx` - New GPS run tracking page
- `src/app/page.tsx` - Added run button, clickable logo
- `src/app/workout/page.tsx` - Set editing, offline queue, real exercise IDs
- `src/hooks/useSupabase.ts` - LoggedSet interface, offline queue functions, edit/delete
- `src/components/Logo.tsx` - Added href prop for navigation
- `src/lib/generateWorkout.ts` - Debug logging (reverted)
- `supabase/functions/generate-workout/index.ts` - Time budget constraints in prompts
- `supabase/migrations/011_run_tracking.sql` - Run tracking tables
- `ios/App/App/Info.plist` - Location permission descriptions
- `.env.local` - Fixed Supabase anon key format (JWT instead of publishable)

---

## Future Work / Wishlist

### High Priority
- [ ] **Apple HealthKit Integration**
  - Read steps, heart rate, sleep data from Oura/Apple Watch
  - Write workouts back to Apple Health
  - Requires: Xcode HealthKit capability, Info.plist descriptions
  - Plugin: `@AcquiredSupport/capacitor-healthkit` or similar

### Medium Priority
- [ ] **Manual Activity Logging** - Quick log for walks, yoga, stretching without GPS
- [ ] **Run History & Analytics** - View past runs, weekly mileage, pace trends
- [ ] **Workout Templates** - Save favorite AI workouts for quick re-use
- [ ] **Rest Timer Notifications** - Push notification when rest period ends

### Low Priority / Nice to Have
- [ ] **Social Features** - Share workouts, compete with friends
- [ ] **Wearable Integration** - Direct Oura/Garmin/Whoop API connections
- [ ] **Apple Watch Companion** - Quick logging from watch
- [ ] **Workout Streaks & Achievements** - Gamification elements

---

## Related Projects
- **YearVow** (`~/apps/resolutions`) - Resolution tracking app, same tech stack

---

*Last updated: January 9, 2026*
