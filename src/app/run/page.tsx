'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Geolocation, Position } from '@capacitor/geolocation';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase/client';

interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
  altitude?: number;
  speed?: number;
}

interface Split {
  km: number;
  time_seconds: number;
  pace_seconds_per_km: number;
}

type RunState = 'ready' | 'running' | 'paused' | 'finished';
type VoiceInterval = 'quarter' | 'half' | 'mile' | 'off';

// Voice announcement using Web Speech API
function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to use a natural voice
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(v =>
    v.name.includes('Samantha') || v.name.includes('Alex') || v.lang.startsWith('en')
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  speechSynthesis.speak(utterance);
}

// Format pace for speech
function speakPace(secondsPerKm: number): string {
  if (!secondsPerKm || !isFinite(secondsPerKm)) return 'unknown pace';
  // Convert to per mile for US users
  const secondsPerMile = secondsPerKm * 1.60934;
  const mins = Math.floor(secondsPerMile / 60);
  const secs = Math.floor(secondsPerMile % 60);
  if (secs === 0) return `${mins} minute mile`;
  return `${mins} ${secs} per mile`;
}

// Haversine formula to calculate distance between two GPS points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Format seconds to MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format pace (seconds per km) to MM:SS
function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || !isFinite(secondsPerKm)) return '--:--';
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format distance in meters to km or mi
function formatDistance(meters: number, unit: 'km' | 'mi' = 'km'): string {
  if (unit === 'mi') {
    return (meters / 1609.34).toFixed(2);
  }
  return (meters / 1000).toFixed(2);
}

