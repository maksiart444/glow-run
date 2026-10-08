// Рисование: фон, неоновый лабиринт, точки, герой, враги, эффекты.
// Всё «тяжёлое» (свечение стен, фон, спрайты точек) рисуется один раз
// в отдельные холсты и потом просто копируется — так игра не тормозит на телефонах.

import { COLS, ROWS, TIMING } from './config.js';
import { UP, DOWN } from './maze.js';
import { makeCanvas, rgba, seeded, eyesOnly } from './worlds/common.js';

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
}

const TAU = Math.PI * 2;

// Контур стен, «утопленный» внутрь клеток на inset пикселей.
// Каждая клетка стены — прямоугольник: к соседним стенам он доходит вплотную,
// внешние углы скруглены, а во внутренних углах вырезан квадратик (иначе торчит зубец).
function wallPath(ctx, maze, s, inset, radius) {
  ctx.beginPath();
  const n = inset;
  for (let y = 0; y < maze.h; y++) {
    for (let x = 0; x < maze.w; x++) {
      if (!maze.isWall(x, y)) continue;
      const W = (dx, dy) => maze.isWall(x + dx, y + dy);
      const L = W(-1, 0), R = W(1, 0), U = W(0, -1), D = W(0, 1);
      const x0 = x * s + (L ? 0 : inset), x1 = (x + 1) * s - (R ? 0 : inset);
      const y0 = y * s + (U ? 0 : inset), y1 = (y + 1) * s - (D ? 0 : inset);
      const r = Math.max(0, Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2));
      const corner = (a, b, diag) => (!a && !b ? 'r' : a && b && !diag ? 'n' : '');
      const tl = corner(L, U, W(-1, -1)), tr = corner(R, U, W(1, -1));
      const br = corner(R, D, W(1, 1)), bl = corner(L, D, W(-1, 1));

      if (tl === 'n') { ctx.moveTo(x0, y0 + n); ctx.lineTo(x0 + n, y0 + n); ctx.lineTo(x0 + n, y0); }
      else if (tl === 'r') { ctx.moveTo(x0, y0 + r); ctx.arcTo(x0, y0, x0 + r, y0, r); }
      else ctx.moveTo(x0, y0);

      if (tr === 'n') { ctx.lineTo(x1 - n, y0); ctx.lineTo(x1 - n, y0 + n); ctx.lineTo(x1, y0 + n); }
      else if (tr === 'r') { ctx.lineTo(x1 - r, y0); ctx.arcTo(x1, y0, x1, y0 + r, r); }
      else ctx.lineTo(x1, y0);

      if (br === 'n') { ctx.lineTo(x1, y1 - n); ctx.lineTo(x1 - n, y1 - n); ctx.lineTo(x1 - n, y1); }
      else if (br === 'r') { ctx.lineTo(x1, y1 - r); ctx.arcTo(x1, y1, x1 - r, y1, r); }
      else ctx.lineTo(x1, y1);

      if (bl === 'n') { ctx.lineTo(x0 + n, y1); ctx.lineTo(x0 + n, y1 - n); ctx.lineTo(x0, y1 - n); }
      else if (bl === 'r') { ctx.lineTo(x0 + r, y1); ctx.arcTo(x0, y1, x0, y1 - r, r); }
      else ctx.lineTo(x0, y1);

      ctx.closePath();
    }
  }
}

function ringCanvas(maze, s, pad, color, inset, lw, radius) {
  const cv = makeCanvas(maze.w * s + pad * 2, maze.h * s + pad * 2);
  const c = cv.getContext('2d');
  c.translate(pad, pad);
  wallPath(c, maze, s, inset, radius);
  c.fillStyle = color;
  c.fill();
  c.globalCompositeOperation = 'destination-out';
  wallPath(c, maze, s, inset + lw, Math.max(0, radius - lw));
  c.fill();
  return cv;
}

