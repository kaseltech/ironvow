'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { GymIcon, HomeIcon, TreeIcon, ChevronDownIcon, CheckIcon, PlusIcon } from '@/components/Icons';
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
  { id: 'gym', name: 'Gym', Icon: GymIcon },
  { id: 'home', name: 'Home', Icon: HomeIcon },
  { id: 'outdoor', name: 'Outdoor', Icon: TreeIcon },
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
  const [focusedDurationIndex, setFocusedDurationIndex] = useState(-1);
  const [focusedGymIndex, setFocusedGymIndex] = useState(-1);
  const durationRef = useRef<HTMLDivElement>(null);
  const gymRef = useRef<HTMLDivElement>(null);

  // Reset focus when dropdowns open/close
  useEffect(() => {
    if (showDurationDropdown) {
      const currentIndex = durations.indexOf(duration);
      setFocusedDurationIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setFocusedDurationIndex(-1);
    }
  }, [showDurationDropdown, duration]);

  useEffect(() => {
    if (showGymDropdown) {
      const currentIndex = gymProfiles.findIndex(g => g.id === selectedGym?.id);
      setFocusedGymIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setFocusedGymIndex(-1);
    }
  }, [showGymDropdown, selectedGym?.id, gymProfiles]);

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

  // Keyboard navigation for duration dropdown
  const handleDurationKeyDown = (e: React.KeyboardEvent) => {
    if (!showDurationDropdown) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setShowDurationDropdown(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedDurationIndex(prev => Math.min(prev + 1, durations.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedDurationIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedDurationIndex >= 0 && focusedDurationIndex < durations.length) {
          setDuration(durations[focusedDurationIndex]);
          setShowDurationDropdown(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDurationDropdown(false);
        break;
      case 'Tab':
        setShowDurationDropdown(false);
        break;
    }
  };

  // Keyboard navigation for gym dropdown
  const handleGymKeyDown = (e: React.KeyboardEvent) => {
    if (!showGymDropdown) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setShowGymDropdown(true);
      }
      return;
    }

    // Include "Manage Gyms" as the last option
    const totalOptions = gymProfiles.length + 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedGymIndex(prev => Math.min(prev + 1, totalOptions - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedGymIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedGymIndex >= 0 && focusedGymIndex < gymProfiles.length) {
          setSelectedGym(gymProfiles[focusedGymIndex]);
          setShowGymDropdown(false);
        } else if (focusedGymIndex === gymProfiles.length) {
          // Manage Gyms option
          setShowGymDropdown(false);
          onManageGyms();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowGymDropdown(false);
        break;
      case 'Tab':
        setShowGymDropdown(false);
        break;
    }
  };

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
        paddingTop: '0.75rem',
        paddingBottom: '1rem',
        marginLeft: '-1rem',
        marginRight: '-1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
    >
      {/* Row 1: Location Buttons */}
      <div
        className="location-buttons-row"
        style={{
          display: 'flex',
          gap: '0.625rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {locations.map(loc => {
          const isSelected = selectedLocation === loc.id;
          const IconComponent = loc.Icon;

          return (
            <button
              key={loc.id}
              onClick={() => handleLocationClick(loc.id)}
              style={{
                flex: '1 1 auto',
                minWidth: 'calc(33% - 0.5rem)',
                padding: '0.875rem 1rem',
                minHeight: '48px',
                borderRadius: '0.875rem',
                background: isSelected
                  ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                  : colors.cardBg,
                border: isSelected
                  ? 'none'
                  : `1.5px solid ${colors.borderSubtle}`,
                color: isSelected ? colors.bg : colors.text,
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: isSelected ? '0 4px 12px rgba(201, 167, 90, 0.3)' : 'none',
              }}
            >
              <IconComponent size={20} color={isSelected ? colors.bg : colors.accent} strokeWidth={2} />
              <span>{loc.name}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Gym Selector (if gym selected) */}
      {selectedLocation === 'gym' && (
        <div style={{ marginBottom: '1rem' }}>
          {gymProfiles.length > 0 ? (
            <div ref={gymRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowGymDropdown(!showGymDropdown)}
                onKeyDown={handleGymKeyDown}
                aria-haspopup="listbox"
                aria-expanded={showGymDropdown}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  minHeight: '48px',
                  borderRadius: '0.875rem',
                  background: colors.cardBg,
                  border: `1.5px solid ${colors.border}`,
                  color: colors.text,
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <GymIcon size={18} color={colors.accent} />
                  <span>{selectedGym?.name || 'Select Gym'}</span>
                  {selectedGym?.is_default && (
                    <span style={{
                      fontSize: '0.625rem',
                      background: colors.accentMuted,
                      color: colors.accent,
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}>
                      Default
                    </span>
                  )}
                </div>
                <div
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: showGymDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <ChevronDownIcon size={18} color={colors.textMuted} />
                </div>
              </button>

              {showGymDropdown && (
                <div
                  role="listbox"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: 0,
                    right: 0,
                    background: colors.cardBg,
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: '0.875rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    overflow: 'hidden',
                    zIndex: 100,
                  }}
                >
                  {gymProfiles.map((gym, idx) => {
                    const isSelected = selectedGym?.id === gym.id;
                    const isFocused = focusedGymIndex === idx;
                    return (
                    <button
                      key={gym.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSelectedGym(gym);
                        setShowGymDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        minHeight: '48px',
                        background: isFocused ? colors.accentMuted : isSelected ? colors.accentMuted : 'transparent',
                        border: 'none',
                        borderBottom: idx < gymProfiles.length - 1 ? `1px solid ${colors.borderSubtle}` : 'none',
                        color: colors.text,
                        fontSize: '0.9375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        outline: isFocused ? `2px solid ${colors.accent}` : 'none',
                        outlineOffset: '-2px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: selectedGym?.id === gym.id ? 600 : 500 }}>
                          {gym.name}
                        </div>
                        <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.125rem' }}>
                          {(gym.equipment_ids?.length || 0) + (gym.custom_equipment?.length || 0)} equipment items
                        </div>
                      </div>
                      {isSelected && (
                        <CheckIcon size={18} color={colors.accent} />
                      )}
                    </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setShowGymDropdown(false);
                      onManageGyms();
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      minHeight: '48px',
                      background: focusedGymIndex === gymProfiles.length ? colors.accentMuted : 'transparent',
                      borderTop: `1px solid ${colors.borderSubtle}`,
                      border: 'none',
                      color: colors.accent,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      outline: focusedGymIndex === gymProfiles.length ? `2px solid ${colors.accent}` : 'none',
                      outlineOffset: '-2px',
                    }}
                  >
                    <PlusIcon size={16} color={colors.accent} />
                    Manage Gyms
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onManageGyms}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                background: 'transparent',
                border: `2px dashed ${colors.accent}`,
                color: colors.accent,
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <PlusIcon size={18} color={colors.accent} />
              Add Your First Gym
            </button>
          )}
        </div>
      )}

      {/* Row 3: Duration & Mode */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {/* Duration Dropdown */}
        <div ref={durationRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDurationDropdown(!showDurationDropdown)}
            onKeyDown={handleDurationKeyDown}
            aria-haspopup="listbox"
            aria-expanded={showDurationDropdown}
            style={{
              padding: '0.625rem 1rem',
              minHeight: '44px',
              borderRadius: '0.75rem',
              background: colors.cardBg,
              border: `1.5px solid ${colors.border}`,
              color: colors.text,
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '100px',
            }}
          >
            <span>{duration}</span>
            <span style={{ color: colors.textMuted, fontWeight: 400 }}>min</span>
            <div
              style={{
                marginLeft: '0.25rem',
                transition: 'transform 0.2s ease',
                transform: showDurationDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'flex',
              }}
            >
              <ChevronDownIcon size={16} color={colors.textMuted} />
            </div>
          </button>

          {showDurationDropdown && (
            <div
              role="listbox"
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                left: 0,
                background: colors.cardBg,
                border: `1.5px solid ${colors.border}`,
                borderRadius: '0.875rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                zIndex: 100,
                minWidth: '120px',
              }}
            >
              {durations.map((mins, idx) => {
                const isSelected = duration === mins;
                const isFocused = focusedDurationIndex === idx;
                return (
                <button
                  key={mins}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setDuration(mins);
                    setShowDurationDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    minHeight: '44px',
                    background: isFocused ? colors.accentMuted : isSelected ? colors.accentMuted : 'transparent',
                    border: 'none',
                    borderBottom: idx < durations.length - 1 ? `1px solid ${colors.borderSubtle}` : 'none',
                    color: isSelected ? colors.accent : colors.text,
                    fontSize: '0.9375rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    outline: isFocused ? `2px solid ${colors.accent}` : 'none',
                    outlineOffset: '-2px',
                  }}
                >
                  <span>{mins} min</span>
                  {isSelected && <CheckIcon size={16} color={colors.accent} />}
                </button>
                );
              })}
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
            border: `1.5px solid ${colors.border}`,
            borderRadius: '0.75rem',
            padding: '0.25rem',
          }}
        >
          <button
            onClick={() => setWeeklyMode(false)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              background: !weeklyMode
                ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                : 'transparent',
              border: 'none',
              color: !weeklyMode ? colors.bg : colors.textMuted,
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Single
          </button>
          <button
            onClick={() => setWeeklyMode(true)}
            aria-label="Switch to weekly plan mode"
            title="Plan your entire week of workouts"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              background: weeklyMode
                ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`
                : 'transparent',
              border: 'none',
              color: weeklyMode ? colors.bg : colors.textMuted,
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            Weekly
            {!weeklyMode && (
              <span
                style={{
                  position: 'absolute',
                  top: '-0.125rem',
                  right: '-0.125rem',
                  width: '0.5rem',
                  height: '0.5rem',
                  background: colors.accent,
                  borderRadius: '50%',
                  opacity: 0.8,
                }}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
