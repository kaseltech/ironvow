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

// SVG polygon paths - traced from white lines in male_front.png
// Image is 1024x1024, figure spans roughly x:27-73%, y:6-96%
// Using viewBox 0-100, coordinates are percentages

const frontMusclePolygons = [
  // TRAPS - small visible area at neck base between shoulder caps
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 43,12.5 L 50,11.5 L 57,12.5 L 55,15.5 L 50,16 L 45,15.5 Z',
  },

  // LEFT SHOULDER (Deltoid) - rounded cap following white outline
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 43,14 L 39,15 L 33,16.5 L 29,18.5 L 28.5,21.5 L 30,24 L 35,23.5 L 39,21 L 43,17 Z',
  },

  // RIGHT SHOULDER (Deltoid) - mirror
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 57,14 L 61,15 L 67,16.5 L 71,18.5 L 71.5,21.5 L 70,24 L 65,23.5 L 61,21 L 57,17 Z',
  },

  // LEFT CHEST (Pectoral) - follows curved pec outline
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 43,17 L 39,21 L 37.5,25 L 38,29 L 43,30.5 L 50,28.5 L 50,18 L 45,15.5 Z',
  },

  // RIGHT CHEST (Pectoral)
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 57,17 L 61,21 L 62.5,25 L 62,29 L 57,30.5 L 50,28.5 L 50,18 L 55,15.5 Z',
  },

  // LEFT BICEP - front of upper arm
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 30,24 L 28.5,21.5 L 27.5,25 L 27,31 L 28,37 L 31,38.5 L 34.5,36 L 35,29 L 34,24 Z',
  },

  // RIGHT BICEP
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 70,24 L 71.5,21.5 L 72.5,25 L 73,31 L 72,37 L 69,38.5 L 65.5,36 L 65,29 L 66,24 Z',
  },

  // LEFT FOREARM
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 28,37 L 26.5,43 L 26,49 L 27,53 L 31,52 L 33,46 L 33,40 L 31,38.5 Z',
  },

  // RIGHT FOREARM
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 72,37 L 73.5,43 L 74,49 L 73,53 L 69,52 L 67,46 L 67,40 L 69,38.5 Z',
  },

  // ABS (Core) - center column
  {
    id: 'core',
    name: 'Abs',
    path: 'M 44.5,30.5 L 55.5,30.5 L 55.5,46 L 53,47.5 L 47,47.5 L 44.5,46 Z',
  },

  // LEFT OBLIQUE - side of torso
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 38,29 L 43,30.5 L 44.5,30.5 L 44.5,46 L 41,47 L 37.5,44 L 37,37 L 37.5,32 Z',
  },

  // RIGHT OBLIQUE
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 62,29 L 57,30.5 L 55.5,30.5 L 55.5,46 L 59,47 L 62.5,44 L 63,37 L 62.5,32 Z',
  },

  // LEFT QUAD - front thigh with natural curve
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 37.5,48 L 41,48 L 47,49 L 48,55 L 47,63 L 45,70 L 41,72.5 L 37,70 L 35.5,62 L 36,54 Z',
  },

  // RIGHT QUAD
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 62.5,48 L 59,48 L 53,49 L 52,55 L 53,63 L 55,70 L 59,72.5 L 63,70 L 64.5,62 L 64,54 Z',
  },

  // ADDUCTORS - inner thighs (curved V shape, not pointy)
  {
    id: 'adductors',
    name: 'Inner Thighs',
    path: 'M 47,49 L 53,49 L 52,55 L 51.5,61 L 50,64 L 48.5,61 L 48,55 Z',
  },

  // LEFT CALF - tibialis anterior (front shin)
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 41,72.5 L 45,72.5 L 46,79 L 45.5,86 L 44,92 L 40.5,92 L 39,86 L 39.5,79 Z',
  },

  // RIGHT CALF
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 59,72.5 L 55,72.5 L 54,79 L 54.5,86 L 56,92 L 59.5,92 L 61,86 L 60.5,79 Z',
  },
];

// Back view polygons - traced from white lines in male_back.png
// Same coordinate system as front view
const backMusclePolygons = [
  // TRAPS - large diamond/kite shape from neck to mid-back
  {
    id: 'traps',
    name: 'Traps',
    path: 'M 50,11.5 L 43,14 L 38,18 L 40,24 L 45,28 L 50,31 L 55,28 L 60,24 L 62,18 L 57,14 Z',
  },

  // LEFT REAR DELT - rounded shoulder cap
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 38,18 L 33,16.5 L 29,18.5 L 28.5,22 L 30,24.5 L 35,24 L 40,21 Z',
  },

  // RIGHT REAR DELT
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 62,18 L 67,16.5 L 71,18.5 L 71.5,22 L 70,24.5 L 65,24 L 60,21 Z',
  },

  // LEFT LAT - large fan-shaped muscle on side of back
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 40,21 L 35,24 L 33,30 L 34,38 L 37,44 L 43,46 L 45,42 L 45,32 L 42,26 Z',
  },

  // RIGHT LAT
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 60,21 L 65,24 L 67,30 L 66,38 L 63,44 L 57,46 L 55,42 L 55,32 L 58,26 Z',
  },

  // UPPER BACK (Rhomboids) - between shoulder blades
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 45,28 L 50,31 L 55,28 L 55,32 L 55,38 L 50,41 L 45,38 L 45,32 Z',
  },

  // LOWER BACK (Erectors) - center column
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 45,38 L 50,41 L 55,38 L 55,44 L 53,48 L 50,49.5 L 47,48 L 45,44 Z',
  },

  // LEFT TRICEP - back of upper arm
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 30,24.5 L 28.5,22 L 27,26 L 27,32 L 28,38 L 31,39 L 34,36 L 34.5,30 L 33,25 Z',
  },

  // RIGHT TRICEP
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 70,24.5 L 71.5,22 L 73,26 L 73,32 L 72,38 L 69,39 L 66,36 L 65.5,30 L 67,25 Z',
  },

  // LEFT FOREARM (back)
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 28,38 L 26.5,44 L 26,50 L 27,53 L 31,52 L 32.5,46 L 32,40 L 31,39 Z',
  },

  // RIGHT FOREARM (back)
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 72,38 L 73.5,44 L 74,50 L 73,53 L 69,52 L 67.5,46 L 68,40 L 69,39 Z',
  },

  // LEFT GLUTE - rounded shape
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 43,46 L 47,48 L 50,49.5 L 50,56.5 L 46,58 L 39,55 L 37,50 L 39,47 Z',
  },

  // RIGHT GLUTE
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 57,46 L 53,48 L 50,49.5 L 50,56.5 L 54,58 L 61,55 L 63,50 L 61,47 Z',
  },

  // LEFT HAMSTRING - back of thigh
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 39,55 L 46,58 L 48,61 L 47,69 L 44,74 L 40,74 L 36.5,68 L 36,60 L 37,56 Z',
  },

  // RIGHT HAMSTRING
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 61,55 L 54,58 L 52,61 L 53,69 L 56,74 L 60,74 L 63.5,68 L 64,60 L 63,56 Z',
  },

  // LEFT CALF (gastrocnemius) - diamond shape on back of lower leg
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 40,74 L 45,74 L 46.5,80 L 45.5,87 L 43.5,92 L 40,92 L 38,87 L 39,80 Z',
  },

  // RIGHT CALF (gastrocnemius)
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 60,74 L 55,74 L 53.5,80 L 54.5,87 L 56.5,92 L 60,92 L 62,87 L 61,80 Z',
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
