'use client';

import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { BodyMap } from '@/components/BodyMap';

// Mock muscle strength data - derived from workout history
const muscleStrengthData = [
  { id: 'chest', name: 'Chest', strength: 78, volume: '12.4k', lastTrained: '2 days', trend: 'up' as const },
  { id: 'shoulders', name: 'Shoulders', strength: 55, volume: '6.2k', lastTrained: '2 days', trend: 'stable' as const },
  { id: 'biceps', name: 'Biceps', strength: 72, volume: '4.8k', lastTrained: '4 days', trend: 'up' as const },
  { id: 'triceps', name: 'Triceps', strength: 68, volume: '5.1k', lastTrained: '2 days', trend: 'up' as const },
  { id: 'forearms', name: 'Forearms', strength: 45, volume: '2.1k', lastTrained: '4 days', trend: 'stable' as const },
  { id: 'core', name: 'Core', strength: 52, volume: '3.2k', lastTrained: '3 days', trend: 'stable' as const },
  { id: 'quads', name: 'Quads', strength: 35, volume: '4.5k', lastTrained: '8 days', trend: 'down' as const },
  { id: 'hamstrings', name: 'Hamstrings', strength: 28, volume: '2.8k', lastTrained: '8 days', trend: 'down' as const },
  { id: 'glutes', name: 'Glutes', strength: 32, volume: '3.1k', lastTrained: '8 days', trend: 'down' as const },
  { id: 'calves', name: 'Calves', strength: 22, volume: '1.2k', lastTrained: '2 weeks', trend: 'down' as const },
  { id: 'lats', name: 'Lats', strength: 70, volume: '8.2k', lastTrained: '4 days', trend: 'up' as const },
  { id: 'upper_back', name: 'Upper Back', strength: 65, volume: '6.8k', lastTrained: '4 days', trend: 'stable' as const },
  { id: 'traps', name: 'Traps', strength: 58, volume: '3.4k', lastTrained: '4 days', trend: 'stable' as const },
  { id: 'rear_delts', name: 'Rear Delts', strength: 42, volume: '1.8k', lastTrained: '4 days', trend: 'stable' as const },
  { id: 'lower_back', name: 'Lower Back', strength: 60, volume: '4.2k', lastTrained: '5 days', trend: 'stable' as const },
];

// Mock saved workouts
const savedWorkouts = [
  { id: '1', name: 'Upper Body Push', lastRun: '2 days ago', exercises: 5, duration: 45 },
  { id: '2', name: 'Pull Day', lastRun: '4 days ago', exercises: 6, duration: 50 },
  { id: '3', name: 'Leg Day', lastRun: '1 week ago', exercises: 5, duration: 55 },
];

