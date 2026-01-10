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

// SVG polygon paths precisely traced from anatomy images
// Coordinates are percentages (0-100) of the viewBox
// These follow the exact white lines visible in male_front.png and male_back.png

const frontMusclePolygons = [
  // TRAPS - V-shaped area at base of neck (visible from front)
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 44,9 Q 50,8 56,9 L 54,13 Q 50,14 46,13 Z',
  },

  // LEFT SHOULDER (Deltoid) - rounded muscle cap
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 46,13 L 44,10 L 36,11 L 28,14 L 25,18 L 27,23 L 31,22 L 36,18 L 42,15 Z',
  },

  // RIGHT SHOULDER (Deltoid)
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 54,13 L 56,10 L 64,11 L 72,14 L 75,18 L 73,23 L 69,22 L 64,18 L 58,15 Z',
  },

  // LEFT CHEST (Pectoral) - traced along white pec outline
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 42,15 L 36,18 L 31,22 L 31,27 L 36,30 L 44,30 L 50,27 L 50,18 L 46,13 Z',
  },

  // RIGHT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 58,15 L 64,18 L 69,22 L 69,27 L 64,30 L 56,30 L 50,27 L 50,18 L 54,13 Z',
  },

  // LEFT BICEP - front of upper arm
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 27,23 L 25,18 L 22,20 L 20,27 L 20,34 L 23,36 L 27,34 L 29,28 L 30,24 Z',
  },

  // RIGHT BICEP
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 73,23 L 75,18 L 78,20 L 80,27 L 80,34 L 77,36 L 73,34 L 71,28 L 70,24 Z',
  },

  // LEFT FOREARM
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 20,34 L 19,41 L 19,48 L 22,51 L 25,49 L 26,43 L 25,37 L 23,36 Z',
  },

  // RIGHT FOREARM
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 80,34 L 81,41 L 81,48 L 78,51 L 75,49 L 74,43 L 75,37 L 77,36 Z',
  },

  // ABS (Core) - central 6-pack area with distinct borders
  {
    id: 'core',
    name: 'Abs',
    path: 'M 44,30 L 56,30 L 56,44 L 54,46 L 46,46 L 44,44 Z',
  },

  // LEFT OBLIQUE - side of torso
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 31,27 L 36,30 L 44,30 L 44,44 L 40,46 L 34,44 L 31,38 L 30,31 Z',
  },

  // RIGHT OBLIQUE
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 69,27 L 64,30 L 56,30 L 56,44 L 60,46 L 66,44 L 69,38 L 70,31 Z',
  },

  // LEFT QUAD - front of thigh with muscle detail
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 34,44 L 40,46 L 46,46 L 46,49 L 44,59 L 42,69 L 40,74 L 35,74 L 33,69 L 32,59 L 32,49 Z',
  },

  // RIGHT QUAD
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 66,44 L 60,46 L 54,46 L 54,49 L 56,59 L 58,69 L 60,74 L 65,74 L 67,69 L 68,59 L 68,49 Z',
  },

  // ADDUCTORS - inner thigh
  {
    id: 'adductors',
    name: 'Inner Thighs',
    path: 'M 46,49 L 46,46 L 54,46 L 54,49 L 53,59 L 51,66 L 50,69 L 49,66 L 47,59 Z',
  },

  // LEFT CALF (front - tibialis)
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 35,74 L 40,74 L 42,81 L 42,89 L 40,94 L 36,94 L 34,89 L 34,81 Z',
  },

  // RIGHT CALF (front)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 65,74 L 60,74 L 58,81 L 58,89 L 60,94 L 64,94 L 66,89 L 66,81 Z',
  },
];

const backMusclePolygons = [
  // TRAPS - large diamond/kite shape from neck to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,7 L 44,10 L 36,14 L 40,19 L 46,21 L 50,26 L 54,21 L 60,19 L 64,14 L 56,10 Z',
  },

  // LEFT REAR DELT - back of shoulder
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 36,14 L 28,13 L 24,17 L 26,22 L 31,23 L 36,20 L 40,19 Z',
  },

  // RIGHT REAR DELT
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 64,14 L 72,13 L 76,17 L 74,22 L 69,23 L 64,20 L 60,19 Z',
  },

  // LEFT LAT - large wing muscle on side
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 36,20 L 31,23 L 29,30 L 31,38 L 35,42 L 42,44 L 46,40 L 46,26 L 44,22 Z',
  },

  // RIGHT LAT
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 64,20 L 69,23 L 71,30 L 69,38 L 65,42 L 58,44 L 54,40 L 54,26 L 56,22 Z',
  },

  // UPPER BACK (Rhomboids/mid-traps area)
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 46,21 L 50,26 L 54,21 L 56,22 L 54,26 L 54,35 L 50,37 L 46,35 L 46,26 L 44,22 Z',
  },

  // LOWER BACK (Erector spinae)
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 46,35 L 50,37 L 54,35 L 54,40 L 53,46 L 50,48 L 47,46 L 46,40 Z',
  },

  // LEFT TRICEP - back of upper arm
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 26,22 L 24,17 L 21,20 L 19,28 L 19,36 L 22,37 L 25,34 L 27,28 L 29,24 Z',
  },

  // RIGHT TRICEP
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 74,22 L 76,17 L 79,20 L 81,28 L 81,36 L 78,37 L 75,34 L 73,28 L 71,24 Z',
  },

  // LEFT FOREARM (back)
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 19,36 L 18,43 L 18,50 L 21,53 L 24,51 L 25,45 L 24,38 L 22,37 Z',
  },

  // RIGHT FOREARM (back)
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 81,36 L 82,43 L 82,50 L 79,53 L 76,51 L 75,45 L 76,38 L 78,37 Z',
  },

  // LEFT GLUTE - clearly defined buttock
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 42,44 L 47,46 L 50,48 L 50,55 L 47,57 L 41,55 L 36,51 L 36,47 Z',
  },

  // RIGHT GLUTE
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 58,44 L 53,46 L 50,48 L 50,55 L 53,57 L 59,55 L 64,51 L 64,47 Z',
  },

  // LEFT HAMSTRING - back of thigh
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 36,51 L 41,55 L 47,57 L 48,63 L 46,71 L 42,75 L 36,75 L 33,69 L 32,61 L 34,55 Z',
  },

  // RIGHT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 64,51 L 59,55 L 53,57 L 52,63 L 54,71 L 58,75 L 64,75 L 67,69 L 68,61 L 66,55 Z',
  },

  // LEFT CALF (back - gastrocnemius)
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 36,75 L 42,75 L 44,81 L 43,89 L 40,94 L 37,94 L 34,89 L 34,81 Z',
  },

  // RIGHT CALF (back)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 64,75 L 58,75 L 56,81 L 57,89 L 60,94 L 63,94 L 66,89 L 66,81 Z',
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
