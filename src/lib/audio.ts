// src/lib/audio.ts
//
// Tiny Web Audio synth for the lucky-draw reveal. No external assets; sounds
// are generated on demand so the app has no audio-file dependencies and works
// fully offline.

let cachedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!cachedCtx) {
    // Some browsers ship `webkitAudioContext` instead of `AudioContext`.
    const Ctor =
      window.AudioContext ||
      (
        window as unknown as { webkitAudioContext?: typeof AudioContext }
      ).webkitAudioContext;
    if (!Ctor) {
      throw new Error("Web Audio API is not supported in this browser.");
    }
    cachedCtx = new Ctor();
  }
  // Browsers may auto-suspend the context (autoplay policy). Resume on demand
  // so a subsequent gesture is what unlocks playback.
  if (cachedCtx.state === "suspended") {
    void cachedCtx.resume();
  }
  return cachedCtx;
}

/** Lazy accessor for the shared AudioContext. Must be called from within a
 *  user-gesture handler (e.g. a click) to satisfy browser autoplay rules. */
export function getAudioContext(): AudioContext {
  return getCtx();
}

/**
 * Drumroll: rapid low-pitch beats for `durationMs`. Used while the canvas
 * collapse/burst animation is playing.
 */
export function playDrumroll(ctx: AudioContext, durationMs: number): void {
  const start = ctx.currentTime;
  const beatInterval = 0.06; // 60ms between beats ≈ 16 beats/sec
  for (let t = 0; t < durationMs / 1000; t += beatInterval) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(110, start + t);
    gain.gain.setValueAtTime(0, start + t);
    gain.gain.linearRampToValueAtTime(0.28, start + t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, start + t + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start + t);
    osc.stop(start + t + 0.07);
  }
}

/**
 * Fanfare: three ascending triangle-wave notes (C5 → E5 → G5, with G held
 * longer). Plays once the canvas reveal animation finishes.
 */
export function playFanfare(ctx: AudioContext): void {
  const start = ctx.currentTime;
  const notes: { freq: number; time: number; duration: number }[] = [
    { freq: 523.25, time: 0.0, duration: 0.16 },
    { freq: 659.25, time: 0.16, duration: 0.16 },
    { freq: 783.99, time: 0.32, duration: 0.5 },
  ];
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(note.freq, start + note.time);
    gain.gain.setValueAtTime(0, start + note.time);
    gain.gain.linearRampToValueAtTime(0.32, start + note.time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + note.time + note.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start + note.time);
    osc.stop(start + note.time + note.duration + 0.02);
  }
}
