// Все настройки игры в одном месте. Меняйте числа здесь — код трогать не нужно.

export const COLS = 19;            // ширина лабиринта в клетках
export const ROWS = 25;            // высота лабиринта в клетках
export const STEP = 1 / 120;       // шаг логики: 120 раз в секунду (плавно и точно)

export const START_LIVES = 3;
export const MAX_LIVES = 5;
export const EXTRA_LIFE_SCORE = 10000;
export const LEVELS_PER_WORLD = 3;
export const STORY_LEVELS = 9;     // 3 мира × 3 уровня, дальше — бесконечный режим

export const SCORE = {
  dot: 10,
  power: 50,
  enemy: [200, 400, 800, 1600],    // очки за 1-го, 2-го, 3-го, 4-го врага за один бонус
  item: [100, 300, 500, 700, 1000, 1500, 2000, 3000, 5000],
};

export const TURN_BUFFER = 0.6;    // сколько секунд помнится нажатое направление
export const CORNER_LATE = 0.45;   // проскочил поворот меньше чем на полклетки — всё равно свернёт
export const CORNER_EARLY = 0.4;   // не доехал до поворота меньше чем полклетки — свернёт сразу
export const HIT_RADIUS = 0.5;     // расстояние (в клетках), на котором враг ловит героя

export const TIMING = {
  ready: 2.2,        // «Готов?» перед стартом
  eatPause: 0.45,    // стоп-кадр после поедания врага
  deathFreeze: 0.7,  // пауза перед анимацией смерти
  deathAnim: 1.5,    // анимация смерти
  clearFlash: 1.8,   // лабиринт мигает, когда уровень пройден
  itemLife: 9,       // сколько лежит бонусный предмет
  trapLife: 8,       // сколько лежит ловушка Хаотика
  trapSlow: 1.6,     // на сколько секунд ловушка замедляет героя
  alert: 2.2,        // рывок Патрульного
  alertCooldown: 4,
};

// Сложность растёт с каждым уровнем (level = 0, 1, 2, ...).
export function difficulty(level) {
  const d = Math.min(level, 12);
  const hero = Math.min(6.6 + 0.14 * d, 8.2);          // клеток в секунду
  return {
    heroSpeed: hero,
    heroFrightSpeed: hero * 1.08,
    heroSlowFactor: 0.55,
    enemySpeed: hero * Math.min(0.74 + 0.025 * d, 0.95),
    frightSpeed: hero * 0.55,
    tunnelSpeed: hero * 0.45,
    eyesSpeed: hero * 2,
    elroyBoost: 1.06,                                  // Охотник ускоряется, когда точек мало
    patrolDash: 1.35,
    frightTime: Math.max(2, 8 - 0.55 * d),
    flashTime: 2,
    release: [0, 2, 6, 11].map(t => t * Math.max(0.35, 1 - 0.07 * d)),
    trapEvery: Math.max(6, 11 - 0.5 * d),
    // Враги то «гуляют» по своим углам, то «охотятся». Последняя охота бесконечна.
    modes: [
      ['scatter', Math.max(3, 8 - 0.4 * d)],
      ['chase', 20 + d],
      ['scatter', Math.max(2.5, 6 - 0.4 * d)],
      ['chase', 22 + d],
      ['scatter', 4],
      ['chase', Infinity],
    ],
  };
}
