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

// Muscle region definitions for click areas (percentages of image)
const frontMuscleRegions = [
  { id: 'shoulders', name: 'Shoulders', x: 15, y: 18, w: 18, h: 8 },
  { id: 'shoulders', name: 'Shoulders', x: 67, y: 18, w: 18, h: 8 },
  { id: 'chest', name: 'Chest', x: 28, y: 22, w: 44, h: 14 },
  { id: 'biceps', name: 'Biceps', x: 12, y: 26, w: 12, h: 14 },
  { id: 'biceps', name: 'Biceps', x: 76, y: 26, w: 12, h: 14 },
  { id: 'forearms', name: 'Forearms', x: 8, y: 40, w: 10, h: 14 },
  { id: 'forearms', name: 'Forearms', x: 82, y: 40, w: 10, h: 14 },
  { id: 'core', name: 'Core', x: 35, y: 36, w: 30, h: 18 },
  { id: 'quads', name: 'Quads', x: 30, y: 55, w: 18, h: 22 },
  { id: 'quads', name: 'Quads', x: 52, y: 55, w: 18, h: 22 },
  { id: 'calves', name: 'Calves', x: 32, y: 80, w: 14, h: 16 },
  { id: 'calves', name: 'Calves', x: 54, y: 80, w: 14, h: 16 },
];

const backMuscleRegions = [
  { id: 'traps', name: 'Traps', x: 35, y: 16, w: 30, h: 10 },
  { id: 'rear_delts', name: 'Rear Delts', x: 18, y: 20, w: 14, h: 8 },
  { id: 'rear_delts', name: 'Rear Delts', x: 68, y: 20, w: 14, h: 8 },
  { id: 'upper_back', name: 'Upper Back', x: 32, y: 24, w: 36, h: 14 },
  { id: 'lats', name: 'Lats', x: 24, y: 30, w: 12, h: 18 },
  { id: 'lats', name: 'Lats', x: 64, y: 30, w: 12, h: 18 },
  { id: 'triceps', name: 'Triceps', x: 12, y: 28, w: 10, h: 14 },
  { id: 'triceps', name: 'Triceps', x: 78, y: 28, w: 10, h: 14 },
  { id: 'lower_back', name: 'Lower Back', x: 38, y: 40, w: 24, h: 12 },
  { id: 'glutes', name: 'Glutes', x: 32, y: 52, w: 36, h: 12 },
  { id: 'hamstrings', name: 'Hamstrings', x: 30, y: 62, w: 18, h: 18 },
  { id: 'hamstrings', name: 'Hamstrings', x: 52, y: 62, w: 18, h: 18 },
  { id: 'calves', name: 'Calves', x: 32, y: 82, w: 14, h: 14 },
  { id: 'calves', name: 'Calves', x: 54, y: 82, w: 14, h: 14 },
];

export function BodyMap({ gender, muscleData, onMuscleSelect }: BodyMapProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  // Always use male images for now
  const imageSrc = view === 'front' ? '/images/male_front.png' : '/images/male_back.png';
  const regions = view === 'front' ? frontMuscleRegions : backMuscleRegions;

  const getMuscleData = (id: string) => {
    return muscleData.find(m => m.id === id);
  };

  const handleMuscleClick = (id: string) => {
    setSelectedMuscle(id);
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
          onClick={() => setView('front')}
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
          onClick={() => setView('back')}
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
            width: '200px',
            height: '360px',
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
            const strength = muscle?.strength ?? 50;

            return (
              <button
                key={`${region.id}-${idx}`}
                onClick={() => handleMuscleClick(region.id)}
                style={{
                  position: 'absolute',
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.w}%`,
                  height: `${region.h}%`,
                  background: isSelected
                    ? `${getColor(strength)}40`
                    : 'transparent',
                  border: isSelected
                    ? `2px solid ${getColor(strength)}`
                    : '1px solid transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = `${getColor(strength)}20`;
                    e.currentTarget.style.border = `1px solid ${getColor(strength)}60`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '1px solid transparent';
                  }
                }}
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
