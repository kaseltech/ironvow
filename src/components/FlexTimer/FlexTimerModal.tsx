'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/context/ThemeContext';
import { timerAudio } from './TimerSounds';
import {
  TimerMode,
  TimerStatus,
  TimerPhase,
  TimerState,
  TimerConfig,
  DEFAULT_CONFIGS,
  INITIAL_TIMER_STATE,
  MODE_INFO,
} from './types';

interface FlexTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FlexTimerModal({ isOpen, onClose }: FlexTimerModalProps) {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer state
  const [state, setState] = useState<TimerState>(INITIAL_TIMER_STATE);
  const [config, setConfig] = useState<TimerConfig>({
    workDuration: 20,
    restDuration: 10,
    setRestDuration: 60,
    countdownDuration: 60,
    emomRoundDuration: 60,
    rounds: 8,
    sets: 3,
    preludeEnabled: true,
    soundEnabled: true,
    hapticEnabled: true,
    warningAt: 3,
  });

  // Config panel visibility
  const [showConfig, setShowConfig] = useState(false);

  // Timer display style
  type TimerStyle = 'crossfit' | 'modern' | 'minimal';
  const [timerStyle, setTimerStyle] = useState<TimerStyle>('crossfit');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update audio settings when config changes
  useEffect(() => {
    timerAudio.setEnabled(config.soundEnabled);
    timerAudio.setHapticEnabled(config.hapticEnabled);
  }, [config.soundEnabled, config.hapticEnabled]);

