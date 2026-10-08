// Герой и враги. Все двигаются по клеткам: tx, ty — клетка, которую покинули,
// dir — направление, prog — сколько пройдено до следующей клетки (от 0 до 1).
// Решения (куда свернуть) принимаются только в центре клетки, поэтому никто
// не застревает в стенах.

import { DIRS, NONE, LEFT, opposite } from './maze.js';
import { CORNER_LATE, CORNER_EARLY, TIMING } from './config.js';

class Actor {
  constructor() {
    this.tx = 0; this.ty = 0; this.dir = NONE; this.prog = 0;
    this.angle = 0; this.anim = Math.random() * 10;
  }

  place(x, y, dir = NONE) { this.tx = x; this.ty = y; this.dir = dir; this.prog = 0; }

  get x() { return this.tx + this.dir.x * this.prog; }
  get y() { return this.ty + this.dir.y * this.prog; }

  canGo(maze, dir) { return dir !== NONE && maze.isOpen(this.tx + dir.x, this.ty + dir.y); }

  // Развернуться на месте: следующая клетка становится текущей.
  reverse(maze) {
    if (this.dir === NONE) return;
    if (this.prog > 0) {
      this.tx = maze.wrapX(this.tx + this.dir.x);
      this.ty = maze.wrapY(this.ty + this.dir.y);
      this.prog = 1 - this.prog;
    }
    this.dir = opposite(this.dir);
  }

  // Пройти dist клеток. decide() вызывается в центре каждой клетки.
  advance(maze, dist, decide) {
    for (let guard = 0; guard < 8 && dist > 1e-9; guard++) {
      if (this.prog === 0) {
        this.dir = decide();
        if (this.dir === NONE) return;
      }
      const step = Math.min(dist, 1 - this.prog);
      this.prog += step;
      dist -= step;
      if (this.prog >= 1 - 1e-9) {
        this.tx = maze.wrapX(this.tx + this.dir.x);
        this.ty = maze.wrapY(this.ty + this.dir.y);
        this.prog = 0;
      }
    }
  }

  turnTowards(dir, dt, rate = 16) {
    if (dir === NONE) return;
    const target = Math.atan2(dir.y, dir.x);
    let diff = target - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += diff * Math.min(1, dt * rate);
  }
}

export class Hero extends Actor {
  reset(maze) {
    this.place(maze.heroStart.x, maze.heroStart.y, NONE);
    this.face = LEFT;
    this.angle = Math.PI;
    this.slow = 0;
    this.moving = false;
    this.ox = 0;   // смещение картинки при «срезании угла» — плавно уходит в ноль
    this.oy = 0;
  }

  // Где рисовать героя (логика игры использует x/y без смещения).
  get drawX() { return this.x + this.ox; }
  get drawY() { return this.y + this.oy; }

  // want — направление, которое хочет игрок (или null). Возвращает true, если оно применено.
  update(dt, maze, want, speed) {
    this.anim += dt;
    let used = false;

    if (want && want !== this.dir && this.dir !== NONE) {
      if (want === opposite(this.dir)) {
        this.reverse(maze);           // развернуться можно всегда
        used = true;
      } else if (this.prog > 0 && this.prog <= CORNER_LATE && this.canGo(maze, want)) {
        // Чуть проскочил поворот — сворачиваем, а картинка плавно «срезает угол»
        this.ox += this.dir.x * this.prog;
        this.oy += this.dir.y * this.prog;
        this.prog = 0;
      } else if (this.prog >= 1 - CORNER_EARLY) {
        // Почти доехал до поворота — сворачиваем чуть раньше центра клетки
        const nx = maze.wrapX(this.tx + this.dir.x), ny = maze.wrapY(this.ty + this.dir.y);
        if (maze.isOpen(nx + want.x, ny + want.y)) {
          this.ox += this.dir.x * (this.prog - 1);
          this.oy += this.dir.y * (this.prog - 1);
          this.tx = nx; this.ty = ny; this.prog = 0;
        }
      }
    }
    const k = Math.min(1, dt * 14);
    this.ox -= this.ox * k;
    this.oy -= this.oy * k;

    this.advance(maze, speed * dt, () => {
      if (want && !used && this.canGo(maze, want)) { used = true; return want; }
      return this.canGo(maze, this.dir) ? this.dir : NONE;
    });

    if (this.dir === NONE && want && !used && this.canGo(maze, want)) {
      this.dir = want;                 // стоял у стены — трогаемся
      used = true;
    }
    this.moving = this.dir !== NONE;
    if (this.moving) this.face = this.dir;
    this.turnTowards(this.face, dt, 18);
    return used;
  }
}

