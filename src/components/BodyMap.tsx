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

// Expanded muscle region definitions (percentages of image)
// More granular areas for better interaction
const frontMuscleRegions = [
  // Neck/Traps
  { id: 'traps', name: 'Traps', x: 38, y: 12, w: 24, h: 6 },

  // Shoulders (front delts)
  { id: 'shoulders', name: 'Front Delts', x: 18, y: 16, w: 12, h: 8 },
  { id: 'shoulders', name: 'Front Delts', x: 70, y: 16, w: 12, h: 8 },

  // Chest - upper and lower
  { id: 'chest', name: 'Upper Chest', x: 32, y: 20, w: 36, h: 8 },
  { id: 'chest', name: 'Lower Chest', x: 30, y: 28, w: 40, h: 8 },

  // Biceps
  { id: 'biceps', name: 'Biceps', x: 14, y: 26, w: 10, h: 12 },
  { id: 'biceps', name: 'Biceps', x: 76, y: 26, w: 10, h: 12 },

  // Forearms
  { id: 'forearms', name: 'Forearms', x: 10, y: 40, w: 10, h: 14 },
  { id: 'forearms', name: 'Forearms', x: 80, y: 40, w: 10, h: 14 },

  // Core - abs and obliques
  { id: 'abs', name: 'Upper Abs', x: 38, y: 36, w: 24, h: 8 },
  { id: 'abs', name: 'Lower Abs', x: 38, y: 44, w: 24, h: 8 },
  { id: 'obliques', name: 'Obliques', x: 28, y: 38, w: 10, h: 14 },
  { id: 'obliques', name: 'Obliques', x: 62, y: 38, w: 10, h: 14 },

  // Hip flexors
  { id: 'hip_flexors', name: 'Hip Flexors', x: 35, y: 52, w: 12, h: 6 },
  { id: 'hip_flexors', name: 'Hip Flexors', x: 53, y: 52, w: 12, h: 6 },

  // Quads - outer, inner, front
  { id: 'quads', name: 'Outer Quad', x: 26, y: 58, w: 10, h: 14 },
  { id: 'quads', name: 'Front Quad', x: 36, y: 58, w: 10, h: 14 },
  { id: 'quads', name: 'Front Quad', x: 54, y: 58, w: 10, h: 14 },
  { id: 'quads', name: 'Outer Quad', x: 64, y: 58, w: 10, h: 14 },

  // Adductors (inner thigh)
  { id: 'adductors', name: 'Adductors', x: 44, y: 60, w: 12, h: 12 },

  // Lower quads / knee area
  { id: 'quads', name: 'Lower Quad', x: 30, y: 72, w: 14, h: 8 },
  { id: 'quads', name: 'Lower Quad', x: 56, y: 72, w: 14, h: 8 },

  // Tibialis (front of shin)
  { id: 'tibialis', name: 'Tibialis', x: 32, y: 82, w: 10, h: 10 },
  { id: 'tibialis', name: 'Tibialis', x: 58, y: 82, w: 10, h: 10 },

  // Calves (front view - mostly tibialis visible)
  { id: 'calves', name: 'Calves', x: 34, y: 80, w: 12, h: 14 },
  { id: 'calves', name: 'Calves', x: 54, y: 80, w: 12, h: 14 },
];

const backMuscleRegions = [
  // Traps - upper, mid, lower
  { id: 'traps', name: 'Upper Traps', x: 36, y: 12, w: 28, h: 6 },
  { id: 'traps', name: 'Mid Traps', x: 38, y: 18, w: 24, h: 6 },

  // Rear Delts
  { id: 'rear_delts', name: 'Rear Delts', x: 18, y: 18, w: 12, h: 8 },
  { id: 'rear_delts', name: 'Rear Delts', x: 70, y: 18, w: 12, h: 8 },

  // Rhomboids (mid back)
  { id: 'rhomboids', name: 'Rhomboids', x: 36, y: 24, w: 28, h: 8 },

  // Lats - multiple zones
  { id: 'lats', name: 'Upper Lats', x: 22, y: 26, w: 14, h: 10 },
  { id: 'lats', name: 'Upper Lats', x: 64, y: 26, w: 14, h: 10 },
  { id: 'lats', name: 'Lower Lats', x: 24, y: 36, w: 12, h: 10 },
  { id: 'lats', name: 'Lower Lats', x: 64, y: 36, w: 12, h: 10 },

  // Triceps
  { id: 'triceps', name: 'Triceps', x: 14, y: 26, w: 8, h: 14 },
  { id: 'triceps', name: 'Triceps', x: 78, y: 26, w: 8, h: 14 },

  // Forearms (back)
  { id: 'forearms', name: 'Forearms', x: 10, y: 42, w: 8, h: 12 },
  { id: 'forearms', name: 'Forearms', x: 82, y: 42, w: 8, h: 12 },

  // Lower back / erector spinae
  { id: 'lower_back', name: 'Erector Spinae', x: 36, y: 34, w: 12, h: 14 },
  { id: 'lower_back', name: 'Erector Spinae', x: 52, y: 34, w: 12, h: 14 },

  // Glutes - upper and lower
  { id: 'glutes', name: 'Upper Glutes', x: 30, y: 50, w: 18, h: 8 },
  { id: 'glutes', name: 'Upper Glutes', x: 52, y: 50, w: 18, h: 8 },
  { id: 'glutes', name: 'Lower Glutes', x: 32, y: 58, w: 16, h: 6 },
  { id: 'glutes', name: 'Lower Glutes', x: 52, y: 58, w: 16, h: 6 },

  // Hamstrings - upper and lower
  { id: 'hamstrings', name: 'Upper Hamstring', x: 30, y: 64, w: 14, h: 10 },
  { id: 'hamstrings', name: 'Upper Hamstring', x: 56, y: 64, w: 14, h: 10 },
  { id: 'hamstrings', name: 'Lower Hamstring', x: 32, y: 74, w: 12, h: 8 },
  { id: 'hamstrings', name: 'Lower Hamstring', x: 56, y: 74, w: 12, h: 8 },

  // Calves (back view)
  { id: 'calves', name: 'Gastrocnemius', x: 32, y: 82, w: 14, h: 10 },
  { id: 'calves', name: 'Gastrocnemius', x: 54, y: 82, w: 14, h: 10 },
  { id: 'calves', name: 'Soleus', x: 34, y: 90, w: 10, h: 6 },
  { id: 'calves', name: 'Soleus', x: 56, y: 90, w: 10, h: 6 },
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

      {/* Body Image with Clickable Regions - MUCH LARGER */}
      <div className="flex justify-center">
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '450px',
            aspectRatio: '1 / 1.8',
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
                onTouchStart={() => setHoveredRegion(idx)}
                onTouchEnd={() => setHoveredRegion(null)}
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
                title={region.name}
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
      {selected && (
        <div
          className="mt-4 p-3"
          style={{
            background: 'rgba(15, 34, 51, 0.5)',
            borderRadius: '0.75rem',
            border: `2px solid ${getColor(selected.strength)}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 style={{ color: '#F5F1EA', fontWeight: 600 }}>{selected.name}</h4>
            <span
              style={{
                color: getColor(selected.strength),
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {getLabel(selected.strength)}
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
                {selected.trend === 'up' ? '↑' : selected.trend === 'down' ? '↓' : '→'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
