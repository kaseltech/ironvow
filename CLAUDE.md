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

# Deploy edge function
/opt/homebrew/bin/supabase functions deploy generate-workout --project-ref kbqrgjogyonwhhxhpodf

# View edge function logs
/opt/homebrew/bin/supabase functions logs generate-workout --project-ref kbqrgjogyonwhhxhpodf

# Run database migrations
/opt/homebrew/bin/supabase db push

# Check Supabase status
/opt/homebrew/bin/supabase status
```

## Recent Bug Fixes (January 2025)

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

### Fallback Removal
- Removed 140+ line silent fallback that generated placeholder workouts
- Now throws error with clear message when no valid exercises found
- User sees: "Failed to generate [style] workout: No valid exercises found for [muscles]. Please try different settings."

## Pending Features (from plan file)

### Enhanced Workout History
- Expandable workout cards in profile history
- Detail page at `/workout-history/[sessionId]`
- Bookmark functionality
- "Do Again" button to reload past workouts

### Weekly Workout Planner
- Multi-day AI-generated balanced programs
- Database tables: `workout_plans`, `workout_plan_days`
- Auto-splits based on day count (2-3 days = full body, 4 days = upper/lower, 5-6 days = PPL)

See `/Users/charleskasel/.claude/plans/purrfect-petting-fog.md` for full plan details.

## Supabase Project

- **Project Ref**: kbqrgjogyonwhhxhpodf
- **Dashboard**: https://supabase.com/dashboard/project/kbqrgjogyonwhhxhpodf

## Important Notes

1. **Static Export**: Next.js is configured for static export (`output: 'export'`), no server-side rendering
2. **No Fallbacks**: Edge function now throws errors instead of generating fallback workouts
3. **Equipment Filtering**: Home workouts with no equipment should ONLY get bodyweight exercises
4. **Rehab Workouts**: Should NEVER include heavy compound lifts (bench, squat, deadlift)
5. **Traditional Workouts**: Should NOT include CrossFit exercises (muscle-ups, kipping, wall balls, etc.)

## GitHub Repository

https://github.com/kaseltech/ironvow
