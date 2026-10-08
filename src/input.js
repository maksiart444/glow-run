// Управление: стрелки / WASD на компьютере и свайпы на телефоне.
// Нажатое направление запоминается на TURN_BUFFER секунд —
// герой свернёт, как только появится проход («поворот заранее»).

import { UP, DOWN, LEFT, RIGHT } from './maze.js';
import { TURN_BUFFER } from './config.js';

const KEYS = {
  ArrowUp: UP, KeyW: UP,
  ArrowDown: DOWN, KeyS: DOWN,
  ArrowLeft: LEFT, KeyA: LEFT,
  ArrowRight: RIGHT, KeyD: RIGHT,
};

export class Input {
  constructor(surface) {
    this.want = null;
    this.wantAt = 0;
    this.held = [];          // зажатые клавиши, последняя — главная
    this.onPause = () => {};
    this.onConfirm = () => {};

    window.addEventListener('keydown', e => {
      const dir = KEYS[e.code];
      if (dir) {
        e.preventDefault();
        this.held = this.held.filter(d => d !== dir);
        this.held.push(dir);
        this.press(dir);
        return;
      }
      if (e.repeat) return;
      if (e.code === 'Escape' || e.code === 'KeyP') this.onPause();
      if (e.code === 'Enter' || e.code === 'Space') this.onConfirm(e);
    });
    window.addEventListener('keyup', e => {
      const dir = KEYS[e.code];
      if (dir) this.held = this.held.filter(d => d !== dir);
    });
    window.addEventListener('blur', () => { this.held = []; });

    // Свайпы: направление определяется, как только палец прошёл ~18px.
    // Можно не отрывать палец и вести его дальше — каждый новый рывок считается.
    let sx = 0, sy = 0, active = false;
    surface.addEventListener('pointerdown', e => {
      active = true; sx = e.clientX; sy = e.clientY;
      surface.setPointerCapture?.(e.pointerId);
    });
    surface.addEventListener('pointermove', e => {
      if (!active) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.hypot(dx, dy) < 18) return;
      this.press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? RIGHT : LEFT) : (dy > 0 ? DOWN : UP));
      sx = e.clientX; sy = e.clientY;
    });
    const end = () => { active = false; };
    surface.addEventListener('pointerup', end);
    surface.addEventListener('pointercancel', end);
    surface.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  }

  press(dir) {
    this.want = dir;
    this.wantAt = performance.now();
  }

  peek() {
    if (this.want && performance.now() - this.wantAt <= TURN_BUFFER * 1000) return this.want;
    if (this.held.length) return this.held[this.held.length - 1];
    return null;
  }

  consume() { this.want = null; }

  reset() { this.want = null; this.held = []; }
}
