# Changelog

All notable changes to IronVow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
