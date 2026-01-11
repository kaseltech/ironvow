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

      // Prelude countdown
      if (status === 'prelude') {
        if (preludeCount > 1) {
          timerAudio.play('countdown');
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
        preludeCount: 3,
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
      {/* Header */}
      <header
        style={{
          padding: '1rem 1.5rem',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${colors.accent}20`,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: colors.accent,
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
        >
          ✕
        </button>
        <h1
          style={{
            fontFamily: 'var(--font-libre-baskerville)',
            fontSize: '1.25rem',
            color: colors.text,
            margin: 0,
          }}
        >
          Flex Timer
        </h1>
        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            background: showConfig ? `${colors.accent}20` : 'none',
            border: `1px solid ${colors.accent}40`,
            borderRadius: '0.5rem',
            color: colors.accent,
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem 0.75rem',
            minWidth: '44px',
            minHeight: '44px',
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
          padding: '1rem',
          overflowX: 'auto',
          borderBottom: `1px solid ${colors.accent}10`,
        }}
      >
        {(Object.keys(MODE_INFO) as TimerMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            disabled={state.status === 'running'}
            style={{
              background: state.mode === mode ? `${colors.accent}20` : 'transparent',
              border: `1px solid ${state.mode === mode ? colors.accent : colors.accent + '30'}`,
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              color: state.mode === mode ? colors.accent : colors.textMuted,
              fontSize: '0.875rem',
              fontWeight: state.mode === mode ? 600 : 400,
              cursor: state.status === 'running' ? 'not-allowed' : 'pointer',
              opacity: state.status === 'running' && state.mode !== mode ? 0.5 : 1,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {MODE_INFO[mode].icon} {MODE_INFO[mode].label}
          </button>
        ))}
      </div>

      {/* Main timer display */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        {/* Phase label */}
        {getPhaseLabel() && (
          <div
            style={{
              fontSize: state.status === 'prelude' ? '3rem' : '1.25rem',
              fontWeight: 700,
              color: getPhaseColor(),
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: '1rem',
              transition: 'all 0.2s ease',
            }}
          >
            {getPhaseLabel()}
          </div>
        )}

        {/* Timer digits */}
        <div
          style={{
            fontSize: state.status === 'prelude' ? '4rem' : '6rem',
            fontFamily: 'var(--font-geist-mono)',
            fontWeight: 700,
            color: state.status === 'complete' ? colors.success : colors.text,
            lineHeight: 1,
            marginBottom: '1rem',
          }}
        >
          {state.status === 'prelude' ? '' : formatTime(displayTime)}
        </div>

        {/* Progress info */}
        {(state.mode === 'tabata' || state.mode === 'emom' || state.mode === 'interval') && (
          <div
            style={{
              fontSize: '1rem',
              color: colors.textMuted,
              marginBottom: '1rem',
            }}
          >
            Round {state.currentRound} of {state.totalRounds}
            {state.mode === 'interval' && (
              <span> &bull; Set {state.currentSet} of {state.totalSets}</span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {state.mode !== 'stopwatch' && state.status !== 'idle' && (
          <div
            style={{
              width: '100%',
              maxWidth: '300px',
              height: '6px',
              backgroundColor: `${colors.accent}20`,
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${getProgress()}%`,
                backgroundColor: getPhaseColor(),
                transition: 'width 0.2s linear',
              }}
            />
          </div>
        )}

        {/* Laps (stopwatch) */}
        {state.mode === 'stopwatch' && state.laps.length > 0 && (
          <div
            style={{
              width: '100%',
              maxWidth: '300px',
              maxHeight: '150px',
              overflowY: 'auto',
              marginBottom: '1rem',
            }}
          >
            {state.laps.map((lapTime, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: `1px solid ${colors.accent}10`,
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: colors.textMuted }}>Lap {i + 1}</span>
                <span style={{ color: colors.text, fontFamily: 'var(--font-geist-mono)' }}>
                  {formatLapTime(lapTime)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Control buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          {state.status === 'idle' || state.status === 'complete' ? (
            <button
              onClick={start}
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}CC)`,
                border: 'none',
                borderRadius: '1rem',
                padding: '1.25rem 3rem',
                color: '#0F2233',
                fontSize: '1.25rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {state.status === 'complete' ? 'Restart' : 'Start'}
            </button>
          ) : state.status === 'running' ? (
            <>
              {state.mode === 'stopwatch' && (
                <button
                  onClick={lap}
                  style={{
                    background: 'transparent',
                    border: `2px solid ${colors.accent}`,
                    borderRadius: '1rem',
                    padding: '1rem 2rem',
                    color: colors.accent,
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Lap
                </button>
              )}
              <button
                onClick={pause}
                style={{
                  background: `${colors.accent}20`,
                  border: `2px solid ${colors.accent}`,
                  borderRadius: '1rem',
                  padding: '1rem 2rem',
                  color: colors.accent,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Pause
              </button>
            </>
          ) : state.status === 'paused' ? (
            <>
              <button
                onClick={reset}
                style={{
                  background: 'transparent',
                  border: `2px solid ${colors.textMuted}`,
                  borderRadius: '1rem',
                  padding: '1rem 2rem',
                  color: colors.textMuted,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
              <button
                onClick={resume}
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}CC)`,
                  border: 'none',
                  borderRadius: '1rem',
                  padding: '1rem 2rem',
                  color: '#0F2233',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Resume
              </button>
            </>
          ) : null}
        </div>

        {state.status === 'idle' && (
          <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginTop: '1rem' }}>
            Press Space to start
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
            background: colors.cardBg,
            borderTop: `1px solid ${colors.accent}30`,
            borderRadius: '1.5rem 1.5rem 0 0',
            padding: '1rem 1.5rem',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: colors.text, fontSize: '1rem', margin: 0 }}>
              {MODE_INFO[state.mode].label} Settings
            </h3>
            <button
              onClick={() => setShowConfig(false)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.accent,
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.25rem',
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
