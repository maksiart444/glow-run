// Мир 2 — DEEP GLOW: глубина океана. Герой — рыбка-удильщик с фонариком.

import { rgba, eyes, scaredFace, star, faceAngle, verticalGradient } from './common.js';

const TAU = Math.PI * 2;

// Испуганный глаз для рыб, нарисованных сбоку.
function sideScared(ctx, s, x, y, col) {
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x * s, y * s, 0.07 * s, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1030';
  ctx.beginPath(); ctx.arc(x * s, y * s, 0.025 * s, 0, TAU); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 0.035 * s;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) {
    const px = (x - 0.08 + i * 0.05) * s, py = (y + 0.16 + (i % 2 ? -0.03 : 0.02)) * s;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
}

export default {
  id: 'deep',
  name: 'Deep Glow',
  subtitle: 'Тёмная глубина. Собери светящийся планктон и не попадись хищникам.',
  heroName: 'Рыбка-удильщик',
  dotName: 'планктон',
  powerName: 'Жемчужина',
  itemName: 'Морская звезда',
  trapName: 'облако чернил',

  colors: {
    bgTop: '#04294a', bgBottom: '#000510', mazeBg: '#010f20',
    wall: '#19e3d0', wallFill: 'rgba(25,227,208,0.07)', door: '#ff7ad9',
    accent: '#19e3d0', accent2: '#ff7ad9',
    hero: '#ffb347', dot: '#8dffe8', power: '#fff0f8',
    fright: '#4d7cff', frightFlash: '#eaf2ff', text: '#e8fffb',
  },
  enemies: {
    hunter: { name: 'Акула', color: '#ff4d6d' },
    interceptor: { name: 'Мурена', color: '#b6ff3b' },
    patrol: { name: 'Медуза', color: '#ff8de1' },
    chaos: { name: 'Осьминог', color: '#b388ff' },
  },
  sweep: { type: 'up', speed: 0.12, size: 0.3, alpha: 0.55, color: '#c8fff8' },

  maze: [
    '##########',
    '#o.......#',
    '#.##.###.#',
    '#.#......E',
    '#.#.#.###-',
    '#...#.#HHH',
    '##.##.#HHH',
    '#..#..####',
    '#.##.#....',
    '#....#.##.',
    '####.#.#.*',
    'ttt..#.#.#',
    '####...#..',
    '#....#.##.',
    '#.##.#....',
    '#.#..###.#',
    '#.#.#.....',
    '#...#.###.',
    '#.###.#...',
    '#.....#.#P',
    '#.#.#.#.#.',
    '#o#.#.....',
    '#.#...#.#.',
    '#...#.....',
    '##########',
  ],

  music: {
    bpm: 84, root: 43, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 5, 3, 4],
    bass: [0, null, null, null, null, null, 7, null, 0, null, null, null, 12, null, null, null],
    bassWave: 'sine', bassCut: 600,
    arp: [0, null, 2, null, 4, null, 2, null, 1, null, 3, null, 5, null, 3, null], arpWave: 'triangle', arpVol: 0.05,
    kick: null, hat: null, bubbles: true,
  },
  sfx: { dotWave: 'sine', dot: [620, 830], power: 'triangle' },

  drawBackground(ctx, w, h) {
    verticalGradient(ctx, w, h, this.colors.bgTop, this.colors.bgBottom);
    // Лучи света сверху
    for (let i = 0; i < 6; i++) {
      const x = w * (0.1 + i * 0.17), spread = w * (0.05 + (i % 3) * 0.03);
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.8);
      g.addColorStop(0, 'rgba(160,255,240,0.10)');
      g.addColorStop(1, 'rgba(160,255,240,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - spread * 0.3, 0); ctx.lineTo(x + spread * 0.3, 0);
      ctx.lineTo(x + spread * 2 + w * 0.08, h * 0.8); ctx.lineTo(x - spread * 2 + w * 0.08, h * 0.8);
      ctx.fill();
    }
    // Песок и водоросли внизу
    const sand = ctx.createLinearGradient(0, h * 0.9, 0, h);
    sand.addColorStop(0, 'rgba(25,227,208,0)');
    sand.addColorStop(1, 'rgba(25,227,208,0.12)');
    ctx.fillStyle = sand; ctx.fillRect(0, h * 0.9, w, h * 0.1);
    ctx.strokeStyle = 'rgba(25,227,208,0.18)';
    ctx.lineWidth = Math.max(2, w / 300);
    for (let i = 0; i < 18; i++) {
      const x = (i / 18) * w + (i % 3) * 7, hh = h * (0.05 + ((i * 37) % 10) / 80);
      ctx.beginPath(); ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x + hh * 0.3, h - hh * 0.5, x - hh * 0.1, h - hh);
      ctx.stroke();
    }
  },

  makeAmbient(w, h, s) {
    const bubbles = Array.from({ length: 22 }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: (0.06 + Math.random() * 0.16) * s,
      v: (0.5 + Math.random() * 1.2) * s, ph: Math.random() * TAU,
    }));
    const motes = Array.from({ length: 30 }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: (0.03 + Math.random() * 0.05) * s,
      vx: (Math.random() - 0.5) * 0.3 * s, vy: (Math.random() - 0.5) * 0.3 * s, ph: Math.random() * TAU,
    }));
    return { bubbles, motes };
  },

  drawAmbient(ctx, st, t, dt, w, h) {
    ctx.lineWidth = 1.5;
    for (const b of st.bubbles) {
      b.y -= b.v * dt;
      if (b.y < -b.r * 2) { b.y = h + b.r * 2; b.x = Math.random() * w; }
      const x = b.x + Math.sin(t * 1.5 + b.ph) * b.r * 2;
      ctx.strokeStyle = 'rgba(200,255,250,0.28)';
      ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, TAU); ctx.fill();
    }
    for (const m of st.motes) {
      m.x = (m.x + m.vx * dt + w) % w;
      m.y = (m.y + m.vy * dt + h) % h;
      ctx.fillStyle = `rgba(141,255,232,${0.15 + 0.15 * Math.sin(t * 2 + m.ph)})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
    }
  },

  // Маленькие кораллы и полипы на стенах.
  decorate(ctx, maze, s, rand) {
    ctx.lineCap = 'round';
    for (let y = 0; y < maze.h; y++) {
      for (let x = 0; x < maze.w; x++) {
        if (!maze.isWall(x, y)) continue;
        const n = [maze.isWall(x + 1, y), maze.isWall(x, y + 1), maze.isWall(x - 1, y), maze.isWall(x, y - 1)];
        if (n.filter(Boolean).length < 3 || rand() > 0.45) continue;
        const cx = (x + 0.5) * s, cy = (y + 0.5) * s;
        const col = rand() < 0.5 ? 'rgba(255,122,217,0.45)' : 'rgba(25,227,208,0.45)';
        ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.lineWidth = Math.max(1, s * 0.05);
        const base = cy + s * 0.25;
        for (let k = -1; k <= 1; k++) {
          const tipX = cx + k * s * 0.18, tipY = base - s * (0.3 + rand() * 0.2);
          ctx.beginPath(); ctx.moveTo(cx, base); ctx.quadraticCurveTo(cx + k * s * 0.05, base - s * 0.15, tipX, tipY); ctx.stroke();
          ctx.beginPath(); ctx.arc(tipX, tipY, s * 0.05, 0, TAU); ctx.fill();
        }
      }
    }
  },

  drawDot(ctx, s) {
    ctx.fillStyle = this.colors.dot;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.075, 0, TAU); ctx.fill();
  },

  drawPower(ctx, s) {
    const g = ctx.createRadialGradient(-0.07 * s, -0.07 * s, 0.02 * s, 0, 0, 0.22 * s);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#ffd6ef');
    g.addColorStop(1, '#ff8de1');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 0.21 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(-0.07 * s, -0.08 * s, 0.05 * s, 0, TAU); ctx.fill();
  },

  drawHero(ctx, s, h, t) {
    faceAngle(ctx, h.angle);
    const wag = Math.sin(t * (h.moving ? 14 : 5)) * 0.09;
    // Хвост
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath();
    ctx.moveTo(-0.25 * s, 0);
    ctx.lineTo(-0.5 * s, (-0.22 + wag) * s);
    ctx.lineTo(-0.44 * s, wag * s);
    ctx.lineTo(-0.5 * s, (0.22 + wag) * s);
    ctx.closePath(); ctx.fill();
    // Тело
    const g = ctx.createRadialGradient(0.05 * s, -0.12 * s, 0.04 * s, 0, 0, 0.4 * s);
    g.addColorStop(0, '#ffe2a1');
    g.addColorStop(1, '#ff8c42');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 0.36 * s, 0.3 * s, 0, 0, TAU); ctx.fill();
    // Плавник
    ctx.fillStyle = 'rgba(255,140,66,0.9)';
    ctx.beginPath();
    ctx.moveTo(-0.04 * s, 0.08 * s);
    ctx.lineTo(-0.2 * s, (0.24 + wag * 0.6) * s);
    ctx.lineTo(0.04 * s, 0.18 * s);
    ctx.fill();
    // Рот с зубками
    const open = h.moving ? Math.abs(Math.sin(t * 12)) * 0.5 : 0.12;
    ctx.fillStyle = '#2a0a12';
    ctx.beginPath();
    ctx.moveTo(0.08 * s, 0.07 * s);
    ctx.lineTo(0.4 * s, (0.04 - open * 0.22) * s);
    ctx.lineTo(0.4 * s, (0.1 + open * 0.22) * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      const tx = (0.2 + i * 0.065) * s, ty = (0.06 - open * 0.11 * (i + 1) / 3) * s;
      ctx.beginPath(); ctx.moveTo(tx, ty - 0.01 * s); ctx.lineTo(tx + 0.025 * s, ty + 0.05 * s); ctx.lineTo(tx + 0.05 * s, ty - 0.01 * s); ctx.fill();
    }
    // Глаз
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0.13 * s, -0.1 * s, 0.085 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a0a20';
    ctx.beginPath(); ctx.arc(0.16 * s, -0.1 * s, 0.045 * s, 0, TAU); ctx.fill();
    // Фонарик-приманка
    const bob = Math.sin(t * 3) * 0.03;
    const lx = 0.44 * s, ly = (-0.42 + bob) * s;
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 0.035 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0.02 * s, -0.27 * s); ctx.quadraticCurveTo(0.2 * s, -0.62 * s, lx, ly); ctx.stroke();
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 0.24 * s);
    lg.addColorStop(0, 'rgba(255,247,168,0.8)');
    lg.addColorStop(1, 'rgba(255,247,168,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, ly, 0.24 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fffbe0';
    ctx.beginPath(); ctx.arc(lx, ly, 0.07 * s, 0, TAU); ctx.fill();
  },

  drawEnemy(ctx, s, e, t, look) {
    const col = look.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (e.role) {
      case 'hunter': { // Акула
        faceAngle(ctx, e.angle);
        const wag = Math.sin(t * 10) * 0.07;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(-0.28 * s, 0);
        ctx.lineTo(-0.52 * s, (-0.24 + wag) * s);
        ctx.lineTo(-0.42 * s, wag * s);
        ctx.lineTo(-0.52 * s, (0.2 + wag) * s);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-0.06 * s, -0.17 * s); ctx.lineTo(0.04 * s, -0.44 * s); ctx.lineTo(0.17 * s, -0.16 * s);
        ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 0.44 * s, 0.21 * s, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.ellipse(0.04 * s, 0.08 * s, 0.32 * s, 0.09 * s, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.025 * s;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo((0.08 + i * 0.05) * s, -0.08 * s); ctx.lineTo((0.06 + i * 0.05) * s, 0.06 * s); ctx.stroke();
        }
        if (look.scared) { sideScared(ctx, s, 0.3, -0.06, '#fff'); break; }
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0.3 * s, -0.06 * s, 0.055 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(0.32 * s, -0.06 * s, 0.03 * s, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.025 * s;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) ctx.lineTo((0.2 + i * 0.045) * s, (0.08 + (i % 2) * 0.035) * s);
        ctx.stroke();
        break;
      }
      case 'interceptor': { // Мурена — извивающееся тело
        faceAngle(ctx, e.angle);
        for (let i = 6; i >= 0; i--) {
          const x = (0.24 - i * 0.11) * s;
          const y = Math.sin(t * 9 - i * 0.9) * 0.08 * s * (i / 6 + 0.15);
          const r = (0.16 - i * 0.015) * s;
          ctx.fillStyle = i % 2 ? col : rgba(col, 0.82);
          ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.3, r * 0.22, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(0.28 * s, 0, 0.19 * s, 0.15 * s, 0, 0, TAU); ctx.fill();
        if (look.scared) { sideScared(ctx, s, 0.32, -0.05, '#fff'); break; }
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0.33 * s, -0.05 * s, 0.05 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(0.35 * s, -0.05 * s, 0.025 * s, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#1c2a00'; ctx.lineWidth = 0.03 * s;
        ctx.beginPath(); ctx.moveTo(0.22 * s, 0.05 * s); ctx.lineTo(0.46 * s, 0.03 * s); ctx.stroke();
        break;
      }
      case 'patrol': { // Медуза
        const pulse = 1 + Math.sin(t * 4) * 0.08;
        ctx.strokeStyle = rgba(col, 0.85); ctx.lineWidth = 0.045 * s;
        for (let i = 0; i < 5; i++) {
          const x = (-0.22 + i * 0.11) * s;
          ctx.beginPath(); ctx.moveTo(x, 0.04 * s);
          ctx.quadraticCurveTo(x + Math.sin(t * 5 + i) * 0.1 * s, 0.25 * s, x + Math.sin(t * 5 + i + 1) * 0.06 * s, 0.46 * s);
          ctx.stroke();
        }
        ctx.save();
        ctx.scale(pulse, 1 / pulse);
        const g = ctx.createLinearGradient(0, -0.34 * s, 0, 0.06 * s);
        g.addColorStop(0, col);
        g.addColorStop(1, rgba(col, 0.45));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0.06 * s, 0.38 * s, 0.4 * s, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.ellipse(-0.12 * s, -0.2 * s, 0.08 * s, 0.05 * s, -0.5, 0, TAU); ctx.fill();
        ctx.restore();
        if (look.scared) { scaredFace(ctx, s * 0.8, '#fff'); break; }
        eyes(ctx, s, e.dir, { gap: 0.12, y: -0.1, r: look.alert ? 0.1 : 0.075, pupil: 0.045 });
        break;
      }
      default: { // Осьминог
        ctx.strokeStyle = col; ctx.lineWidth = 0.09 * s;
        for (let i = 0; i < 4; i++) {
          const bx = (-0.21 + i * 0.14) * s, side = bx < 0 ? -1 : 1;
          const tipX = bx * 1.5 + Math.sin(t * 6 + i) * 0.08 * s, tipY = 0.44 * s;
          ctx.beginPath(); ctx.moveTo(bx, 0.1 * s);
          ctx.bezierCurveTo(bx, 0.3 * s, tipX + side * 0.12 * s, 0.3 * s, tipX, tipY);
          ctx.stroke();
        }
        const g = ctx.createRadialGradient(-0.08 * s, -0.16 * s, 0.03 * s, 0, -0.05 * s, 0.36 * s);
        g.addColorStop(0, '#e6d6ff');
        g.addColorStop(1, col);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, -0.06 * s, 0.33 * s, 0.31 * s, 0, 0, TAU); ctx.fill();
        if (look.scared) { scaredFace(ctx, s * 0.85, '#fff'); break; }
        eyes(ctx, s, e.dir, { gap: 0.13, y: -0.07, r: 0.1, pupil: 0.055 });
      }
    }
  },

  drawItem(ctx, s, t) { // Морская звезда
    ctx.rotate(t * 0.8);
    ctx.fillStyle = '#ffa94d';
    star(ctx, 0, 0, 5, 0.36 * s, 0.15 * s);
    ctx.fill();
    ctx.strokeStyle = '#ffe0b3'; ctx.lineWidth = 0.04 * s; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 5; i++) {
      const a = (i * TAU) / 5 - Math.PI / 2;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 0.17 * s, Math.sin(a) * 0.17 * s, 0.03 * s, 0, TAU); ctx.fill();
    }
  },

  drawTrap(ctx, s, t) { // Облако чернил
    ctx.fillStyle = 'rgba(30,8,50,0.88)';
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 + t * 0.5;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 0.17 * s, Math.sin(a) * 0.13 * s, (0.17 + Math.sin(t * 3 + i) * 0.03) * s, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(179,136,255,0.6)'; ctx.lineWidth = 0.035 * s;
    ctx.beginPath(); ctx.arc(0, 0, 0.36 * s, 0, TAU); ctx.stroke();
  },
};
