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

// SVG polygon paths traced from anatomy images
// Coordinates are percentages (0-100) of the viewBox
// These trace the white lines in the anatomy images precisely

const frontMusclePolygons = [
  // TRAPS - small area at base of neck
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 44,10 L 56,10 L 58,13 L 50,14 L 42,13 Z',
  },

  // LEFT SHOULDER (Deltoid) - rounded cap
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 42,13 L 44,10 L 36,11 L 28,14 L 26,18 L 28,22 L 32,21 L 35,17 L 38,15 Z',
  },

  // RIGHT SHOULDER (Deltoid)
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 58,13 L 56,10 L 64,11 L 72,14 L 74,18 L 72,22 L 68,21 L 65,17 L 62,15 Z',
  },

  // LEFT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 38,15 L 35,17 L 32,21 L 33,26 L 38,28 L 45,28 L 50,26 L 50,18 L 44,14 L 42,13 Z',
  },

  // RIGHT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 62,15 L 65,17 L 68,21 L 67,26 L 62,28 L 55,28 L 50,26 L 50,18 L 56,14 L 58,13 Z',
  },

  // LEFT BICEP - front of upper arm
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 28,22 L 26,18 L 23,21 L 20,28 L 19,35 L 22,36 L 26,34 L 28,28 L 30,24 Z',
  },

  // RIGHT BICEP
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 72,22 L 74,18 L 77,21 L 80,28 L 81,35 L 78,36 L 74,34 L 72,28 L 70,24 Z',
  },

  // LEFT FOREARM
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 19,35 L 17,42 L 15,50 L 17,52 L 20,50 L 22,45 L 24,40 L 22,36 Z',
  },

  // RIGHT FOREARM
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 81,35 L 83,42 L 85,50 L 83,52 L 80,50 L 78,45 L 76,40 L 78,36 Z',
  },

  // ABS (Core) - center 6-pack area
  {
    id: 'core',
    name: 'Abs',
    path: 'M 45,28 L 55,28 L 55,46 L 53,48 L 47,48 L 45,46 Z',
  },

  // LEFT OBLIQUE - side of torso
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 33,26 L 38,28 L 45,28 L 45,46 L 42,48 L 36,46 L 33,40 L 32,32 Z',
  },

  // RIGHT OBLIQUE
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 67,26 L 62,28 L 55,28 L 55,46 L 58,48 L 64,46 L 67,40 L 68,32 Z',
  },

  // LEFT QUAD - front of thigh (outer portion)
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 36,46 L 42,48 L 45,50 L 44,58 L 42,68 L 40,74 L 36,74 L 33,68 L 32,58 L 33,50 Z',
  },

  // RIGHT QUAD
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 64,46 L 58,48 L 55,50 L 56,58 L 58,68 L 60,74 L 64,74 L 67,68 L 68,58 L 67,50 Z',
  },

  // ADDUCTORS - inner thighs
  {
    id: 'adductors',
    name: 'Inner Thighs',
    path: 'M 45,50 L 47,48 L 53,48 L 55,50 L 54,60 L 52,66 L 50,68 L 48,66 L 46,60 Z',
  },

  // LEFT CALF (front - tibialis)
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 36,74 L 40,74 L 42,80 L 42,88 L 40,93 L 37,93 L 35,88 L 35,80 Z',
  },

  // RIGHT CALF (front)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 64,74 L 60,74 L 58,80 L 58,88 L 60,93 L 63,93 L 65,88 L 65,80 Z',
  },
];

