// Ambient Soundscapes Engine
class SoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.playing = {};
    this.gains = {};
  }

  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Generate noise buffer
  noise(seconds, type) {
    this.init();
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(2, sr * seconds, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      if (type === 'brown') {
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (last + 0.02 * white) / 1.02;
          last = data[i];
          data[i] *= 3.5;
        }
      } else {
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
    }
    return buf;
  }

  startRain() {
    if (this.playing.rain) return;
    this.init();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise(4, 'white');
    src.loop = true;
    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 400;
    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 100;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.15;
    src.connect(lpf); lpf.connect(hpf); hpf.connect(gain); gain.connect(this.ctx.destination);
    src.start();
    this.playing.rain = src; this.gains.rain = gain;

    // Occasional thunder rumble
    this.thunderInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 40 + Math.random() * 30;
        g.gain.value = 0; g.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 2.5);
      }
    }, 8000);
  }

  startOcean() {
    if (this.playing.ocean) return;
    this.init();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise(6, 'brown');
    src.loop = true;
    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 300;
    // Modulate for wave effect
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.1; lfoGain.gain.value = 150;
    lfo.connect(lfoGain); lfoGain.connect(lpf.frequency);
    lfo.start();
    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;
    src.connect(lpf); lpf.connect(gain); gain.connect(this.ctx.destination);
    src.start();
    this.playing.ocean = src; this.gains.ocean = gain;
    this.playing.oceanLfo = lfo;
  }

  startForest() {
    if (this.playing.forest) return;
    this.init();
    // Soft wind
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise(4, 'brown');
    src.loop = true;
    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 200;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.08;
    src.connect(lpf); lpf.connect(gain); gain.connect(this.ctx.destination);
    src.start();
    this.playing.forest = src; this.gains.forest = gain;

    // Bird chirps
    this.birdInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        const baseFreq = 2000 + Math.random() * 2000;
        osc.frequency.value = baseFreq;
        osc.frequency.linearRampToValueAtTime(baseFreq + 500, this.ctx.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(baseFreq - 200, this.ctx.currentTime + 0.2);
        g.gain.value = 0; g.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.05);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.4);
      }
    }, 3000);
  }

  startCampfire() {
    if (this.playing.fire) return;
    this.init();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise(3, 'white');
    src.loop = true;
    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 500; bpf.Q.value = 0.5;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.1;
    src.connect(bpf); bpf.connect(gain); gain.connect(this.ctx.destination);
    src.start();
    this.playing.fire = src; this.gains.fire = gain;

    // Crackle pops
    this.crackleInterval = setInterval(() => {
      for (let i = 0; i < 2 + Math.random() * 3; i++) {
        setTimeout(() => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'square'; osc.frequency.value = 100 + Math.random() * 300;
          g.gain.value = 0.03; g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
          osc.connect(g); g.connect(this.ctx.destination);
          osc.start(); osc.stop(this.ctx.currentTime + 0.06);
        }, Math.random() * 500);
      }
    }, 2000);
  }

  startCafe() {
    if (this.playing.cafe) return;
    this.init();
    // Murmur
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise(5, 'brown');
    src.loop = true;
    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 500;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.12;
    src.connect(lpf); lpf.connect(gain); gain.connect(this.ctx.destination);
    src.start();
    this.playing.cafe = src; this.gains.cafe = gain;
  }

  stop(name) {
    if (this.playing[name]) { try { this.playing[name].stop(); } catch(e) {} delete this.playing[name]; }
    if (name === 'ocean' && this.playing.oceanLfo) { this.playing.oceanLfo.stop(); delete this.playing.oceanLfo; }
    if (name === 'forest' && this.birdInterval) clearInterval(this.birdInterval);
    if (name === 'fire' && this.crackleInterval) clearInterval(this.crackleInterval);
    if (name === 'rain' && this.thunderInterval) clearInterval(this.thunderInterval);
  }

  stopAll() {
    Object.keys(this.playing).forEach(k => this.stop(k));
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }
}

window.soundscape = new SoundscapeEngine();
