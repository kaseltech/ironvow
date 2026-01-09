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

type ViewMode = 'list' | 'select-presets' | 'customize';

export function GymManager({ isOpen, onClose }: GymManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProfile, setEditingProfile] = useState<GymProfile | null>(null);

  // Multi-select presets
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);

  const [gymName, setGymName] = useState('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const { profiles, createProfile, updateProfile, deleteProfile, loading: profilesLoading, refetch: refetchProfiles } = useGymProfiles();
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
      setSelectedPresetIds([]);
      setGymName('');
      setSelectedEquipmentIds([]);
      setCustomEquipment([]);
      setCustomInput('');
      setIsDefault(false);
      setEquipmentSearch('');
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (viewMode === 'customize') {
          setViewMode('select-presets');
        } else if (viewMode === 'select-presets') {
          setViewMode('list');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, viewMode, onClose]);

  // Toggle preset selection (multi-select)
  const togglePreset = (presetId: string) => {
    setSelectedPresetIds(prev =>
      prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  };

  // Proceed from preset selection to customization
  const handleProceedToCustomize = () => {
    // Merge equipment from all selected presets
    const selectedPresets = presets.filter(p => selectedPresetIds.includes(p.id));
    const allPresetEquipmentNames = new Set<string>();
    selectedPresets.forEach(preset => {
      preset.equipment_names.forEach(name => allPresetEquipmentNames.add(name));
    });

    // Map equipment names to IDs
    const equipmentIds = allEquipment
      .filter(eq => allPresetEquipmentNames.has(eq.name))
      .map(eq => eq.id);

    setSelectedEquipmentIds(equipmentIds);
    setIsDefault(profiles.length === 0);
    setViewMode('customize');
  };

  // Start fresh (no presets)
  const handleStartFresh = () => {
    setSelectedPresetIds([]);
    setSelectedEquipmentIds([]);
    setIsDefault(profiles.length === 0);
    setViewMode('customize');
  };

  const handleEditProfile = (profile: GymProfile) => {
    setEditingProfile(profile);
    setGymName(profile.name);
    setSelectedEquipmentIds(profile.equipment_ids || []);
    setCustomEquipment(profile.custom_equipment || []);
    setIsDefault(profile.is_default);
    setSelectedPresetIds([]); // No presets when editing
    setViewMode('customize');
  };

  const handleSave = async () => {
    if (!gymName.trim()) return;

    setSaving(true);
    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, {
          name: gymName.trim(),
          equipment_ids: selectedEquipmentIds,
          custom_equipment: customEquipment,
          is_default: isDefault,
        });
      } else {
        // Determine gym type from selected presets
        const selectedPresets = presets.filter(p => selectedPresetIds.includes(p.id));
        const presetNames = selectedPresets.map(p => p.name.toLowerCase());

        let gymType: GymProfile['gym_type'] = 'custom';
        if (presetNames.some(n => n.includes('crossfit'))) gymType = 'crossfit';
        else if (presetNames.some(n => n.includes('powerlifting'))) gymType = 'powerlifting';
        else if (presetNames.some(n => n.includes('olympic'))) gymType = 'olympic';
        else if (presetNames.some(n => n.includes('commercial'))) gymType = 'commercial';
        else if (presetNames.some(n => n.includes('hotel'))) gymType = 'hotel';
        else if (presetNames.some(n => n.includes('home'))) gymType = 'home';
        else if (presetNames.some(n => n.includes('hiit') || n.includes('circuit'))) gymType = 'hiit';
        else if (presetNames.some(n => n.includes('calisthenics') || n.includes('street'))) gymType = 'calisthenics';
        else if (presetNames.some(n => n.includes('outdoor') || n.includes('park'))) gymType = 'outdoor';

        await createProfile(
          gymName.trim(),
          gymType,
          selectedEquipmentIds,
          customEquipment,
          isDefault
        );
      }
      await refetchProfiles();
      setViewMode('list');
      setEditingProfile(null);
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

  // Filter equipment by search term
  const filteredEquipment = equipmentSearch.trim()
    ? allEquipment.filter(eq =>
        eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
        (eq.category || '').toLowerCase().includes(equipmentSearch.toLowerCase())
      )
    : allEquipment;

  // Group equipment by category
  const equipmentByCategory = filteredEquipment.reduce((acc, eq) => {
    const category = eq.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(eq);
    return acc;
  }, {} as Record<string, typeof filteredEquipment>);

  // Get count of equipment from selected presets
  const getSelectedPresetsEquipmentCount = () => {
    const selectedPresets = presets.filter(p => selectedPresetIds.includes(p.id));
    const allNames = new Set<string>();
    selectedPresets.forEach(p => p.equipment_names.forEach(n => allNames.add(n)));
    return allNames.size;
  };

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
                onClick={() => {
                  if (viewMode === 'customize' && !editingProfile) {
                    setViewMode('select-presets');
                  } else {
                    setViewMode('list');
                    setEditingProfile(null);
                  }
                }}
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
              {viewMode === 'list' ? 'My Gyms' :
               viewMode === 'select-presets' ? 'Select Gym Types' :
               editingProfile ? 'Edit Gym' : 'Customize Equipment'}
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
            /* LIST VIEW */
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

              {/* Add New Gym Button */}
              <button
                onClick={() => {
                  setSelectedPresetIds([]);
                  setViewMode('select-presets');
                }}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  background: `linear-gradient(135deg, ${BRAND.gold}20 0%, ${BRAND.gold}10 100%)`,
                  border: '2px dashed rgba(201, 167, 90, 0.4)',
                  borderRadius: '0.75rem',
                  color: BRAND.gold,
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                + Add New Gym
              </button>
            </>
          ) : viewMode === 'select-presets' ? (
            /* PRESET SELECTION (Multi-select) */
            <>
              <p style={{ color: BRAND.goldMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
                Select all gym types that apply. Equipment will be combined.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {presets.map(preset => {
                  const isSelected = selectedPresetIds.includes(preset.id);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => togglePreset(preset.id)}
                      style={{
                        background: isSelected ? 'rgba(201, 167, 90, 0.2)' : 'rgba(15, 34, 51, 0.5)',
                        border: isSelected ? '2px solid ' + BRAND.gold : '2px solid rgba(201, 167, 90, 0.2)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: `2px solid ${isSelected ? BRAND.gold : 'rgba(201, 167, 90, 0.4)'}`,
                        background: isSelected ? BRAND.gold : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: BRAND.navyDark,
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}>
                        {isSelected && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>{preset.icon}</span>
                          <span style={{ color: BRAND.cream, fontWeight: 500 }}>{preset.name}</span>
                        </div>
                        <div style={{ color: BRAND.goldMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {preset.equipment_names.length} items • {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Start Fresh option */}
              <button
                onClick={handleStartFresh}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'transparent',
                  border: '1px solid rgba(201, 167, 90, 0.2)',
                  borderRadius: '0.5rem',
                  color: BRAND.goldMuted,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                }}
              >
                Or start from scratch (select equipment manually)
              </button>

              {/* Continue Button */}
              {selectedPresetIds.length > 0 && (
                <button
                  onClick={handleProceedToCustomize}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: BRAND.gold,
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: BRAND.navyDark,
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Continue with {selectedPresetIds.length} type{selectedPresetIds.length > 1 ? 's' : ''} ({getSelectedPresetsEquipmentCount()} items)
                </button>
              )}
            </>
          ) : (
            /* CUSTOMIZE/EDIT VIEW */
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
                  placeholder="e.g., My CrossFit Gym, Planet Fitness Downtown"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', color: BRAND.goldMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Equipment ({selectedEquipmentIds.length} selected)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSelectedEquipmentIds(allEquipment.map(e => e.id))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: BRAND.gold,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedEquipmentIds([])}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: BRAND.goldMuted,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Equipment Search */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Search equipment..."
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: `1px solid ${BRAND.goldMuted}40`,
                      borderRadius: '0.5rem',
                      color: BRAND.cream,
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                {Object.keys(equipmentByCategory).length === 0 && equipmentSearch && (
                  <div style={{ color: BRAND.goldMuted, fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
                    No equipment found matching "{equipmentSearch}"
                  </div>
                )}

                {Object.entries(equipmentByCategory).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '1rem' }}>
                    <h4 style={{
                      fontSize: '0.7rem',
                      color: BRAND.gold,
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {category.replace('_', ' ')}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {items.map(eq => {
                        const isSelected = selectedEquipmentIds.includes(eq.id);
                        return (
                          <button
                            key={eq.id}
                            onClick={() => toggleEquipment(eq.id)}
                            style={{
                              padding: '0.375rem 0.625rem',
                              background: isSelected ? BRAND.gold : 'rgba(15, 34, 51, 0.5)',
                              border: 'none',
                              borderRadius: '0.375rem',
                              color: isSelected ? BRAND.navyDark : BRAND.cream,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: BRAND.goldMuted, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Custom Equipment
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomEquipment()}
                    placeholder="Add equipment not listed above"
                    style={{
                      flex: 1,
                      padding: '0.625rem 0.875rem',
                      background: 'rgba(15, 34, 51, 0.5)',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      borderRadius: '0.5rem',
                      color: BRAND.cream,
                      fontSize: '0.875rem',
                    }}
                  />
                  <button
                    onClick={addCustomEquipment}
                    style={{
                      padding: '0.625rem 1rem',
                      background: 'rgba(201, 167, 90, 0.2)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: BRAND.gold,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Add
                  </button>
                </div>
                {customEquipment.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {customEquipment.map(item => (
                      <span
                        key={item}
                        style={{
                          padding: '0.375rem 0.625rem',
                          background: 'rgba(201, 167, 90, 0.15)',
                          borderRadius: '0.375rem',
                          color: BRAND.cream,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                        }}
                      >
                        {item}
                        <button
                          onClick={() => removeCustomEquipment(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: BRAND.goldMuted,
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.875rem',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!gymName.trim() || saving}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: gymName.trim() ? BRAND.gold : 'rgba(201, 167, 90, 0.3)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: BRAND.navyDark,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: gymName.trim() ? 'pointer' : 'not-allowed',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : editingProfile ? 'Update Gym' : 'Save Gym'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
