# IronVow - AI-Powered Workout App

## Project Overview

IronVow is a fitness app that uses AI (Claude 3 Haiku) to generate personalized workouts. It's built as a Next.js web app that compiles to iOS via Capacitor.

## Tech Stack

- **Frontend**: Next.js 16 with static export, React 19, TypeScript
- **Mobile**: Capacitor 8 for iOS builds
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **AI**: Claude 3 Haiku via Anthropic API (called from Supabase Edge Function)
- **Styling**: Inline styles with ThemeContext for dark/light mode

## Key Files

### Edge Function (AI Workout Generation)
- **`/supabase/functions/generate-workout/index.ts`** - Main AI workout generation
  - Handles single workouts, weekly plans, and exercise swaps
  - Contains workout style contexts (traditional, HIIT, yoga, rehab, etc.)
  - Fuzzy matches AI-generated exercises to database entries
  - CRITICAL: Uses `equipment` and `targetMuscles` parameters (not `allEquipment` or `rawTargetMuscles`)

### Main Pages
- **`/src/app/page.tsx`** - Main workout generation page with Single/Weekly toggle
- **`/src/app/workout/page.tsx`** - Active workout session page
- **`/src/app/profile/page.tsx`** - User profile with history, stats, settings tabs
- **`/src/app/library/page.tsx`** - Exercise library browser
- **`/src/app/progress/page.tsx`** - Progress tracking and charts

### Key Components
- **`/src/components/ExerciseDetailModal.tsx`** - Shows exercise images, instructions, YouTube link
- **`/src/components/WorkoutCard.tsx`** - Displays workout in session
- **`/src/components/WeeklyPlanner.tsx`** - Multi-day workout planning UI
- **`/src/components/ExerciseSwapModal.tsx`** - Unified swap modal for equipment variants and alternatives
- **`/src/components/BottomNav.tsx`** - Shared bottom navigation component
- **`/src/components/StreakTracker.tsx`** - Displays workout streaks and weekly/monthly stats
- **`/src/components/WorkoutCalendar.tsx`** - GitHub-style heatmap showing workout activity

### Hooks
- **`/src/hooks/useExerciseDetail.ts`** - Fetches exercise details with caching
- **`/src/hooks/useSupabase.ts`** - Main Supabase client and data fetching
- **`/src/hooks/useStrengthData.ts`** - Strength progress tracking

### Database
- **`/src/lib/supabase/types.ts`** - TypeScript types for all tables
- **`/supabase/migrations/`** - All database migrations

## Exercise Database

- 870+ exercises imported from free-exercise-db (Public Domain)
- Each exercise has: name, slug, instructions, primary_muscles, secondary_muscles, image_urls, category, difficulty
- Images hosted on GitHub raw URLs
- YouTube fallback for any exercise: `https://www.youtube.com/results?search_query=${encodeURIComponent('how to ' + name + ' exercise')}`

## Common Commands

```bash
# Build and deploy to iOS
npm run build && npx cap sync && npx cap open ios

# Deploy edge function (MUST use --no-verify-jwt flag!)
/opt/homebrew/bin/supabase functions deploy generate-workout --no-verify-jwt --project-ref kbqrgjogyonwhhxhpodf

# View edge function logs
/opt/homebrew/bin/supabase functions logs generate-workout --project-ref kbqrgjogyonwhhxhpodf

# Run database migrations
/opt/homebrew/bin/supabase db push

# Check Supabase status
/opt/homebrew/bin/supabase status
```

## Recent Features (January 2026)

### UI/UX Polish & Accessibility (v2.5.0)
- **Profile Editor Modal**: Edit gender, experience level, height, and birth date from Settings without re-running onboarding
- **Age Calculation**: Now calculated from full birth date (month/day), not just year
- **Touch Targets**: All interactive elements now meet 44px minimum for accessibility
- **Text Contrast**: Muted text increased from 60% to 70% opacity for WCAG compliance
- **Responsive Typography**: Large text uses `clamp()` for proper scaling on small screens/landscape
- **Theme Consistency**: All hardcoded colors replaced with theme context colors
- **Form Validation**: Weight inputs constrained to 50-700 lbs, prevents negative values
- **Empty States**: Improved with icons, helpful messages, and actionable CTAs
- **Generate Button**: More prominent styling, no longer overlaps bottom nav
- **Files**: `src/components/ProfileEditor.tsx`, `src/context/ThemeContext.tsx`

