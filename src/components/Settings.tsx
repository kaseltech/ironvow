'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  const { profile, updateProfile } = useProfile();
  const { allEquipment, userEquipment, toggleEquipment, hasEquipment } = useEquipment();

  const [showChangelog, setShowChangelog] = useState(false);
  const [showEquipmentEditor, setShowEquipmentEditor] = useState(false);
  const [customEquipment, setCustomEquipment] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [equipmentLocation, setEquipmentLocation] = useState<'home' | 'gym'>('home');
  const [saving, setSaving] = useState(false);

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

  const groupedEquipment = allEquipment.reduce((acc, eq) => {
    const category = eq.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(eq);
    return acc;
  }, {} as Record<string, typeof allEquipment>);

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
          {showEquipmentEditor ? (
            /* Equipment Editor View */
            <>
              <button
                onClick={() => setShowEquipmentEditor(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C9A75A',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                ← Back to Settings
              </button>

              {/* Location toggle */}
              <div className="flex gap-2 mb-4">
                {(['home', 'gym'] as const).map(loc => (
                  <button
                    key={loc}
                    onClick={() => setEquipmentLocation(loc)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: equipmentLocation === loc ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                      border: equipmentLocation === loc ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                      color: equipmentLocation === loc ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}
                  >
                    {loc === 'gym' ? '🏋️ Gym' : '🏠 Home'}
                  </button>
                ))}
              </div>

              {/* Equipment list */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                {Object.entries(groupedEquipment).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map(eq => {
                        const selected = hasEquipment(eq.id, equipmentLocation);
                        return (
                          <button
                            key={eq.id}
                            onClick={() => toggleEquipment(eq.id, equipmentLocation)}
                            style={{
                              padding: '0.375rem 0.625rem',
                              borderRadius: '2rem',
                              background: selected ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                              border: selected ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                              color: selected ? '#C9A75A' : 'rgba(245, 241, 234, 0.5)',
                              fontSize: '0.75rem',
                            }}
                          >
                            {eq.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Equipment */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Custom Equipment
                </h4>
                {customEquipment.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {customEquipment.map(item => (
                      <span
                        key={item}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '2rem',
                          background: 'rgba(74, 222, 128, 0.15)',
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          color: '#4ADE80',
                          fontSize: '0.75rem',
                        }}
                      >
                        {item}
                        <button
                          onClick={() => removeCustomEquipment(item)}
                          style={{ background: 'none', border: 'none', color: 'rgba(74, 222, 128, 0.7)', fontSize: '0.875rem', lineHeight: 1, cursor: 'pointer', padding: 0 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="Add custom equipment..."
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(15, 34, 51, 0.8)',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      color: '#F5F1EA',
                      fontSize: '0.875rem',
                    }}
                  />
                  <button
                    onClick={addCustomEquipment}
                    disabled={!customInput.trim()}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: customInput.trim() ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                      border: '1px solid rgba(201, 167, 90, 0.3)',
                      color: customInput.trim() ? '#C9A75A' : 'rgba(201, 167, 90, 0.4)',
                      fontSize: '0.875rem',
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                onClick={saveEquipment}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? 'Saving...' : 'Save Equipment'}
              </button>
            </>
          ) : (
            /* Main Settings View */
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
                      Version 1.3.0
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
          )}
        </div>

        {/* Changelog Modal */}
        <Changelog isOpen={showChangelog} onClose={() => setShowChangelog(false)} />

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
