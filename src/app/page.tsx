'use client';

import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { AuthGuard } from '@/components/AuthGuard';
import { Onboarding } from '@/components/Onboarding';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useSupabase';

// Mock data for the demo
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

const mockWorkout = {
  name: 'Upper Body Push',
  duration: 45,
  exercises: [
    { name: 'Bench Press', sets: 4, reps: '8-10', weight: '165 lbs', rest: 90 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: '50 lbs', rest: 75 },
    { name: 'Overhead Press', sets: 3, reps: '8-10', weight: '95 lbs', rest: 90 },
    { name: 'Lateral Raises', sets: 3, reps: '12-15', weight: '20 lbs', rest: 60 },
    { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', weight: '40 lbs', rest: 60 },
    { name: 'Dips', sets: 3, reps: 'AMRAP', weight: 'BW', rest: 90 },
  ],
};

export default function Home() {
  const { profile, loading: profileLoading, isProfileComplete, refetch: refetchProfile } = useProfile();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [duration, setDuration] = useState(45);
  const [showWorkout, setShowWorkout] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowWorkout(true);
    }, 1500);
  };

  const canGenerate = selectedLocation && selectedMuscles.length > 0;

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
                    onClick={() => setSelectedLocation(loc.id)}
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
        ) : (
          /* Workout Display */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowWorkout(false)}
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

            <div className="card mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2
                  style={{
                    fontFamily: 'var(--font-libre-baskerville)',
                    fontSize: '1.5rem',
                    color: '#F5F1EA',
                  }}
                >
                  {mockWorkout.name}
                </h2>
                <span style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.875rem' }}>
                  ~{mockWorkout.duration} min
                </span>
              </div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                {mockWorkout.exercises.length} exercises • Push focus
              </p>
            </div>

            <div className="space-y-3">
              {mockWorkout.exercises.map((exercise, i) => (
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
                      {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#C9A75A', fontSize: '0.75rem' }}>
                      {exercise.rest}s rest
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-primary w-full mt-6"
              style={{ fontSize: '1.125rem' }}
            >
              Start Workout
            </button>
          </div>
        )}
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
    </div>
    )}
    </AuthGuard>
  );
}
