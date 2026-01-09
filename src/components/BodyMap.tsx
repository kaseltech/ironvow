'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MuscleData {
  id: string;
  name: string;
  strength: number; // 0-100
  volume: string;
  lastTrained: string;
  trend: 'up' | 'down' | 'stable';
}

interface BodyMapProps {
  gender: 'male' | 'female';
  muscleData: MuscleData[];
  onMuscleSelect?: (muscle: MuscleData) => void;
}

// Color based on strength score
const getColor = (strength: number) => {
  if (strength >= 80) return '#4ADE80'; // Strong - green
  if (strength >= 60) return '#C9A75A'; // Good - gold
  if (strength >= 40) return '#FBBF24'; // Moderate - yellow
  if (strength >= 20) return '#FB923C'; // Weak - orange
  return '#F87171'; // Very weak - red
};

const getLabel = (strength: number) => {
  if (strength >= 80) return 'Strong';
  if (strength >= 60) return 'Good';
  if (strength >= 40) return 'Moderate';
  if (strength >= 20) return 'Weak';
  return 'Undertrained';
};

// Muscle regions calibrated to the actual body images
// The figure is centered and takes ~60% width, starts at y ~5%
// Coordinates are percentages of the container

const frontMuscleRegions = [
  // Traps (neck area)
  { id: 'traps', name: 'Traps', x: 40, y: 10, w: 20, h: 5 },

  // Shoulders (deltoids) - left and right
  { id: 'shoulders', name: 'Left Shoulder', x: 26, y: 14, w: 12, h: 9 },
  { id: 'shoulders', name: 'Right Shoulder', x: 62, y: 14, w: 12, h: 9 },

  // Chest - main pectoral area
  { id: 'chest', name: 'Left Chest', x: 33, y: 18, w: 15, h: 12 },
  { id: 'chest', name: 'Right Chest', x: 52, y: 18, w: 15, h: 12 },

  // Biceps - left and right
  { id: 'biceps', name: 'Left Bicep', x: 21, y: 23, w: 8, h: 14 },
  { id: 'biceps', name: 'Right Bicep', x: 71, y: 23, w: 8, h: 14 },

  // Forearms - left and right
  { id: 'forearms', name: 'Left Forearm', x: 17, y: 38, w: 8, h: 14 },
  { id: 'forearms', name: 'Right Forearm', x: 75, y: 38, w: 8, h: 14 },

  // Core / Abs - center
  { id: 'core', name: 'Abs', x: 40, y: 31, w: 20, h: 18 },

  // Obliques - sides of core
  { id: 'obliques', name: 'Left Oblique', x: 32, y: 35, w: 8, h: 12 },
  { id: 'obliques', name: 'Right Oblique', x: 60, y: 35, w: 8, h: 12 },

  // Quads - left and right thighs
  { id: 'quads', name: 'Left Quad', x: 32, y: 52, w: 14, h: 24 },
  { id: 'quads', name: 'Right Quad', x: 54, y: 52, w: 14, h: 24 },

  // Adductors - inner thigh
  { id: 'adductors', name: 'Adductors', x: 45, y: 56, w: 10, h: 14 },

  // Calves - front view (tibialis)
  { id: 'calves', name: 'Left Calf', x: 35, y: 78, w: 10, h: 14 },
  { id: 'calves', name: 'Right Calf', x: 55, y: 78, w: 10, h: 14 },
];

const backMuscleRegions = [
  // Traps - upper back / neck
  { id: 'traps', name: 'Traps', x: 38, y: 12, w: 24, h: 10 },

  // Shoulders (rear delts) - left and right
  { id: 'shoulders', name: 'Left Rear Delt', x: 26, y: 14, w: 12, h: 9 },
  { id: 'shoulders', name: 'Right Rear Delt', x: 62, y: 14, w: 12, h: 9 },

  // Lats - left and right
  { id: 'lats', name: 'Left Lat', x: 28, y: 22, w: 14, h: 18 },
  { id: 'lats', name: 'Right Lat', x: 58, y: 22, w: 14, h: 18 },

  // Upper back (rhomboids area)
  { id: 'upper_back', name: 'Upper Back', x: 40, y: 22, w: 20, h: 14 },

  // Lower back (erector spinae)
  { id: 'lower_back', name: 'Lower Back', x: 42, y: 38, w: 16, h: 10 },

  // Triceps - left and right
  { id: 'triceps', name: 'Left Tricep', x: 19, y: 23, w: 8, h: 14 },
  { id: 'triceps', name: 'Right Tricep', x: 73, y: 23, w: 8, h: 14 },

  // Forearms - left and right
  { id: 'forearms', name: 'Left Forearm', x: 16, y: 38, w: 8, h: 14 },
  { id: 'forearms', name: 'Right Forearm', x: 76, y: 38, w: 8, h: 14 },

  // Glutes
  { id: 'glutes', name: 'Left Glute', x: 34, y: 46, w: 14, h: 10 },
  { id: 'glutes', name: 'Right Glute', x: 52, y: 46, w: 14, h: 10 },

  // Hamstrings - left and right
  { id: 'hamstrings', name: 'Left Hamstring', x: 34, y: 56, w: 12, h: 18 },
  { id: 'hamstrings', name: 'Right Hamstring', x: 54, y: 56, w: 12, h: 18 },

  // Calves - back view
  { id: 'calves', name: 'Left Calf', x: 36, y: 76, w: 10, h: 14 },
  { id: 'calves', name: 'Right Calf', x: 54, y: 76, w: 10, h: 14 },
];