// Готовая картинка лабиринта со свечением. Используется и в игре, и в превью миров.
export function buildMaze(world, maze, s, { glow = true, wallColor, backing = true } = {}) {
  const pad = Math.ceil(s);
  const inset = s * 0.16, lw = Math.max(1.5, s * 0.075), radius = s * 0.32;
  const color = wallColor || world.colors.wall;
  const cv = makeCanvas(maze.w * s + pad * 2, maze.h * s + pad * 2);
  const c = cv.getContext('2d');
  c.translate(pad, pad);

  if (backing) {
    c.fillStyle = rgba(world.colors.mazeBg, 0.82);
    c.beginPath(); c.roundRect(-s * 0.1, -s * 0.1, maze.w * s + s * 0.2, maze.h * s + s * 0.2, s * 0.5); c.fill();
  }

  // Заливка стен и узоры внутри них
  wallPath(c, maze, s, inset + lw * 0.5, radius);
  c.fillStyle = wallColor ? rgba(wallColor, 0.12) : world.colors.wallFill;
  c.fill();
  if (!wallColor) {
    c.save();
    wallPath(c, maze, s, inset + lw, radius);
    c.clip();
    world.decorate(c, maze, s, seeded(42));
    c.restore();
  }

  // Неоновый контур: размытое свечение + яркая линия + белая сердцевина
  const ring = ringCanvas(maze, s, pad, color, inset, lw, radius);
  const core = ringCanvas(maze, s, pad, 'rgba(255,255,255,0.6)', inset + lw * 0.3, lw * 0.4, radius);
  if (glow) {
    c.save();
    c.shadowColor = color;
    c.shadowBlur = s * 0.5;
    c.drawImage(ring, -pad, -pad);
    c.shadowBlur = s * 0.2;
    c.drawImage(ring, -pad, -pad);
    c.restore();
  }
  c.drawImage(ring, -pad, -pad);
  c.drawImage(core, -pad, -pad);

  // Дверь дома врагов
  if (maze.door) {
    const d = maze.door;
    c.save();
    c.shadowColor = world.colors.door;
    c.shadowBlur = glow ? s * 0.4 : 0;
    c.fillStyle = world.colors.door;
    c.beginPath(); c.roundRect(d.x * s - s * 0.1, d.y * s + s * 0.42, s * 1.2, s * 0.16, s * 0.08); c.fill();
    c.restore();
  }
  return { canvas: cv, pad };
}

