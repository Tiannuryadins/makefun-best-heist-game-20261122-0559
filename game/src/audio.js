// WebAudio synth for Midnight Vault: every sound is generated, no audio
// files. A low tension drone while playing, blips for loot, a rising alarm
// sting when spotted, and a cash-register arpeggio when the vault opens.

let ctx = null;
let muted = false;
let droneNodes = null;

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  if (droneNodes) droneNodes.gain.gain.value = muted ? 0 : 0.035;
  return muted;
}

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  if (muted) return;
  const ac = ensureCtx();
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playLoot() { tone(880, 0.12, 'triangle', 0.12); tone(1318, 0.16, 'triangle', 0.1, 0.07); }
export function playVault() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.13, i * 0.09));
}
export function playCaught() {
  tone(220, 0.5, 'sawtooth', 0.14);
  tone(174, 0.7, 'sawtooth', 0.14, 0.15);
}
export function playWin() {
  [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.1));
}
export function playClick() { tone(660, 0.06, 'square', 0.06); }
export function playSmoke() { tone(180, 0.35, 'sine', 0.1); }
export function playEmp() { tone(1200, 0.2, 'square', 0.07); tone(900, 0.25, 'square', 0.07, 0.08); }

export function startDrone() {
  if (droneNodes) return;
  const ac = ensureCtx();
  const osc = ac.createOscillator();
  const osc2 = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine'; osc.frequency.value = 55;
  osc2.type = 'sine'; osc2.frequency.value = 55.7;
  gain.gain.value = muted ? 0 : 0.035;
  osc.connect(gain); osc2.connect(gain); gain.connect(ac.destination);
  osc.start(); osc2.start();
  droneNodes = { osc, osc2, gain };
}

export function stopDrone() {
  if (!droneNodes) return;
  try { droneNodes.osc.stop(); droneNodes.osc2.stop(); } catch { /* already stopped */ }
  droneNodes = null;
}
