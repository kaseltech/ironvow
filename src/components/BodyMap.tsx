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

// Muscle regions precisely calibrated to anatomy image white lines
// Coordinates are percentages of the container (400x400 max)
// Key: Non-overlapping regions - shoulders separate from chest

const frontMuscleRegions = [
  // TRAPS - narrow band below neck, above shoulders
  { id: 'traps', name: 'Traps', x: 42, y: 8, w: 16, h: 4 },

  // SHOULDERS (Deltoids) - rounded caps on outer arms, NOT touching chest
  { id: 'shoulders', name: 'Left Delt', x: 24, y: 12, w: 10, h: 8 },
  { id: 'shoulders', name: 'Right Delt', x: 66, y: 12, w: 10, h: 8 },

  // CHEST - inner pec area only, between shoulders
  { id: 'chest', name: 'Left Pec', x: 35, y: 15, w: 12, h: 10 },
  { id: 'chest', name: 'Right Pec', x: 53, y: 15, w: 12, h: 10 },

  // BICEPS - front of upper arms, outside of torso
  { id: 'biceps', name: 'Left Bicep', x: 20, y: 21, w: 6, h: 12 },
  { id: 'biceps', name: 'Right Bicep', x: 74, y: 21, w: 6, h: 12 },

  // FOREARMS - lower arms
  { id: 'forearms', name: 'Left Forearm', x: 16, y: 35, w: 6, h: 14 },
  { id: 'forearms', name: 'Right Forearm', x: 78, y: 35, w: 6, h: 14 },

  // ABS - center column, below chest
  { id: 'core', name: 'Abs', x: 42, y: 27, w: 16, h: 18 },

  // OBLIQUES - sides of abs (narrower)
  { id: 'obliques', name: 'Left Oblique', x: 34, y: 32, w: 7, h: 10 },
  { id: 'obliques', name: 'Right Oblique', x: 59, y: 32, w: 7, h: 10 },

  // QUADS - front of thighs
  { id: 'quads', name: 'Left Quad', x: 34, y: 50, w: 12, h: 22 },
  { id: 'quads', name: 'Right Quad', x: 54, y: 50, w: 12, h: 22 },

  // ADDUCTORS - inner thigh gap
  { id: 'adductors', name: 'Adductors', x: 46, y: 54, w: 8, h: 12 },

  // CALVES - tibialis anterior (front shin)
  { id: 'calves', name: 'Left Calf', x: 36, y: 76, w: 8, h: 14 },
  { id: 'calves', name: 'Right Calf', x: 56, y: 76, w: 8, h: 14 },
];

const backMuscleRegions = [
  // TRAPS - diamond shape from neck to mid-back
  { id: 'traps', name: 'Traps', x: 40, y: 8, w: 20, h: 12 },

  // REAR DELTS - back of shoulders
  { id: 'shoulders', name: 'Left Rear Delt', x: 24, y: 12, w: 10, h: 8 },
  { id: 'shoulders', name: 'Right Rear Delt', x: 66, y: 12, w: 10, h: 8 },

  // LATS - large fan-shaped muscles on sides
  { id: 'lats', name: 'Left Lat', x: 28, y: 20, w: 12, h: 16 },
  { id: 'lats', name: 'Right Lat', x: 60, y: 20, w: 12, h: 16 },

  // UPPER BACK (Rhomboids) - between shoulder blades
  { id: 'upper_back', name: 'Upper Back', x: 41, y: 18, w: 18, h: 12 },

  // LOWER BACK (Erectors) - center lower back
  { id: 'lower_back', name: 'Lower Back', x: 43, y: 34, w: 14, h: 10 },

  // TRICEPS - back of upper arms
  { id: 'triceps', name: 'Left Tricep', x: 18, y: 21, w: 6, h: 12 },
  { id: 'triceps', name: 'Right Tricep', x: 76, y: 21, w: 6, h: 12 },

  // FOREARMS - back of lower arms
  { id: 'forearms', name: 'Left Forearm', x: 15, y: 35, w: 6, h: 14 },
  { id: 'forearms', name: 'Right Forearm', x: 79, y: 35, w: 6, h: 14 },

  // GLUTES - clearly defined in image
  { id: 'glutes', name: 'Left Glute', x: 36, y: 44, w: 12, h: 10 },
  { id: 'glutes', name: 'Right Glute', x: 52, y: 44, w: 12, h: 10 },

  // HAMSTRINGS - back of thighs
  { id: 'hamstrings', name: 'Left Hamstring', x: 36, y: 55, w: 10, h: 16 },
  { id: 'hamstrings', name: 'Right Hamstring', x: 54, y: 55, w: 10, h: 16 },

  // CALVES - gastrocnemius (back of lower leg)
  { id: 'calves', name: 'Left Calf', x: 38, y: 74, w: 8, h: 14 },
  { id: 'calves', name: 'Right Calf', x: 54, y: 74, w: 8, h: 14 },
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

  const handleMuscleClick = (id: string, regionName: string) => {
    setSelectedMuscle(prev => prev === id ? null : id);
    const muscle = getMuscleData(id);
    if (onMuscleSelect) {
      // Always call onMuscleSelect, even if no data exists
      onMuscleSelect({
        id,
        name: muscle?.name || regionName.replace('_', ' '),
        strength: muscle?.strength ?? 0,
        volume: muscle?.volume ?? '0 lbs',
        lastTrained: muscle?.lastTrained ?? 'Never',
        trend: muscle?.trend ?? 'stable',
      });
    }
  };

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
                onClick={() => handleMuscleClick(region.id, region.name)}
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

      {/* Tap instruction */}
      <p className="text-center mt-2" style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.625rem' }}>
        Tap a muscle group for detailed stats
      </p>
    </div>
  );
}
