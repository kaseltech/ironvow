# IronVow - AI-Powered Workout App

## Overview

**IronVow** is a context-aware, AI-powered workout generation and tracking app. Unlike traditional workout apps that offer static routines or generic AI suggestions, IronVow knows YOU - your body, goals, equipment, history, and adapts every workout accordingly.

**Part of the Vow Suite** - Shares brand identity with YearVow (resolution tracking).

---

## Core Concept

> "Your AI training partner that actually knows you."

### The Problem with Existing Apps
- **Preset libraries** - No personalization, one-size-fits-all
- **Trackers only** - Great for logging, no workout generation
- **Generic AI** - Doesn't know your equipment, history, or constraints
- **Location blind** - Can't adapt to home vs gym vs hotel

### IronVow Solution
Feed the app your complete profile:
- Body metrics (height, weight, body type)
- Fitness goals (strength, hypertrophy, endurance, weight loss)
- Equipment available (home gym inventory, gym membership)
- Workout history (lift PRs, mile times, past sessions)
- Preferences (workout duration, muscle group focus, intensity)

Then generate workouts on-demand that adapt to:
- **Where you are** - Home (limited equipment) vs Gym (full access)
- **What you want** - Target muscle groups, workout type
- **How you're doing** - Progressive overload based on history
- **How much time you have** - 20 min quickie vs 90 min session

---

## Key Features

### 1. Smart Profile
- Body metrics & measurements
- Goal setting (primary + secondary goals)
- Equipment inventory
  - Home equipment list
  - Gym equipment (or "full gym" preset)
  - Travel/hotel equipment
- Fitness history import (optional)
- Injury/limitation notes

### 2. AI Workout Generation
- Context selector: "I'm at [Home/Gym/Hotel/Outdoor]"
- Target selector: Muscle groups, workout type
- Duration selector: 15/30/45/60/90 min
- Intensity selector: Light/Moderate/Intense
- Generate button → Full workout with sets/reps/rest

### 3. Active Workout Mode
- Exercise-by-exercise guidance
- **Rest timer** between sets (customizable)
- **Weight logging** per set
- **Rep logging** (actual vs target)
- Swap exercise option (if equipment unavailable)
- Skip/modify on the fly
- Voice cues (optional)

### 4. Progress Tracking
- Lift PRs (auto-detected)
- Volume tracking (sets × reps × weight)
- Cardio tracking (distance, time, pace)
- Body measurements over time
- Workout streak/consistency
- Muscle group balance (are you skipping legs?)

