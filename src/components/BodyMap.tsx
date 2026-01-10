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

// SVG polygon paths - PRECISELY traced from white lines in male_front.png
// Figure bounds: x=28-72%, head top=6%, feet=96%
// All coordinates are percentages matching the actual image

const frontMusclePolygons = [
  // TRAPS - small visible area at neck/shoulder junction
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 44,13 L 50,12 L 56,13 L 54,16 L 50,17 L 46,16 Z',
  },

  // LEFT SHOULDER (Deltoid) - rounded cap, follows white outline
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 44,14 L 40,15 L 34,16 L 29,18 L 28,21 L 30,23 L 34,23 L 38,20 L 42,17 Z',
  },

  // RIGHT SHOULDER (Deltoid)
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 56,14 L 60,15 L 66,16 L 71,18 L 72,21 L 70,23 L 66,23 L 62,20 L 58,17 Z',
  },

  // LEFT CHEST (Pectoral) - bounded by white lines
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 42,17 L 38,20 L 37,24 L 38,28 L 42,30 L 50,28 L 50,20 L 46,16 Z',
  },

  // RIGHT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 58,17 L 62,20 L 63,24 L 62,28 L 58,30 L 50,28 L 50,20 L 54,16 Z',
  },

  // LEFT BICEP - front of upper arm
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 30,23 L 28,21 L 28,26 L 28,32 L 29,37 L 32,38 L 35,36 L 35,30 L 34,23 Z',
  },

  // RIGHT BICEP
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 70,23 L 72,21 L 72,26 L 72,32 L 71,37 L 68,38 L 65,36 L 65,30 L 66,23 Z',
  },

  // LEFT FOREARM
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 29,37 L 27,42 L 26,48 L 27,52 L 31,51 L 33,46 L 33,40 L 32,38 Z',
  },

  // RIGHT FOREARM
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 71,37 L 73,42 L 74,48 L 73,52 L 69,51 L 67,46 L 67,40 L 68,38 Z',
  },

  // ABS (Core) - center column with visible ab lines
  {
    id: 'core',
    name: 'Abs',
    path: 'M 45,30 L 55,30 L 55,46 L 53,47 L 47,47 L 45,46 Z',
  },

  // LEFT OBLIQUE - side of torso
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 38,28 L 42,30 L 45,30 L 45,46 L 42,47 L 38,45 L 37,38 L 37,32 Z',
  },

  // RIGHT OBLIQUE
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 62,28 L 58,30 L 55,30 L 55,46 L 58,47 L 62,45 L 63,38 L 63,32 Z',
  },

  // LEFT QUAD - front thigh
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 38,49 L 42,49 L 48,50 L 48,58 L 46,66 L 44,72 L 40,72 L 37,66 L 36,58 L 37,52 Z',
  },

  // RIGHT QUAD
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 62,49 L 58,49 L 52,50 L 52,58 L 54,66 L 56,72 L 60,72 L 63,66 L 64,58 L 63,52 Z',
  },

  // ADDUCTORS - inner thighs
  {
    id: 'adductors',
    name: 'Inner Thighs',
    path: 'M 48,50 L 52,50 L 52,58 L 51,65 L 50,66 L 49,65 L 48,58 Z',
  },

  // LEFT CALF - front of lower leg (tibialis)
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 40,73 L 45,73 L 46,80 L 45,88 L 43,92 L 40,92 L 38,88 L 39,80 Z',
  },

  // RIGHT CALF
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 60,73 L 55,73 L 54,80 L 55,88 L 57,92 L 60,92 L 62,88 L 61,80 Z',
  },
];

