'use client';

import { useState } from 'react';

// Detailed lift history - this is what AI references
const liftDatabase = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
    pr: { weight: 225, reps: 1, date: 'Jan 4' },
    estimated1RM: 225,
    lastWorkout: {
      date: 'Jan 6',
      sets: [
        { weight: 165, reps: 8 },
        { weight: 165, reps: 8 },
        { weight: 165, reps: 7 },
        { weight: 155, reps: 10 },
      ],
    },
    history: [
      { date: 'Jan 6', topSet: '165×8', volume: 5240, e1rm: 203 },
      { date: 'Jan 2', topSet: '170×7', volume: 4960, e1rm: 204 },
      { date: 'Dec 28', topSet: '165×8', volume: 5100, e1rm: 203 },
      { date: 'Dec 23', topSet: '160×9', volume: 4880, e1rm: 203 },
      { date: 'Dec 19', topSet: '155×10', volume: 4650, e1rm: 201 },
      { date: 'Dec 14', topSet: '155×9', volume: 4500, e1rm: 196 },
    ],
    trend: 'up', // AI sees you're progressing
    avgRestDays: 4,
    preferredRepRange: '8-10',
    notes: 'Responds well to moderate volume. Stalled at 170, dropped to 165 for more reps.',
  },
  {
    id: 'squat',
    name: 'Squat',
    muscleGroups: ['Quads', 'Glutes', 'Hamstrings'],
    pr: { weight: 275, reps: 1, date: 'Dec 28' },
    estimated1RM: 275,
    lastWorkout: {
      date: 'Jan 5',
      sets: [
        { weight: 225, reps: 5 },
        { weight: 225, reps: 5 },
        { weight: 225, reps: 5 },
        { weight: 225, reps: 4 },
      ],
    },
    history: [
      { date: 'Jan 5', topSet: '225×5', volume: 4275, e1rm: 253 },
      { date: 'Jan 1', topSet: '225×5', volume: 4500, e1rm: 253 },
      { date: 'Dec 28', topSet: '275×1', volume: 3850, e1rm: 275 },
      { date: 'Dec 23', topSet: '235×4', volume: 4200, e1rm: 256 },
    ],
    trend: 'stable',
    avgRestDays: 5,
    preferredRepRange: '5-6',
    notes: 'Lower rep preference. Hit PR recently, now building volume base.',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroups: ['Back', 'Hamstrings', 'Glutes'],
    pr: { weight: 315, reps: 1, date: 'Jan 2' },
    estimated1RM: 315,
    lastWorkout: {
      date: 'Jan 4',
      sets: [
        { weight: 275, reps: 5 },
        { weight: 275, reps: 5 },
        { weight: 275, reps: 4 },
      ],
    },
    history: [
      { date: 'Jan 4', topSet: '275×5', volume: 3850, e1rm: 309 },
      { date: 'Jan 2', topSet: '315×1', volume: 2835, e1rm: 315 },
      { date: 'Dec 29', topSet: '285×4', volume: 3420, e1rm: 311 },
    ],
    trend: 'up',
    avgRestDays: 5,
    preferredRepRange: '3-5',
    notes: 'PR! Pushing hard. May need deload soon.',
  },
  {
    id: 'ohp',
    name: 'Overhead Press',
    muscleGroups: ['Shoulders', 'Triceps'],
    pr: { weight: 135, reps: 1, date: 'Dec 20' },
    estimated1RM: 135,
    lastWorkout: {
      date: 'Jan 6',
      sets: [
        { weight: 95, reps: 8 },
        { weight: 95, reps: 7 },
        { weight: 95, reps: 6 },
      ],
    },
    history: [
      { date: 'Jan 6', topSet: '95×8', volume: 1995, e1rm: 117 },
      { date: 'Jan 1', topSet: '100×6', volume: 1800, e1rm: 116 },
      { date: 'Dec 27', topSet: '95×8', volume: 1900, e1rm: 117 },
    ],
    trend: 'stable',
    avgRestDays: 5,
    preferredRepRange: '6-8',
    notes: 'User has shoulder injury - using lighter weights, higher reps. Avoid behind-neck.',
  },
];

