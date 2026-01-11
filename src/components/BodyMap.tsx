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
  selectedMuscleId?: string | null;
  onMuscleSelect?: (muscle: MuscleData) => void;
  view?: 'front' | 'back';
  onViewChange?: (view: 'front' | 'back') => void;
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
  // LEFT TRAP - sloped area from neck to left shoulder (not throat)
  {
    id: 'traps',
    name: 'Left Trap',
    path: 'M 46,15 L 48,14 L 48,17 L 44,19 L 42,18 L 44,16 Z',
  },

  // RIGHT TRAP - sloped area from neck to right shoulder (not throat)
  {
    id: 'traps',
    name: 'Right Trap',
    path: 'M 54,15 L 52,14 L 52,17 L 56,19 L 58,18 L 56,16 Z',
  },

  // LEFT SHOULDER (Deltoid) - smaller rounded cap
  {
    id: 'shoulders',
    name: 'Left Shoulder',
    path: 'M 44,18 L 41,19 L 39,22 L 40,24 L 42,24 L 44,21 Z',
  },

  // RIGHT SHOULDER (Deltoid) - smaller rounded cap
  {
    id: 'shoulders',
    name: 'Right Shoulder',
    path: 'M 56,18 L 59,19 L 61,22 L 60,24 L 58,24 L 56,21 Z',
  },

  // LEFT CHEST (Pectoral) - lower, follows pec muscle boundary
  {
    id: 'chest',
    name: 'Left Chest',
    path: 'M 44,21 L 42,23 L 41,27 L 43,30 L 47,29 L 50,27 L 50,23 L 46,21 Z',
  },

  // RIGHT CHEST (Pectoral) - lower, follows pec muscle boundary
  {
    id: 'chest',
    name: 'Right Chest',
    path: 'M 56,21 L 58,23 L 59,27 L 57,30 L 53,29 L 50,27 L 50,23 L 54,21 Z',
  },

  // LEFT BICEP - on the arm
  {
    id: 'biceps',
    name: 'Left Bicep',
    path: 'M 40,24 L 38,26 L 37,30 L 38,34 L 40,35 L 41,31 L 41,27 Z',
  },

  // RIGHT BICEP - on the arm
  {
    id: 'biceps',
    name: 'Right Bicep',
    path: 'M 60,24 L 62,26 L 63,30 L 62,34 L 60,35 L 59,31 L 59,27 Z',
  },

  // LEFT FOREARM - moved more left, better shape
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 38,35 L 36,37 L 34,43 L 35,48 L 37,49 L 39,45 L 39,39 Z',
  },

  // RIGHT FOREARM - moved more right, better shape
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 62,35 L 64,37 L 66,43 L 65,48 L 63,49 L 61,45 L 61,39 Z',
  },

  // ABS (Core) - center column
  {
    id: 'core',
    name: 'Abs',
    path: 'M 46,29 L 54,29 L 54,44 L 52,47 L 48,47 L 46,44 Z',
  },

  // LEFT OBLIQUE - side waist
  {
    id: 'obliques',
    name: 'Left Oblique',
    path: 'M 43,29 L 45,29 L 46,29 L 46,44 L 44,46 L 42,44 L 42,33 Z',
  },

  // RIGHT OBLIQUE - side waist
  {
    id: 'obliques',
    name: 'Right Oblique',
    path: 'M 57,29 L 55,29 L 54,29 L 54,44 L 56,46 L 58,44 L 58,33 Z',
  },

  // LEFT QUAD - front of thigh
  {
    id: 'quads',
    name: 'Left Quad',
    path: 'M 42,49 L 45,48 L 48,49 L 48,54 L 47,62 L 45,68 L 43,69 L 41,67 L 40,59 L 41,52 Z',
  },

  // RIGHT QUAD - front of thigh
  {
    id: 'quads',
    name: 'Right Quad',
    path: 'M 58,49 L 55,48 L 52,49 L 52,54 L 53,62 L 55,68 L 57,69 L 59,67 L 60,59 L 59,52 Z',
  },

  // LEFT INNER THIGH (Adductor)
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

  // No calves on front view - they're mainly visible from back
];

