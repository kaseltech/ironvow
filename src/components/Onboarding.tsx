'use client';

import { useState } from 'react';
import { Logo } from './Logo';
import { useProfile, useWeightGoal, useWeightLogs, useEquipment } from '@/hooks/useSupabase';

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'gender' | 'experience' | 'body' | 'goal' | 'equipment' | 'complete';

export function Onboarding({ onComplete }: OnboardingProps) {
  const { profile, updateProfile } = useProfile();
  const { setWeightGoal } = useWeightGoal();
  const { addWeightLog } = useWeightLogs();
  const { allEquipment, toggleEquipment, hasEquipment } = useEquipment();

  const [step, setStep] = useState<Step>('welcome');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('10');
  const [weight, setWeight] = useState('');
  const [goalType, setGoalType] = useState<'cut' | 'bulk' | 'maintain' | 'recomp' | null>(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [equipmentLocation, setEquipmentLocation] = useState<'home' | 'gym'>('home');
  const [customEquipment, setCustomEquipment] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [saving, setSaving] = useState(false);

  const nextStep = () => {
    const steps: Step[] = ['welcome', 'gender', 'experience', 'body', 'goal', 'equipment', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['welcome', 'gender', 'experience', 'body', 'goal', 'equipment', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const saveAndContinue = async () => {
    setSaving(true);
    try {
      // Save profile data including custom equipment
      const heightTotal = parseInt(heightFeet) * 12 + parseInt(heightInches || '0');
      await updateProfile({
        gender: gender || undefined,
        experience_level: experience || undefined,
        height_inches: heightTotal || undefined,
        custom_equipment: customEquipment.length > 0 ? customEquipment : undefined,
      });

      // Save initial weight if provided
      if (weight) {
        await addWeightLog(parseFloat(weight));
      }

      // Save weight goal if provided
      if (goalType && weight) {
        await setWeightGoal(
          goalType,
          parseFloat(weight),
          targetWeight ? parseFloat(targetWeight) : undefined
        );
      }

      nextStep();
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const finishOnboarding = async () => {
    setSaving(true);
    try {
      // Final save if needed
      await updateProfile({
        gender: gender || undefined,
        experience_level: experience || undefined,
      });
      onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0F2233' }}>
      {/* Progress indicator */}
      {step !== 'welcome' && step !== 'complete' && (
        <div className="px-6 pt-4">
          <div className="flex gap-1">
            {['gender', 'experience', 'body', 'goal', 'equipment'].map((s, i) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: ['gender', 'experience', 'body', 'goal', 'equipment'].indexOf(step) >= i
                    ? '#C9A75A'
                    : 'rgba(201, 167, 90, 0.2)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col p-6">
        {/* Welcome */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Logo size="lg" />
            <h1
              style={{
                fontFamily: 'var(--font-libre-baskerville)',
                fontSize: '2rem',
                color: '#F5F1EA',
                marginTop: '2rem',
                marginBottom: '1rem',
              }}
            >
              Welcome to IronVow
            </h1>
            <p style={{ color: 'rgba(245, 241, 234, 0.7)', fontSize: '1rem', maxWidth: '300px', marginBottom: '3rem' }}>
              Your AI-powered training partner. Let's set up your profile to personalize your experience.
            </p>
            <button onClick={nextStep} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}>
              Get Started
            </button>
          </div>
        )}

        {/* Gender */}
        {step === 'gender' && (
          <div className="flex-1 flex flex-col">
            <button onClick={prevStep} style={{ color: '#C9A75A', background: 'none', border: 'none', alignSelf: 'flex-start', marginBottom: '1rem' }}>
              ← Back
            </button>
            <h2 style={{ fontFamily: 'var(--font-libre-baskerville)', fontSize: '1.75rem', color: '#F5F1EA', marginBottom: '0.5rem' }}>
              What's your gender?
            </h2>
            <p style={{ color: 'rgba(245, 241, 234, 0.6)', marginBottom: '2rem' }}>
              This helps us show accurate body maps and adjust exercise recommendations.
            </p>

            <div className="space-y-3">
              {[
                { value: 'male', label: 'Male', icon: '♂' },
                { value: 'female', label: 'Female', icon: '♀' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setGender(option.value as 'male' | 'female')}
                  className="w-full card text-left flex items-center gap-4"
                  style={{
                    border: gender === option.value ? '2px solid #C9A75A' : '2px solid transparent',
                    background: gender === option.value ? 'rgba(201, 167, 90, 0.1)' : undefined,
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{option.icon}</span>
                  <span style={{ color: '#F5F1EA', fontSize: '1.125rem' }}>{option.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-auto">
              <button
                onClick={nextStep}
                disabled={!gender}
                className="btn-primary w-full"
                style={{ opacity: gender ? 1 : 0.5 }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Experience */}
        {step === 'experience' && (
          <div className="flex-1 flex flex-col">
            <button onClick={prevStep} style={{ color: '#C9A75A', background: 'none', border: 'none', alignSelf: 'flex-start', marginBottom: '1rem' }}>
              ← Back
            </button>
            <h2 style={{ fontFamily: 'var(--font-libre-baskerville)', fontSize: '1.75rem', color: '#F5F1EA', marginBottom: '0.5rem' }}>
              What's your experience level?
            </h2>
            <p style={{ color: 'rgba(245, 241, 234, 0.6)', marginBottom: '2rem' }}>
              We'll adjust exercise complexity and volume accordingly.
            </p>

            <div className="space-y-3">
              {[
                { value: 'beginner', label: 'Beginner', desc: 'New to lifting or less than 6 months' },
                { value: 'intermediate', label: 'Intermediate', desc: '6 months to 2 years of consistent training' },
                { value: 'advanced', label: 'Advanced', desc: '2+ years with solid strength foundation' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setExperience(option.value as typeof experience)}
                  className="w-full card text-left"
                  style={{
                    border: experience === option.value ? '2px solid #C9A75A' : '2px solid transparent',
                    background: experience === option.value ? 'rgba(201, 167, 90, 0.1)' : undefined,
                  }}
                >
                  <div style={{ color: '#F5F1EA', fontSize: '1.125rem', marginBottom: '0.25rem' }}>{option.label}</div>
                  <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.875rem' }}>{option.desc}</div>
                </button>
              ))}
            </div>

            <div className="mt-auto">
              <button
                onClick={nextStep}
                disabled={!experience}
                className="btn-primary w-full"
                style={{ opacity: experience ? 1 : 0.5 }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Body stats */}
        {step === 'body' && (
          <div className="flex-1 flex flex-col">
            <button onClick={prevStep} style={{ color: '#C9A75A', background: 'none', border: 'none', alignSelf: 'flex-start', marginBottom: '1rem' }}>
              ← Back
            </button>
            <h2 style={{ fontFamily: 'var(--font-libre-baskerville)', fontSize: '1.75rem', color: '#F5F1EA', marginBottom: '0.5rem' }}>
              Body measurements
            </h2>
            <p style={{ color: 'rgba(245, 241, 234, 0.6)', marginBottom: '2rem' }}>
              Optional but helps track progress and estimate strength.
            </p>

            <div className="space-y-6">
              {/* Height */}
              <div className="card">
                <label style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Height
                </label>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={heightFeet}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setHeightFeet(val);
                      }}
                      onFocus={e => e.target.select()}
                      style={{
                        width: '60px',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(15, 34, 51, 0.8)',
                        border: '1px solid rgba(201, 167, 90, 0.2)',
                        color: '#F5F1EA',
                        fontSize: '1.25rem',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)' }}>ft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={heightInches}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setHeightInches(val);
                      }}
                      onFocus={e => e.target.select()}
                      style={{
                        width: '60px',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(15, 34, 51, 0.8)',
                        border: '1px solid rgba(201, 167, 90, 0.2)',
                        color: '#F5F1EA',
                        fontSize: '1.25rem',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ color: 'rgba(245, 241, 234, 0.5)' }}>in</span>
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div className="card">
                <label style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Weight
                </label>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={weight}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setWeight(val);
                    }}
                    placeholder=""
                    style={{
                      width: '100px',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(15, 34, 51, 0.8)',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      color: '#F5F1EA',
                      fontSize: '1.25rem',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)' }}>lbs</span>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <button onClick={nextStep} className="btn-primary w-full">
                Continue
              </button>
              <button
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(245, 241, 234, 0.5)',
                  fontSize: '0.875rem',
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Goal */}
        {step === 'goal' && (
          <div className="flex-1 flex flex-col">
            <button onClick={prevStep} style={{ color: '#C9A75A', background: 'none', border: 'none', alignSelf: 'flex-start', marginBottom: '1rem' }}>
              ← Back
            </button>
            <h2 style={{ fontFamily: 'var(--font-libre-baskerville)', fontSize: '1.75rem', color: '#F5F1EA', marginBottom: '0.5rem' }}>
              What's your goal?
            </h2>
            <p style={{ color: 'rgba(245, 241, 234, 0.6)', marginBottom: '2rem' }}>
              This helps the AI optimize your workouts.
            </p>

            <div className="space-y-3">
              {[
                { value: 'cut', label: 'Lose fat (Cut)', desc: 'Reduce body fat while maintaining muscle', icon: '📉' },
                { value: 'bulk', label: 'Build muscle (Bulk)', desc: 'Gain muscle mass with strength training', icon: '📈' },
                { value: 'maintain', label: 'Maintain', desc: 'Stay at current weight and fitness level', icon: '⚖️' },
                { value: 'recomp', label: 'Recomposition', desc: 'Lose fat and build muscle simultaneously', icon: '🔄' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setGoalType(option.value as typeof goalType)}
                  className="w-full card text-left flex items-center gap-4"
                  style={{
                    border: goalType === option.value ? '2px solid #C9A75A' : '2px solid transparent',
                    background: goalType === option.value ? 'rgba(201, 167, 90, 0.1)' : undefined,
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{option.icon}</span>
                  <div>
                    <div style={{ color: '#F5F1EA', fontSize: '1rem', fontWeight: 500 }}>{option.label}</div>
                    <div style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.8125rem' }}>{option.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {goalType && (goalType === 'cut' || goalType === 'bulk') && (
              <div className="card mt-4">
                <label style={{ color: '#C9A75A', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target Weight (optional)
                </label>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={targetWeight}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setTargetWeight(val);
                    }}
                    placeholder=""
                    style={{
                      width: '100px',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(15, 34, 51, 0.8)',
                      border: '1px solid rgba(201, 167, 90, 0.2)',
                      color: '#F5F1EA',
                      fontSize: '1.25rem',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ color: 'rgba(245, 241, 234, 0.5)' }}>lbs</span>
                </div>
              </div>
            )}

            <div className="mt-auto">
              <button onClick={nextStep} className="btn-primary w-full">
                Continue
              </button>
              <button
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(245, 241, 234, 0.5)',
                  fontSize: '0.875rem',
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Equipment */}
        {step === 'equipment' && (
          <div className="flex-1 flex flex-col">
            <button onClick={prevStep} style={{ color: '#C9A75A', background: 'none', border: 'none', alignSelf: 'flex-start', marginBottom: '1rem' }}>
              ← Back
            </button>
            <h2 style={{ fontFamily: 'var(--font-libre-baskerville)', fontSize: '1.75rem', color: '#F5F1EA', marginBottom: '0.5rem' }}>
              What equipment do you have?
            </h2>
            <p style={{ color: 'rgba(245, 241, 234, 0.6)', marginBottom: '1rem' }}>
              Select what's available to you. You can update this anytime.
            </p>

            {/* Location toggle */}
            <div className="flex gap-2 mb-4">
              {(['gym', 'home'] as const).map(loc => (
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

            {equipmentLocation === 'gym' && (
              <div
                className="card mb-4"
                style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
              >
                <p style={{ color: '#4ADE80', fontSize: '0.875rem' }}>
                  Gym typically has full equipment access. We'll assume you have access to standard gym equipment.
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4" style={{ maxHeight: '250px' }}>
              {Object.entries(groupedEquipment).map(([category, items]) => (
                <div key={category}>
                  <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map(eq => {
                      const selected = hasEquipment(eq.id, equipmentLocation);
                      return (
                        <button
                          key={eq.id}
                          onClick={() => toggleEquipment(eq.id, equipmentLocation)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '2rem',
                            background: selected ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                            border: selected ? '1px solid #C9A75A' : '1px solid rgba(201, 167, 90, 0.2)',
                            color: selected ? '#C9A75A' : 'rgba(245, 241, 234, 0.6)',
                            fontSize: '0.8125rem',
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

            {/* Custom Equipment Section */}
            <div className="mt-4">
              <h3 style={{ color: '#C9A75A', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Custom Equipment
              </h3>
              <p style={{ color: 'rgba(245, 241, 234, 0.5)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                Add anything not listed above. The AI will consider these when generating workouts.
              </p>

              {/* Custom equipment tags */}
              {customEquipment.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {customEquipment.map(item => (
                    <span
                      key={item}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '2rem',
                        background: 'rgba(74, 222, 128, 0.15)',
                        border: '1px solid rgba(74, 222, 128, 0.3)',
                        color: '#4ADE80',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {item}
                      <button
                        onClick={() => removeCustomEquipment(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(74, 222, 128, 0.7)',
                          fontSize: '1rem',
                          lineHeight: 1,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input field */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  placeholder="e.g., Cable crossover machine, Reverse hyper..."
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
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
                    padding: '0.625rem 1rem',
                    borderRadius: '0.5rem',
                    background: customInput.trim() ? 'rgba(201, 167, 90, 0.2)' : 'transparent',
                    border: '1px solid rgba(201, 167, 90, 0.3)',
                    color: customInput.trim() ? '#C9A75A' : 'rgba(201, 167, 90, 0.4)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: customInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button onClick={saveAndContinue} disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Complete */}
        {step === 'complete' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💪</div>
            <h2
              style={{
                fontFamily: 'var(--font-libre-baskerville)',
                fontSize: '2rem',
                color: '#F5F1EA',
                marginBottom: '0.5rem',
              }}
            >
              You're all set!
            </h2>
            <p style={{ color: 'rgba(245, 241, 234, 0.7)', fontSize: '1rem', maxWidth: '300px', marginBottom: '3rem' }}>
              Your profile is ready. Let's generate your first workout.
            </p>
            <button onClick={finishOnboarding} disabled={saving} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}>
              {saving ? 'Finishing...' : 'Start Training'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