### Workout Tracking & Streaks (v2.4.0)
- **Streak Tracker**: Shows current streak (consecutive workout days), longest streak ever, motivational messages
- **Calendar Heatmap**: GitHub-style 12-week grid showing workout frequency with color intensity based on volume
- **Weekly/Monthly Stats**: "This Week" and "This Month" workout counts displayed prominently
- **PR Day Highlighting**: Days with personal records have gold borders on the calendar
- **Interactive Calendar**: Tap any day to see workout details (volume, exercises, PR status)
- **Files**: `src/components/StreakTracker.tsx`, `src/components/WorkoutCalendar.tsx`
- **Data Functions**: `calculateStreakData()` and `generateCalendarData()` in `src/hooks/useStrengthData.ts`
- **Location**: Profile > History tab (above workout list)

### Session Persistence & Recovery
- Active workouts stored in Supabase with full workout data (`workout_sessions.workout_data`)
- Sessions recover automatically on app refresh/crash
- **Files**: `src/hooks/useSupabase.ts` (useWorkoutSessions), `src/app/workout/page.tsx`

### Progress-Aware AI Generation
- User PRs passed to AI for personalized weight suggestions
- Recent training data informs recovery-aware programming
- Deload detection when weekly volume >100k lbs
- **Files**: `src/app/page.tsx`, `supabase/functions/generate-workout/index.ts`

### Workout Bookmarking
- Save button saves workouts with all exercises to database
- `useBookmarkedWorkouts` hook manages saved workouts
- **Files**: `src/hooks/useSupabase.ts`, `src/app/page.tsx`

### Weekly Plan Adherence Tracking
- Plan days track completion via `completed_at` and `session_id`
- `getAdherenceStats()` calculates completion percentage
- **Files**: `src/hooks/useWorkoutPlans.ts`, `supabase/migrations/019_session_improvements.sql`

### Unified Swap Modal
- New `ExerciseSwapModal` component replaces duplicated code
- Consistent UX between single workout and weekly plan swaps
- Mobile-optimized with 44-48px touch targets
- **Files**: `src/components/ExerciseSwapModal.tsx`, `src/lib/muscleInference.ts`

### Smart Suggestions
- "Due for Training" cards for muscles not trained in 4+ days
- "Last Workout" repeat option on main page
- Context tags showing PRs, injuries, experience level
- **File**: `src/app/page.tsx`

### Enhanced Completion Screen
- PR celebration with trophy badges
- 5-star workout rating
- Mobile-optimized touch targets
- **File**: `src/app/workout/page.tsx`

### Equipment Toggle for Swap Modal
- When swapping an exercise, users can quickly toggle between equipment variants (barbell ↔ dumbbell ↔ cable ↔ machine)
- Equipment detection from exercise names via `getEquipmentFromName()`
- Base movement extraction via `getBaseMovement()` (e.g., "Barbell Bench Press" → "Bench Press")
- Available variants fetched from database via `getAvailableEquipmentVariants()`
- If variant not in DB, AI generates it and stores in `exercises_pending` table
- **Files**: `src/lib/generateWorkout.ts`, `src/app/page.tsx`, `src/components/WeeklyPlanReview.tsx`

### AI-Enhanced Swap with Review Table
- When < 5 alternatives found in database, AI generates more suggestions
- AI suggestions are fuzzy-matched to existing exercises to avoid duplicates
- Muscle validation ensures AI alternatives target correct muscle groups
- New exercises stored in `exercises_pending` table for human review before promotion
- Purple "AI" badge displayed on AI-generated alternatives
- **Database**: `exercises_pending` table (migration: `20260117_create_exercises_pending.sql`)

### Load More (AI) Button
- Swap modals now have "Load More (AI)" button for on-demand AI alternatives
- Uses `swapRequestAI` and `swapExcludeIds` parameters to force AI generation
- Works in both single workout and weekly plan swap modals

### Weekly Plan Day Regeneration
- Individual days in weekly plans can be regenerated without regenerating the entire plan
- Uses `onRegenerateDay` callback in `WeeklyPlanReview` component
- Excludes current exercises to ensure variety

### Push/Pull/Legs Quick Selects
- Restored Push/Pull/Legs quick select buttons in muscle selector
- Quick selects: Push (chest, shoulders, triceps), Pull (back, biceps, traps), Legs (quads, hamstrings, glutes, calves)
- **File**: `src/components/MuscleSelector.tsx`

## Recent Bug Fixes (January 2025)

