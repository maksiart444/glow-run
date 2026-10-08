// Правила игры: очки, жизни, уровни, бонусы и смена состояний
// (ready → play ⇄ eat → dying / clear → interlude → ... → over).

import {
  SCORE, START_LIVES, MAX_LIVES, EXTRA_LIFE_SCORE, LEVELS_PER_WORLD, STORY_LEVELS,
  TIMING, HIT_RADIUS, difficulty,
} from './config.js';
import { Maze, DIRS, NONE, opposite } from './maze.js';
import { Hero, Enemy, ROLES } from './entities.js';
import { WORLDS } from './worlds/index.js';

export class Game {
  constructor(emit) {
    this.emit = emit;
    this.mazes = WORLDS.map(w => new Maze(w.maze));
    this.hero = new Hero();
    this.enemies = ROLES.map((role, i) => new Enemy(role, i));
    this.best = 0;
    this.paused = false;
    this.demo = true;
    this.start(0, true);
  }

  get worldIndex() { return Math.floor(this.level / LEVELS_PER_WORLD) % WORLDS.length; }
  get endless() { return this.level >= STORY_LEVELS; }
  get levelName() {
    return this.endless
      ? `∞ ${this.level - STORY_LEVELS + 1}`
      : `${this.worldIndex + 1}-${(this.level % LEVELS_PER_WORLD) + 1}`;
  }
  get mode() { return this.d.modes[this.modeIndex][0]; }
  get elroy() { return this.dotsLeft <= this.maze.totalDots * 0.2; }

  start(level, demo = false) {
    this.demo = demo;
    this.paused = false;
    this.score = 0;
    this.lives = START_LIVES;
    this.extraGiven = false;
    this.level = level;
    this.loadLevel();
  }

  loadLevel() {
    this.world = WORLDS[this.worldIndex];
    this.maze = this.mazes[this.worldIndex];
    this.maze.resetDots();
    this.dotsLeft = this.maze.totalDots;
    this.dotsEaten = 0;
    this.itemsSpawned = 0;
    this.d = difficulty(this.level);
    this.resetActors();
    this.setState('ready');
    this.emit('level', { world: this.world, level: this.level });
  }

  // После смерти: все по местам, точки остаются.
  resetActors() {
    this.hero.reset(this.maze);
    for (const e of this.enemies) e.reset(this.maze, this.d);
    this.time = 0;
    this.modeIndex = 0;
    this.modeT = 0;
    this.fright = 0;
    this.combo = 0;
    this.traps = [];
    this.item = null;
    this.heroTileIndex = -1;
    this.autoTarget = undefined;
    this.updateHeroTile();
  }

  setState(s) { this.state = s; this.stateT = 0; }

  // Вызывает интерфейс, когда игрок нажал «Дальше» после уровня.
  continueAfterClear() {
    if (this.state === 'interlude') this.loadLevel();
  }

  update(dt, input) {
    if (this.paused) return;
    this.stateT += dt;
    switch (this.state) {
      case 'ready':
        for (const e of this.enemies) if (e.state === 'house') e.py = e.homeY + Math.sin((e.anim += dt) * 5) * 0.2;
        if (this.stateT >= (this.demo ? 0.3 : TIMING.ready)) {
          this.setState('play');
          this.emit('go');
        }
        break;
      case 'play':
        this.step(dt, input);
        break;
      case 'eat':
        if (this.stateT >= TIMING.eatPause) this.setState('play');
        break;
      case 'dying':
        if (!this.deathShown && this.stateT >= TIMING.deathFreeze) {
          this.deathShown = true;
          this.emit('death-anim', { x: this.hero.x, y: this.hero.y });
        }
        if (this.stateT >= TIMING.deathFreeze + TIMING.deathAnim) {
          this.lives--;
          if (this.lives > 0) {
            this.resetActors();
            this.setState('ready');
            this.emit('lives');
          } else {
            this.setState('over');
            this.emit('over', { score: this.score, level: this.level });
          }
        }
        break;
      case 'clear':
        if (this.stateT >= TIMING.clearFlash) this.finishLevel();
        break;
    }
  }

