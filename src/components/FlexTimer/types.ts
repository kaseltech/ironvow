// Timer mode types
export type TimerMode = 'stopwatch' | 'countdown' | 'tabata' | 'emom' | 'interval';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'prelude' | 'complete';
export type TimerPhase = 'work' | 'rest' | 'set-rest';

// Timer state
export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  timeRemaining: number;    // Seconds (for countdown modes)
  timeElapsed: number;      // Seconds (for stopwatch)
  currentRound: number;
  totalRounds: number;
  currentSet: number;
  totalSets: number;
  phase: TimerPhase;
  preludeCount: number;     // 3, 2, 1, 0 (GO)
  laps: number[];           // Lap times in ms (stopwatch)
}

// Configuration per mode
export interface TimerConfig {
  // Durations in seconds
  workDuration: number;
  restDuration: number;
  setRestDuration: number;
  countdownDuration: number;
  emomRoundDuration: number;

  // Counts
  rounds: number;
  sets: number;

  // Features
  preludeEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  warningAt: number;        // Seconds before end to show warning
}

// Saved preset
export interface TimerPreset {
  id: string;
  user_id: string;
  name: string;
  mode: TimerMode;
  config: Partial<TimerConfig>;
  created_at: string;
  is_favorite: boolean;
}

// Default configurations per mode
export const DEFAULT_CONFIGS: Record<TimerMode, Partial<TimerConfig>> = {
  stopwatch: {
    preludeEnabled: false,
    soundEnabled: true,
    hapticEnabled: true,
  },
  countdown: {
    countdownDuration: 60,
    preludeEnabled: true,
    soundEnabled: true,
    hapticEnabled: true,
    warningAt: 10,
  },
  tabata: {
    workDuration: 20,
    restDuration: 10,
    rounds: 8,
    preludeEnabled: true,
    soundEnabled: true,
    hapticEnabled: true,
    warningAt: 3,
  },
  emom: {
    emomRoundDuration: 60,
    rounds: 10,
    preludeEnabled: true,
    soundEnabled: true,
    hapticEnabled: true,
    warningAt: 5,
  },
  interval: {
    workDuration: 45,
    restDuration: 15,
    rounds: 4,
    sets: 3,
    setRestDuration: 60,
    preludeEnabled: true,
    soundEnabled: true,
    hapticEnabled: true,
    warningAt: 5,
  },
};

// Initial timer state
export const INITIAL_TIMER_STATE: TimerState = {
  mode: 'stopwatch',
  status: 'idle',
  timeRemaining: 0,
  timeElapsed: 0,
  currentRound: 1,
  totalRounds: 1,
  currentSet: 1,
  totalSets: 1,
  phase: 'work',
  preludeCount: 5, // Counts down 4, 3, 2, 1, GO!
  laps: [],
};

// Mode display info
export const MODE_INFO: Record<TimerMode, { label: string; icon: string; description: string }> = {
  stopwatch: {
    label: 'Stopwatch',
    icon: '⏱',
    description: 'Count up with lap tracking',
  },
  countdown: {
    label: 'Countdown',
    icon: '⏳',
    description: 'Simple countdown timer',
  },
  tabata: {
    label: 'Tabata',
    icon: '🔥',
    description: '20s work / 10s rest intervals',
  },
  emom: {
    label: 'EMOM',
    icon: '⚡',
    description: 'Every Minute On the Minute',
  },
  interval: {
    label: 'Interval',
    icon: '🔄',
    description: 'Custom work/rest with sets',
  },
};
