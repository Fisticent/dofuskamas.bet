let audioCtx = null;

export const initAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
};

let droneOsc = null;
let droneGain = null;

export const setAmbientDrone = (mode, enabled, intensity = 0) => {
  if (!enabled) {
    if (droneGain) {
      droneGain.gain.setTargetAtTime(0, audioCtx ? audioCtx.currentTime : 0, 0.5);
      setTimeout(() => {
        if (droneOsc) { try { droneOsc.stop(); droneOsc.disconnect(); } catch(e){} droneOsc = null; }
        if (droneGain) { droneGain.disconnect(); droneGain = null; }
      }, 600);
    }
    return;
  }
  
  initAudio();
  const t = audioCtx.currentTime;

  if (!droneOsc) {
    droneOsc = audioCtx.createOscillator();
    droneGain = audioCtx.createGain();
    droneGain.gain.value = 0;
    droneOsc.connect(droneGain);
    droneGain.connect(audioCtx.destination);
    droneOsc.start();
  }
  
  if (mode === 'boss') {
    droneOsc.type = 'square';
    droneOsc.frequency.setTargetAtTime(50, t, 0.5);
    // Add LFO later in proper systems, but here we just raise the amplitude heavily based on missing health
    droneGain.gain.setTargetAtTime(0.02 + (intensity * 0.08), t, 1);
  } else if (mode === 'tension') {
    droneOsc.type = 'sine';
    // Eerie frequency based on how few players are left
    const freq = 150 + (intensity * 400);
    droneOsc.frequency.setTargetAtTime(freq, t, 2);
    droneGain.gain.setTargetAtTime(0.01 + (intensity * 0.04), t, 2);
  } else {
    droneGain.gain.setTargetAtTime(0, t, 0.5);
  }
};

export const playSound = (type, enabled) => {
  if (!enabled) return;
  initAudio();
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'tick') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t); osc.stop(t + 0.05);
  } else if (type === 'explosion') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
    gain.gain.setValueAtTime(0.3, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.start(t); osc.stop(t + 0.5);
  } else if (type === 'slash') {
    osc.type = 'square'; osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
    gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.start(t); osc.stop(t + 0.2);
  } else if (type === 'coin') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(1200, t);
    gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
  } else if (type === 'divine') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(300, t); osc.frequency.linearRampToValueAtTime(600, t + 1);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.2, t + 0.5); gain.gain.linearRampToValueAtTime(0, t + 1.5);
    osc.start(t); osc.stop(t + 1.5);
  } else if (type === 'heartbeat') {
    const thump = (delay) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t + delay); o.frequency.exponentialRampToValueAtTime(40, t + delay + 0.2);
      g.gain.setValueAtTime(0.5, t + delay); g.gain.exponentialRampToValueAtTime(0.01, t + delay + 0.2);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t + delay); o.stop(t + delay + 0.2);
    };
    thump(0); thump(0.2);
  } else if (type === 'win') {
    [400, 500, 600, 800].forEach((freq, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(freq, t + i * 0.1);
      g.gain.setValueAtTime(0.2, t + i * 0.1); g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.5);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.5);
    });
  }
};