  // Format time display
  const formatTime = (seconds: number, showMs: boolean = false): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    if (showMs && state.mode === 'stopwatch') {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format lap time (ms to MM:SS.ms)
  const formatLapTime = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  // Initialize timer based on mode
  const initializeTimer = useCallback((mode: TimerMode) => {
    const modeDefaults = DEFAULT_CONFIGS[mode];
    const newConfig = { ...config, ...modeDefaults };
    setConfig(newConfig);

    setState({
      ...INITIAL_TIMER_STATE,
      mode,
      totalRounds: mode === 'tabata' || mode === 'emom' || mode === 'interval'
        ? newConfig.rounds
        : 1,
      totalSets: mode === 'interval' ? newConfig.sets : 1,
      timeRemaining: mode === 'countdown' ? newConfig.countdownDuration
        : mode === 'tabata' ? newConfig.workDuration
        : mode === 'emom' ? newConfig.emomRoundDuration
        : mode === 'interval' ? newConfig.workDuration
        : 0,
    });
  }, [config]);

  // Handle mode change
  const handleModeChange = (mode: TimerMode) => {
    if (state.status === 'running') return; // Don't change while running
    initializeTimer(mode);
  };

  // Main timer tick
  const tick = useCallback(() => {
    setState(prev => {
      const { mode, status, phase, timeRemaining, timeElapsed, currentRound, totalRounds, currentSet, totalSets, preludeCount } = prev;

      // Prelude countdown (4, 3, 2, 1, GO!)
      if (status === 'prelude') {
        if (preludeCount > 1) {
          timerAudio.playCountdownNumber(preludeCount - 1);
          return { ...prev, preludeCount: preludeCount - 1 };
        } else {
          timerAudio.playGo();
          return {
            ...prev,
            status: 'running',
            preludeCount: 0,
            timeRemaining: mode === 'countdown' ? config.countdownDuration
              : mode === 'tabata' ? config.workDuration
              : mode === 'emom' ? config.emomRoundDuration
              : mode === 'interval' ? config.workDuration
              : 0,
          };
        }
      }

      // Stopwatch mode (count up)
      if (mode === 'stopwatch') {
        return { ...prev, timeElapsed: timeElapsed + 1 };
      }

      // Countdown modes
      if (timeRemaining <= config.warningAt && timeRemaining > 0) {
        timerAudio.play('warning');
      }

      if (timeRemaining <= 1) {
        // Time's up for current phase

        // Simple countdown - complete
        if (mode === 'countdown') {
          timerAudio.play('complete');
          return { ...prev, status: 'complete', timeRemaining: 0 };
        }

        // Tabata logic
        if (mode === 'tabata') {
          if (phase === 'work') {
            // Switch to rest
            timerAudio.play('restStart');
            return {
              ...prev,
              phase: 'rest',
              timeRemaining: config.restDuration,
            };
          } else {
            // Rest done, next round or complete
            if (currentRound >= totalRounds) {
              timerAudio.play('complete');
              return { ...prev, status: 'complete', timeRemaining: 0 };
            }
            timerAudio.play('workStart');
            return {
              ...prev,
              phase: 'work',
              currentRound: currentRound + 1,
              timeRemaining: config.workDuration,
            };
          }
        }

        // EMOM logic
        if (mode === 'emom') {
          if (currentRound >= totalRounds) {
            timerAudio.play('complete');
            return { ...prev, status: 'complete', timeRemaining: 0 };
          }
          timerAudio.play('workStart');
          return {
            ...prev,
            currentRound: currentRound + 1,
            timeRemaining: config.emomRoundDuration,
          };
        }

        // Interval logic
        if (mode === 'interval') {
          if (phase === 'work') {
            // Switch to rest
            timerAudio.play('restStart');
            return {
              ...prev,
              phase: 'rest',
              timeRemaining: config.restDuration,
            };
          } else if (phase === 'rest') {
            // Rest done
            if (currentRound >= totalRounds) {
              // Set complete
              if (currentSet >= totalSets) {
                timerAudio.play('complete');
                return { ...prev, status: 'complete', timeRemaining: 0 };
              }
              // Set rest
              timerAudio.play('restStart');
              return {
                ...prev,
                phase: 'set-rest',
                timeRemaining: config.setRestDuration,
              };
            }
            // Next round
            timerAudio.play('workStart');
            return {
              ...prev,
              phase: 'work',
              currentRound: currentRound + 1,
              timeRemaining: config.workDuration,
            };
          } else {
            // Set rest done, start next set
            timerAudio.play('workStart');
            return {
              ...prev,
              phase: 'work',
              currentRound: 1,
              currentSet: currentSet + 1,
              timeRemaining: config.workDuration,
            };
          }
        }

        return prev;
      }

      return { ...prev, timeRemaining: timeRemaining - 1 };
    });
  }, [config]);

  // Start/stop interval
  useEffect(() => {
    if (state.status === 'running' || state.status === 'prelude') {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.status, tick]);

  // Control functions
  const start = () => {
    timerAudio.resume(); // Resume audio context on user interaction
    if (config.preludeEnabled && state.mode !== 'stopwatch') {
      setState(prev => ({
        ...prev,
        status: 'prelude',
        preludeCount: 5, // Will count down 4, 3, 2, 1, GO!
      }));
    } else {
      setState(prev => ({
        ...prev,
        status: 'running',
      }));
      if (state.mode !== 'stopwatch') {
        timerAudio.play('workStart');
      }
    }
  };

  const pause = () => {
    setState(prev => ({ ...prev, status: 'paused' }));
  };

  const resume = () => {
    setState(prev => ({ ...prev, status: 'running' }));
  };

  const reset = () => {
    setState(prev => ({
      ...INITIAL_TIMER_STATE,
      mode: prev.mode,
      totalRounds: prev.mode === 'tabata' || prev.mode === 'emom' || prev.mode === 'interval'
        ? config.rounds
        : 1,
      totalSets: prev.mode === 'interval' ? config.sets : 1,
      timeRemaining: prev.mode === 'countdown' ? config.countdownDuration
        : prev.mode === 'tabata' ? config.workDuration
        : prev.mode === 'emom' ? config.emomRoundDuration
        : prev.mode === 'interval' ? config.workDuration
        : 0,
    }));
  };

  const lap = () => {
    if (state.mode !== 'stopwatch' || state.status !== 'running') return;
    timerAudio.play('lap');
    setState(prev => ({
      ...prev,
      laps: [...prev.laps, prev.timeElapsed * 1000],
    }));
  };

  // ESC key to close config first, then modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfig) {
          setShowConfig(false);
        } else if (state.status === 'running') {
          pause();
        } else {
          onClose();
        }
      }
      // Space to start/pause
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        if (state.status === 'idle' || state.status === 'complete') {
          start();
        } else if (state.status === 'running') {
          pause();
        } else if (state.status === 'paused') {
          resume();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, state.status, showConfig, onClose]);

  // Get display time based on mode
  const displayTime = state.mode === 'stopwatch' ? state.timeElapsed : state.timeRemaining;

  // Get phase label
  const getPhaseLabel = (): string => {
    if (state.status === 'prelude') return state.preludeCount.toString();
    if (state.status === 'complete') return 'DONE';
    if (state.mode === 'stopwatch') return '';
    if (state.mode === 'countdown') return '';
    if (state.phase === 'work') return 'WORK';
    if (state.phase === 'rest') return 'REST';
    if (state.phase === 'set-rest') return 'SET REST';
    return '';
  };

  // Get phase color
  const getPhaseColor = (): string => {
    if (state.status === 'prelude') return colors.accent;
    if (state.status === 'complete') return colors.success;
    if (state.phase === 'work') return colors.success;
    if (state.phase === 'rest' || state.phase === 'set-rest') return colors.accent;
    return colors.text;
  };

  // Calculate progress
  const getProgress = (): number => {
    if (state.mode === 'stopwatch') return 0;
    if (state.status === 'prelude') return 0;

    const totalTime = state.mode === 'countdown' ? config.countdownDuration
      : state.phase === 'work' ? config.workDuration
      : state.phase === 'rest' ? config.restDuration
      : state.phase === 'set-rest' ? config.setRestDuration
      : config.emomRoundDuration;

    return ((totalTime - state.timeRemaining) / totalTime) * 100;
  };

  // Config adjustment helpers - also update timer state
  const adjustConfig = (key: keyof TimerConfig, delta: number) => {
    setConfig(prev => {
      const newValue = Math.max(1, (prev[key] as number) + delta);
      const newConfig = { ...prev, [key]: newValue };

      // Update timer state to reflect new config
      if (state.status === 'idle') {
        setState(s => ({
          ...s,
          totalRounds: (state.mode === 'tabata' || state.mode === 'emom' || state.mode === 'interval')
            ? (key === 'rounds' ? newValue : newConfig.rounds)
            : 1,
          totalSets: state.mode === 'interval'
            ? (key === 'sets' ? newValue : newConfig.sets)
            : 1,
          timeRemaining: state.mode === 'countdown'
            ? (key === 'countdownDuration' ? newValue : newConfig.countdownDuration)
            : state.mode === 'tabata'
            ? (key === 'workDuration' ? newValue : newConfig.workDuration)
            : state.mode === 'emom'
            ? (key === 'emomRoundDuration' ? newValue : newConfig.emomRoundDuration)
            : state.mode === 'interval'
            ? (key === 'workDuration' ? newValue : newConfig.workDuration)
            : 0,
        }));
      }

      return newConfig;
    });
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 150,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && state.status === 'idle') {
          onClose();
        }
      }}
    >
      {/* Header - minimal for CrossFit style */}
      <header
        style={{
          padding: '0.75rem 1rem',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: timerStyle === 'crossfit' ? '#111' : 'transparent',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: timerStyle === 'crossfit' ? '#666' : colors.accent,
            fontSize: '2rem',
            cursor: 'pointer',
            padding: '0.5rem',
            minWidth: '48px',
            minHeight: '48px',
          }}
        >
          ✕
        </button>

        {/* Style selector in header */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['crossfit', 'modern', 'minimal'] as const).map(style => (
            <button
              key={style}
              onClick={() => setTimerStyle(style)}
              style={{
                background: timerStyle === style ? (timerStyle === 'crossfit' ? '#333' : `${colors.accent}20`) : 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                color: timerStyle === style ? (timerStyle === 'crossfit' ? '#FFF' : colors.accent) : (timerStyle === 'crossfit' ? '#555' : colors.textMuted),
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {style === 'crossfit' ? 'GYM' : style === 'modern' ? 'MOD' : 'MIN'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            background: showConfig ? (timerStyle === 'crossfit' ? '#333' : `${colors.accent}30`) : (timerStyle === 'crossfit' ? '#222' : `${colors.accent}10`),
            border: `2px solid ${timerStyle === 'crossfit' ? '#444' : colors.accent}`,
            borderRadius: '0.75rem',
            color: timerStyle === 'crossfit' ? '#FFF' : colors.accent,
            fontSize: '1.75rem',
            cursor: 'pointer',
            padding: '0.75rem 1rem',
            minWidth: '60px',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ⚙
        </button>
      </header>

      {/* Mode selector */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          overflowX: 'auto',
          background: timerStyle === 'crossfit' ? '#111' : 'transparent',
          borderBottom: timerStyle === 'crossfit' ? '1px solid #222' : `1px solid ${colors.accent}10`,
        }}
      >
        {(Object.keys(MODE_INFO) as TimerMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            disabled={state.status === 'running'}
            style={{
              background: state.mode === mode
                ? (timerStyle === 'crossfit' ? '#FF3333' : `${colors.accent}20`)
                : (timerStyle === 'crossfit' ? '#222' : 'transparent'),
              border: timerStyle === 'crossfit' ? 'none' : `1px solid ${state.mode === mode ? colors.accent : colors.accent + '30'}`,
              borderRadius: '0.5rem',
              padding: '0.625rem 1rem',
              color: state.mode === mode
                ? (timerStyle === 'crossfit' ? '#000' : colors.accent)
                : (timerStyle === 'crossfit' ? '#666' : colors.textMuted),
              fontSize: '0.8125rem',
              fontWeight: state.mode === mode ? 700 : 500,
              cursor: state.status === 'running' ? 'not-allowed' : 'pointer',
              opacity: state.status === 'running' && state.mode !== mode ? 0.5 : 1,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              textTransform: timerStyle === 'crossfit' ? 'uppercase' : 'none',
              letterSpacing: timerStyle === 'crossfit' ? '0.05em' : '0',
            }}
          >
            {timerStyle === 'crossfit' ? MODE_INFO[mode].label : `${MODE_INFO[mode].icon} ${MODE_INFO[mode].label}`}
          </button>
        ))}
      </div>

      {/* Main timer display - CrossFit style */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: timerStyle === 'crossfit' ? '#000' : 'transparent',
        }}
      >
        {/* Prelude countdown - massive number */}
        {state.status === 'prelude' && (
          <div
            style={{
              fontSize: timerStyle === 'crossfit' ? 'min(50vw, 300px)' : '8rem',
              fontFamily: 'var(--font-geist-mono)',
              fontWeight: 900,
              color: timerStyle === 'crossfit' ? '#FF3333' : colors.accent,
              lineHeight: 1,
              textShadow: timerStyle === 'crossfit' ? '0 0 40px #FF3333' : 'none',
            }}
          >
            {state.preludeCount - 1 || 'GO'}
          </div>
        )}

        {/* Main timer - CrossFit LED style */}
        {state.status !== 'prelude' && (
          <>
            <div
              style={{
                fontSize: timerStyle === 'crossfit' ? 'min(28vw, 180px)' : timerStyle === 'minimal' ? '5rem' : '6rem',
                fontFamily: 'var(--font-geist-mono)',
                fontWeight: 900,
                color: timerStyle === 'crossfit'
                  ? (state.phase === 'rest' || state.phase === 'set-rest' ? '#33FF33' : '#FF3333')
                  : state.status === 'complete' ? colors.success : colors.text,
                lineHeight: 1,
                textShadow: timerStyle === 'crossfit'
                  ? `0 0 30px ${state.phase === 'rest' || state.phase === 'set-rest' ? '#33FF33' : '#FF3333'}`
                  : 'none',
                letterSpacing: timerStyle === 'crossfit' ? '0.05em' : '0',
              }}
            >
              {formatTime(displayTime)}
            </div>

            {/* Round info - smaller, below timer */}
            {(state.mode === 'tabata' || state.mode === 'emom' || state.mode === 'interval') && state.status !== 'idle' && (
              <div
                style={{
                  fontSize: timerStyle === 'crossfit' ? '1.5rem' : '1rem',
                  color: timerStyle === 'crossfit' ? '#888' : colors.textMuted,
                  marginTop: '1rem',
                  fontFamily: 'var(--font-geist-mono)',
                }}
              >
                {state.mode === 'interval'
                  ? `SET ${state.currentSet}/${state.totalSets} • RD ${state.currentRound}/${state.totalRounds}`
                  : `ROUND ${state.currentRound} / ${state.totalRounds}`}
              </div>
            )}

            {/* Laps (stopwatch) */}
            {state.mode === 'stopwatch' && state.laps.length > 0 && (
              <div style={{ width: '100%', maxWidth: '300px', maxHeight: '120px', overflowY: 'auto', marginTop: '1rem' }}>
                {state.laps.slice(-5).map((lapTime, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                    <span style={{ color: timerStyle === 'crossfit' ? '#666' : colors.textMuted }}>Lap {state.laps.length - 4 + i}</span>
                    <span style={{ color: timerStyle === 'crossfit' ? '#AAA' : colors.text, fontFamily: 'var(--font-geist-mono)' }}>
                      {formatLapTime(lapTime)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Control buttons - larger and clearer */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
          {state.status === 'idle' || state.status === 'complete' ? (
            <button
              onClick={start}
              style={{
                background: timerStyle === 'crossfit' ? '#33FF33' : `linear-gradient(135deg, ${colors.accent}, ${colors.accent}CC)`,
                border: 'none',
                borderRadius: '1rem',
                padding: '1.5rem 4rem',
                color: '#000',
                fontSize: '1.5rem',
                fontWeight: 900,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {state.status === 'complete' ? 'Again' : 'Start'}
            </button>
          ) : state.status === 'running' ? (
            <>
              {state.mode === 'stopwatch' && (
                <button
                  onClick={lap}
                  style={{
                    background: 'transparent',
                    border: `3px solid ${timerStyle === 'crossfit' ? '#FFF' : colors.accent}`,
                    borderRadius: '1rem',
                    padding: '1rem 2rem',
                    color: timerStyle === 'crossfit' ? '#FFF' : colors.accent,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  LAP
                </button>
              )}
              <button
                onClick={pause}
                style={{
                  background: timerStyle === 'crossfit' ? '#FF3333' : `${colors.accent}20`,
                  border: timerStyle === 'crossfit' ? 'none' : `3px solid ${colors.accent}`,
                  borderRadius: '1rem',
                  padding: '1rem 2.5rem',
                  color: timerStyle === 'crossfit' ? '#000' : colors.accent,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                STOP
              </button>
            </>
          ) : state.status === 'paused' ? (
            <>
              <button
                onClick={reset}
                style={{
                  background: 'transparent',
                  border: `3px solid ${timerStyle === 'crossfit' ? '#666' : colors.textMuted}`,
                  borderRadius: '1rem',
                  padding: '1rem 2rem',
                  color: timerStyle === 'crossfit' ? '#666' : colors.textMuted,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                RESET
              </button>
              <button
                onClick={resume}
                style={{
                  background: timerStyle === 'crossfit' ? '#33FF33' : `linear-gradient(135deg, ${colors.accent}, ${colors.accent}CC)`,
                  border: 'none',
                  borderRadius: '1rem',
                  padding: '1rem 2.5rem',
                  color: '#000',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                GO
              </button>
            </>
          ) : null}
        </div>

        {state.status === 'idle' && (
          <p style={{ color: timerStyle === 'crossfit' ? '#555' : colors.textMuted, fontSize: '0.875rem', marginTop: '1rem' }}>
            TAP START or press SPACE
          </p>
        )}
      </main>

      {/* Config panel */}
      {showConfig && state.status === 'idle' && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: timerStyle === 'crossfit' ? '#111' : colors.cardBg,
            borderTop: timerStyle === 'crossfit' ? '2px solid #333' : `1px solid ${colors.accent}30`,
            borderRadius: '1.5rem 1.5rem 0 0',
            padding: '1.25rem 1.5rem',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{
              color: timerStyle === 'crossfit' ? '#FFF' : colors.text,
              fontSize: '1.125rem',
              margin: 0,
              fontWeight: 700,
              textTransform: timerStyle === 'crossfit' ? 'uppercase' : 'none',
              letterSpacing: timerStyle === 'crossfit' ? '0.1em' : '0',
            }}>
              {MODE_INFO[state.mode].label}
            </h3>
            <button
              onClick={() => setShowConfig(false)}
              style={{
                background: timerStyle === 'crossfit' ? '#333' : 'none',
                border: 'none',
                borderRadius: '0.5rem',
                color: timerStyle === 'crossfit' ? '#FFF' : colors.accent,
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Countdown duration */}
          {state.mode === 'countdown' && (
            <ConfigRow
              label="Duration"
              value={formatTime(config.countdownDuration)}
              onDecrease={() => adjustConfig('countdownDuration', -5)}
              onIncrease={() => adjustConfig('countdownDuration', 5)}
              colors={colors}
            />
          )}

          {/* Tabata config */}
          {state.mode === 'tabata' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
              <ConfigRowCompact label="Work" value={`${config.workDuration}s`} onDecrease={() => adjustConfig('workDuration', -5)} onIncrease={() => adjustConfig('workDuration', 5)} colors={colors} />
              <ConfigRowCompact label="Rest" value={`${config.restDuration}s`} onDecrease={() => adjustConfig('restDuration', -5)} onIncrease={() => adjustConfig('restDuration', 5)} colors={colors} />
              <ConfigRowCompact label="Rounds" value={config.rounds.toString()} onDecrease={() => adjustConfig('rounds', -1)} onIncrease={() => adjustConfig('rounds', 1)} colors={colors} />
            </div>
          )}

          {/* EMOM config */}
          {state.mode === 'emom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
              <ConfigRowCompact label="Round" value={`${config.emomRoundDuration}s`} onDecrease={() => adjustConfig('emomRoundDuration', -5)} onIncrease={() => adjustConfig('emomRoundDuration', 5)} colors={colors} />
              <ConfigRowCompact label="Rounds" value={config.rounds.toString()} onDecrease={() => adjustConfig('rounds', -1)} onIncrease={() => adjustConfig('rounds', 1)} colors={colors} />
            </div>
          )}

          {/* Interval config */}
          {state.mode === 'interval' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
              <ConfigRowCompact label="Work" value={`${config.workDuration}s`} onDecrease={() => adjustConfig('workDuration', -5)} onIncrease={() => adjustConfig('workDuration', 5)} colors={colors} />
              <ConfigRowCompact label="Rest" value={`${config.restDuration}s`} onDecrease={() => adjustConfig('restDuration', -5)} onIncrease={() => adjustConfig('restDuration', 5)} colors={colors} />
              <ConfigRowCompact label="Rounds" value={config.rounds.toString()} onDecrease={() => adjustConfig('rounds', -1)} onIncrease={() => adjustConfig('rounds', 1)} colors={colors} />
              <ConfigRowCompact label="Sets" value={config.sets.toString()} onDecrease={() => adjustConfig('sets', -1)} onIncrease={() => adjustConfig('sets', 1)} colors={colors} />
              <ConfigRowCompact label="Set Rest" value={`${config.setRestDuration}s`} onDecrease={() => adjustConfig('setRestDuration', -10)} onIncrease={() => adjustConfig('setRestDuration', 10)} colors={colors} />
            </div>
          )}

          {/* Sound/Haptic toggles - inline */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${colors.accent}20`, flexWrap: 'wrap' }}>
            <ToggleRowCompact label="Sound" value={config.soundEnabled} onChange={(v) => setConfig(prev => ({ ...prev, soundEnabled: v }))} colors={colors} />
            <ToggleRowCompact label="Haptic" value={config.hapticEnabled} onChange={(v) => setConfig(prev => ({ ...prev, hapticEnabled: v }))} colors={colors} />
            {state.mode !== 'stopwatch' && (
              <ToggleRowCompact label="3-2-1" value={config.preludeEnabled} onChange={(v) => setConfig(prev => ({ ...prev, preludeEnabled: v }))} colors={colors} />
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

// Config row component
function ConfigRow({
  label,
  value,
  onDecrease,
  onIncrease,
  colors,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: `1px solid ${colors.accent}10`,
      }}
    >
      <span style={{ color: colors.text, fontSize: '0.9375rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onDecrease}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `${colors.accent}15`,
            border: `1px solid ${colors.accent}30`,
            color: colors.accent,
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          −
        </button>
        <span
          style={{
            color: colors.accent,
            fontSize: '1rem',
            fontWeight: 600,
            minWidth: '60px',
            textAlign: 'center',
            fontFamily: 'var(--font-geist-mono)',
          }}
        >
          {value}
        </span>
        <button
          onClick={onIncrease}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `${colors.accent}15`,
            border: `1px solid ${colors.accent}30`,
            color: colors.accent,
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// Toggle row component
function ToggleRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
      }}
    >
      <span style={{ color: colors.text, fontSize: '0.9375rem' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '48px',
          height: '28px',
          borderRadius: '14px',
          background: value ? colors.accent : `${colors.textMuted}30`,
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: value ? '22px' : '2px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s ease',
          }}
        />
      </button>
    </div>
  );
}

// Compact config row for grid layout
function ConfigRowCompact({
  label,
  value,
  onDecrease,
  onIncrease,
  colors,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
      <span style={{ color: colors.textMuted, fontSize: '0.8125rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={onDecrease}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: `${colors.accent}15`,
            border: `1px solid ${colors.accent}30`,
            color: colors.accent,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          −
        </button>
        <span style={{ color: colors.accent, fontSize: '0.875rem', fontWeight: 600, minWidth: '40px', textAlign: 'center', fontFamily: 'var(--font-geist-mono)' }}>
          {value}
        </span>
        <button
          onClick={onIncrease}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: `${colors.accent}15`,
            border: `1px solid ${colors.accent}30`,
            color: colors.accent,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// Compact toggle for inline layout
function ToggleRowCompact({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: value ? `${colors.accent}20` : 'transparent',
        border: `1px solid ${value ? colors.accent : colors.textMuted}40`,
        borderRadius: '1rem',
        padding: '0.375rem 0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ color: value ? colors.accent : colors.textMuted, fontSize: '0.8125rem' }}>{label}</span>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: value ? colors.accent : colors.textMuted,
        }}
      />
    </button>
  );
}

export default FlexTimerModal;
