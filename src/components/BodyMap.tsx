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

const getLabel = (strength: number) => {
  if (strength >= 80) return 'Strong';
  if (strength >= 60) return 'Good';
  if (strength >= 40) return 'Moderate';
  if (strength >= 20) return 'Weak';
  return 'Undertrained';
};

export function BodyMap({ gender, muscleData, onMuscleSelect }: BodyMapProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  const getMuscleStrength = (id: string) => {
    const muscle = muscleData.find(m => m.id === id);
    return muscle?.strength ?? 50;
  };

  const getMuscleData = (id: string) => {
    return muscleData.find(m => m.id === id);
  };

  const handleMuscleClick = (id: string) => {
    setSelectedMuscle(id);
    const muscle = getMuscleData(id);
    if (muscle && onMuscleSelect) {
      onMuscleSelect(muscle);
    }
  };

  const selected = selectedMuscle ? getMuscleData(selectedMuscle) : null;

  // Simplified body proportions
  const isMale = gender === 'male';

  return (
    <div>
      {/* View Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setView('front')}
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
          onClick={() => setView('back')}
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

      {/* Body SVG */}
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 400"
          width="180"
          height="360"
          style={{ maxWidth: '100%' }}
        >
          {/* Body outline */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Head & Neck - only for male, female has its own */}
          {isMale && (
            <>
              <ellipse
                cx="100"
                cy="35"
                rx="22"
                ry="28"
                fill="rgba(245, 241, 234, 0.1)"
                stroke="rgba(245, 241, 234, 0.3)"
                strokeWidth="1"
              />
              <rect
                x="90"
                y="60"
                width="20"
                height="15"
                fill="rgba(245, 241, 234, 0.1)"
                stroke="rgba(245, 241, 234, 0.3)"
                strokeWidth="1"
              />
            </>
          )}

          {view === 'front' ? (
            <>
              {/* FRONT VIEW */}

              {isMale ? (
                <>
                  {/* MALE FRONT */}

                  {/* Shoulders/Traps */}
                  <path
                    d="M60,75 Q40,80 35,95 L55,95 Q60,85 75,80 Z M140,75 Q160,80 165,95 L145,95 Q140,85 125,80 Z"
                    fill={getColor(getMuscleStrength('shoulders'))}
                    opacity="0.7"
                    onClick={() => handleMuscleClick('shoulders')}
                    style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'shoulders' ? 'url(#glow)' : undefined}
                  />

                  {/* Chest - male pecs */}
                  <path
                    d="M55,95 Q50,100 50,120 Q60,135 100,135 Q140,135 150,120 Q150,100 145,95 Q130,90 100,88 Q70,90 55,95 Z"
                    fill={getColor(getMuscleStrength('chest'))}
                    opacity="0.7"
                    onClick={() => handleMuscleClick('chest')}
                    style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'chest' ? 'url(#glow)' : undefined}
                  />

                  {/* Biceps */}
                  <ellipse cx="38" cy="130" rx="12" ry="25"
                    fill={getColor(getMuscleStrength('biceps'))} opacity="0.7"
                    onClick={() => handleMuscleClick('biceps')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'biceps' ? 'url(#glow)' : undefined}
                  />
                  <ellipse cx="162" cy="130" rx="12" ry="25"
                    fill={getColor(getMuscleStrength('biceps'))} opacity="0.7"
                    onClick={() => handleMuscleClick('biceps')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'biceps' ? 'url(#glow)' : undefined}
                  />

                  {/* Forearms */}
                  <ellipse cx="32" cy="175" rx="8" ry="22"
                    fill={getColor(getMuscleStrength('forearms'))} opacity="0.7"
                    onClick={() => handleMuscleClick('forearms')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'forearms' ? 'url(#glow)' : undefined}
                  />
                  <ellipse cx="168" cy="175" rx="8" ry="22"
                    fill={getColor(getMuscleStrength('forearms'))} opacity="0.7"
                    onClick={() => handleMuscleClick('forearms')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'forearms' ? 'url(#glow)' : undefined}
                  />

                  {/* Abs/Core */}
                  <path
                    d="M70,135 L70,200 Q70,210 100,210 Q130,210 130,200 L130,135 Q115,140 100,140 Q85,140 70,135 Z"
                    fill={getColor(getMuscleStrength('core'))} opacity="0.7"
                    onClick={() => handleMuscleClick('core')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'core' ? 'url(#glow)' : undefined}
                  />

                  {/* Quads */}
                  <path d="M70,215 L60,300 Q65,310 85,310 L90,215 Z"
                    fill={getColor(getMuscleStrength('quads'))} opacity="0.7"
                    onClick={() => handleMuscleClick('quads')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'quads' ? 'url(#glow)' : undefined}
                  />
                  <path d="M130,215 L140,300 Q135,310 115,310 L110,215 Z"
                    fill={getColor(getMuscleStrength('quads'))} opacity="0.7"
                    onClick={() => handleMuscleClick('quads')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'quads' ? 'url(#glow)' : undefined}
                  />

                  {/* Calves */}
                  <ellipse cx="75" cy="345" rx="10" ry="25"
                    fill={getColor(getMuscleStrength('calves'))} opacity="0.7"
                    onClick={() => handleMuscleClick('calves')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'calves' ? 'url(#glow)' : undefined}
                  />
                  <ellipse cx="125" cy="345" rx="10" ry="25"
                    fill={getColor(getMuscleStrength('calves'))} opacity="0.7"
                    onClick={() => handleMuscleClick('calves')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'calves' ? 'url(#glow)' : undefined}
                  />
                </>
              ) : (
                <>
                  {/* FEMALE FRONT - Feminine proportions, no pec lines */}

                  {/* Head - slightly smaller */}
                  <ellipse cx="100" cy="35" rx="18" ry="24" fill="rgba(245, 241, 234, 0.15)" stroke="rgba(245, 241, 234, 0.3)" strokeWidth="1" />

                  {/* Neck - slimmer */}
                  <rect x="92" y="56" width="16" height="14" fill="rgba(245, 241, 234, 0.1)" />

                  {/* Shoulders - narrower */}
                  <path
                    d="M70,72 Q55,78 52,92 L65,92 Q68,82 80,76 Z M130,72 Q145,78 148,92 L135,92 Q132,82 120,76 Z"
                    fill={getColor(getMuscleStrength('shoulders'))}
                    opacity="0.7"
                    onClick={() => handleMuscleClick('shoulders')}
                    style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'shoulders' ? 'url(#glow)' : undefined}
                  />

                  {/* Chest - smooth feminine shape, NO pec lines */}
                  <path
                    d="M65,92 Q60,100 62,118 Q70,130 100,132 Q130,130 138,118 Q140,100 135,92 Q120,88 100,86 Q80,88 65,92 Z"
                    fill={getColor(getMuscleStrength('chest'))}
                    opacity="0.7"
                    onClick={() => handleMuscleClick('chest')}
                    style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'chest' ? 'url(#glow)' : undefined}
                  />

                  {/* Biceps - slimmer */}
                  <ellipse cx="48" cy="125" rx="9" ry="22"
                    fill={getColor(getMuscleStrength('biceps'))} opacity="0.7"
                    onClick={() => handleMuscleClick('biceps')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'biceps' ? 'url(#glow)' : undefined}
                  />
                  <ellipse cx="152" cy="125" rx="9" ry="22"
                    fill={getColor(getMuscleStrength('biceps'))} opacity="0.7"
                    onClick={() => handleMuscleClick('biceps')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'biceps' ? 'url(#glow)' : undefined}
                  />

                  {/* Forearms - slimmer */}
                  <ellipse cx="44" cy="168" rx="6" ry="20"
                    fill={getColor(getMuscleStrength('forearms'))} opacity="0.7"
                    onClick={() => handleMuscleClick('forearms')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'forearms' ? 'url(#glow)' : undefined}
                  />
                  <ellipse cx="156" cy="168" rx="6" ry="20"
                    fill={getColor(getMuscleStrength('forearms'))} opacity="0.7"
                    onClick={() => handleMuscleClick('forearms')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'forearms' ? 'url(#glow)' : undefined}
                  />

                  {/* Core - narrower waist, wider at hips */}
                  <path
                    d="M75,132 Q72,150 68,175 Q65,195 70,210 Q85,215 100,215 Q115,215 130,210 Q135,195 132,175 Q128,150 125,132 Q112,136 100,136 Q88,136 75,132 Z"
                    fill={getColor(getMuscleStrength('core'))}
                    opacity="0.7"
                    onClick={() => handleMuscleClick('core')}
                    style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'core' ? 'url(#glow)' : undefined}
                  />

                  {/* Quads - feminine shape, wider hips */}
                  <path d="M68,218 L58,300 Q65,312 88,310 L92,218 Q80,220 68,218 Z"
                    fill={getColor(getMuscleStrength('quads'))} opacity="0.7"
                    onClick={() => handleMuscleClick('quads')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'quads' ? 'url(#glow)' : undefined}
                  />
                  <path d="M132,218 L142,300 Q135,312 112,310 L108,218 Q120,220 132,218 Z"
                    fill={getColor(getMuscleStrength('quads'))} opacity="0.7"
                    onClick={() => handleMuscleClick('quads')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'quads' ? 'url(#glow)' : undefined}
                  />

                  {/* Calves - slimmer */}
                  <ellipse cx="75" cy="345" rx="9" ry="24"
                    fill={getColor(getMuscleStrength('calves'))} opacity="0.7"
                    onClick={() => handleMuscleClick('calves')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'calves' ? 'url(#glow)' : undefined}
                  />
                  <ellipse cx="125" cy="345" rx="9" ry="24"
                    fill={getColor(getMuscleStrength('calves'))} opacity="0.7"
                    onClick={() => handleMuscleClick('calves')} style={{ cursor: 'pointer' }}
                    filter={selectedMuscle === 'calves' ? 'url(#glow)' : undefined}
                  />
                </>
              )}
            </>
          ) : (
            <>
              {/* BACK VIEW */}

              {/* Traps */}
              <path
                d="M75,75 L65,95 L100,100 L135,95 L125,75 Q100,85 75,75 Z"
                fill={getColor(getMuscleStrength('traps'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('traps')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'traps' ? 'url(#glow)' : undefined}
              />

              {/* Rear Delts */}
              <ellipse
                cx={isMale ? "50" : "55"}
                cy="95"
                rx="15"
                ry="12"
                fill={getColor(getMuscleStrength('rear_delts'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('rear_delts')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'rear_delts' ? 'url(#glow)' : undefined}
              />
              <ellipse
                cx={isMale ? "150" : "145"}
                cy="95"
                rx="15"
                ry="12"
                fill={getColor(getMuscleStrength('rear_delts'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('rear_delts')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'rear_delts' ? 'url(#glow)' : undefined}
              />

              {/* Lats */}
              <path
                d={isMale
                  ? "M55,100 Q45,130 50,170 L70,180 L70,110 Q60,105 55,100 Z M145,100 Q155,130 150,170 L130,180 L130,110 Q140,105 145,100 Z"
                  : "M60,100 Q52,125 55,160 L72,170 L72,110 Q65,105 60,100 Z M140,100 Q148,125 145,160 L128,170 L128,110 Q135,105 140,100 Z"
                }
                fill={getColor(getMuscleStrength('lats'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('lats')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'lats' ? 'url(#glow)' : undefined}
              />

              {/* Mid Back / Rhomboids */}
              <path
                d="M70,100 L70,150 Q85,155 100,155 Q115,155 130,150 L130,100 Q115,105 100,105 Q85,105 70,100 Z"
                fill={getColor(getMuscleStrength('upper_back'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('upper_back')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'upper_back' ? 'url(#glow)' : undefined}
              />

              {/* Triceps */}
              <ellipse
                cx={isMale ? "38" : "45"}
                cy="130"
                rx={isMale ? "11" : "9"}
                ry="22"
                fill={getColor(getMuscleStrength('triceps'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('triceps')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'triceps' ? 'url(#glow)' : undefined}
              />
              <ellipse
                cx={isMale ? "162" : "155"}
                cy="130"
                rx={isMale ? "11" : "9"}
                ry="22"
                fill={getColor(getMuscleStrength('triceps'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('triceps')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'triceps' ? 'url(#glow)' : undefined}
              />

              {/* Lower Back */}
              <path
                d="M70,155 L70,210 Q85,215 100,215 Q115,215 130,210 L130,155 Q115,160 100,160 Q85,160 70,155 Z"
                fill={getColor(getMuscleStrength('lower_back'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('lower_back')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'lower_back' ? 'url(#glow)' : undefined}
              />

              {/* Glutes */}
              <ellipse
                cx="82"
                cy="230"
                rx="18"
                ry="20"
                fill={getColor(getMuscleStrength('glutes'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('glutes')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'glutes' ? 'url(#glow)' : undefined}
              />
              <ellipse
                cx="118"
                cy="230"
                rx="18"
                ry="20"
                fill={getColor(getMuscleStrength('glutes'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('glutes')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'glutes' ? 'url(#glow)' : undefined}
              />

              {/* Hamstrings */}
              <path
                d="M65,255 L60,310 Q70,320 85,315 L88,255 Z"
                fill={getColor(getMuscleStrength('hamstrings'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('hamstrings')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'hamstrings' ? 'url(#glow)' : undefined}
              />
              <path
                d="M135,255 L140,310 Q130,320 115,315 L112,255 Z"
                fill={getColor(getMuscleStrength('hamstrings'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('hamstrings')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'hamstrings' ? 'url(#glow)' : undefined}
              />

              {/* Calves (back view) */}
              <ellipse
                cx="75"
                cy="350"
                rx="12"
                ry="28"
                fill={getColor(getMuscleStrength('calves'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('calves')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'calves' ? 'url(#glow)' : undefined}
              />
              <ellipse
                cx="125"
                cy="350"
                rx="12"
                ry="28"
                fill={getColor(getMuscleStrength('calves'))}
                opacity="0.7"
                onClick={() => handleMuscleClick('calves')}
                style={{ cursor: 'pointer' }}
                filter={selectedMuscle === 'calves' ? 'url(#glow)' : undefined}
              />
            </>
          )}
        </svg>
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

      {/* Selected Muscle Info */}
      {selected && (
        <div
          className="mt-4 p-3"
          style={{
            background: 'rgba(15, 34, 51, 0.5)',
            borderRadius: '0.75rem',
            border: `2px solid ${getColor(selected.strength)}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 style={{ color: '#F5F1EA', fontWeight: 600 }}>{selected.name}</h4>
            <span
              style={{
                color: getColor(selected.strength),
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {getLabel(selected.strength)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem' }}>Weekly Volume</p>
              <p style={{ color: '#F5F1EA', fontWeight: 500, fontSize: '0.875rem' }}>{selected.volume}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem' }}>Last Trained</p>
              <p style={{ color: '#F5F1EA', fontWeight: 500, fontSize: '0.875rem' }}>{selected.lastTrained}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.625rem' }}>Trend</p>
              <p style={{
                color: selected.trend === 'up' ? '#4ADE80' : selected.trend === 'down' ? '#F87171' : '#C9A75A',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}>
                {selected.trend === 'up' ? '↑' : selected.trend === 'down' ? '↓' : '→'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
