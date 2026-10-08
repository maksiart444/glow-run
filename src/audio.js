// Звуки и музыка без файлов: всё синтезируется прямо в браузере (Web Audio).
// На iPhone звук включается только после первого касания — это требование Safari.

const midiToHz = m => 440 * 2 ** ((m - 69) / 12);

export class Sound {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.flip = false;
    this.song = null;
    this.timer = null;
    this.lastDot = 0;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = this.ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(comp);
      this.sfx = ctx.createGain();
      this.sfx.connect(this.master);
      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 18000;
      this.musicFilter.connect(this.master);
      this.music = ctx.createGain();
      this.music.connect(this.musicFilter);
      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.apply();
  }

  apply() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfx.gain.setTargetAtTime(this.settings.sound ? 0.5 : 0, t, 0.02);
    this.music.gain.setTargetAtTime(this.settings.music ? 0.2 : 0, t, 0.05);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  tone(freq, dur, o = {}) {
    const ctx = this.ctx;
    const t = (o.at ?? ctx.currentTime) + (o.delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    const vol = o.vol ?? 0.2;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + (o.attack ?? 0.005));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.cut) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.cut;
      osc.connect(f);
      node = f;
    }
    node.connect(gain);
    gain.connect(o.dest || this.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  noise(dur, o = {}) {
    const ctx = this.ctx;
    const t = (o.at ?? ctx.currentTime) + (o.delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'highpass';
    f.frequency.value = o.freq || 6000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(o.vol ?? 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(gain); gain.connect(o.dest || this.sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  play(name, world) {
    if (!this.ctx || !this.settings.sound || this.ctx.state !== 'running') return;
    const fx = world?.sfx || { dotWave: 'square', dot: [740, 880], power: 'sawtooth' };
    switch (name) {
      case 'dot': {
        const now = this.ctx.currentTime;
        if (now - this.lastDot < 0.045) return;
        this.lastDot = now;
        this.flip = !this.flip;
        this.tone(fx.dot[this.flip ? 1 : 0], 0.06, { type: fx.dotWave, vol: 0.09 });
        break;
      }
      case 'power':
        this.tone(220, 0.45, { type: fx.power, slide: 880, vol: 0.18, cut: 3000 });
        this.tone(330, 0.45, { type: 'sine', slide: 1320, vol: 0.12, delay: 0.05 });
        break;
      case 'eat':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.09, { type: 'square', vol: 0.12, delay: i * 0.045, cut: 4000 }));
        break;
      case 'death':
        this.tone(880, 1.2, { type: 'sawtooth', slide: 55, vol: 0.2, cut: 2500 });
        this.tone(660, 1.0, { type: 'square', slide: 40, vol: 0.08, delay: 0.1 });
        this.noise(0.8, { filter: 'lowpass', freq: 1200, vol: 0.15, delay: 0.5 });
        break;
      case 'item':
        [880, 1175, 1568].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', vol: 0.16, delay: i * 0.07 }));
        break;
      case 'extra':
        [659, 784, 988, 1318, 1568].forEach((f, i) => this.tone(f, 0.16, { type: 'square', vol: 0.1, delay: i * 0.08, cut: 5000 }));
        break;
      case 'trap':
        this.tone(140, 0.35, { type: 'sawtooth', slide: 70, vol: 0.18, cut: 900 });
        this.noise(0.25, { filter: 'bandpass', freq: 900, vol: 0.12 });
        break;
      case 'alert':
        this.tone(1200, 0.07, { type: 'square', vol: 0.08 });
        this.tone(1500, 0.07, { type: 'square', vol: 0.08, delay: 0.09 });
        break;
      case 'clear':
        [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', vol: 0.16, delay: i * 0.1 }));
        break;
      case 'start':
        [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.14, { type: 'triangle', vol: 0.14, delay: i * 0.09 }));
        break;
      case 'unlock':
        [523, 659, 784].forEach(f => this.tone(f, 0.9, { type: 'triangle', vol: 0.1, attack: 0.05 }));
        [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(f, 0.25, { type: 'sine', vol: 0.1, delay: 0.2 + i * 0.1 }));
        break;
      case 'gameover':
        [392, 349, 311, 262].forEach((f, i) => this.tone(f, 0.35, { type: 'triangle', vol: 0.16, delay: i * 0.22 }));
        break;
      case 'click':
        this.tone(900, 0.05, { type: 'triangle', vol: 0.12 });
        break;
    }
  }

  // ---------- Музыка: простой секвенсор из 16 шагов на такт ----------

  setSong(song) {
    if (this.song === song) return;
    this.song = song;
    if (this.timer) { this.stopMusic(); this.startMusic(); }
  }

  startMusic() {
    if (!this.ctx || !this.song || this.timer) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
  }

  setFright(on) {
    if (!this.ctx) return;
    this.musicFilter.frequency.setTargetAtTime(on ? 650 : 18000, this.ctx.currentTime, 0.15);
  }

  schedule() {
    if (this.ctx.state !== 'running') { this.nextTime = this.ctx.currentTime + 0.05; return; }
    const song = this.song, stepDur = 60 / song.bpm / 4;
    if (this.nextTime < this.ctx.currentTime - 0.2) this.nextTime = this.ctx.currentTime + 0.02;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      this.playStep(song, this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % (16 * song.prog.length);
    }
  }

  // Нота гаммы: degree может быть больше длины гаммы — тогда октава выше.
  note(song, degree) {
    const n = song.scale.length;
    const oct = Math.floor(degree / n);
    return song.root + song.scale[((degree % n) + n) % n] + oct * 12;
  }

  playStep(song, step, t, stepDur) {
    const i = step % 16, chord = song.prog[Math.floor(step / 16)];
    const dest = this.music;
    const b = song.bass[i];
    if (b !== null && b !== undefined) {
      this.tone(midiToHz(this.note(song, chord) + b), stepDur * 1.8, { type: song.bassWave, vol: 0.5, cut: song.bassCut, at: t, dest });
    }
    const a = song.arp[i];
    if (a !== null && a !== undefined) {
      this.tone(midiToHz(this.note(song, chord + a * 2) + 24), stepDur * 1.5, { type: song.arpWave, vol: song.arpVol * 4, at: t, dest, cut: 5000 });
    }
    if (song.kick && song.kick[i]) this.tone(140, 0.18, { type: 'sine', slide: 45, vol: 0.55, at: t, dest });
    if (song.hat && song.hat[i]) this.noise(0.04, { freq: 8000, vol: (song.hatVol || 0.03) * 4, at: t, dest });
    if (song.bubbles && Math.random() < 0.12) {
      this.tone(midiToHz(this.note(song, chord + 7 + Math.floor(Math.random() * 5))), 0.12, { type: 'sine', vol: 0.12, at: t, dest, slide: 1800 });
    }
  }
}
