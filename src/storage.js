// Сохранение рекорда, прогресса по мирам и настроек в браузере (localStorage).
// Если браузер не даёт сохранять (например, приватный режим) — игра всё равно работает.

const KEY = 'glowrun.v1';

const DEFAULTS = {
  best: 0,
  progress: [0, 0, 0],   // сколько уровней пройдено в каждом мире (0–3)
  lastWorld: 0,
  settings: { sound: true, music: true, vibration: true, quality: 'high' },
};

export function loadStore() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { saved = {}; }
  const progress = [...DEFAULTS.progress];
  (saved.progress || []).forEach((v, i) => { if (i < progress.length) progress[i] = v; });
  return {
    ...DEFAULTS,
    ...saved,
    progress,
    settings: { ...DEFAULTS.settings, ...(saved.settings || {}) },
  };
}

export function saveStore(store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* сохранить не вышло — не страшно */ }
}
