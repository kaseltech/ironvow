'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme, COLOR_THEMES, ColorTheme } from '@/context/ThemeContext';
import { useProfile, useEquipment } from '@/hooks/useSupabase';
import { Changelog } from './Changelog';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartOnboarding?: () => void;
}

export function Settings({ isOpen, onClose, onRestartOnboarding }: SettingsProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { colorTheme, setColorTheme, colors } = useTheme();
  const { profile, updateProfile } = useProfile();
  const { allEquipment, userEquipment, toggleEquipment, hasEquipment } = useEquipment();

  const [showChangelog, setShowChangelog] = useState(false);
  const [showEquipmentEditor, setShowEquipmentEditor] = useState(false);
  const [customEquipment, setCustomEquipment] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [equipmentLocation, setEquipmentLocation] = useState<'home' | 'gym'>('home');
  const [saving, setSaving] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');

  // Common equipment that should appear first
  const commonEquipmentNames = [
    'Dumbbells', 'Barbell', 'Flat Bench', 'Adjustable Bench', 'Squat Rack', 'Power Rack',
    'Pull-up Bar', 'Kettlebells', 'Resistance Bands', 'Cable Machine', 'Lat Pulldown',
    'Leg Press', 'Smith Machine', 'EZ Curl Bar', 'Treadmill', 'Rowing Machine',
    'Foam Roller', 'Jump Rope', 'Plyo Box', 'Medicine Ball', 'Battle Ropes',
  ];

  const getEquipmentPriority = (name: string): number => {
    const idx = commonEquipmentNames.findIndex(n =>
      name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(name.toLowerCase())
    );
    return idx === -1 ? 999 : idx;
  };

  // Load custom equipment from profile
  useEffect(() => {
    if (profile?.custom_equipment) {
      setCustomEquipment(profile.custom_equipment);
    }
  }, [profile]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showChangelog) {
          setShowChangelog(false);
        } else if (showEquipmentEditor) {
          setShowEquipmentEditor(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, showChangelog, showEquipmentEditor, onClose]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    onClose();
  };

  const addCustomEquipment = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customEquipment.includes(trimmed)) {
      setCustomEquipment([...customEquipment, trimmed]);
      setCustomInput('');
    }
  };

  const removeCustomEquipment = (item: string) => {
    setCustomEquipment(customEquipment.filter(e => e !== item));
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomEquipment();
    }
  };

  const saveEquipment = async () => {
    setSaving(true);
    try {
      await updateProfile({ custom_equipment: customEquipment });
      setShowEquipmentEditor(false);
    } catch (err) {
      console.error('Failed to save equipment:', err);
    } finally {
      setSaving(false);
    }
  };

  // Filter and sort equipment
  const searchTerm = equipmentSearch.trim().toLowerCase();
  const isSearching = searchTerm.length > 0;

  const filteredEquipment = isSearching
    ? allEquipment
        .filter(eq =>
          eq.name.toLowerCase().includes(searchTerm) ||
          (eq.category || '').toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
          const bStarts = b.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          return getEquipmentPriority(a.name) - getEquipmentPriority(b.name);
        })
    : allEquipment;

  // Group by category (only when not searching)
  const groupedEquipment = isSearching
    ? {}
    : filteredEquipment.reduce((acc, eq) => {
        const category = eq.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(eq);
        return acc;
      }, {} as Record<string, typeof filteredEquipment>);

  // Sort categories and items within
  const categoryOrder = ['Free Weights', 'Benches', 'Racks', 'Machines', 'Cable', 'Cardio', 'Accessories', 'Other'];
  const sortedCategories = Object.keys(groupedEquipment).sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a);
    const bIdx = categoryOrder.indexOf(b);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });
  Object.keys(groupedEquipment).forEach(cat => {
    groupedEquipment[cat].sort((a, b) => getEquipmentPriority(a.name) - getEquipmentPriority(b.name));
  });

  // Common equipment for quick access
  const commonEquipment = allEquipment
    .filter(eq => commonEquipmentNames.some(name =>
      eq.name.toLowerCase().includes(name.toLowerCase())
    ))
    .sort((a, b) => getEquipmentPriority(a.name) - getEquipmentPriority(b.name))
    .slice(0, 15);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 50,
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1A3550',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0.75rem',
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'rgba(201, 167, 90, 0.3)',
            borderRadius: '2px',
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem 1rem',
          borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⚙️</span>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#F5F1EA',
              margin: 0,
            }}>
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(245, 241, 234, 0.5)',
            }}
          >
            <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Main Settings View */}
          <>
            {/* Profile Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'rgba(245, 241, 234, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 1rem',
                }}>
                  Profile
                </h3>
                <div style={{
                  backgroundColor: 'rgba(15, 34, 51, 0.5)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => router.push('/profile')}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 500, color: '#F5F1EA' }}>Edit Profile</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(245, 241, 234, 0.5)' }}>
                        {profile?.experience_level || 'Not set'} • {profile?.gender || 'Not set'}
                      </div>
                    </div>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(245, 241, 234, 0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowEquipmentEditor(true)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🏋️</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 500, color: '#F5F1EA' }}>My Equipment</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(245, 241, 234, 0.5)' }}>
                        {userEquipment.length} items • {(profile?.custom_equipment?.length || 0)} custom
                      </div>
                    </div>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(245, 241, 234, 0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {onRestartOnboarding && (
                    <button
                      onClick={() => {
                        onClose();
                        onRestartOnboarding();
                      }}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🔄</span>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 500, color: '#F5F1EA' }}>Restart Onboarding</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(245, 241, 234, 0.5)' }}>
                          Go through setup again
                        </div>
                      </div>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(245, 241, 234, 0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Theme Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'rgba(245, 241, 234, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 1rem',
                }}>
                  Theme
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                }}>
                  {(Object.keys(COLOR_THEMES) as ColorTheme[]).map(theme => (
                    <button
                      key={theme}
                      onClick={() => setColorTheme(theme)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.625rem 0.375rem',
                        borderRadius: '0.5rem',
                        border: colorTheme === theme ? '2px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                        backgroundColor: colorTheme === theme ? 'rgba(201, 167, 90, 0.15)' : 'rgba(15, 34, 51, 0.5)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: COLOR_THEMES[theme].preview,
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                      }} />
                      <span style={{
                        fontSize: '0.625rem',
                        color: colorTheme === theme ? '#C9A75A' : 'rgba(245, 241, 234, 0.7)',
                        fontWeight: colorTheme === theme ? 600 : 400,
                      }}>
                        {COLOR_THEMES[theme].name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* About Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'rgba(245, 241, 234, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 1rem',
                }}>
                  About
                </h3>
                <div style={{
                  backgroundColor: 'rgba(15, 34, 51, 0.5)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
                  }}>
                    <div style={{ fontWeight: 500, color: '#F5F1EA', marginBottom: '0.25rem' }}>
                      IronVow
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(245, 241, 234, 0.5)' }}>
                      Version 1.4.1
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChangelog(true)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>📋</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 500, color: '#F5F1EA' }}>What's New</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(245, 241, 234, 0.5)' }}>
                        View changelog and updates
                      </div>
                    </div>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(245, 241, 234, 0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Account Section */}
              <div>
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'rgba(245, 241, 234, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 1rem',
                }}>
                  Account
                </h3>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </>
        </div>

        {/* Changelog Modal */}
        <Changelog isOpen={showChangelog} onClose={() => setShowChangelog(false)} />

        {/* Equipment Editor Modal - Full Screen Portal */}
        {showEquipmentEditor && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#0F2233',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(201, 167, 90, 0.1)',
              backgroundColor: '#1A3550',
            }}>
              <button
                onClick={() => setShowEquipmentEditor(false)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#C9A75A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#F5F1EA',
                margin: 0,
              }}>
                My Equipment
              </h2>
              <div style={{ width: '60px' }} />
            </div>

            {/* Search */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#1A3550' }}>
              <input
                type="text"
                placeholder="Search equipment..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(201, 167, 90, 0.2)',
                  backgroundColor: 'rgba(15, 34, 51, 0.5)',
                  color: '#F5F1EA',
                  fontSize: '1rem',
                }}
              />
            </div>

            {/* Equipment List */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '1rem 1.5rem',
            }}>
              {/* Selected count */}
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(201, 167, 90, 0.1)',
                borderRadius: '0.5rem',
                textAlign: 'center',
              }}>
                <span style={{ color: '#C9A75A', fontWeight: 600 }}>{userEquipment.length}</span>
                <span style={{ color: 'rgba(245, 241, 234, 0.7)' }}> items selected</span>
              </div>

              {isSearching ? (
                /* Search Results */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredEquipment.map(eq => (
                    <button
                      key={eq.id}
                      onClick={() => toggleEquipment(eq.id, 'home')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        borderRadius: '0.5rem',
                        border: hasEquipment(eq.id) ? '2px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                        backgroundColor: hasEquipment(eq.id) ? 'rgba(201, 167, 90, 0.1)' : 'rgba(15, 34, 51, 0.5)',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '0.25rem',
                        border: hasEquipment(eq.id) ? '2px solid #C9A75A' : '2px solid rgba(201, 167, 90, 0.3)',
                        backgroundColor: hasEquipment(eq.id) ? '#C9A75A' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {hasEquipment(eq.id) && (
                          <svg style={{ width: '1rem', height: '1rem', color: '#0F2233' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#F5F1EA', fontWeight: 500 }}>{eq.name}</div>
                        {eq.category && (
                          <div style={{ fontSize: '0.75rem', color: 'rgba(245, 241, 234, 0.5)' }}>{eq.category}</div>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredEquipment.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(245, 241, 234, 0.5)' }}>
                      No equipment found
                    </div>
                  )}
                </div>
              ) : (
                /* Grouped by Category */
                <>
                  {/* Common Equipment Section */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#C9A75A',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 0.75rem',
                    }}>
                      Common Equipment
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {commonEquipment.map(eq => (
                        <button
                          key={eq.id}
                          onClick={() => toggleEquipment(eq.id, 'home')}
                          style={{
                            padding: '0.5rem 0.875rem',
                            borderRadius: '999px',
                            border: hasEquipment(eq.id) ? '2px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                            backgroundColor: hasEquipment(eq.id) ? 'rgba(201, 167, 90, 0.15)' : 'rgba(15, 34, 51, 0.5)',
                            color: hasEquipment(eq.id) ? '#C9A75A' : '#F5F1EA',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontWeight: hasEquipment(eq.id) ? 600 : 400,
                          }}
                        >
                          {hasEquipment(eq.id) && '✓ '}{eq.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* All Equipment by Category */}
                  {sortedCategories.map(category => (
                    <div key={category} style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'rgba(245, 241, 234, 0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '0 0 0.75rem',
                      }}>
                        {category}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {groupedEquipment[category].map(eq => (
                          <button
                            key={eq.id}
                            onClick={() => toggleEquipment(eq.id, 'home')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              borderRadius: '0.5rem',
                              border: hasEquipment(eq.id) ? '2px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                              backgroundColor: hasEquipment(eq.id) ? 'rgba(201, 167, 90, 0.1)' : 'rgba(15, 34, 51, 0.5)',
                              cursor: 'pointer',
                              width: '100%',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              borderRadius: '0.25rem',
                              border: hasEquipment(eq.id) ? '2px solid #C9A75A' : '2px solid rgba(201, 167, 90, 0.3)',
                              backgroundColor: hasEquipment(eq.id) ? '#C9A75A' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {hasEquipment(eq.id) && (
                                <svg style={{ width: '0.875rem', height: '0.875rem', color: '#0F2233' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span style={{ color: '#F5F1EA' }}>{eq.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Custom Equipment Section */}
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(201, 167, 90, 0.1)' }}>
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'rgba(245, 241, 234, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 0.75rem',
                }}>
                  Custom Equipment
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Add custom equipment..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    style={{
                      flex: 1,
                      padding: '0.625rem 0.875rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      backgroundColor: 'rgba(15, 34, 51, 0.5)',
                      color: '#F5F1EA',
                      fontSize: '0.875rem',
                    }}
                  />
                  <button
                    onClick={addCustomEquipment}
                    disabled={!customInput.trim()}
                    style={{
                      padding: '0.625rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: customInput.trim() ? '#C9A75A' : 'rgba(201, 167, 90, 0.2)',
                      color: customInput.trim() ? '#0F2233' : 'rgba(245, 241, 234, 0.3)',
                      fontWeight: 600,
                      cursor: customInput.trim() ? 'pointer' : 'default',
                    }}
                  >
                    Add
                  </button>
                </div>
                {customEquipment.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {customEquipment.map(item => (
                      <span
                        key={item}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(201, 167, 90, 0.15)',
                          border: '1px solid rgba(201, 167, 90, 0.3)',
                          color: '#C9A75A',
                          fontSize: '0.875rem',
                        }}
                      >
                        {item}
                        <button
                          onClick={() => removeCustomEquipment(item)}
                          style={{
                            padding: 0,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(201, 167, 90, 0.6)',
                            display: 'flex',
                          }}
                        >
                          <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#1A3550',
              borderTop: '1px solid rgba(201, 167, 90, 0.1)',
            }}>
              <button
                onClick={saveEquipment}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  backgroundColor: '#C9A75A',
                  color: '#0F2233',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>,
          document.body
        )}

        <style jsx>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
