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
  // TRAPS - visible at neck base between shoulder caps
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 46,14 L 50,13 L 54,14 L 53,17 L 50,18 L 47,17 Z',
  },

  // LEFT SHOULDER (Deltoid) - rounded cap wrapping arm top
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 46,15 L 44,16 L 41,18 L 39,21 L 39,24 L 41,25 L 44,23 L 46,19 Z',
  },

  // RIGHT SHOULDER (Deltoid) - rounded cap wrapping arm top
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 54,15 L 56,16 L 59,18 L 61,21 L 61,24 L 59,25 L 56,23 L 54,19 Z',
  },

  // LEFT CHEST (Pectoral) - curved bottom edge sweeps UP to sternum
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 46,18 L 44,19 L 41,22 L 40,26 L 42,29 L 46,27 L 50,25 L 50,19 L 47,17 Z',
  },

  // RIGHT CHEST (Pectoral) - curved bottom edge sweeps UP to sternum
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 54,18 L 56,19 L 59,22 L 60,26 L 58,29 L 54,27 L 50,25 L 50,19 L 53,17 Z',
  },

  // LEFT BICEP - follows arm curve, bulges in middle
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 41,25 L 39,24 L 37,27 L 36,31 L 37,35 L 39,36 L 41,33 L 41,28 Z',
  },

  // RIGHT BICEP - follows arm curve, bulges in middle
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 59,25 L 61,24 L 63,27 L 64,31 L 63,35 L 61,36 L 59,33 L 59,28 Z',
  },

  // LEFT FOREARM - tapered, wider at elbow
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 39,36 L 37,35 L 35,40 L 34,46 L 36,50 L 39,48 L 40,43 L 39,38 Z',
  },

  // RIGHT FOREARM - tapered, wider at elbow
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 61,36 L 63,35 L 65,40 L 66,46 L 64,50 L 61,48 L 60,43 L 61,38 Z',
  },

  // ABS (Core) - center column with segments
  {
    id: 'core',
    name: 'Abs',
    path: 'M 46,27 L 54,27 L 54,44 L 52,47 L 48,47 L 46,44 Z',
  },

  // LEFT OBLIQUE - side waist area
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 42,28 L 45,27 L 46,27 L 46,44 L 44,46 L 41,44 L 40,35 Z',
  },

  // RIGHT OBLIQUE - side waist area
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 58,28 L 55,27 L 54,27 L 54,44 L 56,46 L 59,44 L 60,35 Z',
  },

  // LEFT QUAD - follows leg muscle lines, outer sweep
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 41,49 L 45,48 L 48,49 L 48,54 L 47,61 L 45,67 L 43,69 L 40,67 L 39,59 L 40,52 Z',
  },

  // RIGHT QUAD - follows leg muscle lines, outer sweep
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 59,49 L 55,48 L 52,49 L 52,54 L 53,61 L 55,67 L 57,69 L 60,67 L 61,59 L 60,52 Z',
  },

  // LEFT INNER THIGH (Adductor) - inner thigh muscle
  {
    id: 'adductors',
    name: 'Left Inner Thigh',
    path: 'M 48,49 L 50,50 L 50,57 L 48,58 Z',
  },

  // RIGHT INNER THIGH (Adductor)
  {
    id: 'adductors',
    name: 'Right Inner Thigh',
    path: 'M 52,49 L 50,50 L 50,57 L 52,58 Z',
  },

  // LEFT CALF - follows calf muscle shape
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 43,72 L 46,72 L 47,77 L 46,84 L 44,87 L 42,84 L 42,77 Z',
  },

  // RIGHT CALF - follows calf muscle shape
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 57,72 L 54,72 L 53,77 L 54,84 L 56,87 L 58,84 L 58,77 Z',
  },
];

// Back view polygons - traced from muscle boundary lines in image
const backMusclePolygons = [
  // TRAPS - large kite shape following visible lines from neck to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,13 L 45,16 L 43,21 L 45,29 L 48,33 L 50,34 L 52,33 L 55,29 L 57,21 L 55,16 Z',
  },

  // LEFT REAR DELT - rounded cap at back of shoulder
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 45,16 L 42,18 L 40,21 L 40,24 L 42,25 L 44,23 L 45,19 Z',
  },

  // RIGHT REAR DELT - rounded cap at back of shoulder
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 55,16 L 58,18 L 60,21 L 60,24 L 58,25 L 56,23 L 55,19 Z',
  },

  // LEFT LAT - large fan shape on side
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 45,23 L 42,25 L 40,31 L 41,39 L 44,44 L 48,45 L 48,37 L 46,29 L 45,25 Z',
  },

  // RIGHT LAT - large fan shape on side
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 55,23 L 58,25 L 60,31 L 59,39 L 56,44 L 52,45 L 52,37 L 54,29 L 55,25 Z',
  },

  // UPPER BACK (Rhomboids) - center area between shoulder blades
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 48,27 L 50,28 L 52,27 L 52,34 L 50,35 L 48,34 Z',
  },

  // LOWER BACK (Erectors) - center spinal area
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 47,37 L 50,39 L 53,37 L 53,44 L 51,46 L 49,46 L 47,44 Z',
  },

  // LEFT TRICEP - back of upper arm
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 42,25 L 40,24 L 38,28 L 38,33 L 40,36 L 42,36 L 43,32 L 42,28 Z',
  },

  // RIGHT TRICEP - back of upper arm
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 58,25 L 60,24 L 62,28 L 62,33 L 60,36 L 58,36 L 57,32 L 58,28 Z',
  },

  // LEFT FOREARM (back) - tapered toward wrist
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 40,36 L 38,35 L 36,41 L 35,47 L 37,50 L 40,48 L 41,43 L 40,38 Z',
  },

  // RIGHT FOREARM (back) - tapered toward wrist
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 60,36 L 62,35 L 64,41 L 65,47 L 63,50 L 60,48 L 59,43 L 60,38 Z',
  },

  // LEFT GLUTE - large rounded shape
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 43,45 L 47,48 L 50,49 L 50,55 L 46,56 L 42,53 L 41,49 Z',
  },

  // RIGHT GLUTE - large rounded shape
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 57,45 L 53,48 L 50,49 L 50,55 L 54,56 L 58,53 L 59,49 Z',
  },

  // LEFT HAMSTRING - follows back of thigh muscle lines
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 43,54 L 46,56 L 48,57 L 47,67 L 45,72 L 43,72 L 41,67 L 41,59 Z',
  },

  // RIGHT HAMSTRING - follows back of thigh muscle lines
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 57,54 L 54,56 L 52,57 L 53,67 L 55,72 L 57,72 L 59,67 L 59,59 Z',
  },

  // LEFT CALF (gastrocnemius) - diamond calf shape
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 43,73 L 46,73 L 47,78 L 46,85 L 44,87 L 42,85 L 42,78 Z',
  },

  // RIGHT CALF (gastrocnemius) - diamond calf shape
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 57,73 L 54,73 L 53,78 L 54,85 L 56,87 L 58,85 L 58,78 Z',
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
