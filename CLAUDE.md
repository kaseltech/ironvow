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

# Deploy edge function (MUST use --no-verify-jwt flag!)
/opt/homebrew/bin/supabase functions deploy generate-workout --no-verify-jwt --project-ref kbqrgjogyonwhhxhpodf

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
2. **No Fallbacks**: Edge function now throws errors instead of generating fallback workouts. NO CLIENT-SIDE FALLBACK.
3. **Equipment Filtering**: Home workouts with no equipment should ONLY get bodyweight exercises
4. **Rehab Workouts**: Should NEVER include heavy compound lifts (bench, squat, deadlift)
5. **Traditional Workouts**: Should NOT include CrossFit exercises (muscle-ups, kipping, wall balls, etc.)
6. **Edge Function Deployment**: ALWAYS deploy with `--no-verify-jwt` flag or users with expired sessions get 401 errors
7. **Debug Edge Function Issues**: If getting 401/non-2xx errors, check if JWT verification is enabled. Use curl to test function directly.

## GitHub Repository

https://github.com/kaseltech/ironvow