function spriteCanvas(size, draw) {
  const cv = makeCanvas(size, size);
  const c = cv.getContext('2d');
  c.translate(size / 2, size / 2);
  draw(c);
  return cv;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.quality = 'high';
    this.glowCache = new Map();
    this.key = '';
  }

  setQuality(q) { this.quality = q; this.key = ''; }

  // top/bottom — сколько места (в CSS-пикселях) занимают панели сверху и снизу.
  resize(top, bottom) {
    const dpr = this.quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.dpr = dpr;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    const availW = w - 12, availH = h - top - bottom - 8;
    const tile = Math.max(8, Math.min(availW / COLS, availH / ROWS, 40));
    this.s = Math.floor(tile * dpr);
    this.mw = this.s * COLS;
    this.mh = this.s * ROWS;
    this.ox = Math.round((this.W - this.mw) / 2);
    this.oy = Math.round((top + 4) * dpr + (availH * dpr - this.mh) / 2);
    this.key = '';
    return { left: this.ox / dpr, top: this.oy / dpr, width: this.mw / dpr, height: this.mh / dpr, tile: this.s / dpr };
  }

  prepare(world, maze) {
    const key = `${world.id}|${this.s}|${this.W}x${this.H}|${this.quality}`;
    if (key === this.key) return;
    this.key = key;
    const s = this.s, high = this.quality === 'high';

    this.bg = makeCanvas(this.W, this.H);
    world.drawBackground(this.bg.getContext('2d'), this.W, this.H, s);

    this.vignette = makeCanvas(this.W, this.H);
    const vc = this.vignette.getContext('2d');
    const g = vc.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.35, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.6)');
    vc.fillStyle = g;
    vc.fillRect(0, 0, this.W, this.H);
    if (world.drawOverlay && high) world.drawOverlay(vc, this.W, this.H);

    const built = buildMaze(world, maze, s, { glow: high });
    this.mazeCv = built.canvas;
    this.pad = built.pad;
    this.flashCv = buildMaze(world, maze, s, { glow: high, wallColor: '#ffffff' }).canvas;
    const inset = s * 0.16, lw = Math.max(1.5, s * 0.075);
    this.sweepCv = world.sweep ? ringCanvas(maze, s, this.pad, world.sweep.color, inset - lw * 0.3, lw * 1.6, s * 0.32) : null;

    const glowDot = (c, color, r) => {
      const gg = c.createRadialGradient(0, 0, 0, 0, 0, r);
      gg.addColorStop(0, rgba(color, 0.45));
      gg.addColorStop(1, rgba(color, 0));
      c.fillStyle = gg;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    };
    this.dotSprite = spriteCanvas(Math.ceil(s), c => { if (high) glowDot(c, world.colors.dot, s * 0.4); world.drawDot(c, s); });
    this.powerSprite = spriteCanvas(Math.ceil(s * 1.8), c => { glowDot(c, world.colors.power, s * 0.85); world.drawPower(c, s); });

    this.ambient = world.makeAmbient(this.W, this.H, s);
    this.glowCache.clear();
  }

  glow(color) {
    let cv = this.glowCache.get(color);
    if (!cv) {
      const size = Math.ceil(this.s * 2.4);
      cv = spriteCanvas(size, c => {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, size / 2);
        g.addColorStop(0, rgba(color, 0.5));
        g.addColorStop(0.45, rgba(color, 0.16));
        g.addColorStop(1, rgba(color, 0));
        c.fillStyle = g;
        c.fillRect(-size / 2, -size / 2, size, size);
      });
      this.glowCache.set(color, cv);
    }
    return cv;
  }

  // Нарисовать объект в клетке (x, y). У краёв поля рисуем копию на другой стороне — для туннелей.
  drawAt(x, y, fn) {
    const { s, ctx, mw, mh } = this;
    const px = (x + 0.5) * s, py = (y + 0.5) * s;
    const xs = [px], ys = [py];
    if (x < 0.5) xs.push(px + mw);
    if (x > COLS - 1.5) xs.push(px - mw);
    if (y < 0.5) ys.push(py + mh);
    if (y > ROWS - 1.5) ys.push(py - mh);
    for (const X of xs) {
      for (const Y of ys) {
        ctx.save();
        ctx.translate(X, Y);
        fn();
        ctx.restore();
      }
    }
  }

  withGlow(color, alpha, fn) {
    const { ctx } = this;
    if (this.quality === 'high') {
      const g = this.glow(color);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha;
      ctx.drawImage(g, -g.width / 2, -g.height / 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    fn();
  }

  draw(game, fx, t, dt) {
    const { ctx } = this;
    const world = game.world, maze = game.maze, s = this.s;
    this.prepare(world, maze);
    const high = this.quality === 'high';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.bg, 0, 0);
    if (high) world.drawAmbient(ctx, this.ambient, t, dt, this.W, this.H, s);

    const shake = fx.shakeOffset();
    ctx.translate(this.ox + shake.x * s, this.oy + shake.y * s);

    // Лабиринт (мигает, когда уровень пройден)
    const flashing = game.state === 'clear' && Math.floor(game.stateT * 7) % 2 === 1;
    ctx.drawImage(flashing ? this.flashCv : this.mazeCv, -this.pad, -this.pad);
    if (high && this.sweepCv && !flashing) this.drawSweep(world.sweep, t);

    // Точки
    const dots = maze.dots, w = maze.w;
    const ds = this.dotSprite, dh = ds.width / 2;
    const pulse = 0.85 + Math.sin(t * 6) * 0.15;
    for (let i = 0; i < dots.length; i++) {
      if (!dots[i]) continue;
      const cx = ((i % w) + 0.5) * s, cy = (Math.floor(i / w) + 0.5) * s;
      if (dots[i] === 1) {
        ctx.drawImage(ds, cx - dh, cy - dh);
      } else {
        const ps = this.powerSprite, size = ps.width * pulse;
        ctx.drawImage(ps, cx - size / 2, cy - size / 2, size, size);
      }
    }

    ctx.save();
    ctx.beginPath(); ctx.rect(-s * 0.1, -s * 0.1, this.mw + s * 0.2, this.mh + s * 0.2); ctx.clip();

    for (const trap of game.traps) {
      ctx.globalAlpha = Math.min(1, trap.t, (TIMING.trapLife - trap.t) * 4);
      this.drawAt(trap.x, trap.y, () => world.drawTrap(ctx, s, t));
      ctx.globalAlpha = 1;
    }

    if (game.item && (game.item.t > 2 || Math.floor(t * 8) % 2 === 0)) {
      this.drawAt(game.item.x, game.item.y, () => this.withGlow('#ffd166', 0.8, () => world.drawItem(ctx, s, t)));
    }

    const hideEnemies = (game.state === 'dying' && game.stateT > TIMING.deathFreeze) || game.state === 'clear';
    if (!hideEnemies) for (const e of game.enemies) this.drawEnemy(game, e, t);
    this.drawHero(game, t);
    ctx.restore();

    fx.draw(ctx, s);

    if (game.state === 'ready' && !game.demo) {
      const spot = maze.itemSpot;
      const text = game.stateT > TIMING.ready - 0.5 ? 'ВПЕРЁД!' : 'ГОТОВ?';
      ctx.save();
      ctx.font = `800 ${Math.round(s * 0.8)}px "Exo 2", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = world.colors.accent2;
      ctx.shadowBlur = s * 0.6;
      ctx.fillStyle = world.colors.accent2;
      const k = Math.min(1, game.stateT * 4);
      ctx.globalAlpha = k;
      ctx.fillText(text, this.mw / 2, (spot.y + 0.5) * s);
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.vignette, 0, 0);
    if (fx.flashA > 0) {
      ctx.globalAlpha = fx.flashA;
      ctx.fillStyle = fx.flashColor;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.globalAlpha = 1;
    }
  }

  drawSweep(sw, t) {
    const { ctx } = this, cv = this.sweepCv;
    ctx.globalCompositeOperation = 'lighter';
    if (sw.type === 'pulse') {
      ctx.globalAlpha = sw.alpha * (0.5 + 0.5 * Math.sin(t * sw.speed));
      ctx.drawImage(cv, -this.pad, -this.pad);
    } else {
      const H = cv.height, band = sw.size * H, ph = (t * sw.speed) % 1;
      const top = sw.type === 'down' ? ph * (H + band) - band : H - ph * (H + band);
      const slices = 8;
      for (let i = 0; i < slices; i++) {
        const y0 = Math.max(0, top + (band * i) / slices), y1 = Math.min(H, top + (band * (i + 1)) / slices);
        if (y1 <= y0) continue;
        ctx.globalAlpha = sw.alpha * Math.sin((Math.PI * (i + 0.5)) / slices);
        ctx.drawImage(cv, 0, y0, cv.width, y1 - y0, -this.pad, -this.pad + y0, cv.width, y1 - y0);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  drawHero(game, t) {
    const { ctx, s } = this, hero = game.hero, world = game.world;
    let k = 0;
    if (game.state === 'dying') {
      k = Math.max(0, Math.min(1, (game.stateT - TIMING.deathFreeze) / (TIMING.deathAnim * 0.7)));
      if (k >= 1) return;
    }
    this.drawAt(hero.x, hero.y, () => {
      if (k > 0) {
        ctx.rotate(k * 9);
        ctx.scale(1 - k, 1 - k);
        ctx.globalAlpha = 1 - k * 0.6;
      }
      if (hero.slow > 0) ctx.globalAlpha *= 0.65 + 0.35 * Math.sin(t * 30);
      this.withGlow(world.colors.hero, 0.9, () => world.drawHero(ctx, s, hero, hero.anim));
      ctx.globalAlpha = 1;
    });
  }

  drawEnemy(game, e, t) {
    const { ctx, s } = this, world = game.world;
    const base = world.enemies[e.role].color;
    if (e.state === 'eyes' || e.state === 'entering') {
      const dir = e.state === 'entering' ? DOWN : e.dir;
      this.drawAt(e.x, e.y, () => eyesOnly(ctx, s, dir, base));
      return;
    }
    const scared = e.frightened;
    const flash = scared && game.fright < game.d.flashTime && Math.floor(game.fright * 8) % 2 === 0;
    const color = scared ? (flash ? world.colors.frightFlash : world.colors.fright) : base;
    const look = { color, scared, flash, alert: e.alert > 0 };
    // В доме враг смотрит вверх, к двери
    const view = e.free || (!e.dir.x && !e.dir.y)
      ? { role: e.role, index: e.index, dir: UP, angle: -Math.PI / 2 }
      : e;
    this.drawAt(e.x, e.y, () => {
      if (e.state === 'house') ctx.globalAlpha = 0.85;
      this.withGlow(color, look.alert ? 1 : 0.7, () => world.drawEnemy(ctx, s, view, t + e.index, look));
      ctx.globalAlpha = 1;
      if (look.alert) {
        ctx.font = `900 ${Math.round(s * 0.55)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = base;
        ctx.shadowBlur = s * 0.4;
        ctx.fillText('!', 0, -s * 0.72 + Math.sin(t * 12) * s * 0.04);
        ctx.shadowBlur = 0;
      }
    });
  }
}

// Маленькая картинка для интерфейса (жизни, иконки врагов, превью миров).
export function drawIcon(canvas, cssSize, draw) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.translate(canvas.width / 2, canvas.height / 2);
  draw(c, canvas.width);
}

export function renderPreview(canvas, world, maze, cssW, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const c = canvas.getContext('2d');
  world.drawBackground(c, canvas.width, canvas.height, 10);
  const s = Math.floor(Math.min(canvas.width / maze.w, canvas.height / maze.h) * 0.92);
  const built = buildMaze(world, maze, s, { glow: true });
  const ox = (canvas.width - maze.w * s) / 2, oy = (canvas.height - maze.h * s) / 2;
  c.drawImage(built.canvas, ox - built.pad, oy - built.pad);
  c.save();
  c.translate(ox + (maze.heroStart.x + 0.5) * s, oy + (maze.heroStart.y + 0.5) * s);
  c.scale(1.6, 1.6);
  world.drawHero(c, s, { angle: 0, moving: true, face: { x: 1, y: 0 } }, 0.3);
  c.restore();
}