// Back view polygons - PRECISELY traced from white lines in male_back.png
// Figure bounds: x=28-72%, head top=6%, feet=96%
const backMusclePolygons = [
  // TRAPS - large diamond shape from neck to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,12 L 44,14 L 40,18 L 42,24 L 46,28 L 50,30 L 54,28 L 58,24 L 60,18 L 56,14 Z',
  },

  // LEFT REAR DELT - rounded shoulder cap
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 40,18 L 34,16 L 29,18 L 28,22 L 30,24 L 35,24 L 40,22 Z',
  },

  // RIGHT REAR DELT
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 60,18 L 66,16 L 71,18 L 72,22 L 70,24 L 65,24 L 60,22 Z',
  },

  // LEFT LAT - large fan-shaped muscle
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 40,22 L 35,24 L 33,30 L 35,38 L 38,44 L 44,46 L 46,42 L 46,32 L 42,26 Z',
  },

  // RIGHT LAT
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 60,22 L 65,24 L 67,30 L 65,38 L 62,44 L 56,46 L 54,42 L 54,32 L 58,26 Z',
  },

  // UPPER BACK (Rhomboids) - between shoulder blades
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 46,28 L 50,30 L 54,28 L 54,32 L 54,38 L 50,40 L 46,38 L 46,32 Z',
  },

  // LOWER BACK (Erectors) - center lower back
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 46,38 L 50,40 L 54,38 L 54,44 L 52,48 L 50,49 L 48,48 L 46,44 Z',
  },

  // LEFT TRICEP - back of upper arm
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 30,24 L 28,22 L 27,27 L 27,33 L 28,38 L 31,39 L 34,36 L 34,30 L 33,25 Z',
  },

  // RIGHT TRICEP
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 70,24 L 72,22 L 73,27 L 73,33 L 72,38 L 69,39 L 66,36 L 66,30 L 67,25 Z',
  },

  // LEFT FOREARM (back)
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 28,38 L 26,44 L 26,50 L 28,53 L 31,51 L 32,46 L 32,40 L 31,39 Z',
  },

  // RIGHT FOREARM (back)
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 72,38 L 74,44 L 74,50 L 72,53 L 69,51 L 68,46 L 68,40 L 69,39 Z',
  },

  // LEFT GLUTE - clearly defined
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 44,46 L 48,48 L 50,49 L 50,56 L 46,57 L 40,55 L 38,50 L 40,47 Z',
  },

  // RIGHT GLUTE
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 56,46 L 52,48 L 50,49 L 50,56 L 54,57 L 60,55 L 62,50 L 60,47 Z',
  },

  // LEFT HAMSTRING - back of thigh
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 40,55 L 46,57 L 48,60 L 47,68 L 44,74 L 40,74 L 37,68 L 36,60 L 38,56 Z',
  },

  // RIGHT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 60,55 L 54,57 L 52,60 L 53,68 L 56,74 L 60,74 L 63,68 L 64,60 L 62,56 Z',
  },

  // LEFT CALF (gastrocnemius) - back of lower leg
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 40,74 L 45,74 L 46,80 L 45,87 L 43,92 L 40,92 L 38,87 L 39,80 Z',
  },

  // RIGHT CALF (gastrocnemius)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 60,74 L 55,74 L 54,80 L 55,87 L 57,92 L 60,92 L 62,87 L 61,80 Z',
  },
];

export function BodyMap({ gender, muscleData, onMuscleSelect }: BodyMapProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [debugMode, setDebugMode] = useState(false);
  const [debugTapCount, setDebugTapCount] = useState(0);

  // Tap legend 5 times to toggle debug mode
  const handleLegendTap = () => {
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);
    if (newCount >= 5) {
      setDebugMode(!debugMode);
      setDebugTapCount(0);
    }
    // Reset count after 2 seconds of no taps
    setTimeout(() => setDebugTapCount(0), 2000);
  };

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
                  fill={isSelected ? `${color}` : isHovered ? `${color}` : debugMode ? 'rgba(201, 167, 90, 0.1)' : 'transparent'}
                  fillOpacity={isSelected ? 0.4 : isHovered ? 0.25 : debugMode ? 0.3 : 0}
                  stroke={isSelected ? color : isHovered ? color : debugMode ? '#C9A75A' : 'transparent'}
                  strokeWidth={isSelected ? 0.8 : isHovered ? 0.5 : debugMode ? 0.3 : 0}
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

      {/* Legend - tap 5 times to toggle debug mode */}
      <div
        className="flex justify-center gap-3 mt-4 flex-wrap"
        onClick={handleLegendTap}
        style={{ cursor: 'pointer' }}
      >
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

      {/* Debug indicator */}
      {debugMode && (
        <p className="text-center mt-1" style={{ color: '#C9A75A', fontSize: '0.625rem' }}>
          Debug mode ON - polygon outlines visible
        </p>
      )}

      {/* Tap instruction */}
      <p className="text-center mt-2" style={{ color: 'rgba(245, 241, 234, 0.4)', fontSize: '0.625rem' }}>
        Tap a muscle group for detailed stats
      </p>
    </div>
  );
}
