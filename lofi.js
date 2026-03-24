// Lo-Fi Music Engine - Ambient chill beats using Web Audio API
class LofiEngine {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.nodes = [];
    // Chill chord progressions in C major / A minor
    this.chords = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 277.18, 329.63], // A minor
      [246.94, 311.13, 369.99], // B dim (approx)
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
    ];
    this.chordIndex = 0;
    this.beatTimer = null;
  }

  start() {
    if (this.playing) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.playing = true;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.12;
    
    // Lo-pass filter for warmth
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 800;
    this.filter.Q.value = 1;
    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Vinyl crackle (noise)
    this.startCrackle();
    // Start chord loop
    this.playNextChord();
    this.beatTimer = setInterval(() => this.playNextChord(), 4000);
    // Subtle bass
    this.startBass();
  }

  stop() {
    this.playing = false;
    if (this.beatTimer) clearInterval(this.beatTimer);
    this.nodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this.nodes = [];
    if (this.ctx) this.ctx.close();
    this.ctx = null;
  }

  playNextChord() {
    if (!this.playing || !this.ctx) return;
    const chord = this.chords[this.chordIndex % this.chords.length];
    this.chordIndex++;
    
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // Mix of triangle and sine for lo-fi warmth
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq / 2; // One octave lower for chill
      
      // Slight detune for that wobbly vinyl feel
      osc.detune.value = (Math.random() - 0.5) * 15;
      
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 3.8);
      
      osc.connect(gain);
      gain.connect(this.filter);
      osc.start();
      osc.stop(this.ctx.currentTime + 4);
      this.nodes.push(osc);
    });

    // Random melody note on top
    if (Math.random() > 0.3) {
      const melody = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5 D5 E5 G5 A5 pentatonic
      const note = melody[Math.floor(Math.random() * melody.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = note / 2;
      gain.gain.value = 0;
      const delay = Math.random() * 2;
      gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + delay + 0.1);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + delay + 1.5);
      osc.connect(gain);
      gain.connect(this.filter);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 2);
      this.nodes.push(osc);
    }
  }

  startCrackle() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Sparse crackle - mostly silence with occasional pops
      data[i] = Math.random() > 0.997 ? (Math.random() - 0.5) * 0.3 : 0;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.15;
    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 1000;
    source.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.masterGain);
    source.start();
    this.nodes.push(source);
  }

  startBass() {
    if (!this.ctx) return;
    const bassNotes = [130.81, 110.00, 130.81, 87.31, 98.00, 110.00, 87.31, 98.00];
    let bassIdx = 0;
    const playBass = () => {
      if (!this.playing || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = bassNotes[bassIdx % bassNotes.length] / 2;
      bassIdx++;
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.2);
      gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 2);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 3.8);
      osc.connect(gain);
      gain.connect(this.filter);
      osc.start();
      osc.stop(this.ctx.currentTime + 4);
      this.nodes.push(osc);
    };
    playBass();
    setInterval(playBass, 4000);
  }
}

window.lofiEngine = new LofiEngine();