### 5. History & Analytics
- Past workout log
- Progress graphs (strength curves)
- Personal records timeline
- Weekly/monthly summaries
- Muscle group heatmap (what you've worked recently)

### 6. Workout Library (Non-AI)
- Save generated workouts as templates
- Community workouts (future)
- Classic programs (5x5, PPL, etc.)

---

## User Flows

### First Launch
1. Welcome → Brand intro
2. Basic profile (height, weight, age, gender)
3. Goal selection (strength/hypertrophy/endurance/weight loss)
4. Equipment setup
   - "Do you have a home gym?" → Equipment checklist
   - "Do you go to a gym?" → Yes/No
5. Experience level (beginner/intermediate/advanced)
6. Tutorial → Generate first workout

### Daily Use - Generate Workout
1. Open app → "Start Workout"
2. "Where are you?" → Home / Gym / Other
3. "What do you want to hit?" → Muscle groups or "Full body" / "AI surprise me"
4. "How long?" → Duration slider
5. Generate → Review workout → Start

### During Workout
1. Exercise card shows:
   - Exercise name + demo (gif/video)
   - Sets × Reps × Weight (suggested)
   - Rest time between sets
2. User completes set → Log actual weight/reps
3. Rest timer starts automatically
4. Next set or next exercise
5. Workout complete → Summary + save

---

## Technical Architecture

### Tech Stack (Matching YearVow)
- **Frontend:** Next.js + React + TypeScript
- **Mobile:** Capacitor (iOS first, Android later)
- **Backend:** Supabase (auth, database, storage)
- **AI:** OpenAI API or Claude API for workout generation
- **Styling:** Tailwind CSS

### Database Schema (Draft)

```sql
-- User profile
profiles
  id UUID
  user_id UUID
  height_inches INTEGER
  weight_lbs NUMERIC
  age INTEGER
  gender TEXT
  experience_level TEXT
  goals JSONB
  created_at TIMESTAMP
  updated_at TIMESTAMP

-- Equipment inventory
equipment
  id UUID
  user_id UUID
  name TEXT
  category TEXT (barbell, dumbbell, machine, cardio, bodyweight)
  location TEXT (home, gym)
  notes TEXT

-- Exercises library
exercises
  id UUID
  name TEXT
  muscle_groups TEXT[]
  equipment_required TEXT[]
  difficulty TEXT
  instructions TEXT
  demo_url TEXT

-- Workout templates
workout_templates
  id UUID
  user_id UUID (null for system templates)
  name TEXT
  description TEXT
  exercises JSONB
  duration_minutes INTEGER
  difficulty TEXT
  is_public BOOLEAN

-- Workout sessions (completed workouts)
workout_sessions
  id UUID
  user_id UUID
  template_id UUID (nullable - could be AI generated)
  started_at TIMESTAMP
  completed_at TIMESTAMP
  location TEXT
  notes TEXT

-- Individual sets logged
workout_sets
  id UUID
  session_id UUID
  exercise_id UUID
  set_number INTEGER
  target_reps INTEGER
  actual_reps INTEGER
  target_weight NUMERIC
  actual_weight NUMERIC
  rest_seconds INTEGER
  notes TEXT

-- Personal records
personal_records
  id UUID
  user_id UUID
  exercise_id UUID
  record_type TEXT (1rm, 5rm, max_reps, etc)
  value NUMERIC
  achieved_at TIMESTAMP
```

### AI Prompt Structure (Draft)

```
System: You are a certified personal trainer AI. Generate workouts based on user profile and context.

User Profile:
- Height: 5'10", Weight: 180 lbs, Age: 32, Male
- Experience: Intermediate (2 years lifting)
- Goals: Primary - Hypertrophy, Secondary - Strength
- Available equipment: [list]
- Recent workout history: [summary]
- Known PRs: Bench 185x5, Squat 225x5, Deadlift 275x5

Request:
- Location: Home gym
- Target: Upper body (chest, shoulders, triceps)
- Duration: 45 minutes
- Intensity: Moderate

Generate a workout with:
- Exercise name
- Sets x Reps
- Suggested weight (based on history)
- Rest time between sets
- Brief form cues

Format as JSON.
```

---

## Design System

### Brand Identity (Vow Suite)
- **Primary:** Navy `#1F3A5A`
- **Accent:** Gold `#C9A75A`
- **Text:** Cream `#F5F1EA`
- **Typography:** Serif for brand, sans-serif for UI

### IronVow Specific
- Potentially more "energetic" accent color options
- Workout mode could have higher contrast for gym visibility
- Dark theme default (easier to see in gym lighting)

### App Icon Ideas
- Serif "IV" monogram (also Roman numeral 4)
- Stylized dumbbell + V
- Simple "I" with iron/metal texture

**ChatGPT Prompt for App Icon:**
```
iOS app icon design, perfectly square with NO rounded corners, full bleed.

Solid dark navy blue background (#1F3A5A) filling entire canvas edge to edge.

Elegant serif letters "IV" (like Roman numeral 4) centered, in muted gold/champagne color (#C9A75A). Subtle gradient shading only - NOT overly metallic or 3D. Refined, understated elegance.

Style: Flat design with minimal depth. Premium and timeless, like a luxury fitness brand. Think Equinox or high-end athletic wear, not aggressive gym bro aesthetic.

No borders, no shadows, no decorative elements. Navy background extends completely to all four edges.
```

---

## Competitive Analysis

| App | Pros | Cons |
|-----|------|------|
| **Strong** | Great logging, clean UI | No AI generation, manual everything |
| **JEFIT** | Huge exercise library | Cluttered UI, dated |
| **Fitbod** | AI workouts | Subscription heavy, generic AI |
| **Hevy** | Modern, social features | No AI generation |
| **Apple Fitness+** | Polished | Video classes only, not customizable |

**IronVow Differentiator:** True context-aware AI that knows YOUR equipment and history.

---

## Monetization (Future)

### Free Tier
- Basic profile
- 3 AI generations per week
- Manual workout logging
- Basic progress tracking

### Premium ($9.99/mo or $79.99/yr)
- Unlimited AI generations
- Advanced analytics
- Workout history export
- Priority AI (faster/better model)
- Custom exercise additions
- Apple Watch app (future)

---

## Development Phases

### Phase 1: Foundation ✅
- [x] Project setup (Next.js + Capacitor)
- [x] Auth (Supabase - email, Apple, Google)
- [x] Basic profile setup
- [x] Equipment inventory management
- [x] Exercise library (seed data)

### Phase 2: Core Workout ✅
- [x] AI workout generation (basic)
- [x] Active workout mode
- [x] Rest timer
- [x] Weight/rep logging
- [x] Workout completion & save

### Phase 3: Intelligence ✅
- [x] AI improvements (context-aware)
- [x] Progressive overload suggestions
- [x] PR detection
- [x] History-based recommendations

### Phase 4: Polish (In Progress)
- [ ] Progress analytics & graphs
- [x] Workout templates
- [x] Settings & preferences
- [x] Onboarding tutorial

### Phase 5: Expansion
- [ ] Apple Watch companion
- [ ] Android build
- [ ] Social features (optional)
- [ ] Trainer/coach mode (B2B)

---

## Open Questions

1. **AI Provider:** OpenAI vs Claude vs fine-tuned model?
2. **Exercise demos:** Source videos/gifs? Create our own? License?
3. **Offline mode:** How much functionality without internet?
4. **Social:** Sharing workouts, friends, leaderboards - or keep it personal?
5. **Wearables:** Apple Watch priority? Integrate Apple Health?

---

## Resources

- YearVow codebase: `~/apps/resolutions/` (reference for patterns)
- Supabase dashboard: https://supabase.com/dashboard
- Capacitor docs: https://capacitorjs.com/docs

---

*Created: January 8, 2026*