  step(dt, input) {
    const { d, maze, hero } = this;
    this.time += dt;

    // Таймер бонуса. Пока он действует, смена режимов врагов на паузе.
    if (this.fright > 0) {
      this.fright -= dt;
      if (this.fright <= 0) {
        this.fright = 0;
        for (const e of this.enemies) e.frightened = false;
        this.emit('fright-end');
      }
    } else {
      this.modeT += dt;
      if (this.modeT >= d.modes[this.modeIndex][1] && this.modeIndex < d.modes.length - 1) {
        this.modeIndex++;
        this.modeT = 0;
        for (const e of this.enemies) if (e.state === 'active') e.reverseQueued = true;
      }
    }

    // Герой
    const want = this.demo ? this.autopilot() : input.peek();
    let speed = this.fright > 0 ? d.heroFrightSpeed : d.heroSpeed;
    if (hero.slow > 0) { hero.slow -= dt; speed *= d.heroSlowFactor; }
    if (hero.update(dt, maze, want, speed) && !this.demo) input.consume();
    this.updateHeroTile();

    // Точки и бонусы
    const { x: cx, y: cy } = this.heroTile;
    const i = maze.idx(cx, cy);
    const kind = maze.dots[i];
    if (kind) {
      maze.dots[i] = 0;
      this.dotsLeft--;
      this.dotsEaten++;
      if (kind === 1) {
        this.addScore(SCORE.dot);
        this.emit('dot', { x: cx, y: cy });
      } else {
        this.addScore(SCORE.power);
        this.startFright();
        this.emit('power', { x: cx, y: cy });
      }
      const need = maze.totalDots * (this.itemsSpawned === 0 ? 0.3 : 0.7);
      if (this.itemsSpawned < 2 && this.dotsEaten >= need) {
        this.itemsSpawned++;
        this.item = { ...maze.itemSpot, t: TIMING.itemLife };
        this.emit('item-spawn', this.item);
      }
    }

    if (this.item) {
      this.item.t -= dt;
      if (cx === this.item.x && cy === this.item.y) {
        const points = SCORE.item[Math.min(this.level, SCORE.item.length - 1)];
        this.addScore(points);
        this.emit('item', { x: cx, y: cy, points });
        this.item = null;
      } else if (this.item.t <= 0) {
        this.item = null;
      }
    }

    for (const trap of this.traps) {
      trap.t -= dt;
      if (trap.t > 0 && trap.x === cx && trap.y === cy) {
        trap.t = 0;
        hero.slow = TIMING.trapSlow;
        this.emit('trap', { x: cx, y: cy });
      }
    }
    this.traps = this.traps.filter(t => t.t > 0);

    // Враги
    for (const e of this.enemies) e.update(dt, this);

    // Столкновения
    for (const e of this.enemies) {
      if (e.state !== 'active') continue;
      let dx = Math.abs(e.x - hero.x), dy = Math.abs(e.y - hero.y);
      if (dx > maze.w / 2) dx = maze.w - dx;
      if (dy > maze.h / 2) dy = maze.h - dy;
      if (dx * dx + dy * dy > HIT_RADIUS * HIT_RADIUS) continue;
      if (e.frightened) {
        this.eatEnemy(e);
        return;
      }
      if (!this.demo) {
        this.setState('dying');
        this.deathShown = false;
        this.emit('death', { x: hero.x, y: hero.y });
        return;
      }
    }

    if (this.dotsLeft === 0) {
      this.setState('clear');
      this.emit('clear');
    }
  }

  updateHeroTile() {
    const { maze, hero } = this;
    const x = maze.wrapX(Math.round(hero.x)), y = maze.wrapY(Math.round(hero.y));
    this.heroTile = { x, y };
    const i = maze.idx(x, y);
    if (i !== this.heroTileIndex) {
      this.heroTileIndex = i;
      this.heroMap = maze.bfs(hero.tx, hero.ty);
    }
  }

  startFright() {
    this.fright = this.d.frightTime;
    this.combo = 0;
    for (const e of this.enemies) {
      if (e.state === 'eyes' || e.state === 'entering') continue;
      if (e.state === 'active' && !e.frightened) e.reverseQueued = true;
      e.frightened = true;
      e.alert = 0;
    }
  }

  eatEnemy(e) {
    const points = SCORE.enemy[Math.min(this.combo, SCORE.enemy.length - 1)];
    this.combo++;
    this.addScore(points);
    const at = { x: e.x, y: e.y };
    e.toEyes();
    this.setState('eat');
    this.emit('eat', { ...at, points, enemy: e, combo: this.combo });
  }

  addTrap(x, y) {
    const { maze } = this;
    if (this.traps.length >= 2 || maze.isTunnel(x, y)) return;
    if (x === maze.exit.x && y === maze.exit.y) return;
    if (this.traps.some(t => t.x === x && t.y === y)) return;
    this.traps.push({ x, y, t: TIMING.trapLife });
    this.emit('trap-drop', { x, y });
  }

  addScore(points) {
    if (this.demo) return;
    this.score += points;
    if (this.score > this.best) this.best = this.score;
    if (!this.extraGiven && this.score >= EXTRA_LIFE_SCORE) {
      this.extraGiven = true;
      if (this.lives < MAX_LIVES) this.lives++;
      this.emit('extra-life');
    }
  }

  finishLevel() {
    const finished = this.level;
    this.level++;
    if (this.demo) { this.loadLevel(); return; }
    this.setState('interlude');
    const worldDone = (finished + 1) % LEVELS_PER_WORLD === 0;
    this.emit('level-clear', {
      finished,
      worldDone,
      worldIndex: Math.floor(finished / LEVELS_PER_WORLD) % WORLDS.length,
      nextWorldIndex: this.worldIndex,
      storyDone: finished + 1 === STORY_LEVELS,
    });
  }

  // Автопилот для заставки в меню: выбирает ближайшую точку и идёт к ней, пока не съест.
  // Думает на клетку вперёд: решение нужно уже в момент, когда герой дойдёт до центра.
  autopilot() {
    const { hero, maze } = this;
    if (this.autoTarget !== undefined && !maze.dots[this.autoTarget]) this.autoTarget = undefined;
    const moving = hero.prog > 0 && hero.dir !== NONE;
    const sx = moving ? maze.wrapX(hero.tx + hero.dir.x) : hero.tx;
    const sy = moving ? maze.wrapY(hero.ty + hero.dir.y) : hero.ty;
    const back = moving ? opposite(hero.dir) : NONE;
    const seen = new Uint8Array(maze.w * maze.h);
    const queue = [[sx, sy, null]];
    seen[maze.idx(sx, sy)] = 1;
    const dirs = [hero.dir, ...DIRS.filter(d => d !== hero.dir)].filter(d => d !== NONE);
    while (queue.length) {
      const [x, y, first] = queue.shift();
      const i = maze.idx(x, y);
      if (first && (this.autoTarget === undefined ? maze.dots[i] : i === this.autoTarget)) {
        this.autoTarget = i;
        return first;
      }
      for (const dir of dirs) {
        if (!first && dir === back) continue;
        const nx = maze.wrapX(x + dir.x), ny = maze.wrapY(y + dir.y);
        const i = maze.idx(nx, ny);
        if (!seen[i] && maze.isOpen(nx, ny)) {
          seen[i] = 1;
          queue.push([nx, ny, first || dir]);
        }
      }
    }
    return null;
  }
}
