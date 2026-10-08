// Интерфейс: экраны меню, панели очков, жизни, карточки миров, подсказки.

import { WORLDS } from './worlds/index.js';
import { drawIcon, renderPreview } from './render.js';
import { RIGHT } from './maze.js';

const $ = id => document.getElementById(id);

const ROLE_TEXT = {
  hunter: ['Охотник', 'Всегда идёт к тебе кратчайшим путём. Когда точек остаётся мало — ускоряется.'],
  interceptor: ['Перехватчик', 'Бежит туда, где ты окажешься через пару секунд, и отрезает путь.'],
  patrol: ['Патрульный', 'Обходит свой участок. Увидит тебя по прямой — делает рывок.'],
  chaos: ['Хаотик', 'Бродит непредсказуемо и оставляет ловушки, которые замедляют.'],
};

const LOCK_SVG = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z"/></svg>';

const iconHero = { angle: 0, moving: false, face: RIGHT };

export class UI {
  constructor(onAction) {
    this.stack = [];
    this.current = null;
    this.shown = {};
    this.clearTimer = null;
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-action]');
      if (el && !el.disabled) onAction(el.dataset.action, el.dataset);
    });
  }

  // ---------- Экраны ----------

  setVisible(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('show', s.id === `scr-${name}`));
    this.current = name;
    const focus = name && document.querySelector(`#scr-${name} .btn.primary`);
    if (focus && matchMedia('(pointer: fine)').matches) focus.focus({ preventScroll: true });
  }

  show(name, push = false) {
    if (push && this.current) this.stack.push(this.current);
    else this.stack = [];
    this.setVisible(name);
  }

  back() {
    const prev = this.stack.pop();
    this.setVisible(prev || null);
  }

  hide() {
    clearTimeout(this.clearTimer);
    this.stack = [];
    this.setVisible(null);
  }

  setHud(on) {
    $('hud-top').classList.toggle('hidden', !on);
    $('hud-bottom').classList.toggle('hidden', !on);
  }

  setTheme(world) {
    const root = document.documentElement.style;
    root.setProperty('--accent', world.colors.accent);
    root.setProperty('--accent2', world.colors.accent2);
    root.setProperty('--fright', world.colors.fright);
    root.setProperty('--text', world.colors.text);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', world.colors.bgTop);
  }

  toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  setMenuBest(best) { $('menu-best').textContent = best.toLocaleString('ru-RU'); }

  // ---------- Панель очков (обновляем только то, что изменилось) ----------

  set(id, value) {
    if (this.shown[id] === value) return;
    this.shown[id] = value;
    $(id).textContent = value;
  }

  updateHud(game) {
    this.set('score', game.score.toLocaleString('ru-RU'));
    this.set('best', Math.max(game.best, game.score).toLocaleString('ru-RU'));
    this.set('world-name', game.world.name);
    this.set('level-name', game.levelName);
    const on = game.fright > 0;
    $('fright').classList.toggle('on', on);
    if (on) $('fright-fill').style.width = `${(game.fright / game.d.frightTime) * 100}%`;
  }

  renderLives(world, lives) {
    const box = $('lives');
    box.innerHTML = '';
    for (let i = 0; i < lives; i++) {
      const c = document.createElement('canvas');
      drawIcon(c, 24, (ctx, size) => world.drawHero(ctx, size * 0.8, iconHero, 0.4));
      box.appendChild(c);
    }
    this.set('fright-name', world.powerName);
  }

  // ---------- Миры ----------

  renderWorlds(store, mazes) {
    const grid = $('world-grid');
    grid.innerHTML = '';
    WORLDS.forEach((world, i) => {
      const locked = i > store.unlocked;
      const card = document.createElement('button');
      card.className = 'world-card' + (locked ? ' locked' : '');
      card.style.setProperty('--card-accent', world.colors.accent);
      card.style.setProperty('--card-glow', world.colors.accent + '88');
      if (!locked) { card.dataset.action = 'world'; card.dataset.world = i; }
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      card.insertAdjacentHTML('beforeend', `
        ${locked ? `<div class="lock">${LOCK_SVG}</div>` : ''}
        <div class="info"><h4>${i + 1}. ${world.name}</h4>
        <p>${locked ? `Пройди мир «${WORLDS[i - 1].name}»` : world.subtitle.split('.')[0]}</p></div>`);
      grid.appendChild(card);
      requestAnimationFrame(() => {
        const w = card.clientWidth || 160;
        renderPreview(canvas, world, mazes[i], w, w * 4 / 3);
      });
    });
    const endless = document.createElement('button');
    endless.className = 'world-card endless' + (store.endless ? '' : ' locked');
    if (store.endless) endless.dataset.action = 'endless';
    endless.innerHTML = `<div class="info"><h4>∞ Бесконечный режим</h4>
      <p>${store.endless ? 'Миры идут по кругу, скорость растёт. Сколько продержишься?' : 'Откроется, когда пройдёшь все три мира.'}</p></div>`;
    grid.appendChild(endless);
  }

  // ---------- Настройки ----------

  renderSettings(settings) {
    document.querySelectorAll('.toggle').forEach(t => t.classList.toggle('on', !!settings[t.dataset.key]));
    document.querySelectorAll('.segment button').forEach(b => b.classList.toggle('on', b.dataset.value === settings.quality));
  }

  // ---------- Как играть ----------

  renderHowto(world) {
    $('howto-power').textContent = `(${world.powerName.toLowerCase()})`;
    const list = $('enemy-list');
    list.innerHTML = '';
    for (const role of ['hunter', 'interceptor', 'patrol', 'chaos']) {
      const [title, text] = ROLE_TEXT[role];
      const row = document.createElement('div');
      row.className = 'enemy-row';
      const c = document.createElement('canvas');
      drawIcon(c, 44, (ctx, size) => {
        world.drawEnemy(ctx, size * 0.72, { role, index: 0, dir: RIGHT, angle: 0 }, 0.5, {
          color: world.enemies[role].color, scared: false, flash: false, alert: false,
        });
      });
      row.appendChild(c);
      row.insertAdjacentHTML('beforeend', `<div><h4>${title}<small>${world.enemies[role].name}</small></h4><p>${text}</p></div>`);
      list.appendChild(row);
    }
  }

  // ---------- Уровень пройден ----------

  showClear(info, mazes, onNext) {
    const preview = $('clear-preview');
    preview.classList.remove('show');
    let auto = 1.8;
    $('clear-kicker').textContent = info.label;
    $('clear-score').textContent = info.score.toLocaleString('ru-RU');
    const next = WORLDS[info.nextWorldIndex];
    if (info.endlessNew) {
      $('clear-title').textContent = 'Все миры пройдены!';
      $('clear-text').textContent = 'Открыт бесконечный режим: миры идут по кругу, а скорость растёт.';
      auto = 0;
    } else if (info.unlockedNew) {
      $('clear-title').textContent = 'Открыт новый мир!';
      $('clear-text').textContent = `${next.name}. ${next.subtitle}`;
      preview.classList.add('show');
      renderPreview(preview, next, mazes[info.nextWorldIndex], 220, 293);
      auto = 0;
    } else if (info.worldDone) {
      $('clear-title').textContent = 'Мир пройден!';
      $('clear-text').textContent = `Следующий мир: ${next.name}`;
      auto = 2.6;
    } else {
      $('clear-title').textContent = 'Уровень пройден!';
      $('clear-text').textContent = 'Враги станут быстрее. Держись!';
    }
    this.show('clear');
    clearTimeout(this.clearTimer);
    if (auto) this.clearTimer = setTimeout(() => { if (this.current === 'clear') onNext(); }, auto * 1000);
  }

  showOver({ score, record, label }) {
    $('over-score').textContent = score.toLocaleString('ru-RU');
    $('over-record').style.display = record ? '' : 'none';
    $('over-info').textContent = `Последний уровень: ${label}`;
    this.show('over');
  }
}
