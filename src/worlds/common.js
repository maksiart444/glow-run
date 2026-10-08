// Общие инструменты рисования для всех миров.

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

// Предсказуемый генератор случайных чисел (одинаковый узор при каждой загрузке).
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// Два глаза, которые смотрят в сторону движения.
export function eyes(ctx, s, dir, o = {}) {
  const gap = (o.gap ?? 0.15) * s, y = (o.y ?? -0.06) * s;
  const r = (o.r ?? 0.1) * s, pr = (o.pupil ?? 0.055) * s;
  const lx = dir.x * r * 0.45, ly = dir.y * r * 0.45;
  for (const sx of [-gap, gap]) {
    ctx.fillStyle = o.white ?? '#ffffff';
    ctx.beginPath(); ctx.arc(sx, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = o.pupilColor ?? '#0b0b1e';
    ctx.beginPath(); ctx.arc(sx + lx, y + ly, pr, 0, Math.PI * 2); ctx.fill();
  }
}

// Испуганное лицо: глаза-точки и дрожащий рот.
export function scaredFace(ctx, s, color = '#ffffff') {
  ctx.fillStyle = color;
  for (const sx of [-0.12, 0.12]) {
    ctx.beginPath(); ctx.arc(sx * s, -0.07 * s, 0.05 * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, 0.045 * s);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const x = (-0.18 + i * 0.06) * s, y = (0.1 + (i % 2 ? -0.04 : 0.02)) * s;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}

// Только глаза — так выглядит съеденный враг, который летит домой.
export function eyesOnly(ctx, s, dir, color) {
  ctx.shadowColor = color;
  ctx.shadowBlur = 0.4 * s;
  eyes(ctx, s, dir, { gap: 0.13, y: 0, r: 0.11, pupil: 0.06, pupilColor: color });
  ctx.shadowBlur = 0;
}

export function star(ctx, cx, cy, spikes, outer, inner, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = rot + (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// Повернуть рисунок по направлению взгляда, не переворачивая его «вверх ногами».
export function faceAngle(ctx, angle) {
  ctx.rotate(angle);
  if (Math.cos(angle) < -0.01) ctx.scale(1, -1);
}

// Простой фон: вертикальный градиент.
export function verticalGradient(ctx, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