// Mock workout history
const recentWorkouts = [
  { id: '1', name: 'Upper Body Push', date: 'Jan 6', duration: 47, volume: 12450 },
  { id: '2', name: 'Pull Day', date: 'Jan 4', duration: 52, volume: 14200 },
  { id: '3', name: 'Leg Day', date: 'Jan 2', duration: 58, volume: 18600 },
  { id: '4', name: 'Upper Body Push', date: 'Dec 30', duration: 44, volume: 11800 },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'body' | 'saved' | 'history' | 'settings'>('body');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F2233' }}>
      {/* Header */}
      <header
        className="safe-area-top"
        style={{
          background: '#1A3550',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/'}
            style={{ color: '#C9A75A', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            ← Back
          </button>
          <span style={{ color: '#F5F1EA', fontWeight: 600 }}>Profile</span>
          <div style={{ width: '48px' }} />
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b" style={{ borderColor: 'rgba(201, 167, 90, 0.1)' }}>
        {(['body', 'saved', 'history', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #C9A75A' : '2px solid transparent',
              color: activeTab === tab ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'body' ? 'Body' : tab === 'saved' ? 'Saved' : tab === 'history' ? 'History' : 'Settings'}
          </button>
        ))}
      </div>

      <main className="p-4 pb-24">
        {activeTab === 'body' && (
          <div>
            {/* Imbalance Alert */}
            <div
              style={{
                background: 'rgba(251, 146, 60, 0.1)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
              }}
            >
              <div className="flex items-start gap-2">
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <div>
                  <p style={{ color: '#FB923C', fontWeight: 500, fontSize: '0.875rem' }}>
                    Leg day needed!
                  </p>
                  <p style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.75rem' }}>
                    Your lower body is lagging behind. Quads, hamstrings, and calves haven't been trained in over a week.
                  </p>
                </div>
              </div>
            </div>

            {/* Body Map */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Muscle Balance
                </h2>
                {/* Gender Toggle */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setGender('male')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.6875rem',
                      background: gender === 'male' ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                      border: gender === 'male' ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                      color: gender === 'male' ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                    }}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.6875rem',
                      background: gender === 'female' ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                      border: gender === 'female' ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                      color: gender === 'female' ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                    }}
                  >
                    Female
                  </button>
                </div>
              </div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                Tap a muscle to see details. Colors show relative strength based on your training history.
              </p>
              <BodyMap
                gender={gender}
                muscleData={muscleStrengthData}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="card text-center">
                <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.6875rem' }}>Strongest</p>
                <p style={{ color: '#4ADE80', fontWeight: 600, fontSize: '1rem' }}>Chest</p>
                <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.6875rem' }}>78% strength score</p>
              </div>
              <div className="card text-center">
                <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.6875rem' }}>Needs Work</p>
                <p style={{ color: '#F87171', fontWeight: 600, fontSize: '1rem' }}>Calves</p>
                <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.6875rem' }}>22% strength score</p>
              </div>
            </div>

            {/* AI Suggestion */}
            <div
              className="card mt-4"
              style={{ background: 'rgba(201, 167, 90, 0.05)', border: '1px solid rgba(201, 167, 90, 0.2)' }}
            >
              <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                AI Recommendation
              </h3>
              <p style={{ color: 'rgba(245, 241, 234, 0.7)', fontSize: '0.8125rem' }}>
                Based on your muscle balance, your next workout should focus on <span style={{ color: '#F5F1EA', fontWeight: 500 }}>legs and glutes</span>.
                Consider adding an extra leg day this week to address the imbalance.
              </p>
              <button
                className="btn-primary w-full mt-3"
                style={{ fontSize: '0.875rem', padding: '0.75rem' }}
              >
                Generate Leg Workout
              </button>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-3">
            <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Workouts you've bookmarked to run again
            </p>
            {savedWorkouts.map(workout => (
              <div
                key={workout.id}
                className="card flex items-center justify-between"
              >
                <div>
                  <h3 style={{ color: '#F5F1EA', fontSize: '1rem', fontWeight: 500 }}>
                    {workout.name}
                  </h3>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                    {workout.exercises} exercises • ~{workout.duration} min • Last run {workout.lastRun}
                  </p>
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Your recent workouts
            </p>
            {recentWorkouts.map(workout => (
              <div
                key={workout.id}
                className="card"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 style={{ color: '#F5F1EA', fontSize: '1rem', fontWeight: 500 }}>
                    {workout.name}
                  </h3>
                  <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                    {workout.date}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span style={{ color: '#C9A75A', fontSize: '1rem', fontWeight: 600 }}>{workout.duration}</span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}> min</span>
                  </div>
                  <div>
                    <span style={{ color: '#C9A75A', fontSize: '1rem', fontWeight: 600 }}>{(workout.volume / 1000).toFixed(1)}k</span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}> lbs volume</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Basic Info
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'rgba(245, 241, 234, 0.7)' }}>Age</span>
                  <span style={{ color: '#F5F1EA', fontWeight: 500 }}>32</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'rgba(245, 241, 234, 0.7)' }}>Height</span>
                  <span style={{ color: '#F5F1EA', fontWeight: 500 }}>5'10"</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'rgba(245, 241, 234, 0.7)' }}>Weight</span>
                  <span style={{ color: '#F5F1EA', fontWeight: 500 }}>180 lbs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'rgba(245, 241, 234, 0.7)' }}>Experience</span>
                  <span style={{ color: '#F5F1EA', fontWeight: 500 }}>Intermediate</span>
                </div>
              </div>
            </div>

            {/* Weight Goal */}
            <div className="card">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Weight Goal
              </h2>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.6875rem', marginBottom: '0.25rem' }}>Start</p>
                  <span style={{ color: '#F5F1EA', fontSize: '1.25rem', fontWeight: 600 }}>185</span>
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}> lbs</span>
                </div>
                <div style={{ color: '#C9A75A', fontSize: '1.5rem' }}>→</div>
                <div className="text-center flex-1">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.6875rem', marginBottom: '0.25rem' }}>Current</p>
                  <span style={{ color: '#C9A75A', fontSize: '1.25rem', fontWeight: 600 }}>180.6</span>
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}> lbs</span>
                </div>
                <div style={{ color: '#C9A75A', fontSize: '1.5rem' }}>→</div>
                <div className="text-center flex-1">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.6875rem', marginBottom: '0.25rem' }}>Target</p>
                  <span style={{ color: '#F5F1EA', fontSize: '1.25rem', fontWeight: 600 }}>175</span>
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}> lbs</span>
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(201, 167, 90, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1rem' }}>📉</span>
                <span style={{ color: 'rgba(245, 241, 234, 0.7)', fontSize: '0.8125rem' }}>
                  Lose weight (cut) — AI will factor recovery needs
                </span>
              </div>
            </div>

            {/* Training Goals */}
            <div className="card">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Training Goals
              </h2>
              <div className="flex flex-wrap gap-2">
                {['Hypertrophy', 'Strength'].map(goal => (
                  <span
                    key={goal}
                    style={{
                      background: 'rgba(201, 167, 90, 0.2)',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      borderRadius: '2rem',
                      padding: '0.5rem 1rem',
                      color: '#C9A75A',
                      fontSize: '0.875rem',
                    }}
                  >
                    {goal}
                  </span>
                ))}
              </div>
              <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                Primary: Hypertrophy (8-12 rep ranges) • Secondary: Strength (lower reps, heavier)
              </p>
            </div>

            {/* Injuries & Limitations */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Injuries & Limitations
                </h2>
                <button style={{ color: '#C9A75A', background: 'none', border: 'none', fontSize: '1.5rem' }}>
                  +
                </button>
              </div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                AI will suggest alternatives that work the same muscles without aggravating these areas
              </p>

              {/* Injury Card */}
              <div
                style={{
                  background: 'rgba(15, 34, 51, 0.5)',
                  border: '1px solid rgba(201, 167, 90, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '1.25rem' }}>🦴</span>
                    <div>
                      <h3 style={{ color: '#F5F1EA', fontSize: '0.9375rem', fontWeight: 500 }}>
                        Right Shoulder
                      </h3>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          color: '#EAB308',
                          background: 'rgba(234, 179, 8, 0.1)',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '1rem',
                        }}
                      >
                        Moderate
                      </span>
                    </div>
                  </div>
                  <button style={{ color: 'rgba(245, 241, 234, 0.3)', background: 'none', border: 'none' }}>
                    ✕
                  </button>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    Movements to avoid:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['Overhead Press', 'Behind-neck Press', 'Upright Rows'].map(movement => (
                      <span
                        key={movement}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '0.375rem',
                          padding: '0.25rem 0.5rem',
                          color: '#F87171',
                          fontSize: '0.6875rem',
                        }}
                      >
                        {movement}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    AI will substitute with:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['Landmine Press', 'Cable Lateral Raises', 'Face Pulls'].map(movement => (
                      <span
                        key={movement}
                        style={{
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderRadius: '0.375rem',
                          padding: '0.25rem 0.5rem',
                          color: '#4ADE80',
                          fontSize: '0.6875rem',
                        }}
                      >
                        {movement}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="card">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Equipment
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: '#F5F1EA', fontSize: '0.875rem' }}>🏠 Home Gym</span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>8 items</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['Dumbbells', 'Barbell', 'Bench', 'Pull-up Bar', 'Bands'].map(item => (
                      <span
                        key={item}
                        style={{
                          background: 'rgba(201, 167, 90, 0.1)',
                          borderRadius: '0.375rem',
                          padding: '0.25rem 0.5rem',
                          color: 'rgba(245, 241, 234, 0.7)',
                          fontSize: '0.6875rem',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                    <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.6875rem', padding: '0.25rem' }}>
                      +3 more
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: '#F5F1EA', fontSize: '0.875rem' }}>🏋️ Gym</span>
                    <span style={{ color: '#4ADE80', fontSize: '0.75rem' }}>Full access</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PRs */}
            <div className="card">
              <h2 style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Personal Records
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { lift: 'Bench', weight: 225, reps: 1 },
                  { lift: 'Squat', weight: 275, reps: 1 },
                  { lift: 'Deadlift', weight: 315, reps: 1 },
                  { lift: 'OHP', weight: 135, reps: 1 },
                ].map(pr => (
                  <div
                    key={pr.lift}
                    style={{
                      background: 'rgba(15, 34, 51, 0.5)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>{pr.lift}</div>
                    <div style={{ color: '#C9A75A', fontSize: '1.25rem', fontWeight: 700 }}>{pr.weight}</div>
                    <div style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.6875rem' }}>× {pr.reps}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-area-bottom"
        style={{
          background: '#1A3550',
          borderTop: '1px solid rgba(201, 167, 90, 0.1)',
        }}
      >
        <div className="flex justify-around py-3">
          {[
            { icon: '🏋️', label: 'Workout', href: '/' },
            { icon: '📊', label: 'Progress', href: '/progress' },
            { icon: '📚', label: 'Library', href: '/library' },
            { icon: '👤', label: 'Profile', href: '/profile', active: true },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => window.location.href = item.href}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span style={{ fontSize: '1.25rem', opacity: item.active ? 1 : 0.5 }}>{item.icon}</span>
              <span style={{ fontSize: '0.625rem', color: item.active ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
