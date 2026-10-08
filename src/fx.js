// Эффекты: искры, волны, всплывающие очки, тряска и вспышки экрана.
// Координаты — в клетках лабиринта (как у героя и врагов).

const TAU = Math.PI * 2;

export class FX {
  constructor() {
    this.amount = 1;  // 1 — красиво, 0.4 — экономно
    this.clear();
  }

  clear() {
    this.particles = [];
    this.rings = [];
    this.popups = [];
    this.shakeT = 0;
    this.shakeAmp = 0;
    this.flashA = 0;
    this.flashColor = '#fff';
  }

  burst(x, y, color, count = 12, speed = 4, life = 0.6, size = 0.08) {
    const n = Math.max(1, Math.round(count * this.amount));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: life * (0.6 + Math.random() * 0.4), max: life, size: size * (0.6 + Math.random() * 0.8), color,
      });
    }
    if (this.particles.length > 500) this.particles.splice(0, this.particles.length - 500);
  }

  ring(x, y, color, radius = 3, life = 0.6, width = 0.12) {
    this.rings.push({ x, y, color, radius, life, max: life, width });
  }

  popup(x, y, text, color) {
    this.popups.push({ x, y, text, color, life: 1.1, max: 1.1 });
  }

  shake(amp = 0.2, time = 0.3) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
    this.shakeT = Math.max(this.shakeT, time);
  }

  flash(color = '#fff', alpha = 0.35) {
    this.flashColor = color;
    this.flashA = Math.max(this.flashA, alpha);
  }

  shakeOffset() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    return { x: (Math.random() - 0.5) * 2 * this.shakeAmp, y: (Math.random() - 0.5) * 2 * this.shakeAmp };
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 3;
      p.vy *= 1 - dt * 3;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter(r => r.life > 0);
    for (const p of this.popups) { p.life -= dt; p.y -= dt * 0.9; }
    this.popups = this.popups.filter(p => p.life > 0);
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      if (this.shakeT <= 0) this.shakeAmp = 0;
    }
    this.flashA = Math.max(0, this.flashA - dt * 1.8);
  }

  draw(ctx, s) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * s * (1 - k * 0.6);
      ctx.beginPath(); ctx.arc((r.x + 0.5) * s, (r.y + 0.5) * s, (0.2 + k * r.radius) * s, 0, TAU); ctx.stroke();
    }
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc((p.x + 0.5) * s, (p.y + 0.5) * s, p.size * s, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(s * 0.6)}px "Exo 2", sans-serif`;
    for (const p of this.popups) {
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 2);
      const scale = 1 + Math.max(0, (k - 0.8)) * 2;
      ctx.save();
      ctx.translate((p.x + 0.5) * s, (p.y + 0.5) * s);
      ctx.scale(scale, scale);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = s * 0.4;
      ctx.fillStyle = '#fff';
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}
