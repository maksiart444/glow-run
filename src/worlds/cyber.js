// Мир 1 — CYBER GLOW: ночной неоновый город. Герой — дрон-хакер, враги — антивирусы.

import { rgba, scaredFace, star, verticalGradient } from './common.js';

const TAU = Math.PI * 2;

export default {
  id: 'cyber',
  name: 'Cyber Glow',
  subtitle: 'Неоновый город. Взломай систему — собери все биты данных.',
  heroName: 'Дрон-хакер',
  dotName: 'биты данных',
  powerName: 'Оверклок',
  itemName: 'Чип',
  trapName: 'лужа помех',

  colors: {
    bgTop: '#0d0326', bgBottom: '#030108', mazeBg: '#07020f',
    wall: '#ff2bd6', wallFill: 'rgba(255,43,214,0.07)', door: '#00f0ff',
    accent: '#ff2bd6', accent2: '#00f0ff',
    hero: '#00f0ff', dot: '#7df9ff', power: '#fff36b',
    fright: '#3d5afe', frightFlash: '#e8ecff', text: '#f6eaff',
  },
  enemies: {
    hunter: { name: 'Сканер', color: '#ff3860' },
    interceptor: { name: 'Файрвол', color: '#ff9f1c' },
    patrol: { name: 'Сторож', color: '#39ff8f' },
    chaos: { name: 'Баг', color: '#e9ff3b' },
  },
  sweep: { type: 'down', speed: 0.22, size: 0.16, alpha: 0.9, color: '#9ffcff' },

  maze: [
    '##########',
    '#o........',
    '#.#.##.##.',
    '#.#.......',
    '#.#.##.###',
    '#...#.....',
    '#.#.#.#.##',
    't...#.#...',
    '##.##.#.##',
    '#...#....E',
    '#.#.#.###-',
    '#.#...#HHH',
    '#.#.#.#HHH',
    '#...#.####',
    '#.##.....*',
    '#.##.###.#',
    '#.........',
    't.##.#.#.#',
    '#.##.#...P',
    '#.##.#.###',
    '#.........',
    '#.#.###.#.',
    '#o#...#...',
    '#...#...##',
    '##########',
  ],

  music: {
    bpm: 112, root: 45, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4],
    bass: [0, null, 12, null, 0, null, 12, 0, 0, null, 12, null, 0, 12, null, 12],
    bassWave: 'sawtooth', bassCut: 900,
    arp: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 2, 3], arpWave: 'square', arpVol: 0.035,
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
  },
  sfx: { dotWave: 'square', dot: [740, 880], power: 'sawtooth' },

  drawBackground(ctx, w, h) {
    verticalGradient(ctx, w, h, this.colors.bgTop, this.colors.bgBottom);
    // Ретро-солнце и сетка-горизонт в стиле synthwave
    const hy = h * 0.66, cx = w / 2, r = Math.min(w, h) * 0.22;
    const sun = ctx.createLinearGradient(0, hy - r, 0, hy);
    sun.addColorStop(0, 'rgba(255,214,0,0.35)');
    sun.addColorStop(1, 'rgba(255,43,214,0.35)');
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, hy, r, Math.PI, TAU); ctx.closePath(); ctx.clip();
    ctx.fillStyle = sun; ctx.fillRect(cx - r, hy - r, r * 2, r);
    ctx.fillStyle = this.colors.bgBottom;
    for (let i = 0; i < 6; i++) {
      const y = hy - r * 0.08 - i * r * 0.14;
      ctx.fillRect(cx - r, y, r * 2, r * 0.025 * (6 - i) * 0.6);
    }
    ctx.restore();
    const glow = ctx.createLinearGradient(0, hy - h * 0.08, 0, hy + h * 0.02);
    glow.addColorStop(0, 'rgba(255,43,214,0)');
    glow.addColorStop(1, 'rgba(255,43,214,0.25)');
    ctx.fillStyle = glow; ctx.fillRect(0, hy - h * 0.08, w, h * 0.1);
    ctx.strokeStyle = 'rgba(255,43,214,0.22)';
    ctx.lineWidth = Math.max(1, w / 900);
    for (let i = -20; i <= 20; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * w * 0.012, hy); ctx.lineTo(cx + i * w * 0.12, h); ctx.stroke();
    }
    for (let i = 1; i < 14; i++) {
      const y = hy + (h - hy) * (i / 14) ** 2;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  },

  drawOverlay(ctx, w, h) {
    // Тонкие линии развёртки, как на старом мониторе
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    const step = Math.max(3, Math.round(h / 300));
    for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, 1);
  },

  makeAmbient(w, h, s) {
    return Array.from({ length: 34 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      v: (0.6 + Math.random() * 1.6) * s, size: (0.35 + Math.random() * 0.4) * s,
      ch: Math.random() < 0.5 ? '0' : '1', c: Math.random() < 0.6 ? '#00f0ff' : '#ff2bd6',
      a: 0.08 + Math.random() * 0.16,
    }));
  },

  drawAmbient(ctx, st, t, dt, w, h) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of st) {
      p.y += p.v * dt;
      if (p.y > h + p.size) { p.y = -p.size; p.x = Math.random() * w; }
      if (Math.random() < dt * 2) p.ch = p.ch === '0' ? '1' : '0';
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      ctx.font = `700 ${p.size | 0}px 'Courier New', monospace`;
      ctx.fillText(p.ch, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  },

  // Узор «микросхемы» внутри толстых стен.
  decorate(ctx, maze, s, rand) {
    ctx.strokeStyle = rgba(this.colors.wall, 0.35);
    ctx.fillStyle = rgba(this.colors.door, 0.45);
    ctx.lineWidth = Math.max(1, s * 0.05);
    for (let y = 0; y < maze.h; y++) {
      for (let x = 0; x < maze.w; x++) {
        if (!maze.isWall(x, y)) continue;
        const n = [maze.isWall(x + 1, y), maze.isWall(x, y + 1), maze.isWall(x - 1, y), maze.isWall(x, y - 1)];
        if (n.filter(Boolean).length < 3 || rand() > 0.5) continue;
        const cx = (x + 0.5) * s, cy = (y + 0.5) * s;
        if (n[0] && rand() < 0.6) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s, cy); ctx.stroke(); }
        if (n[1] && rand() < 0.4) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + s); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.08, 0, TAU); ctx.fill();
      }
    }
  },

  drawDot(ctx, s) {
    ctx.fillStyle = this.colors.dot;
    ctx.rotate(Math.PI / 4);
    const r = s * 0.075;
    ctx.fillRect(-r, -r, r * 2, r * 2);
  },

  drawPower(ctx, s) {
    const c = this.colors.power;
    ctx.strokeStyle = c;
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 - Math.PI / 2;
      const x = Math.cos(a) * s * 0.3, y = Math.sin(a) * s * 0.3;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0.04 * s, -0.2 * s); ctx.lineTo(-0.1 * s, 0.03 * s); ctx.lineTo(0.0, 0.03 * s);
    ctx.lineTo(-0.04 * s, 0.2 * s); ctx.lineTo(0.1 * s, -0.03 * s); ctx.lineTo(0.0, -0.03 * s);
    ctx.closePath(); ctx.fill();
  },

  drawHero(ctx, s, h, t) {
    const c = this.colors.hero;
    ctx.rotate(h.angle);
    ctx.translate(0, Math.sin(t * 7) * 0.025 * s);
    // Двигатели
    const flame = h.moving ? 0.2 + Math.sin(t * 50) * 0.05 : 0.07;
    for (const sy of [-0.17, 0.17]) {
      const g = ctx.createLinearGradient(-0.28 * s, 0, (-0.3 - flame) * s, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.4, rgba(c, 0.8));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-0.26 * s, (sy - 0.06) * s);
      ctx.lineTo((-0.3 - flame) * s, sy * s);
      ctx.lineTo(-0.26 * s, (sy + 0.06) * s);
      ctx.fill();
    }
    // Корпус-ромб
    ctx.beginPath();
    ctx.moveTo(0.44 * s, 0); ctx.lineTo(0.02 * s, -0.37 * s);
    ctx.lineTo(-0.32 * s, 0); ctx.lineTo(0.02 * s, 0.37 * s);
    ctx.closePath();
    ctx.fillStyle = '#0b1838'; ctx.fill();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = c; ctx.lineWidth = 0.08 * s; ctx.stroke();
    ctx.strokeStyle = rgba(c, 0.45); ctx.lineWidth = 0.03 * s;
    ctx.beginPath();
    ctx.moveTo(0.02 * s, -0.37 * s); ctx.lineTo(-0.06 * s, 0); ctx.lineTo(0.02 * s, 0.37 * s);
    ctx.stroke();
    // Визор со сканирующей точкой
    ctx.fillStyle = '#e9feff';
    ctx.beginPath(); ctx.roundRect(0.06 * s, -0.07 * s, 0.26 * s, 0.14 * s, 0.07 * s); ctx.fill();
    ctx.fillStyle = '#ff2bd6';
    const sx = 0.1 + (Math.sin(t * 5) * 0.5 + 0.5) * 0.18;
    ctx.beginPath(); ctx.arc(sx * s, 0, 0.045 * s, 0, TAU); ctx.fill();
  },

  drawEnemy(ctx, s, e, t, look) {
    const col = look.color, dark = '#12041a';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    switch (e.role) {
      case 'hunter': { // Сканер — глаз с вращающимся кольцом
        ctx.save();
        ctx.rotate(t * 2.4);
        ctx.strokeStyle = col; ctx.lineWidth = 0.06 * s;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(0, 0, 0.41 * s, i * 2.094, i * 2.094 + 1.3); ctx.stroke();
        }
        ctx.restore();
        ctx.beginPath(); ctx.arc(0, 0, 0.3 * s, 0, TAU);
        ctx.fillStyle = dark; ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 0.06 * s; ctx.stroke();
        if (look.scared) { scaredFace(ctx, s * 0.9, col); break; }
        const ex = e.dir.x * 0.08 * s, ey = e.dir.y * 0.08 * s;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(ex, ey, 0.15 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex + e.dir.x * 0.04 * s, ey + e.dir.y * 0.04 * s, 0.055 * s, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 0.025 * s;
        const sl = Math.sin(t * 6) * 0.22 * s;
        ctx.beginPath(); ctx.moveTo(-0.24 * s, sl); ctx.lineTo(0.24 * s, sl); ctx.stroke();
        break;
      }
      case 'interceptor': { // Файрвол — щит-шестиугольник с пламенем
        if (!look.scared) {
          ctx.fillStyle = rgba(col, 0.85);
          for (let i = -1; i <= 1; i++) {
            const fh = (0.16 + Math.sin(t * 14 + i * 2) * 0.06) * s;
            ctx.beginPath();
            ctx.moveTo((i * 0.14 - 0.07) * s, -0.3 * s);
            ctx.lineTo(i * 0.14 * s, -0.3 * s - fh);
            ctx.lineTo((i * 0.14 + 0.07) * s, -0.3 * s);
            ctx.fill();
          }
        }
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6;
          const x = Math.cos(a) * 0.4 * s, y = Math.sin(a) * 0.38 * s;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = dark; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 0.035 * s;
        for (let i = -1; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(-0.5 * s, i * 0.17 * s); ctx.lineTo(0.5 * s, i * 0.17 * s); ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = col; ctx.lineWidth = 0.07 * s; ctx.stroke();
        if (look.scared) { scaredFace(ctx, s * 0.9, col); break; }
        ctx.fillStyle = col;
        const ox = e.dir.x * 0.05 * s, oy = e.dir.y * 0.04 * s;
        ctx.fillRect(-0.2 * s + ox, -0.09 * s + oy, 0.13 * s, 0.07 * s);
        ctx.fillRect(0.07 * s + ox, -0.09 * s + oy, 0.13 * s, 0.07 * s);
        break;
      }
      case 'patrol': { // Сторож — треугольник с антенной и визором
        ctx.strokeStyle = col; ctx.lineWidth = 0.05 * s;
        ctx.beginPath(); ctx.moveTo(0, -0.34 * s); ctx.lineTo(0, -0.5 * s); ctx.stroke();
        ctx.fillStyle = (Math.floor(t * 4) % 2) ? col : '#fff';
        ctx.beginPath(); ctx.arc(0, -0.5 * s, 0.05 * s, 0, TAU); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -0.38 * s); ctx.lineTo(0.42 * s, 0.34 * s); ctx.lineTo(-0.42 * s, 0.34 * s);
        ctx.closePath();
        ctx.fillStyle = dark; ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 0.07 * s; ctx.stroke();
        if (look.scared) { ctx.translate(0, 0.08 * s); scaredFace(ctx, s * 0.75, col); break; }
        ctx.fillStyle = rgba(col, 0.3);
        ctx.beginPath(); ctx.roundRect(-0.2 * s, 0.04 * s, 0.4 * s, 0.12 * s, 0.06 * s); ctx.fill();
        const px = (look.alert ? e.dir.x * 0.12 : Math.sin(t * 3) * 0.13) * s;
        ctx.fillStyle = look.alert ? '#fff' : col;
        ctx.beginPath(); ctx.arc(px, 0.1 * s, 0.055 * s, 0, TAU); ctx.fill();
        break;
      }
      default: { // Баг — жук с цифровыми помехами
        ctx.rotate(e.angle);
        const glitch = Math.sin(t * 13) * Math.sin(t * 7.3) > 0.55;
        const body = (dx, dy, stroke) => {
          ctx.beginPath(); ctx.ellipse(dx, dy, 0.3 * s, 0.24 * s, 0, 0, TAU);
          ctx.strokeStyle = stroke; ctx.stroke();
        };
        ctx.lineWidth = 0.05 * s;
        if (glitch && !look.scared) {
          body(-0.06 * s, 0.03 * s, 'rgba(255,43,214,0.7)');
          body(0.06 * s, -0.03 * s, 'rgba(0,240,255,0.7)');
        }
        ctx.strokeStyle = col; ctx.lineWidth = 0.045 * s;
        for (const side of [-1, 1]) {
          for (let k = 0; k < 3; k++) {
            const lx = (-0.14 + k * 0.14) * s, wig = Math.sin(t * 22 + k * 2 + side) * 0.06 * s;
            ctx.beginPath();
            ctx.moveTo(lx, side * 0.18 * s);
            ctx.lineTo(lx + wig, side * 0.4 * s);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.moveTo(0.26 * s, -0.08 * s); ctx.lineTo(0.46 * s, -0.2 * s);
        ctx.moveTo(0.26 * s, 0.08 * s); ctx.lineTo(0.46 * s, 0.2 * s);
        ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, 0.3 * s, 0.24 * s, 0, 0, TAU);
        ctx.fillStyle = dark; ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 0.065 * s; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-0.28 * s, 0); ctx.lineTo(0.1 * s, 0);
        ctx.lineWidth = 0.03 * s; ctx.stroke();
        if (look.scared) { ctx.rotate(-e.angle); scaredFace(ctx, s * 0.8, col); break; }
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(0.17 * s, -0.09 * s, 0.06 * s, 0, TAU); ctx.arc(0.17 * s, 0.09 * s, 0.06 * s, 0, TAU); ctx.fill();
      }
    }
  },

  drawItem(ctx, s, t) { // Чип
    const c = '#ffd400';
    ctx.rotate(Math.sin(t * 2) * 0.15);
    ctx.strokeStyle = c; ctx.lineWidth = 0.05 * s;
    for (let i = -1; i <= 1; i++) {
      const p = i * 0.12 * s;
      ctx.beginPath();
      ctx.moveTo(p, -0.24 * s); ctx.lineTo(p, -0.36 * s);
      ctx.moveTo(p, 0.24 * s); ctx.lineTo(p, 0.36 * s);
      ctx.moveTo(-0.24 * s, p); ctx.lineTo(-0.36 * s, p);
      ctx.moveTo(0.24 * s, p); ctx.lineTo(0.36 * s, p);
      ctx.stroke();
    }
    ctx.fillStyle = '#1b1400';
    ctx.beginPath(); ctx.roundRect(-0.25 * s, -0.25 * s, 0.5 * s, 0.5 * s, 0.06 * s); ctx.fill();
    ctx.lineWidth = 0.06 * s; ctx.stroke();
    ctx.fillStyle = c;
    star(ctx, 0, 0, 4, 0.13 * s, 0.05 * s, t * 2);
    ctx.fill();
  },

  drawTrap(ctx, s, t) { // Лужа помех
    const f = Math.floor(t * 14);
    for (let i = 0; i < 7; i++) {
      const r = Math.sin(f * 12.9898 + i * 78.233) * 43758.5453;
      const v = r - Math.floor(r);
      ctx.fillStyle = i % 2 ? 'rgba(255,43,214,0.75)' : 'rgba(0,240,255,0.75)';
      ctx.fillRect((v - 0.5) * 0.7 * s, (i / 7 - 0.5) * 0.6 * s, (0.1 + v * 0.25) * s, 0.06 * s);
    }
    ctx.strokeStyle = 'rgba(255,43,214,0.5)';
    ctx.lineWidth = 0.04 * s;
    ctx.beginPath(); ctx.ellipse(0, 0, 0.4 * s, 0.3 * s, 0, 0, TAU); ctx.stroke();
  },
};
