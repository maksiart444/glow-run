// Сохранение рекорда, открытых миров и настроек в браузере (localStorage).
// Если браузер не даёт сохранять (например, приватный режим) — игра всё равно работает.

const KEY = 'glowrun.v1';

const DEFAULTS = {
  best: 0,
  unlocked: 0,        // номер последнего открытого мира (0, 1, 2)
  endless: false,     // открыт ли бесконечный режим
  lastWorld: 0,
  settings: { sound: true, music: true, vibration: true, quality: 'high' },
};

export function loadStore() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { saved = {}; }
  return {
    ...DEFAULTS,
    ...saved,
    settings: { ...DEFAULTS.settings, ...(saved.settings || {}) },
  };
}

export function saveStore(store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* сохранить не вышло — не страшно */ }
}
