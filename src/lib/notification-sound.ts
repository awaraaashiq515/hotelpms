/**
 * Sound notification engine for Antigravity Hotel PMS & Partner Portals.
 * Uses Web Audio API for zero-latency, cross-platform audio synthesized in real time.
 * No external .mp3 files required — works reliably offline and on mobile.
 */

let sharedAudioContext: AudioContext | null = null;
let isAudioUnlocked = false;

/**
 * Returns or initializes a shared AudioContext singleton.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioContext = new AudioContextClass();
      }
    }
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => { });
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Automatically unlocks audio context on first touch / click (vital for mobile browsers like Safari iOS / Chrome Android).
 */
export function setupAudioUnlock(): void {
  if (typeof window === 'undefined' || isAudioUnlocked) return;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isAudioUnlocked = true;
        }).catch(() => { });
      } else {
        isAudioUnlocked = true;
      }
    }
    // Remove listeners once unlocked
    window.removeEventListener('click', unlock);
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('keydown', unlock);
  };

  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

/**
 * Check if notifications sound is enabled by user preference
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('app_notification_sound_enabled');
  return val === null ? true : val === 'true';
}

/**
 * Toggle sound notifications on or off
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('app_notification_sound_enabled', enabled ? 'true' : 'false');
}

export type SoundEffectType = 'lead' | 'booking' | 'agent_booking' | 'success' | 'alert' | 'ding';

/**
 * Play a notification sound effect.
 */
export function playNotificationSound(type: SoundEffectType = 'lead', volumeMultiplier: number = 1.0): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const baseVolume = 0.28 * Math.max(0.1, Math.min(volumeMultiplier, 1.8));

    if (type === 'agent_booking' || type === 'booking') {
      // 🛎️ Premium Hotel Front Desk Bell (Classic 2-strike brass chime: A5 -> D6)
      // Realistic bell harmonics: fundamental + 2nd harmonic + shimmer overtone
      const strikes = [
        { fundamental: 880.00, overtone: 1760.00, shimmer: 2640.00, start: 0, dur: 0.8, vol: 1.0 },
        { fundamental: 1174.66, overtone: 2349.32, shimmer: 3520.00, start: 0.22, dur: 1.2, vol: 1.2 },
      ];

      strikes.forEach(({ fundamental, overtone, shimmer, start, dur, vol }) => {
        const strokeVol = baseVolume * vol;

        // 1. Pure bell tone (sine)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(fundamental, now + start);
        gain1.gain.setValueAtTime(strokeVol * 0.8, now + start);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now + start);
        osc1.stop(now + start + dur);

        // 2. Bright brass strike overtone (triangle)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(overtone, now + start);
        gain2.gain.setValueAtTime(strokeVol * 0.45, now + start);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + start + (dur * 0.75));
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + start);
        osc2.stop(now + start + dur);

        // 3. Shimmer metallic ring (sine)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(shimmer, now + start);
        gain3.gain.setValueAtTime(strokeVol * 0.2, now + start);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + start + (dur * 0.5));
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now + start);
        osc3.stop(now + start + dur);
      });
    } else if (type === 'lead') {
      // 🚴 New Lead / Rental Enquiry Chime (Crisp 3-note upbeat bell: D5 -> F#5 -> A5)
      const notes = [
        { freq: 587.33, start: 0, dur: 0.12 },
        { freq: 739.99, start: 0.1, dur: 0.12 },
        { freq: 880.0, start: 0.22, dur: 0.45 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(baseVolume, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } else if (type === 'success') {
      // ✅ Success Confirmation (C-E-G major chord arpeggio)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = idx * 0.08;
        const dur = 0.35;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(baseVolume * 0.7, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } else if (type === 'alert') {
      // ⚠️ Alert / Attention Required
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.1);
      osc.frequency.linearRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(baseVolume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // 🔔 Simple Ding
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      gain.gain.setValueAtTime(baseVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // Silently continue if audio fails
  }
}

