'use client';

import { useState } from 'react';

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

// SVG polygon paths - measured directly from the 1024x1024 image
// Image analysis shows body positioned as follows in 0-100 coordinate space:
// - Head: y=5-12, centered at x=50
// - Traps: y=12-16
// - Shoulders: y=14-23, x=28-72 (full width)
// - Chest: y=18-30
// - Abs: y=30-47
// - Groin: y=47-52
// - Quads: y=52-72
// - Calves: y=76-93

const frontMusclePolygons = [
  // TRAPS - small visible area at base of neck between shoulders
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 44,12 L 50,11 L 56,12 L 55,16 L 50,17 L 45,16 Z',
  },

  // LEFT SHOULDER (Deltoid) - rounded cap on left arm
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 44,14 L 38,15 L 32,18 L 29,22 L 31,26 L 36,25 L 40,22 L 44,18 Z',
  },

  // RIGHT SHOULDER (Deltoid)
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 56,14 L 62,15 L 68,18 L 71,22 L 69,26 L 64,25 L 60,22 L 56,18 Z',
  },

  // LEFT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 44,17 L 40,20 L 37,24 L 38,29 L 43,30 L 50,28 L 50,18 L 45,16 Z',
  },

  // RIGHT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 56,17 L 60,20 L 63,24 L 62,29 L 57,30 L 50,28 L 50,18 L 55,16 Z',
  },

  // LEFT BICEP
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 31,26 L 28,23 L 25,27 L 24,33 L 26,38 L 30,38 L 33,34 L 33,28 Z',
  },

  // RIGHT BICEP
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 69,26 L 72,23 L 75,27 L 76,33 L 74,38 L 70,38 L 67,34 L 67,28 Z',
  },

  // LEFT FOREARM
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 26,38 L 24,44 L 22,50 L 24,54 L 29,52 L 31,46 L 30,40 L 30,38 Z',
  },

  // RIGHT FOREARM
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 74,38 L 76,44 L 78,50 L 76,54 L 71,52 L 69,46 L 70,40 L 70,38 Z',
  },

  // ABS (Core) - center column
  {
    id: 'core',
    name: 'Abs',
    path: 'M 44,30 L 56,30 L 56,46 L 53,48 L 47,48 L 44,46 Z',
  },

  // LEFT OBLIQUE
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 38,29 L 43,30 L 44,30 L 44,46 L 40,47 L 36,44 L 36,33 Z',
  },

  // RIGHT OBLIQUE
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 62,29 L 57,30 L 56,30 L 56,46 L 60,47 L 64,44 L 64,33 Z',
  },

  // LEFT QUAD
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 36,52 L 42,52 L 47,53 L 47,68 L 44,73 L 40,73 L 36,68 L 35,60 Z',
  },

  // RIGHT QUAD
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 64,52 L 58,52 L 53,53 L 53,68 L 56,73 L 60,73 L 64,68 L 65,60 Z',
  },

  // LEFT INNER THIGH (Adductor) - small area on inner thigh
  {
    id: 'adductors',
    name: 'Left Inner Thigh',
    path: 'M 47,53 L 50,54 L 50,62 L 47,63 Z',
  },

  // RIGHT INNER THIGH (Adductor)
  {
    id: 'adductors',
    name: 'Right Inner Thigh',
    path: 'M 53,53 L 50,54 L 50,62 L 53,63 Z',
  },

  // LEFT CALF (front - tibialis)
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 40,76 L 45,76 L 46,84 L 45,92 L 41,92 L 39,84 Z',
  },

  // RIGHT CALF (front - tibialis)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 60,76 L 55,76 L 54,84 L 55,92 L 59,92 L 61,84 Z',
  },
];

// Back view polygons - measured directly from the 1024x1024 back image
// Same coordinate system as front view
const backMusclePolygons = [
  // TRAPS - large kite/diamond shape from neck down to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,11 L 42,14 L 38,18 L 40,26 L 44,32 L 50,34 L 56,32 L 60,26 L 62,18 L 58,14 Z',
  },

  // LEFT REAR DELT
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 38,16 L 32,18 L 29,22 L 31,26 L 35,26 L 38,22 Z',
  },

  // RIGHT REAR DELT
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 62,16 L 68,18 L 71,22 L 69,26 L 65,26 L 62,22 Z',
  },

  // LEFT LAT - large fan-shaped muscle on side
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 38,22 L 34,24 L 32,30 L 34,38 L 38,44 L 44,45 L 44,38 L 42,30 L 40,24 Z',
  },

  // RIGHT LAT
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 62,22 L 66,24 L 68,30 L 66,38 L 62,44 L 56,45 L 56,38 L 58,30 L 60,24 Z',
  },

  // UPPER BACK (Rhomboids) - between shoulder blades
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 44,26 L 50,28 L 56,26 L 56,34 L 50,36 L 44,34 Z',
  },

  // LOWER BACK (Erectors) - center lower back
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 44,38 L 50,40 L 56,38 L 56,45 L 52,48 L 48,48 L 44,45 Z',
  },

  // LEFT TRICEP
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 31,26 L 28,24 L 25,28 L 25,34 L 27,40 L 31,40 L 33,35 L 32,29 Z',
  },

  // RIGHT TRICEP
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 69,26 L 72,24 L 75,28 L 75,34 L 73,40 L 69,40 L 67,35 L 68,29 Z',
  },

  // LEFT FOREARM (back)
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 27,40 L 24,46 L 22,52 L 25,55 L 30,53 L 31,47 L 31,42 L 31,40 Z',
  },

  // RIGHT FOREARM (back)
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 73,40 L 76,46 L 78,52 L 75,55 L 70,53 L 69,47 L 69,42 L 69,40 Z',
  },

  // LEFT GLUTE
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 38,44 L 44,48 L 50,49 L 50,56 L 44,57 L 38,54 L 36,49 Z',
  },

  // RIGHT GLUTE
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 62,44 L 56,48 L 50,49 L 50,56 L 56,57 L 62,54 L 64,49 Z',
  },

  // LEFT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 38,55 L 44,57 L 47,58 L 46,70 L 43,75 L 39,75 L 36,68 L 36,60 Z',
  },

  // RIGHT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 62,55 L 56,57 L 53,58 L 54,70 L 57,75 L 61,75 L 64,68 L 64,60 Z',
  },

  // LEFT CALF (gastrocnemius) - diamond shaped muscle
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 39,76 L 44,76 L 46,82 L 45,90 L 41,90 L 38,82 Z',
  },

  // RIGHT CALF (gastrocnemius)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 61,76 L 56,76 L 54,82 L 55,90 L 59,90 L 62,82 Z',
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

      {/* Body Image with SVG Overlay - image embedded in SVG for perfect alignment */}
      <div className="flex justify-center">
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {/* SVG contains both image and polygon regions for 1:1 coordinate alignment */}
          <svg
            viewBox="0 0 100 100"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Embedded image - same coordinate system as polygons */}
            <image
              href={imageSrc}
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: 'brightness(0.9)' }}
            />
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
