import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type SoundType = 'countdown' | 'workStart' | 'restStart' | 'complete' | 'warning' | 'lap';

class TimerAudio {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private hapticEnabled: boolean = true;
  private synth: SpeechSynthesis | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  private getSynth(): SpeechSynthesis | null {
    if (typeof window === 'undefined') return null;
    if (!this.synth) {
      this.synth = window.speechSynthesis;
    }
    return this.synth;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled;
  }

  // Speak a word/number
  private speak(text: string, rate: number = 1.2): void {
    if (!this.enabled) return;
    const synth = this.getSynth();
    if (!synth) return;

    try {
      // Cancel any ongoing speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a good voice
      const voices = synth.getVoices();
      const preferredVoice = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Google'))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      synth.speak(utterance);
    } catch (e) {
      // Speech not available, fall back to beep
      this.beep(660, 0.1);
    }
  }

  private async playHaptic(style: ImpactStyle): Promise<void> {
    if (!this.hapticEnabled) return;
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Haptics not available
    }
  }

  private playTone(frequency: number, duration: number, volume: number = 0.5): void {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not available
    }
  }

  // Individual beep
  private beep(frequency: number, duration: number = 0.15): void {
    this.playTone(frequency, duration);
  }

  // Voice countdown (4, 3, 2, 1)
  playCountdownNumber(num: number): void {
    this.speak(num.toString(), 1.3);
    this.playHaptic(ImpactStyle.Light);
  }

  // Legacy beep countdown (fallback)
  playCountdown(): void {
    this.beep(660, 0.1);
    this.playHaptic(ImpactStyle.Light);
  }

  // GO! voice
  playGo(): void {
    this.speak('Go!', 1.2);
    this.playHaptic(ImpactStyle.Heavy);
  }

  // Work phase start - ascending tone
  playWorkStart(): void {
    this.beep(880, 0.2);
    this.playHaptic(ImpactStyle.Medium);
  }

  // Rest phase start - descending tone
  playRestStart(): void {
    this.beep(440, 0.3);
    this.playHaptic(ImpactStyle.Medium);
  }

  // Warning beep (time running low)
  playWarning(): void {
    this.beep(550, 0.1);
    this.playHaptic(ImpactStyle.Light);
  }

  // Lap recorded
  playLap(): void {
    this.beep(720, 0.1);
    this.playHaptic(ImpactStyle.Light);
  }

  // Timer complete - three ascending beeps
  playComplete(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Three ascending tones
    [660, 880, 1100].forEach((freq, i) => {
      setTimeout(() => this.beep(freq, 0.2), i * 150);
    });

    this.playHaptic(ImpactStyle.Heavy);
  }

  // Play sound by type
  play(type: SoundType): void {
    switch (type) {
      case 'countdown':
        this.playCountdown();
        break;
      case 'workStart':
        this.playWorkStart();
        break;
      case 'restStart':
        this.playRestStart();
        break;
      case 'complete':
        this.playComplete();
        break;
      case 'warning':
        this.playWarning();
        break;
      case 'lap':
        this.playLap();
        break;
    }
  }

  // Resume audio context (call on user interaction)
  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Singleton instance
export const timerAudio = new TimerAudio();
