let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function playCorrect() {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(523.25, c.currentTime);
    o.frequency.setValueAtTime(659.25, c.currentTime + 0.1);
    o.frequency.setValueAtTime(783.99, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
    o.start(c.currentTime);
    o.stop(c.currentTime + 0.4);
  } catch {}
}

export function playWrong() {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, c.currentTime);
    o.frequency.setValueAtTime(150, c.currentTime + 0.15);
    g.gain.setValueAtTime(0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.35);
    o.start(c.currentTime);
    o.stop(c.currentTime + 0.35);
  } catch {}
}

export function playLevelUp() {
  try {
    const c = getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, c.currentTime + i * 0.12);
      g.gain.setValueAtTime(0.12, c.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + i * 0.12 + 0.3);
      o.start(c.currentTime + i * 0.12);
      o.stop(c.currentTime + i * 0.12 + 0.3);
    });
  } catch {}
}