export function BodyMap({ gender, muscleData, onMuscleSelect }: BodyMapProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  // Always use male images for now
  const imageSrc = view === 'front' ? '/images/male_front.png' : '/images/male_back.png';
  const regions = view === 'front' ? frontMuscleRegions : backMuscleRegions;

  const getMuscleData = (id: string) => {
    return muscleData.find(m => m.id === id);
  };

  const handleMuscleClick = (id: string) => {
    setSelectedMuscle(prev => prev === id ? null : id);
    const muscle = getMuscleData(id);
    if (muscle && onMuscleSelect) {
      onMuscleSelect(muscle);
    }
  };

  const selected = selectedMuscle ? getMuscleData(selectedMuscle) : null;

  return (
    <div>
      {/* View Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => {
            setView('front');
            setHoveredRegion(null);
            setSelectedMuscle(null);
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: view === 'front' ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
            border: view === 'front' ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
            color: view === 'front' ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
            fontSize: '0.75rem',
          }}
        >
          Front
        </button>
        <button
          onClick={() => {
            setView('back');
            setHoveredRegion(null);
            setSelectedMuscle(null);
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: view === 'back' ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
            border: view === 'back' ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
            color: view === 'back' ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
            fontSize: '0.75rem',
          }}
        >
          Back
        </button>
      </div>

      {/* Body Image with Clickable Regions */}
      <div className="flex justify-center">
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '1 / 1',
          }}
        >
          <Image
            src={imageSrc}
            alt={`${view} view`}
            fill
            style={{
              objectFit: 'contain',
              filter: 'brightness(0.9)',
            }}
            priority
          />

          {/* Clickable overlay regions */}
          {regions.map((region, idx) => {
            const muscle = getMuscleData(region.id);
            const isSelected = selectedMuscle === region.id;
            const isHovered = hoveredRegion === idx;
            const strength = muscle?.strength ?? 50;
            const color = getColor(strength);

            return (
              <button
                key={`${region.id}-${idx}`}
                onClick={() => handleMuscleClick(region.id)}
                onMouseEnter={() => setHoveredRegion(idx)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{
                  position: 'absolute',
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.w}%`,
                  height: `${region.h}%`,
                  background: isSelected
                    ? `${color}50`
                    : isHovered
                    ? `${color}30`
                    : 'transparent',
                  border: isSelected
                    ? `2px solid ${color}`
                    : isHovered
                    ? `1px solid ${color}80`
                    : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                aria-label={region.name}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-4 flex-wrap">
        {[
          { color: '#4ADE80', label: 'Strong' },
          { color: '#C9A75A', label: 'Good' },
          { color: '#FBBF24', label: 'Moderate' },
          { color: '#FB923C', label: 'Weak' },
          { color: '#F87171', label: 'Undertrained' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color }} />
            <span style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Selected Muscle Info */}
      {selectedMuscle && (
        <div
          className="mt-4 p-3"
          style={{
            background: 'rgba(15, 34, 51, 0.5)',
            borderRadius: '0.75rem',
            border: selected ? `2px solid ${getColor(selected.strength)}` : '2px solid rgba(201, 167, 90, 0.3)',
          }}
        >
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h4 style={{ color: '#F5F1EA', fontWeight: 600 }}>{selected.name}</h4>
                <span
                  style={{
                    color: getColor(selected.strength),
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {getLabel(selected.strength)} ({selected.strength}%)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem' }}>Weekly Volume</p>
                  <p style={{ color: '#F5F1EA', fontWeight: 500, fontSize: '0.875rem' }}>{selected.volume}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem' }}>Last Trained</p>
                  <p style={{ color: '#F5F1EA', fontWeight: 500, fontSize: '0.875rem' }}>{selected.lastTrained}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem' }}>Trend</p>
                  <p style={{
                    color: selected.trend === 'up' ? '#4ADE80' : selected.trend === 'down' ? '#F87171' : '#C9A75A',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}>
                    {selected.trend === 'up' ? '↑ Improving' : selected.trend === 'down' ? '↓ Declining' : '→ Stable'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <h4 style={{ color: '#C9A75A', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                {selectedMuscle.replace('_', ' ')}
              </h4>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.8125rem' }}>
                No workout data yet
              </p>
              <p style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Do a {selectedMuscle.replace('_', ' ')} workout to start tracking!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
