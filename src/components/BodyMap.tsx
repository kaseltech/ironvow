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
  // TRAPS - small visible area at base of neck
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 46,13 L 50,12 L 54,13 L 53,16 L 50,17 L 47,16 Z',
  },

  // LEFT SHOULDER (Deltoid) - rounded cap shape
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 46,14 L 43,15 L 40,17 L 38,20 L 38,23 L 40,24 L 43,22 L 46,18 Z',
  },

  // RIGHT SHOULDER (Deltoid) - rounded cap shape
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 54,14 L 57,15 L 60,17 L 62,20 L 62,23 L 60,24 L 57,22 L 54,18 Z',
  },

  // LEFT CHEST (Pectoral) - curved pec shape
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 46,17 L 43,18 L 40,21 L 39,25 L 41,29 L 46,30 L 50,28 L 50,20 L 47,17 Z',
  },

  // RIGHT CHEST (Pectoral) - curved pec shape
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 54,17 L 57,18 L 60,21 L 61,25 L 59,29 L 54,30 L 50,28 L 50,20 L 53,17 Z',
  },

  // LEFT BICEP - curved arm shape
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 40,24 L 38,23 L 36,26 L 35,30 L 36,34 L 38,35 L 40,32 L 40,27 Z',
  },

  // RIGHT BICEP - curved arm shape
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 60,24 L 62,23 L 64,26 L 65,30 L 64,34 L 62,35 L 60,32 L 60,27 Z',
  },

  // LEFT FOREARM - tapered shape
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 38,35 L 36,34 L 34,39 L 33,45 L 35,49 L 38,47 L 39,42 L 38,37 Z',
  },

  // RIGHT FOREARM - tapered shape
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 62,35 L 64,34 L 66,39 L 67,45 L 65,49 L 62,47 L 61,42 L 62,37 Z',
  },

  // ABS (Core) - narrower center column
  {
    id: 'core',
    name: 'Abs',
    path: 'M 46,30 L 54,30 L 54,44 L 52,47 L 48,47 L 46,44 Z',
  },

  // LEFT OBLIQUE - side of torso
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 41,29 L 45,30 L 46,30 L 46,44 L 43,46 L 40,43 L 40,32 Z',
  },

  // RIGHT OBLIQUE - side of torso
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 59,29 L 55,30 L 54,30 L 54,44 L 57,46 L 60,43 L 60,32 Z',
  },

  // LEFT QUAD - tapered leg shape following muscle contours
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 40,50 L 44,50 L 48,51 L 48,55 L 47,62 L 45,68 L 42,70 L 40,68 L 39,60 L 39,53 Z',
  },

  // RIGHT QUAD - tapered leg shape
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 60,50 L 56,50 L 52,51 L 52,55 L 53,62 L 55,68 L 58,70 L 60,68 L 61,60 L 61,53 Z',
  },

  // LEFT INNER THIGH (Adductor) - small inner area
  {
    id: 'adductors',
    name: 'Left Inner Thigh',
    path: 'M 48,51 L 50,52 L 50,58 L 48,59 Z',
  },

  // RIGHT INNER THIGH (Adductor)
  {
    id: 'adductors',
    name: 'Right Inner Thigh',
    path: 'M 52,51 L 50,52 L 50,58 L 52,59 Z',
  },

  // LEFT CALF - diamond calf shape
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 42,73 L 46,73 L 47,78 L 46,85 L 44,88 L 42,85 L 41,78 Z',
  },

  // RIGHT CALF - diamond calf shape
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 58,73 L 54,73 L 53,78 L 54,85 L 56,88 L 58,85 L 59,78 Z',
  },
];

// Back view polygons - improved shapes to match muscle contours
const backMusclePolygons = [
  // TRAPS - kite/diamond shape from neck to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,12 L 44,15 L 42,20 L 44,28 L 47,32 L 50,33 L 53,32 L 56,28 L 58,20 L 56,15 Z',
  },

  // LEFT REAR DELT - rounded shoulder cap
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 44,15 L 40,17 L 38,20 L 38,23 L 40,24 L 43,22 L 44,18 Z',
  },

  // RIGHT REAR DELT - rounded shoulder cap
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 56,15 L 60,17 L 62,20 L 62,23 L 60,24 L 57,22 L 56,18 Z',
  },

  // LEFT LAT - fan shape
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 44,22 L 41,24 L 39,30 L 40,38 L 43,43 L 47,44 L 47,36 L 45,28 L 44,24 Z',
  },

  // RIGHT LAT - fan shape
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 56,22 L 59,24 L 61,30 L 60,38 L 57,43 L 53,44 L 53,36 L 55,28 L 56,24 Z',
  },

  // UPPER BACK (Rhomboids) - between shoulder blades
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 47,26 L 50,27 L 53,26 L 53,33 L 50,34 L 47,33 Z',
  },

  // LOWER BACK (Erectors) - center column
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 46,36 L 50,38 L 54,36 L 54,43 L 52,46 L 48,46 L 46,43 Z',
  },

  // LEFT TRICEP - curved arm shape
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 40,24 L 38,23 L 36,27 L 36,32 L 38,35 L 40,35 L 41,31 L 40,27 Z',
  },

  // RIGHT TRICEP - curved arm shape
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 60,24 L 62,23 L 64,27 L 64,32 L 62,35 L 60,35 L 59,31 L 60,27 Z',
  },

  // LEFT FOREARM (back) - tapered
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 38,35 L 36,34 L 34,40 L 34,46 L 36,49 L 39,47 L 39,41 L 38,37 Z',
  },

  // RIGHT FOREARM (back) - tapered
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 62,35 L 64,34 L 66,40 L 66,46 L 64,49 L 61,47 L 61,41 L 62,37 Z',
  },

  // LEFT GLUTE - rounded shape
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 42,44 L 46,47 L 50,48 L 50,54 L 46,55 L 42,52 L 40,48 Z',
  },

  // RIGHT GLUTE - rounded shape
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 58,44 L 54,47 L 50,48 L 50,54 L 54,55 L 58,52 L 60,48 Z',
  },

  // LEFT HAMSTRING - tapered leg shape
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 42,53 L 46,55 L 48,56 L 47,66 L 45,72 L 42,72 L 40,66 L 40,58 Z',
  },

  // RIGHT HAMSTRING - tapered leg shape
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 58,53 L 54,55 L 52,56 L 53,66 L 55,72 L 58,72 L 60,66 L 60,58 Z',
  },

  // LEFT CALF (gastrocnemius) - diamond shape
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 42,73 L 46,73 L 47,79 L 46,86 L 44,88 L 42,86 L 41,79 Z',
  },

  // RIGHT CALF (gastrocnemius) - diamond shape
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 58,73 L 54,73 L 53,79 L 54,86 L 56,88 L 58,86 L 59,79 Z',
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
          {/* CRITICAL: No preserveAspectRatio so image fills exactly 0-100 in both dimensions */}
          <svg
            viewBox="0 0 100 100"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              aspectRatio: '1 / 1',
            }}
          >
            {/* Embedded image - stretches to fill viewBox exactly for coordinate alignment */}
            <image
              href={imageSrc}
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="none"
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
