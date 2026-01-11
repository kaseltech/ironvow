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
    path: 'M 45,12 L 50,11 L 55,12 L 54,16 L 50,17 L 46,16 Z',
  },

  // LEFT SHOULDER (Deltoid) - narrower
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 45,14 L 41,15 L 37,18 L 36,22 L 38,24 L 41,23 L 43,20 L 45,17 Z',
  },

  // RIGHT SHOULDER (Deltoid) - narrower
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 55,14 L 59,15 L 63,18 L 64,22 L 62,24 L 59,23 L 57,20 L 55,17 Z',
  },

  // LEFT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 45,17 L 41,20 L 39,24 L 40,29 L 44,30 L 50,28 L 50,18 L 46,16 Z',
  },

  // RIGHT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 55,17 L 59,20 L 61,24 L 60,29 L 56,30 L 50,28 L 50,18 L 54,16 Z',
  },

  // LEFT BICEP - shifted inward more aggressively
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 38,24 L 36,22 L 34,25 L 33,30 L 35,35 L 37,35 L 39,31 L 39,26 Z',
  },

  // RIGHT BICEP - shifted inward more aggressively
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 62,24 L 64,22 L 66,25 L 67,30 L 65,35 L 63,35 L 61,31 L 61,26 Z',
  },

  // LEFT FOREARM - shifted inward more aggressively
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 35,35 L 33,40 L 32,46 L 34,50 L 37,48 L 38,43 L 37,38 L 37,35 Z',
  },

  // RIGHT FOREARM - shifted inward more aggressively
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 65,35 L 67,40 L 68,46 L 66,50 L 63,48 L 62,43 L 63,38 L 63,35 Z',
  },

  // ABS (Core) - center column
  {
    id: 'core',
    name: 'Abs',
    path: 'M 45,30 L 55,30 L 55,45 L 52,48 L 48,48 L 45,45 Z',
  },

  // LEFT OBLIQUE - shifted inward by 2
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 40,29 L 44,30 L 45,30 L 45,45 L 42,46 L 38,43 L 38,32 Z',
  },

  // RIGHT OBLIQUE - shifted inward by 2
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 60,29 L 56,30 L 55,30 L 55,45 L 58,46 L 62,43 L 62,32 Z',
  },

  // LEFT QUAD - shifted inward slightly
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 38,51 L 43,51 L 48,52 L 48,67 L 45,72 L 41,72 L 38,67 L 37,59 Z',
  },

  // RIGHT QUAD - shifted inward slightly
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 62,51 L 57,51 L 52,52 L 52,67 L 55,72 L 59,72 L 62,67 L 63,59 Z',
  },

  // LEFT INNER THIGH (Adductor)
  {
    id: 'adductors',
    name: 'Left Inner Thigh',
    path: 'M 48,52 L 50,53 L 50,61 L 48,62 Z',
  },

  // RIGHT INNER THIGH (Adductor)
  {
    id: 'adductors',
    name: 'Right Inner Thigh',
    path: 'M 52,52 L 50,53 L 50,61 L 52,62 Z',
  },

  // LEFT CALF - shifted inward slightly
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 41,75 L 46,75 L 47,83 L 46,91 L 42,91 L 40,83 Z',
  },

  // RIGHT CALF - shifted inward slightly
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 59,75 L 54,75 L 53,83 L 54,91 L 58,91 L 60,83 Z',
  },
];

// Back view polygons - shifted inward to match front view adjustments
const backMusclePolygons = [
  // TRAPS - large kite/diamond shape from neck down to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,11 L 43,14 L 40,18 L 42,26 L 45,32 L 50,34 L 55,32 L 58,26 L 60,18 L 57,14 Z',
  },

  // LEFT REAR DELT - narrower
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 42,16 L 38,18 L 36,21 L 38,24 L 40,24 L 42,20 Z',
  },

  // RIGHT REAR DELT - narrower
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 58,16 L 62,18 L 64,21 L 62,24 L 60,24 L 58,20 Z',
  },

  // LEFT LAT - narrower
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 42,20 L 39,22 L 38,28 L 39,36 L 42,42 L 46,43 L 46,36 L 44,28 L 43,22 Z',
  },

  // RIGHT LAT - narrower
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 58,20 L 61,22 L 62,28 L 61,36 L 58,42 L 54,43 L 54,36 L 56,28 L 57,22 Z',
  },

  // UPPER BACK (Rhomboids)
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 45,26 L 50,28 L 55,26 L 55,34 L 50,36 L 45,34 Z',
  },

  // LOWER BACK (Erectors)
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 45,37 L 50,39 L 55,37 L 55,44 L 52,47 L 48,47 L 45,44 Z',
  },

  // LEFT TRICEP - narrower
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 38,24 L 36,22 L 34,26 L 34,31 L 36,36 L 38,36 L 40,32 L 39,27 Z',
  },

  // RIGHT TRICEP - narrower
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 62,24 L 64,22 L 66,26 L 66,31 L 64,36 L 62,36 L 60,32 L 61,27 Z',
  },

  // LEFT FOREARM (back) - narrower
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 36,36 L 34,41 L 33,47 L 35,50 L 38,48 L 39,43 L 38,38 L 38,36 Z',
  },

  // RIGHT FOREARM (back) - narrower
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 64,36 L 66,41 L 67,47 L 65,50 L 62,48 L 61,43 L 62,38 L 62,36 Z',
  },

  // LEFT GLUTE - shifted inward
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 40,43 L 45,47 L 50,48 L 50,55 L 45,56 L 40,53 L 38,48 Z',
  },

  // RIGHT GLUTE - shifted inward
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 60,43 L 55,47 L 50,48 L 50,55 L 55,56 L 60,53 L 62,48 Z',
  },

  // LEFT HAMSTRING - shifted inward
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 40,54 L 45,56 L 48,57 L 47,69 L 44,74 L 40,74 L 38,67 L 38,59 Z',
  },

  // RIGHT HAMSTRING - shifted inward
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 60,54 L 55,56 L 52,57 L 53,69 L 56,74 L 60,74 L 62,67 L 62,59 Z',
  },

  // LEFT CALF (gastrocnemius) - shifted inward
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 40,75 L 45,75 L 47,81 L 46,89 L 42,89 L 39,81 Z',
  },

  // RIGHT CALF (gastrocnemius) - shifted inward
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 60,75 L 55,75 L 53,81 L 54,89 L 58,89 L 61,81 Z',
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