// Back view polygons - traced from muscle boundary lines in image
const backMusclePolygons = [
  // LEFT TRAP - sloped area from neck to left shoulder
  {
    id: 'traps',
    name: 'Left Trap',
    path: 'M 47,15 L 50,14 L 50,20 L 45,24 L 42,20 L 44,17 Z',
  },

  // RIGHT TRAP - sloped area from neck to right shoulder
  {
    id: 'traps',
    name: 'Right Trap',
    path: 'M 53,15 L 50,14 L 50,20 L 55,24 L 58,20 L 56,17 Z',
  },

  // LEFT REAR DELT - smaller rounded cap
  {
    id: 'shoulders',
    name: 'Left Rear Delt',
    path: 'M 44,19 L 41,20 L 39,23 L 40,25 L 42,25 L 44,22 Z',
  },

  // RIGHT REAR DELT - smaller rounded cap
  {
    id: 'shoulders',
    name: 'Right Rear Delt',
    path: 'M 56,19 L 59,20 L 61,23 L 60,25 L 58,25 L 56,22 Z',
  },

  // LEFT LAT - fan shape on side
  {
    id: 'lats',
    name: 'Left Lat',
    path: 'M 44,24 L 41,26 L 40,32 L 41,39 L 44,43 L 48,44 L 48,36 L 46,28 L 45,25 Z',
  },

  // RIGHT LAT - fan shape on side
  {
    id: 'lats',
    name: 'Right Lat',
    path: 'M 56,24 L 59,26 L 60,32 L 59,39 L 56,43 L 52,44 L 52,36 L 54,28 L 55,25 Z',
  },

  // UPPER BACK (Rhomboids) - center between shoulder blades
  {
    id: 'upper_back',
    name: 'Upper Back',
    path: 'M 48,26 L 50,27 L 52,26 L 52,33 L 50,34 L 48,33 Z',
  },

  // LOWER BACK (Erectors) - center spinal area
  {
    id: 'lower_back',
    name: 'Lower Back',
    path: 'M 47,36 L 50,38 L 53,36 L 53,43 L 51,45 L 49,45 L 47,43 Z',
  },

  // LEFT TRICEP - back of upper arm
  {
    id: 'triceps',
    name: 'Left Tricep',
    path: 'M 40,25 L 38,27 L 37,31 L 38,35 L 40,36 L 41,32 L 41,28 Z',
  },

  // RIGHT TRICEP - back of upper arm
  {
    id: 'triceps',
    name: 'Right Tricep',
    path: 'M 60,25 L 62,27 L 63,31 L 62,35 L 60,36 L 59,32 L 59,28 Z',
  },

  // LEFT FOREARM (back) - moved more left
  {
    id: 'forearms',
    name: 'Left Forearm',
    path: 'M 38,36 L 36,38 L 34,44 L 35,49 L 37,50 L 39,46 L 39,40 Z',
  },

  // RIGHT FOREARM (back) - moved more right
  {
    id: 'forearms',
    name: 'Right Forearm',
    path: 'M 62,36 L 64,38 L 66,44 L 65,49 L 63,50 L 61,46 L 61,40 Z',
  },

  // LEFT GLUTE - moved up, better rounded shape
  {
    id: 'glutes',
    name: 'Left Glute',
    path: 'M 43,43 L 47,45 L 50,46 L 50,52 L 46,53 L 42,50 L 41,46 Z',
  },

  // RIGHT GLUTE - moved up, better rounded shape
  {
    id: 'glutes',
    name: 'Right Glute',
    path: 'M 57,43 L 53,45 L 50,46 L 50,52 L 54,53 L 58,50 L 59,46 Z',
  },

  // LEFT HAMSTRING - moved up, starts below glutes
  {
    id: 'hamstrings',
    name: 'Left Hamstring',
    path: 'M 42,51 L 46,53 L 48,54 L 47,65 L 45,70 L 43,70 L 41,65 L 41,56 Z',
  },

  // RIGHT HAMSTRING - moved up, starts below glutes
  {
    id: 'hamstrings',
    name: 'Right Hamstring',
    path: 'M 58,51 L 54,53 L 52,54 L 53,65 L 55,70 L 57,70 L 59,65 L 59,56 Z',
  },

  // LEFT CALF (gastrocnemius) - diamond calf shape
  {
    id: 'calves',
    name: 'Left Calf',
    path: 'M 43,71 L 46,71 L 47,76 L 46,83 L 44,85 L 42,83 L 42,76 Z',
  },

  // RIGHT CALF (gastrocnemius) - diamond calf shape
  {
    id: 'calves',
    name: 'Right Calf',
    path: 'M 57,71 L 54,71 L 53,76 L 54,83 L 56,85 L 58,83 L 58,76 Z',
  },
];

export function BodyMap({ gender, muscleData, selectedMuscleId, onMuscleSelect, view: externalView, onViewChange }: BodyMapProps) {
  const [internalSelectedMuscle, setInternalSelectedMuscle] = useState<string | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [internalView, setInternalView] = useState<'front' | 'back'>('front');
  const [debugMode, setDebugMode] = useState(false);
  const [debugTapCount, setDebugTapCount] = useState(0);

  // Use external view if provided, otherwise use internal state
  const view = externalView !== undefined ? externalView : internalView;
  const setView = (newView: 'front' | 'back') => {
    if (onViewChange) {
      onViewChange(newView);
    } else {
      setInternalView(newView);
    }
  };

  // Use external selectedMuscleId if provided, otherwise use internal state
  const selectedMuscle = selectedMuscleId !== undefined ? selectedMuscleId : internalSelectedMuscle;

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
    // Only update internal state if not controlled externally
    if (selectedMuscleId === undefined) {
      setInternalSelectedMuscle(prev => prev === id ? null : id);
    }
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
            if (selectedMuscleId === undefined) setInternalSelectedMuscle(null);
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
            if (selectedMuscleId === undefined) setInternalSelectedMuscle(null);
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
            onMouseLeave={() => setHoveredMuscle(null)}
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
