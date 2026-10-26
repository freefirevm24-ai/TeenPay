/**
 * Soundbox: cash-register chime + text-to-speech announcements.
 * All audio is synthesized in the browser so no binary assets are required.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

/** Play a bright two-note "ka-ching" cash-register chime. */
export function playCashRegister(volume = 0.7): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume));
  master.connect(ctx.destination);

  // Bell-like ding: two stacked oscillators with a fast decay.
  const notes = [
    { freq: 1318.5, start: 0, duration: 0.18 },
    { freq: 1760, start: 0.09, duration: 0.32 },
  ];

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(note.freq, now + note.start);
    gain.gain.setValueAtTime(0.0001, now + note.start);
    gain.gain.exponentialRampToValueAtTime(0.9, now + note.start + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + note.start + note.duration,
    );
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + note.start);
    osc.stop(now + note.start + note.duration + 0.02);
  }

  // Metallic "cha" noise burst for the register drawer feel.
  const bufferSize = Math.floor(ctx.sampleRate * 0.12);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.25, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2400;
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);
}

/** Speak a funny announcement with the Web Speech API. */
export function speak(message: string, volume = 0.7): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1.05;
  utterance.pitch = 1.15;
  utterance.volume = Math.max(0, Math.min(1, volume));
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => v.lang.startsWith("en-IN"));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/** Fire the full soundbox alert: chime then voice line. */
export function fireSoundbox(
  message: string,
  volume: number,
  enabled: boolean,
): void {
  if (!enabled) return;
  playCashRegister(volume);
  window.setTimeout(() => speak(message, volume), 420);
}