export const ROLES = ['hunter', 'interceptor', 'patrol', 'chaos'];
const HOME_OFFSET = { hunter: 0, interceptor: 0, patrol: -2, chaos: 2 };

export class Enemy extends Actor {
  constructor(role, index) {
    super();
    this.role = role;
    this.index = index;
  }

  // В доме и при выходе из него враг двигается свободно (px, py), а не по клеткам.
  get free() { return this.state === 'house' || this.state === 'leaving' || this.state === 'entering'; }
  get x() { return this.free ? this.px : super.x; }
  get y() { return this.free ? this.py : super.y; }

  reset(maze, d) {
    this.frightened = false;
    this.reverseQueued = false;
    this.alert = 0;
    this.alertCd = 2;
    this.trapT = 0;
    this.waypoint = 0;
    this.releaseAt = d.release[this.index];
    this.homeX = maze.house.x + HOME_OFFSET[this.role];
    this.homeY = maze.house.y;
    if (this.role === 'hunter') {
      this.state = 'active';
      this.place(maze.exit.x, maze.exit.y, NONE);
      this.angle = Math.PI;
    } else {
      this.state = 'house';
      this.place(maze.exit.x, maze.exit.y, NONE);
      this.px = this.homeX;
      this.py = this.homeY;
      this.angle = -Math.PI / 2;
    }
  }

  toEyes() {
    this.state = 'eyes';
    this.frightened = false;
    this.alert = 0;
  }

  update(dt, g) {
    const { maze, d } = g;
    this.anim += dt;
    if (this.alertCd > 0) this.alertCd -= dt;

    if (this.state === 'house') {
      this.py = this.homeY + Math.sin(this.anim * 5) * 0.2;
      if (g.time >= this.releaseAt) this.state = 'leaving';
      return;
    }
    if (this.state === 'leaving') {
      const speed = 2.6 * dt;
      if (Math.abs(this.px - maze.exit.x) > 0.01) {
        this.px += Math.sign(maze.exit.x - this.px) * Math.min(speed, Math.abs(maze.exit.x - this.px));
        this.py += (this.homeY - this.py) * Math.min(1, dt * 8);
      } else {
        this.px = maze.exit.x;
        this.py -= speed;
        this.angle = -Math.PI / 2;
        if (this.py <= maze.exit.y) {
          this.state = 'active';
          this.place(maze.exit.x, maze.exit.y, NONE);
          this.reverseQueued = false;
        }
      }
      return;
    }
    if (this.state === 'entering') {
      const speed = d.eyesSpeed * 0.6 * dt;
      this.py = Math.min(this.homeY, this.py + speed);
      if (this.py >= this.homeY - 0.01) {
        this.state = 'leaving';       // возродился — сразу на выход
        g.emit('revive', { enemy: this });
      }
      return;
    }

    // active или eyes — движение по клеткам
    if (this.reverseQueued) {
      this.reverseQueued = false;
      if (this.state === 'active') this.reverse(maze);
    }

    if (this.state === 'active' && !this.frightened) {
      if (this.role === 'patrol') this.watch(g);
      if (this.role === 'chaos') this.dropTraps(dt, g);
    }
    if (this.alert > 0) this.alert -= dt;

    let speed = d.enemySpeed;
    if (this.state === 'eyes') speed = d.eyesSpeed;
    else if (this.frightened) speed = d.frightSpeed;
    else if (this.role === 'hunter' && g.elroy) speed *= d.elroyBoost;
    else if (this.role === 'patrol' && this.alert > 0) speed *= d.patrolDash;
    if (this.state !== 'eyes' && maze.isTunnel(Math.round(this.x), Math.round(this.y))) {
      speed = Math.min(speed, d.tunnelSpeed);
    }

    let reachedHome = false;
    this.advance(maze, speed * dt, () => {
      if (this.state === 'eyes' && this.tx === maze.exit.x && this.ty === maze.exit.y) {
        reachedHome = true;
        return NONE;
      }
      return this.choose(g);
    });
    if (reachedHome) {
      this.state = 'entering';
      this.px = maze.exit.x;
      this.py = maze.exit.y;
    }
    this.turnTowards(this.dir, dt, 12);
  }

