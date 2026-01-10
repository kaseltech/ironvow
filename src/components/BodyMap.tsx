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

// SVG polygon paths - calibrated from actual rendered screenshots
// Coordinates measured from how the image appears in the app viewport
// Body spans roughly x:35-65%, y:28-95%

const frontMusclePolygons = [
  // TRAPS - small visible area at neck base
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 45,36 L 50,35 L 55,36 L 54,39 L 50,40 L 46,39 Z',
  },

  // LEFT SHOULDER (Deltoid)
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 45,37 L 42,38 L 37,40 L 34,43 L 35,47 L 38,47 L 42,44 L 45,40 Z',
  },

  // RIGHT SHOULDER (Deltoid)
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 55,37 L 58,38 L 63,40 L 66,43 L 65,47 L 62,47 L 58,44 L 55,40 Z',
  },

  // LEFT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 45,40 L 42,44 L 40,48 L 41,52 L 45,53 L 50,51 L 50,42 L 46,39 Z',
  },

  // RIGHT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 55,40 L 58,44 L 60,48 L 59,52 L 55,53 L 50,51 L 50,42 L 54,39 Z',
  },

  // LEFT BICEP
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 35,47 L 34,43 L 32,46 L 31,52 L 32,58 L 35,59 L 38,56 L 38,50 Z',
  },

  // RIGHT BICEP
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 65,47 L 66,43 L 68,46 L 69,52 L 68,58 L 65,59 L 62,56 L 62,50 Z',
  },

  // LEFT FOREARM
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 32,58 L 30,64 L 29,70 L 31,73 L 35,71 L 36,66 L 36,60 L 35,59 Z',
  },

  // RIGHT FOREARM
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 68,58 L 70,64 L 71,70 L 69,73 L 65,71 L 64,66 L 64,60 L 65,59 Z',
  },

  // ABS (Core)
  {
    id: 'core',
    name: 'Abs',
    path: 'M 46,53 L 54,53 L 54,66 L 52,68 L 48,68 L 46,66 Z',
  },

  // LEFT OBLIQUE
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 41,52 L 45,53 L 46,53 L 46,66 L 43,67 L 40,64 L 40,57 Z',
  },

  // RIGHT OBLIQUE
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 59,52 L 55,53 L 54,53 L 54,66 L 57,67 L 60,64 L 60,57 Z',
  },

  // LEFT QUAD
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 40,69 L 43,69 L 48,70 L 48,78 L 46,84 L 43,86 L 40,84 L 38,78 L 39,72 Z',
  },

  // RIGHT QUAD
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 60,69 L 57,69 L 52,70 L 52,78 L 54,84 L 57,86 L 60,84 L 62,78 L 61,72 Z',
  },

  // LEFT INNER THIGH (Adductor) - separate small area on left inner thigh
  {
    id: 'adductors',
    name: 'Left Inner Thigh',
    path: 'M 48,70 L 50,71 L 50,77 L 48,78 Z',
  },

  // RIGHT INNER THIGH (Adductor) - separate small area on right inner thigh
  {
    id: 'adductors',
    name: 'Right Inner Thigh',
    path: 'M 52,70 L 50,71 L 50,77 L 52,78 Z',
  },

  // LEFT CALF
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 43,86 L 46,86 L 47,91 L 46,96 L 43,96 L 42,91 Z',
  },

  // RIGHT CALF
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 57,86 L 54,86 L 53,91 L 54,96 L 57,96 L 58,91 Z',
  },
];

// Back view polygons - calibrated from actual rendered screenshots
// Same coordinate system as front view
const backMusclePolygons = [
  // TRAPS - large diamond/kite shape from neck to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,35 L 44,38 L 40,42 L 42,48 L 46,52 L 50,54 L 54,52 L 58,48 L 60,42 L 56,38 Z',
  },

  // LEFT REAR DELT
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 40,42 L 36,40 L 33,42 L 34,46 L 36,48 L 40,46 Z',
  },

  // RIGHT REAR DELT
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 60,42 L 64,40 L 67,42 L 66,46 L 64,48 L 60,46 Z',
  },

  // LEFT LAT - large fan-shaped muscle
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 40,46 L 36,48 L 35,54 L 37,60 L 40,65 L 45,66 L 46,62 L 45,54 L 42,49 Z',
  },

  // RIGHT LAT
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 60,46 L 64,48 L 65,54 L 63,60 L 60,65 L 55,66 L 54,62 L 55,54 L 58,49 Z',
  },

  // UPPER BACK (Rhomboids)
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 46,52 L 50,54 L 54,52 L 54,56 L 54,60 L 50,62 L 46,60 L 46,56 Z',
  },

  // LOWER BACK (Erectors)
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 46,60 L 50,62 L 54,60 L 54,66 L 52,69 L 50,70 L 48,69 L 46,66 Z',
  },

  // LEFT TRICEP
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 36,48 L 34,46 L 32,50 L 32,56 L 33,61 L 36,62 L 38,58 L 38,52 Z',
  },

  // RIGHT TRICEP
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 64,48 L 66,46 L 68,50 L 68,56 L 67,61 L 64,62 L 62,58 L 62,52 Z',
  },

  // LEFT FOREARM (back)
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 33,61 L 31,66 L 30,72 L 32,75 L 36,73 L 37,68 L 36,63 L 36,62 Z',
  },

  // RIGHT FOREARM (back)
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 67,61 L 69,66 L 70,72 L 68,75 L 64,73 L 63,68 L 64,63 L 64,62 Z',
  },

  // LEFT GLUTE
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 45,66 L 48,69 L 50,70 L 50,76 L 46,77 L 41,75 L 40,70 L 42,67 Z',
  },

  // RIGHT GLUTE
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 55,66 L 52,69 L 50,70 L 50,76 L 54,77 L 59,75 L 60,70 L 58,67 Z',
  },

  // LEFT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 41,75 L 46,77 L 48,79 L 47,86 L 44,89 L 41,89 L 38,84 L 39,78 Z',
  },

  // RIGHT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 59,75 L 54,77 L 52,79 L 53,86 L 56,89 L 59,89 L 62,84 L 61,78 Z',
  },

  // LEFT CALF (gastrocnemius)
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 41,89 L 45,89 L 46,93 L 45,97 L 42,97 L 41,93 Z',
  },

  // RIGHT CALF (gastrocnemius)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 59,89 L 55,89 L 54,93 L 55,97 L 58,97 L 59,93 Z',
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
