'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { AuthGuard } from '@/components/AuthGuard';
import { Onboarding } from '@/components/Onboarding';
import { useAuth } from '@/context/AuthContext';
import { useProfile, useInjuries, useEquipment, useGymProfiles } from '@/hooks/useSupabase';
import { generateWorkout, generateWorkoutLocal, type GeneratedWorkout } from '@/lib/generateWorkout';
import { Settings } from '@/components/Settings';
import { GymManager } from '@/components/GymManager';
import type { GymProfile } from '@/lib/supabase/types';

const muscleGroups = [
  { id: 'chest', name: 'Chest', icon: '💪' },
  { id: 'back', name: 'Back', icon: '🔙' },
  { id: 'shoulders', name: 'Shoulders', icon: '🎯' },
  { id: 'arms', name: 'Arms', icon: '💪' },
  { id: 'legs', name: 'Legs', icon: '🦵' },
  { id: 'core', name: 'Core', icon: '🔥' },
];

const locations = [
  { id: 'gym', name: 'Gym', icon: '🏋️' },
  { id: 'home', name: 'Home', icon: '🏠' },
  { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading, isProfileComplete, refetch: refetchProfile } = useProfile();
  const { injuries } = useInjuries();
  const { userEquipment, allEquipment } = useEquipment();
  const { profiles: gymProfiles, getDefaultProfile } = useGymProfiles();

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedGym, setSelectedGym] = useState<GymProfile | null>(null);
  const [showGymManager, setShowGymManager] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [duration, setDuration] = useState(45);
  const [showWorkout, setShowWorkout] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [debugInfo, setDebugInfo] = useState<object | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!user || !selectedLocation) return;

    setGenerating(true);
    setError(null);

    try {
      // Get equipment based on location
      let locationEquipment: string[] = [];
      let customEquipmentList: string[] = profile?.custom_equipment || [];

      if (selectedLocation === 'gym' && selectedGym) {
        // Use selected gym's equipment
        locationEquipment = selectedGym.equipment_ids
          .map(id => allEquipment.find(eq => eq.id === id)?.name || '')
          .filter(Boolean);
        customEquipmentList = [...customEquipmentList, ...(selectedGym.custom_equipment || [])];
      } else if (selectedLocation === 'home') {
        // Use home equipment
        locationEquipment = userEquipment
          .filter(e => e.location === 'home')
          .map(e => {
            const eq = allEquipment.find(a => a.id === e.equipment_id);
            return eq?.name || '';
          })
          .filter(Boolean);
      }
      // For outdoor, we use minimal/no equipment

      // Format injuries for the request
      const formattedInjuries = injuries.map(i => ({
        bodyPart: i.body_part,
        movementsToAvoid: i.movements_to_avoid || [],
      }));

      // Try AI-powered Edge Function first, fall back to local generation
      const workoutRequest = {
        userId: user.id,
        location: selectedLocation as 'gym' | 'home' | 'outdoor',
        targetMuscles: selectedMuscles,
        duration,
        experienceLevel: profile?.experience_level || 'intermediate',
        injuries: formattedInjuries,
        equipment: locationEquipment,
        customEquipment: customEquipmentList,
        gymName: selectedGym?.name,
      };

      // Save debug info for inspection
      setDebugInfo({
        request: workoutRequest,
        timestamp: new Date().toISOString(),
      });
      console.log('🏋️ Workout Request:', JSON.stringify(workoutRequest, null, 2));

      let workout: GeneratedWorkout;
      let usedAI = false;
      try {
        workout = await generateWorkout(workoutRequest);
        usedAI = true;
      } catch (edgeFnError) {
        console.warn('Edge function failed, using local generation:', edgeFnError);
        workout = await generateWorkoutLocal(workoutRequest);
      }

      // Update debug info with response
      setDebugInfo(prev => ({
        ...prev,
        response: workout,
        usedAI,
      }));

      setGeneratedWorkout(workout);
      setShowWorkout(true);
    } catch (err) {
      console.error('Failed to generate workout:', err);
      setError('Failed to generate workout. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartWorkout = () => {
    if (generatedWorkout) {
      // Store workout in sessionStorage for the workout page
      sessionStorage.setItem('currentWorkout', JSON.stringify(generatedWorkout));
      router.push('/workout');
    }
  };

  const canGenerate = selectedLocation && selectedMuscles.length > 0 &&
    (selectedLocation !== 'gym' || selectedGym !== null);

  // Show onboarding for new users
  const needsOnboarding = !profileLoading && !isProfileComplete;

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refetchProfile();
  };

  return (
    <AuthGuard>
    {needsOnboarding || showOnboarding ? (
      <Onboarding onComplete={handleOnboardingComplete} />
    ) : (
    <div className="min-h-screen" style={{ backgroundColor: '#0F2233' }}>
      {/* Header */}
      <header
        className="safe-area-top"
        style={{
          background: 'linear-gradient(180deg, #1A3550 0%, #0F2233 100%)',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
        }}
      >
        <div className="flex items-center justify-between">
          <Logo size="lg" />
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'rgba(201, 167, 90, 0.1)',
              border: '1px solid rgba(201, 167, 90, 0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="p-4 pb-24">
        {!showWorkout ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-8 animate-fade-in">
              <h1
                style={{
                  fontFamily: 'var(--font-libre-baskerville)',
                  fontSize: '1.75rem',
                  color: '#F5F1EA',
                  marginBottom: '0.5rem',
                }}
              >
                Ready to train?
              </h1>
              <p style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.9rem' }}>
                Your AI training partner is ready to build your workout
              </p>
            </div>

            {/* Location Selector */}
            <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Where are you?
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc.id);
                      // Auto-select default gym when gym is selected
                      if (loc.id === 'gym') {
                        setSelectedGym(getDefaultProfile() || null);
                      } else {
                        setSelectedGym(null);
                      }
                    }}
                    style={{
                      background: selectedLocation === loc.id ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                      border: selectedLocation === loc.id ? '2px solid #C9A75A' : '2px solid rgba(201, 167, 90, 0.1)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{loc.icon}</div>
                    <div style={{ color: '#F5F1EA', fontSize: '0.875rem' }}>{loc.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gym Selector - Only show when gym location selected */}
            {selectedLocation === 'gym' && (
              <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Which gym?
                  </h2>
                  <button
                    onClick={() => setShowGymManager(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#C9A75A',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Manage Gyms
                  </button>
                </div>

                {gymProfiles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {gymProfiles.map(gym => (
                      <button
                        key={gym.id}
                        onClick={() => setSelectedGym(gym)}
                        style={{
                          background: selectedGym?.id === gym.id ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                          border: selectedGym?.id === gym.id ? '2px solid #C9A75A' : '2px solid rgba(201, 167, 90, 0.1)',
                          borderRadius: '0.75rem',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ color: '#F5F1EA', fontSize: '0.9rem', fontWeight: 500 }}>
                            {gym.name}
                            {gym.is_default && (
                              <span style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.625rem',
                                background: '#C9A75A',
                                color: '#0F2233',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                fontWeight: 600,
                              }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.7rem' }}>
                            {(gym.equipment_ids?.length || 0) + (gym.custom_equipment?.length || 0)} equipment items
                          </div>
                        </div>
                        {selectedGym?.id === gym.id && (
                          <span style={{ color: '#C9A75A', fontSize: '1.25rem' }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowGymManager(true)}
                    style={{
                      width: '100%',
                      padding: '1.5rem',
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '2px dashed rgba(201, 167, 90, 0.3)',
                      borderRadius: '0.75rem',
                      color: '#C9A75A',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Your First Gym
                  </button>
                )}
              </div>
            )}

            {/* Muscle Group Selector */}
            <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                What do you want to hit?
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {muscleGroups.map(muscle => (
                  <button
                    key={muscle.id}
                    onClick={() => toggleMuscle(muscle.id)}
                    style={{
                      background: selectedMuscles.includes(muscle.id) ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                      border: selectedMuscles.includes(muscle.id) ? '2px solid #C9A75A' : '2px solid rgba(201, 167, 90, 0.1)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.125rem' }}>{muscle.icon}</div>
                    <div style={{ color: '#F5F1EA', fontSize: '0.75rem' }}>{muscle.name}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedMuscles(['chest', 'back', 'shoulders', 'arms', 'legs', 'core'])}
                style={{
                  marginTop: '0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#C9A75A',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Select all (Full body)
              </button>
            </div>

            {/* Duration Selector */}
            <div className="card mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                How long do you have?
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="15"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: '#C9A75A',
                    height: '4px',
                  }}
                />
                <span style={{ color: '#F5F1EA', fontSize: '1.25rem', fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                  {duration} min
                </span>
              </div>
              <div className="flex justify-between mt-2" style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                <span>Quick</span>
                <span>Full session</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="animate-fade-in mb-4 p-3"
                style={{
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid #F87171',
                  borderRadius: '0.5rem',
                  color: '#F87171',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="btn-primary w-full animate-fade-in"
              style={{
                animationDelay: '0.4s',
                opacity: canGenerate ? 1 : 0.5,
                cursor: canGenerate ? 'pointer' : 'not-allowed',
              }}
            >
              {generating ? (
                <span className="animate-pulse">Generating your workout...</span>
              ) : (
                'Generate Workout'
              )}
            </button>
          </>
        ) : generatedWorkout ? (
          /* Workout Display */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setShowWorkout(false);
                  setGeneratedWorkout(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#C9A75A',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                ← Back
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowDebug(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(100, 100, 100, 0.3)',
                    color: 'rgba(245, 241, 234, 0.4)',
                    fontSize: '0.75rem',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                  title="View AI Request"
                >
                  🔍
                </button>
                <button
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    color: '#C9A75A',
                    fontSize: '0.75rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  Save Template
                </button>
              </div>
            </div>

            <div className="card mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2
                  style={{
                    fontFamily: 'var(--font-libre-baskerville)',
                    fontSize: '1.5rem',
                    color: '#F5F1EA',
                  }}
                >
                  {generatedWorkout.name}
                </h2>
                <span style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.875rem' }}>
                  ~{generatedWorkout.duration} min
                </span>
              </div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                {generatedWorkout.exercises.length} exercises • {generatedWorkout.workoutType} focus
              </p>
            </div>

            <div className="space-y-3">
              {generatedWorkout.exercises.map((exercise, i) => (
                <div
                  key={i}
                  className="card animate-fade-in"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '0.75rem',
                      background: 'rgba(201, 167, 90, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      color: '#C9A75A',
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#F5F1EA', fontSize: '1rem', fontWeight: 500 }}>
                      {exercise.name}
                    </h3>
                    <p style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.75rem' }}>
                      {exercise.sets} sets x {exercise.reps} reps
                    </p>
                    {exercise.notes && (
                      <p style={{ color: 'rgba(201, 167, 90, 0.6)', fontSize: '0.625rem', marginTop: '0.25rem' }}>
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#C9A75A', fontSize: '0.75rem' }}>
                      {exercise.restSeconds}s rest
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartWorkout}
              className="btn-primary w-full mt-6"
              style={{ fontSize: '1.125rem' }}
            >
              Start Workout
            </button>
          </div>
        ) : null}
      </main>

      {/* Bottom Nav Mock */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-area-bottom"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #0F2233 20%)',
          paddingTop: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#1A3550',
            borderTop: '1px solid rgba(201, 167, 90, 0.1)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '0.75rem 0',
          }}
        >
          {[
            { icon: '🏋️', label: 'Workout', active: true },
            { icon: '📊', label: 'Progress', active: false },
            { icon: '📚', label: 'Library', active: false },
            { icon: '👤', label: 'Profile', active: false },
          ].map(item => (
            <button
              key={item.label}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '1.25rem', opacity: item.active ? 1 : 0.5 }}>
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  color: item.active ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                  fontWeight: item.active ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <GymManager isOpen={showGymManager} onClose={() => setShowGymManager(false)} />

      {/* Debug Modal */}
      {showDebug && debugInfo && (
        <div
          onClick={() => setShowDebug(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#1A3550',
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(201, 167, 90, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ color: '#F5F1EA', margin: 0, fontSize: '1rem' }}>
                🔍 AI Request Debug
              </h3>
              <button
                onClick={() => setShowDebug(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F5F1EA',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '1rem',
              overflow: 'auto',
              flex: 1,
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: (debugInfo as any).usedAI ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: (debugInfo as any).usedAI ? '#10b981' : '#f59e0b',
                }}>
                  {(debugInfo as any).usedAI ? '✓ Used AI (Edge Function)' : '⚡ Used Local Generation'}
                </span>
              </div>
              <pre style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.7rem',
                color: '#F5F1EA',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
    )}
    </AuthGuard>
  );
}
