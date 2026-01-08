'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGymProfiles, useEquipmentPresets, useEquipment } from '@/hooks/useSupabase';
import type { GymProfile, EquipmentPreset } from '@/lib/supabase/types';

const BRAND = {
  navy: '#1F3A5A',
  navyDark: '#0F2233',
  cream: '#F5F1EA',
  gold: '#C9A75A',
  goldMuted: '#B8A070',
};

interface GymManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'list' | 'create' | 'edit';

export function GymManager({ isOpen, onClose }: GymManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProfile, setEditingProfile] = useState<GymProfile | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<EquipmentPreset | null>(null);
  const [gymName, setGymName] = useState('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const { profiles, createProfile, updateProfile, deleteProfile, loading: profilesLoading } = useGymProfiles();
  const { presets, loading: presetsLoading } = useEquipmentPresets();
  const { allEquipment, loading: equipmentLoading } = useEquipment();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closing
      setViewMode('list');
      setEditingProfile(null);
      setSelectedPreset(null);
      setGymName('');
      setSelectedEquipmentIds([]);
      setCustomEquipment([]);
      setCustomInput('');
      setIsDefault(false);
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (viewMode !== 'list') {
          setViewMode('list');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, viewMode, onClose]);

  const handleSelectPreset = (preset: EquipmentPreset) => {
    setSelectedPreset(preset);
    setGymName('');

    // Map preset equipment names to equipment IDs
    const equipmentIds = allEquipment
      .filter(eq => preset.equipment_names.includes(eq.name))
      .map(eq => eq.id);

    setSelectedEquipmentIds(equipmentIds);
    setCustomEquipment([]);
    setIsDefault(profiles.length === 0);
    setViewMode('create');
  };

  const handleEditProfile = (profile: GymProfile) => {
    setEditingProfile(profile);
    setGymName(profile.name);
    setSelectedEquipmentIds(profile.equipment_ids || []);
    setCustomEquipment(profile.custom_equipment || []);
    setIsDefault(profile.is_default);
    setViewMode('edit');
  };

  const handleSave = async () => {
    if (!gymName.trim()) return;

    setSaving(true);
    try {
      if (viewMode === 'edit' && editingProfile) {
        await updateProfile(editingProfile.id, {
          name: gymName.trim(),
          equipment_ids: selectedEquipmentIds,
          custom_equipment: customEquipment,
          is_default: isDefault,
        });
      } else {
        const gymType = selectedPreset?.name.toLowerCase().includes('crossfit') ? 'crossfit'
          : selectedPreset?.name.toLowerCase().includes('powerlifting') ? 'powerlifting'
          : selectedPreset?.name.toLowerCase().includes('hotel') ? 'hotel'
          : selectedPreset?.name.toLowerCase().includes('commercial') ? 'commercial'
          : 'custom';

        await createProfile(
          gymName.trim(),
          gymType,
          selectedEquipmentIds,
          customEquipment,
          isDefault
        );
      }
      setViewMode('list');
    } catch (error) {
      console.error('Failed to save gym profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (confirm('Are you sure you want to delete this gym?')) {
      await deleteProfile(profileId);
    }
  };

  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipmentIds(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
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

  if (!mounted || !isOpen) return null;

  const loading = profilesLoading || presetsLoading || equipmentLoading;

  // Group equipment by category
  const equipmentByCategory = allEquipment.reduce((acc, eq) => {
    const category = eq.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(eq);
    return acc;
  }, {} as Record<string, typeof allEquipment>);

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: BRAND.navy,
          borderRadius: '1.5rem 1.5rem 0 0',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(201, 167, 90, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {viewMode !== 'list' && (
              <button
                onClick={() => setViewMode('list')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: BRAND.gold,
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  padding: '0.25rem',
                }}
              >
                ←
              </button>
            )}
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: BRAND.cream,
              margin: 0,
            }}>
              {viewMode === 'list' ? 'My Gyms' : viewMode === 'create' ? 'New Gym' : 'Edit Gym'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: BRAND.cream,
              cursor: 'pointer',
              fontSize: '1.5rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: BRAND.goldMuted }}>
              Loading...
            </div>
          ) : viewMode === 'list' ? (
            <>
              {/* Existing Gyms */}
              {profiles.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.75rem', color: BRAND.goldMuted, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Your Gyms
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {profiles.map(profile => (
                      <div
                        key={profile.id}
                        style={{
                          background: 'rgba(201, 167, 90, 0.1)',
                          borderRadius: '0.75rem',
                          padding: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: BRAND.cream, fontWeight: 500 }}>{profile.name}</span>
                            {profile.is_default && (
                              <span style={{
                                fontSize: '0.625rem',
                                background: BRAND.gold,
                                color: BRAND.navyDark,
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                fontWeight: 600,
                              }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: BRAND.goldMuted }}>
                            {(profile.equipment_ids?.length || 0) + (profile.custom_equipment?.length || 0)} items
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEditProfile(profile)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              borderRadius: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              color: BRAND.cream,
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(profile.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: 'none',
                              borderRadius: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preset Templates */}
              <div>
                <h3 style={{ fontSize: '0.75rem', color: BRAND.goldMuted, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Add New Gym
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {presets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        background: 'rgba(15, 34, 51, 0.5)',
                        border: '1px solid rgba(201, 167, 90, 0.2)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{preset.icon}</div>
                      <div style={{ color: BRAND.cream, fontWeight: 500, fontSize: '0.875rem' }}>{preset.name}</div>
                      <div style={{ color: BRAND.goldMuted, fontSize: '0.625rem', marginTop: '0.25rem' }}>
                        {preset.equipment_names.length} items
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Create/Edit Form */
            <>
              {/* Gym Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: BRAND.goldMuted, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Gym Name
                </label>
                <input
                  type="text"
                  value={gymName}
                  onChange={e => setGymName(e.target.value)}
                  placeholder={selectedPreset ? `e.g., My ${selectedPreset.name}` : 'Enter gym name'}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(15, 34, 51, 0.5)',
                    border: '1px solid rgba(201, 167, 90, 0.2)',
                    borderRadius: '0.5rem',
                    color: BRAND.cream,
                    fontSize: '1rem',
                  }}
                />
              </div>

              {/* Default Toggle */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={e => setIsDefault(e.target.checked)}
                    style={{ accentColor: BRAND.gold }}
                  />
                  <span style={{ color: BRAND.cream, fontSize: '0.875rem' }}>
                    Set as default gym
                  </span>
                </label>
              </div>

              {/* Equipment Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: BRAND.goldMuted, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Equipment ({selectedEquipmentIds.length} selected)
                </label>

                {Object.entries(equipmentByCategory).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', color: BRAND.goldMuted, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                      {category.replace('_', ' ')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {items.map(eq => (
                        <button
                          key={eq.id}
                          onClick={() => toggleEquipment(eq.id)}
                          style={{
                            padding: '0.375rem 0.625rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            background: selectedEquipmentIds.includes(eq.id)
                              ? 'rgba(201, 167, 90, 0.3)'
                              : 'rgba(15, 34, 51, 0.5)',
                            color: selectedEquipmentIds.includes(eq.id)
                              ? BRAND.gold
                              : BRAND.cream,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {eq.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Equipment */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: BRAND.goldMuted, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Custom Equipment
                </label>

                {/* Tags */}
                {customEquipment.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    {customEquipment.map(item => (
                      <span
                        key={item}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(201, 167, 90, 0.2)',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          color: BRAND.gold,
                        }}
                      >
                        {item}
                        <button
                          onClick={() => removeCustomEquipment(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: BRAND.gold,
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '1rem',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomEquipment()}
                    placeholder="Add custom equipment..."
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      borderRadius: '0.5rem',
                      color: BRAND.cream,
                      fontSize: '0.875rem',
                    }}
                  />
                  <button
                    onClick={addCustomEquipment}
                    disabled={!customInput.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      background: customInput.trim() ? BRAND.gold : 'rgba(201, 167, 90, 0.3)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: BRAND.navyDark,
                      cursor: customInput.trim() ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {viewMode !== 'list' && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(201, 167, 90, 0.2)',
          }}>
            <button
              onClick={handleSave}
              disabled={!gymName.trim() || saving}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: gymName.trim() ? BRAND.gold : 'rgba(201, 167, 90, 0.3)',
                border: 'none',
                borderRadius: '0.75rem',
                color: BRAND.navyDark,
                fontWeight: 600,
                fontSize: '1rem',
                cursor: gymName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? 'Saving...' : viewMode === 'edit' ? 'Save Changes' : 'Create Gym'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