export default function RunPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Run state
  const [runState, setRunState] = useState<RunState>('ready');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [averagePace, setAveragePace] = useState(0);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [voiceInterval, setVoiceInterval] = useState<VoiceInterval>('half');
  const [showSettings, setShowSettings] = useState(false);

  // Refs for intervals and watch
  const watchIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const lastKmRef = useRef<number>(0);
  const lastKmTimeRef = useRef<number>(0);
  const lastVoiceMilestoneRef = useRef<number>(0); // In meters

  // Request permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const status = await Geolocation.checkPermissions();
        if (status.location !== 'granted') {
          const result = await Geolocation.requestPermissions();
          if (result.location !== 'granted') {
            setGpsError('Location permission denied. Please enable in settings.');
          }
        }
      } catch (err) {
        console.error('Permission check failed:', err);
        setGpsError('Failed to check location permissions');
      }
    };
    checkPermissions();

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle position updates
  const handlePositionUpdate = useCallback((position: Position | null, err?: any) => {
    if (err) {
      console.error('GPS error:', err);
      setGpsError('GPS signal lost');
      return;
    }

    if (!position) return;
    setGpsError(null);
    setGpsAccuracy(position.coords.accuracy);

    const newPoint: RoutePoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
      altitude: position.coords.altitude ?? undefined,
      speed: position.coords.speed ?? undefined,
    };

    setRoutePoints(prev => {
      const updated = [...prev, newPoint];

      // Calculate distance from last point
      if (prev.length > 0) {
        const lastPoint = prev[prev.length - 1];
        const segmentDistance = calculateDistance(
          lastPoint.lat,
          lastPoint.lng,
          newPoint.lat,
          newPoint.lng
        );

        // Filter out GPS noise (ignore if distance is unrealistically large)
        // Max human sprint ~12 m/s, so if segment implies > 15 m/s, ignore
        const timeDelta = (newPoint.timestamp - lastPoint.timestamp) / 1000;
        if (timeDelta > 0 && segmentDistance / timeDelta < 15) {
          setDistance(d => d + segmentDistance);

          // Calculate current pace from speed or recent points
          if (newPoint.speed && newPoint.speed > 0.5) {
            // speed is in m/s, convert to sec/km
            setCurrentPace(1000 / newPoint.speed);
          } else if (segmentDistance > 0 && timeDelta > 0) {
            // Calculate from segment
            const segmentPace = (timeDelta / segmentDistance) * 1000;
            setCurrentPace(segmentPace);
          }
        }
      }

      return updated;
    });
  }, []);

  // Check for split completion
  useEffect(() => {
    const currentKm = Math.floor(distance / 1000);
    if (currentKm > lastKmRef.current && runState === 'running') {
      // Completed a new km
      const splitTime = elapsedTime - lastKmTimeRef.current;
      const newSplit: Split = {
        km: currentKm,
        time_seconds: splitTime,
        pace_seconds_per_km: splitTime,
      };
      setSplits(prev => [...prev, newSplit]);
      lastKmRef.current = currentKm;
      lastKmTimeRef.current = elapsedTime;
    }
  }, [distance, elapsedTime, runState]);

  // Calculate average pace
  useEffect(() => {
    if (distance > 0 && elapsedTime > 0) {
      setAveragePace((elapsedTime / distance) * 1000);
    }
  }, [distance, elapsedTime]);

  // Voice announcements at distance milestones
  useEffect(() => {
    if (runState !== 'running' || voiceInterval === 'off') return;

    // Convert interval to meters (using miles)
    const mileInMeters = 1609.34;
    const intervalMeters =
      voiceInterval === 'quarter' ? mileInMeters / 4 :
      voiceInterval === 'half' ? mileInMeters / 2 :
      mileInMeters;

    // Check if we've passed a new milestone
    const currentMilestone = Math.floor(distance / intervalMeters);
    const lastMilestone = Math.floor(lastVoiceMilestoneRef.current / intervalMeters);

    if (currentMilestone > lastMilestone && distance > 50) {
      lastVoiceMilestoneRef.current = distance;

      // Calculate miles covered
      const miles = distance / mileInMeters;
      const milesText = miles >= 1
        ? `${miles.toFixed(2)} miles`
        : voiceInterval === 'quarter'
          ? 'quarter mile'
          : 'half mile';

      // Format time for speech
      const mins = Math.floor(elapsedTime / 60);
      const secs = Math.floor(elapsedTime % 60);
      const timeText = mins > 0
        ? `${mins} minutes ${secs} seconds`
        : `${secs} seconds`;

      // Announce
      const announcement = `${milesText}. Time: ${timeText}. Pace: ${speakPace(averagePace)}.`;
      speak(announcement);
    }
  }, [distance, elapsedTime, averagePace, runState, voiceInterval]);

  // Start run
  const startRun = async () => {
    try {
      setGpsError(null);

      // Start GPS tracking
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
        handlePositionUpdate
      );
      watchIdRef.current = id;

      // Start timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current + pausedTimeRef.current) / 1000));
      }, 1000);

      setRunState('running');
    } catch (err) {
      console.error('Failed to start GPS:', err);
      setGpsError('Failed to start GPS tracking');
    }
  };

  // Pause run
  const pauseRun = () => {
    if (watchIdRef.current) {
      Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pausedTimeRef.current += Date.now() - startTimeRef.current;
    setRunState('paused');
  };

  // Resume run
  const resumeRun = async () => {
    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
        handlePositionUpdate
      );
      watchIdRef.current = id;

      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current + pausedTimeRef.current) / 1000));
      }, 1000);

      setRunState('running');
    } catch (err) {
      console.error('Failed to resume GPS:', err);
      setGpsError('Failed to resume GPS tracking');
    }
  };

  // Finish run
  const finishRun = async () => {
    // Stop tracking
    if (watchIdRef.current) {
      Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRunState('finished');

    // Save to database
    if (user && distance > 10) {
      // Only save if ran more than 10m
      try {
        const supabase = getSupabase();
        await supabase.from('run_sessions').insert({
          user_id: user.id,
          started_at: new Date(startTimeRef.current).toISOString(),
          completed_at: new Date().toISOString(),
          duration_seconds: elapsedTime,
          distance_meters: distance,
          average_pace_seconds_per_km: averagePace,
          fastest_pace_seconds_per_km: splits.length > 0
            ? Math.min(...splits.map(s => s.pace_seconds_per_km))
            : null,
          route_data: routePoints,
          splits: splits,
        });
      } catch (err) {
        console.error('Failed to save run:', err);
      }
    }
  };

  // Discard run
  const discardRun = () => {
    if (watchIdRef.current) {
      Geolocation.clearWatch({ id: watchIdRef.current });
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    router.push('/');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0F2233' }}>
        {/* Header */}
        <header className="safe-area-top" style={{ padding: '1rem 1.5rem' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (runState === 'running' || runState === 'paused') {
                  if (confirm('End run without saving?')) {
                    discardRun();
                  }
                } else {
                  router.push('/');
                }
              }}
              style={{ color: '#C9A75A', fontSize: '1rem', background: 'none', border: 'none' }}
            >
              ← Back
            </button>
            <span style={{ color: '#F5F1EA', fontSize: '1rem', fontWeight: 600 }}>
              Run
            </span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                color: voiceInterval !== 'off' ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                fontSize: '1.25rem',
                background: 'none',
                border: 'none',
              }}
            >
              🔊
            </button>
          </div>

          {/* Voice settings dropdown */}
          {showSettings && (
            <div style={{
              marginTop: '0.5rem',
              background: 'rgba(26, 53, 80, 0.9)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
            }}>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                Voice Updates
              </p>
              <div className="flex gap-2">
                {(['quarter', 'half', 'mile', 'off'] as VoiceInterval[]).map(interval => (
                  <button
                    key={interval}
                    onClick={() => {
                      setVoiceInterval(interval);
                      if (interval !== 'off') {
                        speak(`Voice updates every ${interval === 'quarter' ? 'quarter' : interval === 'half' ? 'half' : 'full'} mile`);
                      }
                      setShowSettings(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      background: voiceInterval === interval ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                      border: voiceInterval === interval ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                      color: voiceInterval === interval ? '#C9A75A' : '#F5F1EA',
                      fontSize: '0.75rem',
                    }}
                  >
                    {interval === 'quarter' ? '¼ mi' : interval === 'half' ? '½ mi' : interval === 'mile' ? '1 mi' : 'Off'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* GPS Status */}
        {gpsError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.5rem 1rem',
            color: '#EF4444',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}>
            {gpsError}
          </div>
        )}

        {gpsAccuracy !== null && runState === 'running' && (
          <div style={{
            background: gpsAccuracy < 20 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
            padding: '0.25rem 1rem',
            color: gpsAccuracy < 20 ? '#22C55E' : '#EAB308',
            fontSize: '0.75rem',
            textAlign: 'center',
          }}>
            GPS accuracy: ±{Math.round(gpsAccuracy)}m
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col p-6">
          {runState === 'finished' ? (
            /* FINISH SCREEN */
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">🏃</div>
              <h1 style={{
                fontFamily: 'var(--font-libre-baskerville)',
                fontSize: '2rem',
                color: '#F5F1EA',
                marginBottom: '0.5rem',
              }}>
                Run Complete!
              </h1>

              {/* Stats grid */}
              <div className="w-full max-w-sm mt-6 space-y-4">
                <div className="flex justify-between" style={{
                  background: 'rgba(201, 167, 90, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                }}>
                  <div>
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Distance</p>
                    <p style={{ color: '#F5F1EA', fontSize: '1.5rem', fontWeight: 600 }}>
                      {formatDistance(distance)} km
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Time</p>
                    <p style={{ color: '#F5F1EA', fontSize: '1.5rem', fontWeight: 600 }}>
                      {formatTime(elapsedTime)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between" style={{
                  background: 'rgba(201, 167, 90, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                }}>
                  <div>
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Avg Pace</p>
                    <p style={{ color: '#F5F1EA', fontSize: '1.5rem', fontWeight: 600 }}>
                      {formatPace(averagePace)} /km
                    </p>
                  </div>
                  {splits.length > 0 && (
                    <div className="text-right">
                      <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Best Split</p>
                      <p style={{ color: '#22C55E', fontSize: '1.5rem', fontWeight: 600 }}>
                        {formatPace(Math.min(...splits.map(s => s.pace_seconds_per_km)))} /km
                      </p>
                    </div>
                  )}
                </div>

                {/* Splits */}
                {splits.length > 0 && (
                  <div style={{
                    background: 'rgba(15, 34, 51, 0.5)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                  }}>
                    <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      Splits
                    </p>
                    {splits.map((split, i) => (
                      <div key={i} className="flex justify-between" style={{
                        padding: '0.25rem 0',
                        borderBottom: i < splits.length - 1 ? '1px solid rgba(245, 241, 234, 0.1)' : 'none',
                      }}>
                        <span style={{ color: '#F5F1EA', fontSize: '0.875rem' }}>
                          KM {split.km}
                        </span>
                        <span style={{ color: '#C9A75A', fontSize: '0.875rem' }}>
                          {formatPace(split.pace_seconds_per_km)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push('/')}
                className="btn-primary mt-8"
                style={{ minWidth: '200px' }}
              >
                Done
              </button>
            </div>
          ) : (
            /* ACTIVE RUN SCREEN */
            <div className="flex-1 flex flex-col">
              {/* Time - Big and centered */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <p style={{
                  color: 'rgba(245, 241, 234, 0.5)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.5rem',
                }}>
                  {runState === 'ready' ? 'Duration' : runState === 'paused' ? 'Paused' : 'Time'}
                </p>
                <div style={{
                  fontSize: '5rem',
                  fontWeight: 700,
                  color: runState === 'paused' ? '#C9A75A' : '#F5F1EA',
                  fontFamily: 'var(--font-geist-mono)',
                  lineHeight: 1,
                }}>
                  {formatTime(elapsedTime)}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex justify-around mb-8">
                <div className="text-center">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Distance
                  </p>
                  <p style={{ color: '#F5F1EA', fontSize: '2rem', fontWeight: 600 }}>
                    {formatDistance(distance)}
                  </p>
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>km</p>
                </div>

                <div className="text-center">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Pace
                  </p>
                  <p style={{ color: '#C9A75A', fontSize: '2rem', fontWeight: 600 }}>
                    {formatPace(runState === 'running' ? currentPace : averagePace)}
                  </p>
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>/km</p>
                </div>

                <div className="text-center">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Avg Pace
                  </p>
                  <p style={{ color: '#F5F1EA', fontSize: '2rem', fontWeight: 600 }}>
                    {formatPace(averagePace)}
                  </p>
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>/km</p>
                </div>
              </div>

              {/* Recent splits */}
              {splits.length > 0 && (
                <div style={{
                  background: 'rgba(15, 34, 51, 0.5)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                      Last Split (KM {splits[splits.length - 1].km})
                    </span>
                    <span style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600 }}>
                      {formatPace(splits[splits.length - 1].pace_seconds_per_km)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Bottom controls */}
        {runState !== 'finished' && (
          <div className="safe-area-bottom p-6">
            {runState === 'ready' ? (
              <button
                onClick={startRun}
                className="btn-primary w-full"
                style={{ fontSize: '1.5rem', padding: '1.5rem' }}
              >
                Start Run
              </button>
            ) : runState === 'running' ? (
              <div className="flex gap-4">
                <button
                  onClick={pauseRun}
                  style={{
                    flex: 1,
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '2px solid rgba(201, 167, 90, 0.3)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    color: '#C9A75A',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                  }}
                >
                  Pause
                </button>
                <button
                  onClick={finishRun}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '1.25rem', padding: '1.25rem' }}
                >
                  Finish
                </button>
              </div>
            ) : runState === 'paused' ? (
              <div className="flex gap-4">
                <button
                  onClick={discardRun}
                  style={{
                    flex: 1,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    color: '#EF4444',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={resumeRun}
                  style={{
                    flex: 1,
                    background: 'rgba(201, 167, 90, 0.1)',
                    border: '2px solid rgba(201, 167, 90, 0.3)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    color: '#C9A75A',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Resume
                </button>
                <button
                  onClick={finishRun}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '1rem', padding: '1.25rem' }}
                >
                  Finish
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
