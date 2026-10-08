// Интерфейс: экраны меню, панели очков, жизни, карточки миров, подсказки.

import { WORLDS } from './worlds/index.js';
import { drawIcon, renderPreview } from './render.js';
import { RIGHT } from './maze.js';
import { LEVELS_PER_WORLD } from './config.js';

const $ = id => document.getElementById(id);

const ROLE_TEXT = {
  hunter: ['Мисливець', 'Завжди йде до тебе найкоротшим шляхом. Коли точок лишається мало — пришвидшується.'],
  interceptor: ['Перехоплювач', 'Біжить туди, де ти опинишся за пару секунд, і відрізає шлях.'],
  patrol: ['Патрульний', 'Обходить свою ділянку. Побачить тебе по прямій — робить ривок.'],
  chaos: ['Хаотик', 'Блукає непередбачувано й залишає пастки, які сповільнюють.'],
};


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

  setMenuBest(best) { $('menu-best').textContent = best.toLocaleString('uk-UA'); }

  // ---------- Панель очков (обновляем только то, что изменилось) ----------

  set(id, value) {
    if (this.shown[id] === value) return;
    this.shown[id] = value;
    $(id).textContent = value;
  }

  updateHud(game) {
    this.set('score', game.score.toLocaleString('uk-UA'));
    this.set('best', Math.max(game.best, game.score).toLocaleString('uk-UA'));
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
      const done = Math.min(store.progress[i] || 0, LEVELS_PER_WORLD);
      const card = document.createElement('button');
      card.className = 'world-card';
      card.style.setProperty('--card-accent', world.colors.accent);
      card.style.setProperty('--card-glow', world.colors.accent + '88');
      card.dataset.action = 'world';
      card.dataset.world = i;
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      const status = done >= LEVELS_PER_WORLD ? '✓ Пройдено' : `Пройдено ${done}/${LEVELS_PER_WORLD}`;
      card.insertAdjacentHTML('beforeend', `
        <span class="progress${done >= LEVELS_PER_WORLD ? ' done' : ''}">${status}</span>
        <div class="info"><h4>${i + 1}. ${world.name}</h4>
        <p>${world.subtitle.split('.')[0]}</p></div>`);
      grid.appendChild(card);
      requestAnimationFrame(() => {
        const w = card.clientWidth || 160;
        renderPreview(canvas, world, mazes[i], w, w * 4 / 3);
      });
    });
    const endless = document.createElement('button');
    endless.className = 'world-card endless';
    endless.dataset.action = 'endless';
    endless.innerHTML = `<div class="info"><h4>∞ Нескінченний режим</h4>
      <p>Світи йдуть по колу, а швидкість зростає. Скільки протримаєшся?</p></div>`;
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
    $('clear-score').textContent = info.score.toLocaleString('uk-UA');
    const next = WORLDS[info.nextWorldIndex];
    if (info.storyDone) {
      $('clear-title').textContent = 'Усі світи пройдено!';
      $('clear-text').textContent = 'Далі — нескінченний режим: світи йдуть по колу, а швидкість зростає.';
      auto = 0;
    } else if (info.worldDone) {
      $('clear-title').textContent = 'Світ пройдено!';
      $('clear-text').textContent = `Далі — ${next.name}. ${next.subtitle}`;
      preview.classList.add('show');
      renderPreview(preview, next, mazes[info.nextWorldIndex], 220, 293);
      auto = 0;
    } else {
      $('clear-title').textContent = 'Рівень пройдено!';
      $('clear-text').textContent = 'Вороги стануть швидшими. Тримайся!';
    }
    this.show('clear');
    clearTimeout(this.clearTimer);
    if (auto) this.clearTimer = setTimeout(() => { if (this.current === 'clear') onNext(); }, auto * 1000);
  }

  showOver({ score, record, label }) {
    $('over-score').textContent = score.toLocaleString('uk-UA');
    $('over-record').style.display = record ? '' : 'none';
    $('over-info').textContent = `Останній рівень: ${label}`;
    this.show('over');
  }
}
