// Мир 3 — НОЧНОЙ ЛЕС (Forest Glow): волшебный ночной лес. Герой — светлячок.

import { rgba, eyes, scaredFace, star, verticalGradient } from './common.js';

const TAU = Math.PI * 2;

export default {
  id: 'forest',
  name: 'Нічний ліс',
  subtitle: 'Чарівний нічний ліс. Збирай іскри й запалюй місячні квіти.',
  heroName: 'Світлячок',
  dotName: 'іскри',
  powerName: 'Місячна квітка',
  itemName: 'Жолудь',
  trapName: 'павутина',

  colors: {
    bgTop: '#0a2416', bgBottom: '#020805', mazeBg: '#03100a',
    wall: '#5cf28f', wallFill: 'rgba(92,242,143,0.07)', door: '#ffd166',
    accent: '#5cf28f', accent2: '#ffd166',
    hero: '#d4ff4f', dot: '#ffe066', power: '#efe3ff',
    fright: '#5468ff', frightFlash: '#eef0ff', text: '#f1ffe9',
  },
  enemies: {
    hunter: { name: 'Кажан', color: '#ff4766' },
    interceptor: { name: 'Сова', color: '#ffa53d' },
    patrol: { name: 'Лис-дух', color: '#6ff3ff' },
    chaos: { name: 'Павук', color: '#c77dff' },
  },
  sweep: { type: 'pulse', speed: 1.4, size: 1, alpha: 0.35, color: '#e3ffd0' },

  maze: [
    '####t#####',
    '#o..t....#',
    '#.#.#.##.#',
    '#.#...#...',
    '#.###.#.##',
    '#.....#...',
    '##.##...##',
    '#..####.##',
    '#.###....E',
    '#...#.###-',
    '###.#.#HHH',
    '#...#.#HHH',
    '#.#.#.####',
    '#.#.#....*',
    '#...#.##.#',
    '#.###.#...',
    '#.....#.#.',
    '#.#.###.#P',
    '#.#.....#.',
    '#.###.#.#.',
    '#o....#...',
    '#.#.#.#.#.',
    '#.#.#...#.',
    '#...t.#...',
    '####t#####',
  ],

  music: {
    bpm: 96, root: 50, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3],
    bass: [0, null, null, 7, null, null, 12, null, 0, null, null, 7, null, null, 5, null],
    bassWave: 'triangle', bassCut: 1200,
    arp: [0, 2, 1, 3, 2, 4, 3, 1, 0, 2, 1, 3, 2, 4, 5, 4], arpWave: 'sine', arpVol: 0.055,
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    hat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], hatVol: 0.012,
  },
  sfx: { dotWave: 'triangle', dot: [1046, 1318], power: 'sine' },

  drawBackground(ctx, w, h) {
    verticalGradient(ctx, w, h, this.colors.bgTop, this.colors.bgBottom);
    // Луна
    const mx = w * 0.82, my = h * 0.12, mr = Math.min(w, h) * 0.07;
    const halo = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5);
    halo.addColorStop(0, 'rgba(230,240,255,0.25)');
    halo.addColorStop(1, 'rgba(230,240,255,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f4f1ff';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(180,170,220,0.35)';
    ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, 0, TAU); ctx.arc(mx + mr * 0.35, my + mr * 0.3, mr * 0.15, 0, TAU); ctx.fill();
    // Силуэты елей
    const tree = (x, base, th, col) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x, base - th);
      for (let k = 1; k <= 4; k++) {
        const y = base - th + (th * k) / 4, ww = (th * 0.18 * k) / 1.6;
        ctx.lineTo(x + ww, y); ctx.lineTo(x + ww * 0.45, y);
      }
      for (let k = 4; k >= 1; k--) {
        const y = base - th + (th * k) / 4, ww = (th * 0.18 * k) / 1.6;
        ctx.lineTo(x - ww * 0.45, y); ctx.lineTo(x - ww, y);
      }
      ctx.closePath(); ctx.fill();
    };
    for (let i = 0; i < 16; i++) tree((i / 15) * w, h, h * (0.18 + ((i * 53) % 9) / 50), 'rgba(4,24,12,0.95)');
    for (let i = 0; i < 12; i++) tree(((i + 0.5) / 12) * w, h, h * (0.1 + ((i * 31) % 7) / 60), 'rgba(2,12,6,1)');
  },

  makeAmbient(w, h, s) {
    const flies = Array.from({ length: 26 }, () => ({
      x: Math.random() * w, y: Math.random() * h, ph: Math.random() * TAU,
      sp: 0.3 + Math.random() * 0.6, r: (0.05 + Math.random() * 0.06) * s, dir: Math.random() * TAU,
    }));
    const fog = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * w, y: h * (0.2 + i * 0.17), rx: w * (0.35 + Math.random() * 0.3), ry: h * 0.06,
      v: (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.3) * s,
    }));
    return { flies, fog, s };
  },

  drawAmbient(ctx, st, t, dt, w, h) {
    for (const f of st.fog) {
      f.x += f.v * dt;
      if (f.x - f.rx > w) f.x = -f.rx;
      if (f.x + f.rx < 0) f.x = w + f.rx;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.rx);
      g.addColorStop(0, 'rgba(200,255,220,0.05)');
      g.addColorStop(1, 'rgba(200,255,220,0)');
      ctx.fillStyle = g;
      ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, f.ry / f.rx); ctx.translate(-f.x, -f.y);
      ctx.beginPath(); ctx.arc(f.x, f.y, f.rx, 0, TAU); ctx.fill();
      ctx.restore();
    }
    for (const f of st.flies) {
      f.dir += (Math.random() - 0.5) * dt * 3;
      f.x = (f.x + Math.cos(f.dir) * f.sp * st.s * dt + w) % w;
      f.y = (f.y + Math.sin(f.dir) * f.sp * st.s * dt + h) % h;
      const a = Math.max(0, Math.sin(t * 2 + f.ph));
      if (a < 0.05) continue;
      ctx.fillStyle = `rgba(222,255,120,${0.12 * a})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 4, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(240,255,170,${0.8 * a})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
    }
  },

  // Светящиеся грибы и листья на стенах.
  decorate(ctx, maze, s, rand) {
    for (let y = 0; y < maze.h; y++) {
      for (let x = 0; x < maze.w; x++) {
        if (!maze.isWall(x, y)) continue;
        const n = [maze.isWall(x + 1, y), maze.isWall(x, y + 1), maze.isWall(x - 1, y), maze.isWall(x, y - 1)];
        if (n.filter(Boolean).length < 3 || rand() > 0.4) continue;
        const cx = (x + 0.5) * s + (rand() - 0.5) * s * 0.3, cy = (y + 0.6) * s;
        if (rand() < 0.55) {
          const col = rand() < 0.5 ? '#ff9ad5' : '#9cff6a';
          ctx.fillStyle = 'rgba(230,255,220,0.35)';
          ctx.fillRect(cx - s * 0.025, cy - s * 0.12, s * 0.05, s * 0.16);
          ctx.fillStyle = rgba(col, 0.75);
          ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.12, s * 0.12, s * 0.08, 0, Math.PI, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.beginPath(); ctx.arc(cx - s * 0.04, cy - s * 0.16, s * 0.018, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(92,242,143,0.3)';
          ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.1, s * 0.16, s * 0.06, rand() * Math.PI, 0, TAU); ctx.fill();
        }
      }
    }
  },

  drawDot(ctx, s) {
    ctx.fillStyle = this.colors.dot;
    star(ctx, 0, 0, 4, s * 0.12, s * 0.035);
    ctx.fill();
  },

  drawPower(ctx, s) {
    ctx.fillStyle = 'rgba(239,227,255,0.95)';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * TAU) / 6);
      ctx.beginPath(); ctx.ellipse(0, -0.14 * s, 0.07 * s, 0.13 * s, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, 0, 0.07 * s, 0, TAU); ctx.fill();
  },

  drawHero(ctx, s, h, t) {
    ctx.rotate(h.angle);
    const pulse = 0.75 + Math.sin(t * 6) * 0.25;
    // Крылья
    const flap = Math.abs(Math.sin(t * (h.moving ? 32 : 12)));
    ctx.fillStyle = 'rgba(220,240,255,0.55)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(0.02 * s, side * 0.2 * s, 0.22 * s, (0.06 + flap * 0.1) * s, side * 0.4, 0, TAU);
      ctx.fill();
    }
    // Светящееся брюшко
    const g = ctx.createRadialGradient(-0.12 * s, 0, 0, -0.12 * s, 0, 0.42 * s);
    g.addColorStop(0, `rgba(240,255,170,${0.9 * pulse})`);
    g.addColorStop(0.4, `rgba(212,255,79,${0.45 * pulse})`);
    g.addColorStop(1, 'rgba(212,255,79,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(-0.12 * s, 0, 0.42 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e9ff8a';
    ctx.beginPath(); ctx.ellipse(-0.12 * s, 0, 0.22 * s, 0.17 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(80,100,20,0.45)'; ctx.lineWidth = 0.025 * s;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc((-0.04 - i * 0.07) * s, 0, 0.17 * s, -1, 1); ctx.stroke();
    }
    // Голова и усики
    ctx.fillStyle = '#2b2440';
    ctx.beginPath(); ctx.arc(0.17 * s, 0, 0.13 * s, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2b2440'; ctx.lineWidth = 0.03 * s; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0.26 * s, -0.06 * s); ctx.quadraticCurveTo(0.38 * s, -0.12 * s, 0.42 * s, -0.22 * s);
    ctx.moveTo(0.26 * s, 0.06 * s); ctx.quadraticCurveTo(0.38 * s, 0.12 * s, 0.42 * s, 0.22 * s);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0.22 * s, -0.06 * s, 0.04 * s, 0, TAU); ctx.arc(0.22 * s, 0.06 * s, 0.04 * s, 0, TAU); ctx.fill();
  },

  drawEnemy(ctx, s, e, t, look) {
    const col = look.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (e.role) {
      case 'hunter': { // Летучая мышь
        const flap = Math.sin(t * 16);
        ctx.fillStyle = col;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 0.12 * s, -0.05 * s);
          ctx.lineTo(side * 0.5 * s, (-0.2 - flap * 0.15) * s);
          ctx.lineTo(side * 0.42 * s, (0.02 - flap * 0.05) * s);
          ctx.lineTo(side * 0.32 * s, (0.0 - flap * 0.05) * s);
          ctx.lineTo(side * 0.24 * s, 0.12 * s);
          ctx.closePath(); ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(-0.15 * s, -0.12 * s); ctx.lineTo(-0.17 * s, -0.36 * s); ctx.lineTo(-0.04 * s, -0.2 * s);
        ctx.lineTo(0.04 * s, -0.2 * s); ctx.lineTo(0.17 * s, -0.36 * s); ctx.lineTo(0.15 * s, -0.12 * s);
        ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 0.19 * s, 0.22 * s, 0, 0, TAU); ctx.fill();
        if (look.scared) { scaredFace(ctx, s * 0.75, '#fff'); break; }
        eyes(ctx, s, e.dir, { gap: 0.08, y: -0.05, r: 0.06, pupil: 0.03, white: '#fff6a0', pupilColor: '#3a0010' });
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(-0.06 * s, 0.07 * s); ctx.lineTo(-0.04 * s, 0.14 * s); ctx.lineTo(-0.02 * s, 0.07 * s); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0.02 * s, 0.07 * s); ctx.lineTo(0.04 * s, 0.14 * s); ctx.lineTo(0.06 * s, 0.07 * s); ctx.fill();
        break;
      }
      case 'interceptor': { // Сова
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(-0.3 * s, -0.18 * s); ctx.lineTo(-0.3 * s, -0.42 * s); ctx.lineTo(-0.12 * s, -0.28 * s);
        ctx.lineTo(0.12 * s, -0.28 * s); ctx.lineTo(0.3 * s, -0.42 * s); ctx.lineTo(0.3 * s, -0.18 * s);
        ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0.02 * s, 0.34 * s, 0.38 * s, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(80,30,0,0.4)'; ctx.lineWidth = 0.03 * s;
        for (let i = 0; i < 3; i++) {
          const y = (0.14 + i * 0.08) * s;
          ctx.beginPath(); ctx.moveTo(-0.1 * s, y); ctx.lineTo(0, y + 0.04 * s); ctx.lineTo(0.1 * s, y); ctx.stroke();
        }
        if (look.scared) { scaredFace(ctx, s * 0.85, '#fff'); break; }
        const blink = (t + e.index) % 3.2 < 0.12;
        ctx.fillStyle = '#ffe9c4';
        for (const sx of [-0.13, 0.13]) { ctx.beginPath(); ctx.arc(sx * s, -0.08 * s, 0.12 * s, 0, TAU); ctx.fill(); }
        if (blink) {
          ctx.strokeStyle = '#4a2200'; ctx.lineWidth = 0.035 * s;
          for (const sx of [-0.13, 0.13]) { ctx.beginPath(); ctx.moveTo((sx - 0.09) * s, -0.08 * s); ctx.lineTo((sx + 0.09) * s, -0.08 * s); ctx.stroke(); }
        } else {
          ctx.fillStyle = '#1a0a00';
          for (const sx of [-0.13, 0.13]) {
            ctx.beginPath(); ctx.arc((sx + e.dir.x * 0.04) * s, (-0.08 + e.dir.y * 0.04) * s, 0.065 * s, 0, TAU); ctx.fill();
          }
        }
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.moveTo(-0.05 * s, 0.02 * s); ctx.lineTo(0.05 * s, 0.02 * s); ctx.lineTo(0, 0.1 * s); ctx.fill();
        break;
      }
      case 'patrol': { // Лис-дух с огненным хвостом
        ctx.fillStyle = rgba(col, 0.5);
        for (let i = 0; i < 3; i++) {
          const a = Math.sin(t * 5 + i) * 0.15;
          ctx.beginPath();
          ctx.ellipse((0.22 + i * 0.04) * s, (0.22 - i * 0.05) * s, 0.09 * s, 0.24 * s, 0.9 + a + i * 0.15, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(-0.34 * s, -0.4 * s); ctx.lineTo(-0.12 * s, -0.22 * s); ctx.lineTo(0.12 * s, -0.22 * s);
        ctx.lineTo(0.34 * s, -0.4 * s); ctx.lineTo(0.32 * s, -0.06 * s); ctx.lineTo(0, 0.32 * s);
        ctx.lineTo(-0.32 * s, -0.06 * s);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath(); ctx.moveTo(-0.2 * s, 0.02 * s); ctx.lineTo(0, 0.3 * s); ctx.lineTo(0.2 * s, 0.02 * s); ctx.lineTo(0, 0.1 * s); ctx.fill();
        if (look.scared) { scaredFace(ctx, s * 0.75, '#0b2a33'); break; }
        ctx.fillStyle = '#04262e';
        const open = look.alert ? 0.06 : 0.025;
        for (const sx of [-0.14, 0.14]) {
          ctx.beginPath(); ctx.ellipse((sx + e.dir.x * 0.03) * s, (-0.1 + e.dir.y * 0.02) * s, 0.07 * s, open * s, sx * 1.5, 0, TAU); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(0, 0.25 * s, 0.035 * s, 0, TAU); ctx.fill();
        break;
      }
      default: { // Паук
        ctx.strokeStyle = col; ctx.lineWidth = 0.04 * s;
        for (const side of [-1, 1]) {
          for (let k = 0; k < 4; k++) {
            const a = (-0.6 + k * 0.4), wig = Math.sin(t * 14 + k * 1.7 + side) * 0.06;
            const kx = side * 0.32 * s, ky = (a * 0.4 - 0.12 + wig) * s;
            ctx.beginPath();
            ctx.moveTo(side * 0.12 * s, (a * 0.15) * s);
            ctx.lineTo(kx, ky);
            ctx.lineTo(side * 0.46 * s, (a * 0.55 + 0.08) * s);
            ctx.stroke();
          }
        }
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(0, 0.06 * s, 0.22 * s, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -0.18 * s, 0.13 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc(-0.07 * s, 0.0, 0.06 * s, 0, TAU); ctx.fill();
        if (look.scared) { ctx.translate(0, -0.1 * s); scaredFace(ctx, s * 0.6, '#fff'); break; }
        ctx.fillStyle = '#fff';
        for (const [ex, ey] of [[-0.06, -0.2], [0.06, -0.2], [-0.03, -0.12], [0.03, -0.12]]) {
          ctx.beginPath(); ctx.arc((ex + e.dir.x * 0.015) * s, (ey + e.dir.y * 0.015) * s, 0.028 * s, 0, TAU); ctx.fill();
        }
      }
    }
  },

  drawItem(ctx, s, t) { // Жёлудь
    ctx.rotate(Math.sin(t * 3) * 0.2);
    ctx.fillStyle = '#e3a76b';
    ctx.beginPath(); ctx.ellipse(0, 0.06 * s, 0.2 * s, 0.25 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-0.07 * s, 0.04 * s, 0.05 * s, 0.12 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.ellipse(0, -0.13 * s, 0.25 * s, 0.13 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5c3a18'; ctx.lineWidth = 0.05 * s;
    ctx.beginPath(); ctx.moveTo(0, -0.24 * s); ctx.lineTo(0.05 * s, -0.36 * s); ctx.stroke();
  },

  drawTrap(ctx, s) { // Паутина
    ctx.strokeStyle = 'rgba(235,235,255,0.7)';
    ctx.lineWidth = Math.max(1, 0.025 * s);
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 0.44 * s, Math.sin(a) * 0.44 * s); ctx.stroke();
    }
    for (const r of [0.14, 0.26, 0.38]) {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i * TAU) / 8;
        const x = Math.cos(a) * r * s, y = Math.sin(a) * r * s;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  },
};