const backMusclePolygons = [
  // TRAPS - diamond/kite shape from neck to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,8 L 42,12 L 35,16 L 38,20 L 45,22 L 50,28 L 55,22 L 62,20 L 65,16 L 58,12 Z',
  },

  // LEFT REAR DELT
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 35,16 L 28,14 L 24,18 L 26,22 L 30,24 L 35,22 L 38,20 Z',
  },

  // RIGHT REAR DELT
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 65,16 L 72,14 L 76,18 L 74,22 L 70,24 L 65,22 L 62,20 Z',
  },

  // LEFT LAT - fan shaped on side of back
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 35,22 L 30,24 L 28,30 L 30,38 L 34,42 L 40,44 L 45,40 L 45,28 L 42,24 Z',
  },

  // RIGHT LAT
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 65,22 L 70,24 L 72,30 L 70,38 L 66,42 L 60,44 L 55,40 L 55,28 L 58,24 Z',
  },

  // UPPER BACK (Rhomboids) - between shoulder blades
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 45,22 L 50,28 L 55,22 L 58,24 L 55,28 L 55,36 L 50,38 L 45,36 L 45,28 L 42,24 Z',
  },

  // LOWER BACK (Erectors)
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 45,36 L 50,38 L 55,36 L 55,40 L 54,46 L 50,48 L 46,46 L 45,40 Z',
  },

  // LEFT TRICEP
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 26,22 L 24,18 L 21,22 L 18,30 L 18,38 L 21,38 L 24,34 L 26,28 L 28,24 Z',
  },

  // RIGHT TRICEP
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 74,22 L 76,18 L 79,22 L 82,30 L 82,38 L 79,38 L 76,34 L 74,28 L 72,24 Z',
  },

  // LEFT FOREARM (back)
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 18,38 L 16,45 L 15,52 L 17,54 L 20,52 L 22,46 L 21,38 Z',
  },

  // RIGHT FOREARM (back)
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 82,38 L 84,45 L 85,52 L 83,54 L 80,52 L 78,46 L 79,38 Z',
  },

  // LEFT GLUTE
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 40,44 L 46,46 L 50,48 L 50,56 L 46,58 L 40,56 L 36,52 L 36,48 Z',
  },

  // RIGHT GLUTE
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 60,44 L 54,46 L 50,48 L 50,56 L 54,58 L 60,56 L 64,52 L 64,48 Z',
  },

  // LEFT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 36,52 L 40,56 L 46,58 L 48,64 L 46,72 L 42,76 L 36,76 L 33,70 L 32,62 L 33,56 Z',
  },

  // RIGHT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 64,52 L 60,56 L 54,58 L 52,64 L 54,72 L 58,76 L 64,76 L 67,70 L 68,62 L 67,56 Z',
  },

  // LEFT CALF (back - gastrocnemius)
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 36,76 L 42,76 L 44,82 L 43,90 L 40,94 L 37,94 L 34,90 L 34,82 Z',
  },

  // RIGHT CALF (back)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 64,76 L 58,76 L 56,82 L 57,90 L 60,94 L 63,94 L 66,90 L 66,82 Z',
  },
];

export function BodyMap({ gender, muscleData, onMuscleSelect }: BodyMapProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  const imageSrc = view === 'front' ? '/images/male_front.png' : '/images/male_back.png';
  const polygons = view === 'front' ? frontMusclePolygons : backMusclePolygons;

  const getMuscleData = (id: string) => {
    return muscleData.find(m => m.id === id);
  };

  const handleMuscleClick = (id: string, regionName: string) => {
    setSelectedMuscle(prev => prev === id ? null : id);
    const muscle = getMuscleData(id);
    if (onMuscleSelect) {
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
            setHoveredMuscle(null);
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
            setHoveredMuscle(null);
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

      {/* Body Image with SVG Overlay */}
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

          {/* SVG overlay with polygon regions */}
          <svg
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            {polygons.map((polygon, idx) => {
              const muscle = getMuscleData(polygon.id);
              const isSelected = selectedMuscle === polygon.id;
              const isHovered = hoveredMuscle === `${polygon.id}-${idx}`;
              const strength = muscle?.strength ?? 50;
              const color = getColor(strength);

              return (
                <path
                  key={`${polygon.id}-${idx}`}
                  d={polygon.path}
                  fill={isSelected ? `${color}` : isHovered ? `${color}` : 'transparent'}
                  fillOpacity={isSelected ? 0.4 : isHovered ? 0.25 : 0}
                  stroke={isSelected ? color : isHovered ? color : 'transparent'}
                  strokeWidth={isSelected ? 0.8 : isHovered ? 0.5 : 0}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onClick={() => handleMuscleClick(polygon.id, polygon.name)}
                  onMouseEnter={() => setHoveredMuscle(`${polygon.id}-${idx}`)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  aria-label={polygon.name}
                />
              );
            })}
          </svg>
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
