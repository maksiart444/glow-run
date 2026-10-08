// Точка входа: связывает игру, графику, звук, управление и интерфейс.

import { STEP, STORY_LEVELS, LEVELS_PER_WORLD } from './config.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { FX } from './fx.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { UI } from './ui.js';
import { loadStore, saveStore } from './storage.js';

const store = loadStore();
const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const fx = new FX();
const sound = new Sound(store.settings);
const input = new Input(canvas);
const ui = new UI(handleAction);

let game = null;
let mode = 'menu';        // 'menu' — заставка, 'game' — идёт игра
let startLevel = 0;

applyQuality();
game = new Game(handleEvent);
game.best = store.best;
toMenu();

function levelLabel(level) {
  return level >= STORY_LEVELS
    ? `∞ ${level - STORY_LEVELS + 1}`
    : `${Math.floor(level / LEVELS_PER_WORLD) + 1}-${(level % LEVELS_PER_WORLD) + 1}`;
}

function vibrate(pattern) {
  if (store.settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
}

function applyQuality() {
  renderer.setQuality(store.settings.quality);
  fx.amount = store.settings.quality === 'high' ? 1 : 0.4;
  layout();
}

// Лабиринт занимает всё свободное место, а панели «прилипают» к нему сверху и снизу.
function layout() {
  const probe = getComputedStyle(document.getElementById('safe-probe'));
  const safeTop = parseFloat(probe.paddingTop) || 0;
  const safeBottom = parseFloat(probe.paddingBottom) || 0;
  const rect = renderer.resize(safeTop + 66, safeBottom + 44);
  const hudTop = document.getElementById('hud-top');
  const hudBottom = document.getElementById('hud-bottom');
  hudTop.style.top = `${Math.max(safeTop + 8, rect.top - 60)}px`;
  hudBottom.style.top = `${Math.min(window.innerHeight - safeBottom - 38, rect.top + rect.height + 8)}px`;
  document.documentElement.style.setProperty('--maze-w', `${Math.max(300, rect.width)}px`);
}

// ---------- Переходы между режимами ----------

function startGame(level) {
  sound.unlock();
  startLevel = level;
  mode = 'game';
  input.reset();
  fx.clear();
  game.start(level, false);
  game.best = Math.max(game.best, store.best);
  ui.hide();
  ui.setHud(true);
  ui.renderLives(game.world, game.lives);
  sound.play('start');
}

function toMenu() {
  mode = 'menu';
  sound.stopMusic();
  sound.setFright(false);
  fx.clear();
  game.start(store.lastWorld * LEVELS_PER_WORLD, true);
  ui.setHud(false);
  ui.setMenuBest(store.best);
  ui.show('menu');
}

function pause() {
  if (mode !== 'game' || game.paused || game.state === 'over' || game.state === 'interlude') return;
  game.paused = true;
  sound.stopMusic();
  ui.show('pause');
}

function resume() {
  if (!game.paused) return;
  game.paused = false;
  input.reset();
  ui.hide();
  if (game.state === 'play' || game.state === 'eat') sound.startMusic();
}

// ---------- Кнопки интерфейса ----------

function handleAction(action, data) {
  sound.unlock();
  if (action !== 'toggle') sound.play('click');
  switch (action) {
    case 'play': startGame(store.lastWorld * LEVELS_PER_WORLD); break;
    case 'worlds':
      ui.renderWorlds(store, game.mazes);
      ui.show('worlds', true);
      break;
    case 'world': startGame(Number(data.world) * LEVELS_PER_WORLD); break;
    case 'endless': startGame(STORY_LEVELS); break;
    case 'settings':
      ui.renderSettings(store.settings);
      ui.show('settings', true);
      break;
    case 'howto':
      ui.renderHowto(game.world);
      ui.show('howto', true);
      break;
    case 'back': ui.back(); break;
    case 'pause': pause(); break;
    case 'resume': resume(); break;
    case 'restart': startGame(startLevel); break;
    case 'menu': toMenu(); break;
    case 'next': nextLevel(); break;
    case 'toggle':
      store.settings[data.key] = !store.settings[data.key];
      saveStore(store);
      sound.apply();
      sound.play('click');
      if (data.key === 'vibration') vibrate(30);
      ui.renderSettings(store.settings);
      break;
    case 'quality':
      store.settings.quality = data.value;
      saveStore(store);
      applyQuality();
      ui.renderSettings(store.settings);
      break;
  }
}

function nextLevel() {
  if (game.state !== 'interlude') return;
  ui.hide();
  game.continueAfterClear();
}

input.onPause = () => {
  if (ui.stack.length) { ui.back(); return; }
  if (mode === 'game') game.paused ? resume() : pause();
};

input.onConfirm = e => {
  if (ui.current === 'menu') { e.preventDefault(); startGame(store.lastWorld * LEVELS_PER_WORLD); }
  else if (ui.current === 'clear') { e.preventDefault(); nextLevel(); }
  else if (ui.current === 'over') { e.preventDefault(); startGame(startLevel); }
  else if (ui.current === 'pause') { e.preventDefault(); resume(); }
};

// ---------- События игры: эффекты, звуки, интерфейс ----------

function handleEvent(type, d) {
  if (!game) return;
  const demo = game.demo, world = game.world;
  switch (type) {
    case 'level':
      ui.setTheme(world);
      sound.setSong(world.music);
      if (!demo) {
        store.lastWorld = game.worldIndex;
        saveStore(store);
        ui.renderLives(world, game.lives);
      }
      break;
    case 'go':
      if (!demo) sound.startMusic();
      break;
    case 'dot':
      fx.burst(d.x, d.y, world.colors.dot, 3, 2.5, 0.35, 0.05);
      if (!demo) sound.play('dot', world);
      break;
    case 'power':
      fx.ring(d.x, d.y, world.colors.power, 7, 0.8, 0.2);
      fx.burst(d.x, d.y, world.colors.power, 24, 6, 0.8, 0.09);
      fx.flash(world.colors.fright, 0.2);
      fx.shake(0.08, 0.2);
      if (!demo) { sound.play('power', world); sound.setFright(true); vibrate(30); }
      break;
    case 'power-spawn':
      fx.ring(d.x, d.y, world.colors.power, 2.5, 0.8, 0.15);
      fx.burst(d.x, d.y, world.colors.power, 16, 4, 0.7, 0.07);
      break;
    case 'fright-end':
      sound.setFright(false);
      break;
    case 'eat': {
      const color = world.enemies[d.enemy.role].color;
      fx.burst(d.x, d.y, color, 28, 7, 0.8, 0.1);
      fx.ring(d.x, d.y, color, 3, 0.5, 0.15);
      fx.popup(d.x, d.y - 0.3, String(d.points), color);
      fx.shake(0.12, 0.2);
      if (!demo) { sound.play('eat'); vibrate(40); }
      break;
    }
    case 'death':
      sound.stopMusic();
      sound.setFright(false);
      vibrate([60, 40, 120]);
      break;
    case 'death-anim':
      fx.burst(d.x, d.y, world.colors.hero, 44, 7, 1.2, 0.1);
      fx.ring(d.x, d.y, world.colors.hero, 4, 0.9, 0.22);
      fx.shake(0.3, 0.5);
      fx.flash('#ff2050', 0.25);
      sound.play('death');
      break;
    case 'lives':
      ui.renderLives(world, game.lives);
      break;
    case 'item-spawn':
      fx.ring(d.x, d.y, '#ffd166', 1.6, 0.6, 0.1);
      break;
    case 'item':
      fx.popup(d.x, d.y - 0.3, String(d.points), '#ffd166');
      fx.burst(d.x, d.y, '#ffd166', 22, 5, 0.7, 0.08);
      if (!demo) sound.play('item');
      break;
    case 'trap-drop':
      fx.burst(d.x, d.y, world.enemies.chaos.color, 8, 2, 0.5, 0.06);
      break;
    case 'trap':
      fx.burst(d.x, d.y, world.enemies.chaos.color, 16, 4, 0.6);
      fx.shake(0.1, 0.2);
      if (!demo) { sound.play('trap'); vibrate(25); ui.toast(`Обережно: ${world.trapName}!`); }
      break;
    case 'alert':
      fx.ring(d.enemy.x, d.enemy.y, world.enemies.patrol.color, 2.5, 0.5, 0.1);
      if (!demo) sound.play('alert');
      break;
    case 'extra-life':
      sound.play('extra');
      vibrate([30, 30, 30]);
      ui.toast('+1 життя!');
      ui.renderLives(world, game.lives);
      break;
    case 'clear':
      fx.flash('#ffffff', 0.3);
      if (!demo) { sound.stopMusic(); sound.setFright(false); sound.play('clear'); }
      break;
    case 'level-clear':
      onLevelClear(d);
      break;
    case 'over':
      onGameOver();
      break;
  }
}

function onLevelClear(d) {
  store.best = Math.max(store.best, game.score);
  if (d.finished < STORY_LEVELS) {
    const levelInWorld = (d.finished % LEVELS_PER_WORLD) + 1;
    store.progress[d.worldIndex] = Math.max(store.progress[d.worldIndex] || 0, levelInWorld);
  }
  saveStore(store);
  if (d.worldDone) sound.play('unlock');
  ui.showClear({
    ...d,
    worldDone: d.worldDone && d.finished < STORY_LEVELS,
    score: game.score,
    label: `Рівень ${levelLabel(d.finished)}`,
  }, game.mazes, nextLevel);
}

function onGameOver() {
  const record = game.score > store.best && game.score > 0;
  store.best = Math.max(store.best, game.score);
  saveStore(store);
  sound.play('gameover');
  setTimeout(() => {
    if (mode === 'game' && game.state === 'over') ui.showOver({ score: game.score, record, label: levelLabel(game.level) });
  }, 900);
}

// ---------- Окно, вкладка, поворот экрана ----------

let layoutQueued = false;
function queueLayout() {
  if (layoutQueued) return;
  layoutQueued = true;
  requestAnimationFrame(() => { layoutQueued = false; layout(); });
}
window.addEventListener('resize', queueLayout);
window.addEventListener('orientationchange', queueLayout);
window.visualViewport?.addEventListener('resize', queueLayout);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pause(); sound.suspend(); }
  else sound.resume();
});

document.fonts?.ready.then(queueLayout);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---------- Главный цикл ----------

let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!game.paused) {
    acc += dt;
    while (acc >= STEP) {
      game.update(STEP, input);
      acc -= STEP;
    }
    fx.update(dt);
  } else {
    acc = 0;
  }
  renderer.draw(game, fx, now / 1000, game.paused ? 0 : dt);
  if (mode === 'game') ui.updateHud(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Для автоматических проверок (в игре не используется).
window.__glow = { game, store, input, renderer, startGame, toMenu };