### Muscle Naming Normalization
- Database muscle names were inconsistent ("upper back" vs "upper_back")
- Normalized all 471 exercises to use spaces instead of underscores
- Edge function now uses `normalizeMuscle()` helper to ensure consistency
- **Preference**: Use spaces in muscle names, not underscores

### Muscle Validation in AI Swap
- AI would suggest exercises that fuzzy-matched to wrong muscle groups (e.g., "Calf Raise" in push workout)
- Added muscle validation after fuzzy matching to block incorrect suggestions
- If matched exercise doesn't target any of the requested muscles, it's blocked
- **File**: `supabase/functions/generate-workout/index.ts`

### Variable Scope Bug (CRITICAL)
In `generate-workout/index.ts`, the `generateWithAI` function was using:
- `allEquipment` - WRONG (undefined in function scope)
- `rawTargetMuscles` - WRONG (undefined in function scope)

Fixed to use the actual parameter names:
- `equipment` - CORRECT
- `targetMuscles` - CORRECT

### Home Workout Issues
- Added explicit ban lists for gym-only exercises (Ring Muscle-up, Cable machines, etc.)
- Added CrossFit exercise ban list for traditional workouts
- Enhanced home workout prompt to be explicit about bodyweight-only when no equipment

### Fallback Removal (CRITICAL - January 2025)
- **REMOVED ALL client-side fallback/local workout generation**
- Previously, when edge function failed, app silently fell back to deterministic local generation
- This caused "same workout every time" bugs and garbage workouts
- Now if edge function fails, user sees actual error message
- Files cleaned: Deleted `generateWorkoutLocal()`, `getFallbackWorkout()`, and all helper functions (~350 lines)
- **Principle: Errors are better than garbage. Show failures, don't hide them.**

### Edge Function 401 Unauthorized Bug (CRITICAL - January 2025)
**Symptom**: "Edge Function returned a non-2xx status code" with 401 Unauthorized

**Root Cause**:
- Supabase Edge Functions verify JWT tokens by default at the gateway level
- When user's session expires or token is invalid, request is rejected with 401 BEFORE reaching function code
- The edge function itself was working fine (curl tests passed), but client requests failed

**Why it was confusing**:
- Direct curl requests with anon key worked perfectly
- Error message didn't clearly indicate auth issue
- Function logs showed nothing (request never reached the function)

**Fix**: Deploy edge function with `--no-verify-jwt` flag:
```bash
/opt/homebrew/bin/supabase functions deploy generate-workout --no-verify-jwt --project-ref kbqrgjogyonwhhxhpodf
```

**Why this is safe**:
- The function uses SERVICE_ROLE_KEY internally for database access
- User authentication is handled by the app, not the edge function gateway
- The anon key is still required to call the function (not fully public)

**Config**: Also added to `supabase/config.toml`:
```toml
[functions.generate-workout]
verify_jwt = false
```

## Pending Features

### Exercises Pending Review UI
- Admin interface to review AI-generated exercises in `exercises_pending` table
- Approve, reject, or merge with existing exercises
- Currently exercises are stored but no review UI exists

### Year-at-a-Glance View
- Full year calendar heatmap (currently shows 12 weeks)
- Strength peaks per muscle group over time
- Volume trend charts

### Workout Sharing
- Public workout summary page (no auth required)
- Shareable URL generation
- Social preview metadata (OG tags)

## Supabase Project

- **Project Ref**: kbqrgjogyonwhhxhpodf
- **Dashboard**: https://supabase.com/dashboard/project/kbqrgjogyonwhhxhpodf

## Important Notes

1. **Static Export**: Next.js is configured for static export (`output: 'export'`), no server-side rendering
2. **No Fallbacks**: Edge function now throws errors instead of generating fallback workouts. NO CLIENT-SIDE FALLBACK.
3. **Equipment Filtering**: Home workouts with no equipment should ONLY get bodyweight exercises
4. **Rehab Workouts**: Should NEVER include heavy compound lifts (bench, squat, deadlift)
5. **Traditional Workouts**: Should NOT include CrossFit exercises (muscle-ups, kipping, wall balls, etc.)
6. **Edge Function Deployment**: ALWAYS deploy with `--no-verify-jwt` flag or users with expired sessions get 401 errors
7. **Debug Edge Function Issues**: If getting 401/non-2xx errors, check if JWT verification is enabled. Use curl to test function directly.

## GitHub Repository

https://github.com/kaseltech/ironvow
