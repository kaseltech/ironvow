'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { GymProfile } from '@/lib/supabase/types';

interface PrimaryContextProps {
  selectedLocation: string | null;
  setSelectedLocation: (location: string | null) => void;
  selectedGym: GymProfile | null;
  setSelectedGym: (gym: GymProfile | null) => void;
  gymProfiles: GymProfile[];
  getDefaultProfile: () => GymProfile | undefined;
  duration: number;
  setDuration: (duration: number) => void;
  weeklyMode: boolean;
  setWeeklyMode: (mode: boolean) => void;
  onManageGyms: () => void;
}

const locations = [
  { id: 'gym', name: 'Gym', icon: '🏋️' },
  { id: 'home', name: 'Home', icon: '🏠' },
  { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
];

const durations = [15, 30, 45, 60, 75, 90];

export function PrimaryContext({
  selectedLocation,
  setSelectedLocation,
  selectedGym,
  setSelectedGym,
  gymProfiles,
  getDefaultProfile,
  duration,
  setDuration,
  weeklyMode,
  setWeeklyMode,
  onManageGyms,
}: PrimaryContextProps) {
  const { colors } = useTheme();
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showGymDropdown, setShowGymDropdown] = useState(false);
  const durationRef = useRef<HTMLDivElement>(null);
  const gymRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
        setShowDurationDropdown(false);
      }
      if (gymRef.current && !gymRef.current.contains(event.target as Node)) {
        setShowGymDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationClick = (locId: string) => {
    setSelectedLocation(locId);
    if (locId === 'gym') {
      setSelectedGym(getDefaultProfile() || gymProfiles[0] || null);
    } else {
      setSelectedGym(null);
    }
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: colors.bg,
        paddingTop: '0.5rem',
        paddingBottom: '0.75rem',
        borderBottom: `1px solid ${colors.borderSubtle}`,
        marginLeft: '-1rem',
        marginRight: '-1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
    >
      {/* Row 1: Location Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => handleLocationClick(loc.id)}
            style={{
              flex: loc.id === selectedLocation && loc.id === 'gym' && gymProfiles.length > 0 ? 'none' : 1,
              padding: '0.625rem 0.75rem',
              borderRadius: '999px',
              background: selectedLocation === loc.id ? colors.accent : colors.cardBg,
              border: selectedLocation === loc.id
                ? `1px solid ${colors.accent}`
                : `1px solid ${colors.borderSubtle}`,
              color: selectedLocation === loc.id ? colors.bg : colors.text,
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              minWidth: selectedLocation === loc.id && loc.id === 'gym' ? 'auto' : 0,
            }}
          >
            <span style={{ fontSize: '1rem' }}>{loc.icon}</span>
            <span>{loc.name}</span>
          </button>
        ))}

        {/* Inline Gym Dropdown - Shows when gym is selected */}
        {selectedLocation === 'gym' && gymProfiles.length > 0 && (
          <div ref={gymRef} style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setShowGymDropdown(!showGymDropdown)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: '999px',
                background: colors.cardBg,
                border: `1px solid ${colors.borderSubtle}`,
                color: colors.text,
                fontWeight: 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.375rem',
              }}
            >
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                textAlign: 'left',
              }}>
                {selectedGym?.name || 'Select Gym'}
              </span>
              <span style={{ fontSize: '0.625rem', color: colors.textMuted }}>▼</span>
            </button>

            {showGymDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.25rem)',
                  left: 0,
                  right: 0,
                  background: colors.cardBg,
                  border: `1px solid ${colors.borderSubtle}`,
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  zIndex: 100,
                }}
              >
                {gymProfiles.map(gym => (
                  <button
                    key={gym.id}
                    onClick={() => {
                      setSelectedGym(gym);
                      setShowGymDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: selectedGym?.id === gym.id ? colors.accentMuted : 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${colors.borderSubtle}`,
                      color: colors.text,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: selectedGym?.id === gym.id ? 600 : 400 }}>
                        {gym.name}
                        {gym.is_default && (
                          <span style={{
                            marginLeft: '0.375rem',
                            fontSize: '0.5625rem',
                            background: colors.accent,
                            color: colors.bg,
                            padding: '0.0625rem 0.25rem',
                            borderRadius: '0.25rem',
                            fontWeight: 600,
                          }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: '0.6875rem' }}>
                        {(gym.equipment_ids?.length || 0) + (gym.custom_equipment?.length || 0)} items
                      </div>
                    </div>
                    {selectedGym?.id === gym.id && (
                      <span style={{ color: colors.accent }}>✓</span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowGymDropdown(false);
                    onManageGyms();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    color: colors.accent,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Manage Gyms
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Gym button when gym selected but no gyms exist */}
        {selectedLocation === 'gym' && gymProfiles.length === 0 && (
          <button
            onClick={onManageGyms}
            style={{
              flex: 1,
              padding: '0.625rem 0.75rem',
              borderRadius: '999px',
              background: 'transparent',
              border: `1px dashed ${colors.accent}`,
              color: colors.accent,
              fontWeight: 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            + Add Gym
          </button>
        )}
      </div>

      {/* Row 2: Duration & Mode */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* Duration Dropdown */}
        <div ref={durationRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDurationDropdown(!showDurationDropdown)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '999px',
              background: colors.cardBg,
              border: `1px solid ${colors.borderSubtle}`,
              color: colors.text,
              fontWeight: 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <span>{duration} min</span>
            <span style={{ fontSize: '0.625rem', color: colors.textMuted }}>▼</span>
          </button>

          {showDurationDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.25rem)',
                left: 0,
                background: colors.cardBg,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: '0.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                zIndex: 100,
                minWidth: '100px',
              }}
            >
              {durations.map(mins => (
                <button
                  key={mins}
                  onClick={() => {
                    setDuration(mins);
                    setShowDurationDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    background: duration === mins ? colors.accentMuted : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${colors.borderSubtle}`,
                    color: duration === mins ? colors.accent : colors.text,
                    fontSize: '0.875rem',
                    fontWeight: duration === mins ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {mins} min
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Single / Weekly Toggle */}
        <div
          style={{
            display: 'flex',
            background: colors.cardBg,
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: '999px',
            padding: '0.1875rem',
          }}
        >
          <button
            onClick={() => setWeeklyMode(false)}
            style={{
              padding: '0.4375rem 0.875rem',
              borderRadius: '999px',
              background: !weeklyMode ? colors.accent : 'transparent',
              border: 'none',
              color: !weeklyMode ? colors.bg : colors.textMuted,
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Single
          </button>
          <button
            onClick={() => setWeeklyMode(true)}
            style={{
              padding: '0.4375rem 0.875rem',
              borderRadius: '999px',
              background: weeklyMode ? colors.accent : 'transparent',
              border: 'none',
              color: weeklyMode ? colors.bg : colors.textMuted,
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Weekly
          </button>
        </div>
      </div>
    </div>
  );
}