export default function LibraryPage() {
  const [selectedLift, setSelectedLift] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const lift = liftDatabase.find(l => l.id === selectedLift);
  const filteredLifts = liftDatabase.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.muscleGroups.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            onClick={() => selectedLift ? setSelectedLift(null) : window.location.href = '/'}
            style={{ color: '#C9A75A', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            ← {selectedLift ? 'Back' : 'Home'}
          </button>
          <span style={{ color: '#F5F1EA', fontWeight: 600 }}>
            {selectedLift ? lift?.name : 'Exercise Library'}
          </span>
          <div style={{ width: '48px' }} />
        </div>
      </header>

      <main className="p-4 pb-24">
        {!selectedLift ? (
          <>
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(26, 53, 80, 0.5)',
                  border: '1px solid rgba(201, 167, 90, 0.2)',
                  color: '#F5F1EA',
                  fontSize: '0.9375rem',
                }}
              />
            </div>

            {/* Info Banner */}
            <div
              style={{
                background: 'rgba(201, 167, 90, 0.1)',
                border: '1px solid rgba(201, 167, 90, 0.2)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
              }}
            >
              <p style={{ color: 'rgba(245, 241, 234, 0.7)', fontSize: '0.8125rem' }}>
                <span style={{ color: '#C9A75A' }}>AI uses this data</span> to suggest weights and track your progress over time.
              </p>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              {filteredLifts.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLift(l.id)}
                  className="card w-full text-left"
                  style={{ display: 'block' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 style={{ color: '#F5F1EA', fontSize: '1rem', fontWeight: 500 }}>
                        {l.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {l.muscleGroups.map(g => (
                          <span
                            key={g}
                            style={{
                              background: 'rgba(201, 167, 90, 0.1)',
                              borderRadius: '0.25rem',
                              padding: '0.125rem 0.375rem',
                              color: 'rgba(245, 241, 234, 0.6)',
                              fontSize: '0.625rem',
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: '#C9A75A', fontSize: '1.125rem', fontWeight: 700 }}>
                        {l.pr.weight}
                      </div>
                      <div style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.625rem' }}>
                        PR
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                      Last: {l.lastWorkout.date} • {l.history[0].topSet}
                    </span>
                    <span style={{
                      color: l.trend === 'up' ? '#4ADE80' : l.trend === 'down' ? '#F87171' : '#C9A75A',
                      fontSize: '0.75rem',
                    }}>
                      {l.trend === 'up' ? '↑ Progressing' : l.trend === 'down' ? '↓ Declining' : '→ Stable'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : lift && (
          <>
            {/* Lift Detail View */}

            {/* PR Card */}
            <div className="card mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Personal Record</p>
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontSize: '3rem', fontWeight: 700, color: '#C9A75A' }}>
                      {lift.pr.weight}
                    </span>
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)' }}>lbs × {lift.pr.reps}</span>
                  </div>
                  <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem' }}>
                    Set on {lift.pr.date}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Est. 1RM</p>
                  <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#F5F1EA' }}>
                    {lift.estimated1RM}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Context Card */}
            <div
              className="card mb-4"
              style={{ background: 'rgba(201, 167, 90, 0.05)', border: '1px solid rgba(201, 167, 90, 0.2)' }}
            >
              <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                What AI Knows
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Trend</span>
                  <p style={{ color: lift.trend === 'up' ? '#4ADE80' : '#F5F1EA', fontWeight: 500 }}>
                    {lift.trend === 'up' ? '↑ Progressing' : lift.trend === 'down' ? '↓ Needs attention' : '→ Stable'}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Avg Rest</span>
                  <p style={{ color: '#F5F1EA', fontWeight: 500 }}>{lift.avgRestDays} days</p>
                </div>
                <div>
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Preferred Reps</span>
                  <p style={{ color: '#F5F1EA', fontWeight: 500 }}>{lift.preferredRepRange}</p>
                </div>
                <div>
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>Sessions</span>
                  <p style={{ color: '#F5F1EA', fontWeight: 500 }}>{lift.history.length} logged</p>
                </div>
              </div>
              {lift.notes && (
                <p style={{ color: 'rgba(245, 241, 234, 0.6)', fontSize: '0.8125rem', marginTop: '0.75rem', fontStyle: 'italic' }}>
                  "{lift.notes}"
                </p>
              )}
            </div>

            {/* Last Workout */}
            <div className="card mb-4">
              <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Last Workout — {lift.lastWorkout.date}
              </h3>
              <div className="space-y-2">
                {lift.lastWorkout.sets.map((set, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(15, 34, 51, 0.5)',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>
                      Set {i + 1}
                    </span>
                    <span style={{ color: '#F5F1EA', fontWeight: 500 }}>
                      {set.weight} × {set.reps}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                AI will suggest starting at <span style={{ color: '#C9A75A' }}>{lift.lastWorkout.sets[0].weight + 5} lbs</span> next time (progressive overload)
              </p>
            </div>

            {/* History Chart - Estimated 1RM over time */}
            <div className="card mb-4">
              <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Strength Progress (Est. 1RM)
              </h3>
              <div style={{ height: '100px', display: 'flex', alignItems: 'end', gap: '8px', padding: '0 4px' }}>
                {[...lift.history].reverse().map((h, i) => {
                  const maxE1rm = Math.max(...lift.history.map(x => x.e1rm));
                  const minE1rm = Math.min(...lift.history.map(x => x.e1rm)) - 10;
                  const height = ((h.e1rm - minE1rm) / (maxE1rm - minE1rm)) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span style={{ color: '#C9A75A', fontSize: '0.625rem', marginBottom: '4px' }}>
                        {h.e1rm}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(height, 10)}%`,
                          background: i === lift.history.length - 1 ? '#C9A75A' : 'rgba(201, 167, 90, 0.4)',
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                      <span style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.5rem', marginTop: '4px' }}>
                        {h.date.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full History */}
            <div className="card">
              <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Session History
              </h3>
              <div className="space-y-2">
                {lift.history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                    style={{
                      padding: '0.5rem 0',
                      borderBottom: i < lift.history.length - 1 ? '1px solid rgba(201, 167, 90, 0.1)' : 'none',
                    }}
                  >
                    <div>
                      <span style={{ color: '#F5F1EA', fontSize: '0.875rem' }}>{h.date}</span>
                      <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                        Top: {h.topSet}
                      </span>
                    </div>
                    <div className="text-right">
                      <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem' }}>
                        {(h.volume / 1000).toFixed(1)}k vol
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
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
            { icon: '📚', label: 'Library', href: '/library', active: true },
            { icon: '👤', label: 'Profile', href: '/profile' },
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
