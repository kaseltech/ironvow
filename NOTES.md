# IronVow - Development Notes & Ideas

## Brainstorm Dump

### Equipment Ideas
- Barbell (Olympic, standard)
- Dumbbells (fixed, adjustable - specify weight range)
- Kettlebells
- Pull-up bar
- Resistance bands
- Cable machine
- Smith machine
- Lat pulldown
- Leg press
- Squat rack / Power rack
- Bench (flat, adjustable)
- EZ curl bar
- Trap bar
- Battle ropes
- TRX / Suspension trainer
- Rowing machine
- Treadmill
- Stationary bike
- Elliptical
- Jump rope
- Foam roller
- Yoga mat
- Medicine ball
- Plyo box

### Workout Types
- Push/Pull/Legs (PPL)
- Upper/Lower split
- Full body
- Bro split (chest day, back day, etc.)
- HIIT
- Circuit training
- Strength (low rep, heavy)
- Hypertrophy (moderate rep, volume)
- Endurance (high rep, light)
- Cardio
- Mobility/Stretching
- Active recovery

### Muscle Groups
- Chest
- Back (lats, traps, rhomboids)
- Shoulders (front, side, rear delts)
- Biceps
- Triceps
- Forearms
- Core (abs, obliques, lower back)
- Quads
- Hamstrings
- Glutes
- Calves
- Hip flexors

### AI Prompt Improvements
- Include recent workout to avoid overlap (don't do chest 2 days in a row)
- Factor in recovery time
- Progressive overload - slightly increase weight/reps from last time
- Deload week awareness
- Warm-up sets vs working sets
- Compound movements first, isolation after

### UX Ideas
- Shake phone to swap exercise (for when something is taken at gym)
- Quick "I did this" button vs detailed logging
- Voice input for logging ("185 for 8")
- Apple Watch: just the timer and basic logging
- Widget: "Today's workout" summary
- Lock screen live activity during workout

### Gamification (Maybe?)
- Streak tracking
- PR celebrations (confetti like YearVow?)
- Monthly challenges
- Badges (1000 lb club, etc.)
- Keep it optional - some people hate gamification

### Data to Track
- Total volume (weight × reps × sets)
- 1RM estimates
- Workout duration
- Rest time compliance
- Muscle group frequency
- Weekly volume per muscle group

### Exercise Demo Sources
- Musclewiki.com (free, API?)
- Create our own (expensive, time consuming)
- AI-generated descriptions + form cues
- Partner with fitness YouTuber?

---

## Technical Notes

### AI Response Format
```json
{
  "workout": {
    "name": "Upper Body Push",
    "duration_estimate": 45,
    "warmup": [...],
    "exercises": [
      {
        "name": "Bench Press",
        "muscle_groups": ["chest", "triceps", "shoulders"],
        "sets": 4,
        "reps": "8-10",
        "weight_suggestion": 165,
        "rest_seconds": 90,
        "notes": "Control the descent, explode up",
        "alternatives": ["Dumbbell Press", "Push-ups"]
      }
    ],
    "cooldown": [...]
  }
}
```

### Offline Considerations
- Cache exercise library locally
- Queue workout logs for sync
- Allow manual workout creation offline
- AI generation requires internet (obviously)

### Apple Health Integration
- Sync workouts to Health app
- Import weight from Health
- Heart rate during workout (if Watch)
- Active calories burned

---

## Questions to Answer

1. How detailed should equipment setup be? (e.g., "Dumbbells 5-50 lbs" vs just "Dumbbells")
2. Should we track cardio the same way as lifting?
3. How to handle supersets / circuits in the UI?
4. Do we need video demos or are gifs + text enough?
5. Subscription vs one-time purchase?

---

## Inspiration / Reference Apps
- Strong (best logging UX)
- Hevy (modern design)
- Fitbod (AI approach)
- Apple Fitness+ (polish)
- Strava (for cardio tracking patterns)

---

## Recent Development (January 2026)

### Session 7 - Movement Patterns & Rehab

**Movement Pattern System:**
- Exercises now tagged with movement patterns: `overhead`, `impact`, `spinal_loading`, `deep_knee_flexion`, `hip_hinge`, `rotation`, `wrist_loading`
- Used for injury-aware exercise recommendations
- Contraindications auto-set based on patterns

**Rehab Exercise Library:**
- 40+ rehab/stretching exercises added
- Categories: shoulder, neck/cervical, lower back, knee, hip mobility
- Tagged with `rehab_for` to indicate which injuries they help
- New "Rehab/Prehab" workout style

**Workout Styles (8 total):**
1. Traditional - Hypertrophy focused
2. Strength (5x5) - Heavy, compound
3. HIIT - High intensity intervals
4. Circuit - Back-to-back, minimal rest
5. WOD - CrossFit AMRAP/EMOM
6. Cardio - Running, conditioning
7. Mobility - Stretching, recovery
8. Rehab - Injury prevention, prehab

### Resolved Questions

1. **AI Provider:** Claude 3 Haiku via Anthropic API (fast, cost-effective)
2. **Exercise demos:** Text descriptions + form cues for now
3. **Offline mode:** Workout logging queues locally, syncs when online
4. **Social:** Keeping it personal for now
5. **Wearables:** Apple HealthKit integration planned

---

*Last updated: January 8, 2026*
