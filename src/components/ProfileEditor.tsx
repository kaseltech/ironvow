'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hooks/useSupabase';

interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditor({ isOpen, onClose }: ProfileEditorProps) {
  const { colors } = useTheme();
  const { profile, updateProfile, refetch } = useProfile();
  const [mounted, setMounted] = useState(false);

  // Form state
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setGender((profile.gender as 'male' | 'female' | 'other') || 'male');
      setExperienceLevel((profile.experience_level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate');

      if (profile.height_inches) {
        const feet = Math.floor(profile.height_inches / 12);
        const inches = profile.height_inches % 12;
        setHeightFeet(feet.toString());
        setHeightInches(inches.toString());
      }

      if (profile.date_of_birth) {
        // Extract year from date_of_birth (format: YYYY-MM-DD)
        const year = profile.date_of_birth.split('-')[0];
        if (year) setBirthYear(year);
      }
    }
  }, [profile, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const heightTotal = heightFeet && heightInches
        ? parseInt(heightFeet) * 12 + parseInt(heightInches)
        : null;

      // Convert birth year to date_of_birth format (YYYY-01-01)
      const dateOfBirth = birthYear ? `${birthYear}-01-01` : null;

      await updateProfile({
        gender,
        experience_level: experienceLevel,
        height_inches: heightTotal,
        date_of_birth: dateOfBirth,
      });

      await refetch();
      onClose();
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - parseInt(birthYear) : null;

  const modalContent = (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: `1px solid ${colors.borderSubtle}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: `1px solid ${colors.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ color: colors.text, fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textMuted,
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '1.25rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#EF4444',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Gender */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              Gender
            </label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: gender === g ? `2px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
                    background: gender === g ? 'rgba(201, 167, 90, 0.15)' : colors.inputBg,
                    color: gender === g ? colors.accent : colors.text,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              Experience Level
            </label>
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setExperienceLevel(level)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: experienceLevel === level ? `2px solid ${colors.accent}` : `1px solid ${colors.borderSubtle}`,
                    background: experienceLevel === level ? 'rgba(201, 167, 90, 0.15)' : colors.inputBg,
                    color: experienceLevel === level ? colors.accent : colors.text,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              Height
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="5"
                style={{
                  width: '60px',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: colors.inputBg,
                  border: `1px solid ${colors.borderSubtle}`,
                  color: colors.text,
                  fontSize: '1rem',
                  textAlign: 'center',
                }}
              />
              <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>ft</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="10"
                style={{
                  width: '60px',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: colors.inputBg,
                  border: `1px solid ${colors.borderSubtle}`,
                  color: colors.text,
                  fontSize: '1rem',
                  textAlign: 'center',
                }}
              />
              <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>in</span>
            </div>
          </div>

          {/* Birth Year */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: colors.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              Birth Year {age && <span style={{ color: colors.accent, fontWeight: 400 }}>({age} years old)</span>}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="1990"
              style={{
                width: '100px',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: colors.inputBg,
                border: `1px solid ${colors.borderSubtle}`,
                color: colors.text,
                fontSize: '1rem',
                textAlign: 'center',
              }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '0.75rem',
              background: saving ? colors.textMuted : `linear-gradient(135deg, ${colors.accent}, #B8964A)`,
              border: 'none',
              color: colors.bg,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