  // Патрульный: если видит героя по прямой — рывок.
  watch(g) {
    if (this.alert > 0 || this.alertCd > 0) return;
    const hx = g.heroTile.x, hy = g.heroTile.y;
    if (g.maze.lineOfSight(this.tx, this.ty, hx, hy, 9)) {
      this.alert = TIMING.alert;
      this.alertCd = TIMING.alert + TIMING.alertCooldown;
      g.emit('alert', { enemy: this });
    }
  }

  // Хаотик: время от времени оставляет ловушку.
  dropTraps(dt, g) {
    this.trapT += dt;
    if (this.trapT >= g.d.trapEvery && this.prog < 0.5) {
      this.trapT = 0;
      g.addTrap(this.tx, this.ty);
    }
  }

  // Выбор направления в центре клетки.
  choose(g) {
    const { maze } = g;
    const back = opposite(this.dir);
    let options = DIRS.filter(dir => this.canGo(maze, dir));
    const forward = options.filter(dir => dir !== back);
    if (forward.length) options = forward;
    if (options.length <= 1) return options[0] || NONE;

    if (this.state === 'eyes') return this.byMap(options, maze, maze.maps.exit);
    if (this.frightened) return options[Math.floor(Math.random() * options.length)];

    const scatter = g.mode === 'scatter';
    switch (this.role) {
      case 'hunter':
        return this.byMap(options, maze, scatter && !g.elroy ? maze.maps.topRight : g.heroMap);

      case 'interceptor': {
        if (scatter) return this.byMap(options, maze, maze.maps.topLeft);
        const h = g.heroTile, face = g.hero.face;
        const close = Math.abs(h.x - this.tx) + Math.abs(h.y - this.ty) < 4;
        if (close || !g.hero.moving) return this.byMap(options, maze, g.heroMap);
        return this.byPoint(options, h.x + face.x * 4, h.y + face.y * 4);
      }

      case 'patrol': {
        if (this.alert > 0) return this.byMap(options, maze, g.heroMap);
        const pts = maze.patrolPoints;
        if (this.tx === pts[this.waypoint].x && this.ty === pts[this.waypoint].y) {
          this.waypoint = (this.waypoint + 1) % pts.length;
        }
        return this.byMap(options, maze, maze.maps.patrol[this.waypoint]);
      }

      default: // chaos
        if (!scatter && Math.random() < 0.35) return this.byMap(options, maze, g.heroMap);
        return options[Math.floor(Math.random() * options.length)];
    }
  }

  byMap(options, maze, map) {
    let best = options[0], bestD = Infinity;
    for (const dir of options) {
      const v = maze.distAt(map, this.tx + dir.x, this.ty + dir.y);
      if (v < bestD) { bestD = v; best = dir; }
    }
    return best;
  }

  byPoint(options, px, py) {
    let best = options[0], bestD = Infinity;
    for (const dir of options) {
      const v = (this.tx + dir.x - px) ** 2 + (this.ty + dir.y - py) ** 2;
      if (v < bestD) { bestD = v; best = dir; }
    }
    return best;
  }
}

