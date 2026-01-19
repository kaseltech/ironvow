# Changelog

All notable changes to IronVow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### UI/UX Deep Dive Improvements (January 2025)
- Undo toast for completed sets - 4-second undo window after logging a set
- Rest timer completion notification when app resumes from background
- Generate confirmation modal - shows workout summary before generating
- Freeform AI mode indicator badge when custom prompt is active
- Mid-workout abort confirmation with save/discard options
- Weekly planner discoverability - dot indicator on Weekly toggle button
- Expandable equipment lists in profile - tap "+X more" to see all items
- Horizontal scroll indicator (gradient fade) on muscle filter pills
- Better empty state in library with "Clear Filters" CTA button

#### Accessibility Improvements (January 2025)
- Global focus ring styles (`:focus-visible`) for keyboard navigation
- ARIA labels on all icon-only buttons throughout the app
- Proper `aria-current` on bottom navigation for screen readers
- Keyboard-accessible modals with focus management

### Improved

#### Mobile Touch Experience (January 2025)
- Tab buttons increased to 48px minimum height (was ~32px)
- Global `:active` states for immediate button feedback on touch
- WebkitTapHighlightColor disabled for native feel
- User-select disabled on buttons to prevent accidental text selection
- Minimum 44px touch targets enforced via CSS for coarse pointers

#### Visual Polish (January 2025)
- Edit set discoverability - highlighted "Tap to edit" badge on completed sets
- Weight chart Y-axis labels increased from 10px to 12px
- Muscle selector responsive layout - single column on phones <375px
- Progress page loading indicator changed from full-screen to subtle inline toast
- Error messages now include retry button with one-click regeneration

#### Component Updates (January 2025)
- BottomNav: Added ARIA labels, proper touch targets, current page indicator
- PrimaryContext: Weekly mode tooltip with visual dot indicator
- MuscleSelector: Responsive grid class for small phones
- ExerciseSwapModal: Better accessibility and keyboard support

#### Session Persistence & Recovery (January 2025)
- Active workouts now stored in Supabase with full workout data
- Sessions recover automatically on app refresh or crash
- Added `workout_data` JSONB column to `workout_sessions` table
- Falls back to sessionStorage for immediate navigation

#### Progress-Aware AI Generation (January 2025)
- User PRs (Personal Records) passed to AI for personalized weight suggestions
- AI aims for 5-10% progression based on user's strength history
- Recent training data informs recovery-aware programming
- Added `userPRs` and `recentTraining` to workout request interface

#### Deload Intelligence (January 2025)
- Automatic deload detection based on weekly volume (>100k lbs threshold)
- AI reduces weight by 40-50% when deload is recommended
- Added `deload_suggested` column to track deload recommendations
- Edge function calculates 7-day volume from `user_session_summary` view

#### Workout Bookmarking (January 2025)
- Save button now functional - saves workouts to database
- `useBookmarkedWorkouts` hook for bookmark management
- Saved workouts include all exercises with sets/reps/weights
- Visual feedback shows "Saved" state with checkmark

#### Weekly Plan Adherence Tracking (January 2025)
- Plan days track completion with `completed_at` timestamp
- Link sessions to plan days via `session_id` reference
- `getAdherenceStats()` returns completion percentage
- `markDayCompleted()` function for session-plan linking
- Updated `user_workout_plans` view with adherence fields

#### Unified Swap Modal Component (January 2025)
- New shared `ExerciseSwapModal` component (`/src/components/ExerciseSwapModal.tsx`)
- Eliminates ~300 lines of duplicated code between page.tsx and WeeklyPlanReview
- Consistent UX across single workout and weekly plan swaps
- Mobile-optimized with 44-48px touch targets

#### Context Tags for Workout Preview (January 2025)
- Experience level tag shows user's skill level
- PR count tag shows how many personal records influence generation
- Injury notes tag shows active injury considerations
- Location and style tags already existed

#### Smart Workout Suggestions (January 2025)
- "Due for Training" cards show muscles not trained in 4+ days
- Clicking a muscle pre-selects it for workout generation
- "Last Workout" card with "Do Again" button to repeat recent session
- Shows only when no active weekly plan

#### Enhanced Post-Workout Completion Screen (January 2025)
- PR celebration with trophy emoji when new records hit
- PR badges showing exercise name and weight×reps
- 5-star workout rating system
- Improved stats summary (duration, sets, exercises, volume)
- Mobile-optimized star buttons with 48px touch targets

#### Mobile Optimization (January 2025)
- All interactive elements have minimum 44-48px touch targets
- Safe area insets for iPhone notch/home indicator
- `WebkitTapHighlightColor: 'transparent'` for native feel
- Proper spacing for finger-friendly interactions

#### New Shared Utilities
- `/src/lib/muscleInference.ts` - Shared muscle inference from exercise names
- `buildTargetMuscles()` - Build target muscles from exercise context

#### Equipment Toggle for Exercise Swaps
- Quick equipment variant switching in swap modal (Barbell ↔ Dumbbell ↔ Cable ↔ Machine)
- Equipment detection from exercise names
- Base movement extraction (e.g., "Barbell Bench Press" → "Bench Press")
- If variant not in database, AI generates it automatically

#### AI-Enhanced Exercise Swaps
- When database has fewer than 5 alternatives, AI generates more suggestions
- Fuzzy matching to existing exercises prevents duplicates
- New exercises stored in `exercises_pending` table for review
- Purple "AI" badge on AI-generated alternatives
- "Load More (AI)" button for on-demand AI suggestions
- Muscle validation ensures AI alternatives target correct muscle groups

#### Weekly Plan Improvements
- Individual day regeneration without regenerating entire plan
- "Regenerate Day" button in expanded day view
- Swap exercises within weekly plan before saving

#### UI/UX Overhaul
- Replaced emojis with custom SVG icons throughout
- Progressive disclosure design pattern
- PrimaryContext sticky header component
- MuscleSelector with category-based selection
- TrainingStyleSelector with de-emphasized cards
- AdvancedOptions collapsible section
- Push/Pull/Legs quick select buttons restored
- Cleaner visual hierarchy with reduced gradients

### Fixed

- Muscle naming inconsistency ("upper back" vs "upper_back") - normalized to use spaces
- AI suggesting wrong muscle group exercises (e.g., calf in push workout)
- Edge function 401 errors from JWT verification - deploy with `--no-verify-jwt`
- Weekly plan save using wrong column names
- Swap alternatives not working for unmatched AI exercises

---

## [0.1.1] - 2025-01-11

### Added

#### Exercise Library with Instructions & Images
- Imported 873 exercises from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain)
- Each exercise includes:
  - Step-by-step instructions for proper form
  - 2 demonstration images showing movement
  - Primary and secondary muscle targeting
  - Difficulty level (beginner/intermediate/advanced)
  - Category (strength, stretching, cardio, plyometrics)
- **ExerciseDetailModal component** - Full-screen exercise info viewer:
  - Image carousel with navigation
  - Numbered instruction list
  - Muscle group badges
  - YouTube fallback button for any exercise
- **"?" info button** next to exercise names during workouts
- `useExerciseDetail` hook with caching for fast lookups
- Database migration adding `image_urls` and `category` columns

---

## [0.1.0] - 2025-01-11

### Added

#### Weekly Workout Planner
- New "Weekly" mode toggle on main page alongside "Single" workout mode
- Day selector with Mon-Sun toggle buttons
- Preset split options: Push/Pull/Legs, Upper/Lower, Full Body, Custom
- Per-day muscle group customization
- AI auto-balances muscle splits based on training frequency:
  - 2-3 days: Full body workouts
  - 4 days: Upper/Lower split
  - 5-6 days: Push/Pull/Legs or custom split
- Database tables: `workout_plans`, `workout_plan_days`
- `useWorkoutPlans` hook for plan CRUD operations
- Edge function support for multi-day workout generation
- **WeeklyPlanReview component** - Full-screen modal to review generated plans:
  - Expandable day cards showing all exercises
  - Today's workout highlighted
  - Save & Activate or Regenerate options
  - Start any day's workout directly after saving
- **Today's Workout card** - Appears on main page when active plan has workout scheduled
- **Plan management in Profile** - Saved tab shows all plans with:
  - Active plan badge
  - Day schedule preview
  - Activate/Delete controls

#### Enhanced Workout History
- Expandable workout cards - single tap expands to show exercises inline
- Workout detail page at `/workout-history?id=<sessionId>`
- Bookmark functionality to save favorite workouts
- "Do This Workout Again" button to reload past workouts
- `useSessionDetail` hook with caching for performance
- Database view: `user_session_detail` for aggregated session data

#### Improved Muscle Balance Page
- Redesigned 3-column responsive layout (was tiny overlapping panels)
- Larger, more readable muscle menus with proper spacing
- Head-to-toe anatomical ordering for muscle lists:
  - Front: Traps → Shoulders → Chest → Biceps → Forearms → Core → Obliques → Quads → Adductors
  - Back: Traps → Rear Delts → Upper Back → Lats → Triceps → Forearms → Lower Back → Glutes → Hamstrings → Calves
- View-specific muscle lists (Front vs Back)
- Hover-to-switch view - hovering over back muscles auto-switches to back view
- Larger strength indicators with glow effects
- Improved summary cards with colored borders

#### BodyMap Component
- External view control via `view` and `onViewChange` props
- Synchronized state between body visualization and muscle menu

### Changed
- Workout history now uses query parameters (`?id=`) instead of dynamic routes for Capacitor static export compatibility
- Muscle balance page uses CSS Grid instead of absolute positioning

### Fixed
- Static export compatibility for workout history detail page
- Build errors related to dynamic routes with `output: 'export'`
- Weekly plan generation now shows error if location not selected (was silently failing)

---

## [0.0.1] - 2025-01-08

### Added
- Initial release
- AI workout generation with 8 workout styles
- GPS run tracking with voice announcements
- Exercise library with 200+ exercises
- Weight and strength tracking
- Interactive body map visualization
- Supabase authentication with Apple Sign-In
- Capacitor iOS wrapper
- FlexTimer component for rest periods
- Gym equipment profiles
- Movement pattern tags for injury awareness
