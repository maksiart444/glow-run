// Лабиринт: читает карту из текста, хранит стены и точки, ищет пути.
//
// Карта рисуется символами. Пишется только левая половина (10 символов),
// правая получается зеркально — так лабиринт всегда симметричный.
//   #  стена            .  точка            o  большой бонус
//   t  туннель          P  старт героя      E  выход из дома врагов
//   -  дверь дома       H  дом врагов       *  место бонусного предмета

export const OPEN = 0, WALL = 1, DOOR = 2, HOUSE = 3;

export const UP = { x: 0, y: -1, name: 'up' };
export const DOWN = { x: 0, y: 1, name: 'down' };
export const LEFT = { x: -1, y: 0, name: 'left' };
export const RIGHT = { x: 1, y: 0, name: 'right' };
export const NONE = { x: 0, y: 0, name: 'none' };
export const DIRS = [UP, LEFT, DOWN, RIGHT]; // порядок важен: при равенстве враг выберет первый

export function opposite(d) {
  if (d === UP) return DOWN;
  if (d === DOWN) return UP;
  if (d === LEFT) return RIGHT;
  if (d === RIGHT) return LEFT;
  return NONE;
}

const FAR = 30000;

export class Maze {
  constructor(leftHalf) {
    const rows = leftHalf.map(r => r + [...r.slice(0, 9)].reverse().join(''));
    this.w = rows[0].length;
    this.h = rows.length;
    const n = this.w * this.h;
    this.cells = new Uint8Array(n);
    this.startDots = new Uint8Array(n);
    this.tunnel = new Uint8Array(n);
    this.houseTiles = [];

    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const i = y * this.w + x;
        if (ch === '#') this.cells[i] = WALL;
        else if (ch === '-') { this.cells[i] = DOOR; this.door = { x, y }; }
        else if (ch === 'H') { this.cells[i] = HOUSE; this.houseTiles.push({ x, y }); }
        else if (ch === '.') this.startDots[i] = 1;
        else if (ch === 'o') this.startDots[i] = 2;
        else if (ch === 't') this.tunnel[i] = 1;
        else if (ch === 'P') this.heroStart = { x, y };
        else if (ch === 'E') this.exit = { x, y };
        else if (ch === '*') this.itemSpot = { x, y };
      });
    });

    const hx = this.houseTiles.map(t => t.x), hy = this.houseTiles.map(t => t.y);
    this.house = {
      x: (Math.min(...hx) + Math.max(...hx)) / 2,
      y: (Math.min(...hy) + Math.max(...hy)) / 2,
    };
    this.totalDots = this.startDots.reduce((s, v) => s + (v ? 1 : 0), 0);
    this.dots = new Uint8Array(this.startDots);

    // Карты расстояний до важных мест считаем один раз — стены не меняются.
    const near = (fx, fy) => this.nearestOpen(fx * (this.w - 1), fy * (this.h - 1));
    this.corners = { topLeft: near(0, 0), topRight: near(1, 0) };
    this.patrolPoints = [near(0.1, 0.75), near(0.5, 1), near(0.9, 0.75), near(0.5, 0.6)];
    this.maps = {
      exit: this.bfs(this.exit.x, this.exit.y),
      topLeft: this.bfs(this.corners.topLeft.x, this.corners.topLeft.y),
      topRight: this.bfs(this.corners.topRight.x, this.corners.topRight.y),
      patrol: this.patrolPoints.map(p => this.bfs(p.x, p.y)),
    };
  }

  resetDots() { this.dots.set(this.startDots); }

  idx(x, y) { return y * this.w + x; }

  // Выход за край поля переносит на другую сторону (туннели).
  wrapX(x) { return ((x % this.w) + this.w) % this.w; }
  wrapY(y) { return ((y % this.h) + this.h) % this.h; }

  cell(x, y) { return this.cells[this.idx(this.wrapX(x), this.wrapY(y))]; }
  isOpen(x, y) { return this.cell(x, y) === OPEN; }
  isWall(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.cells[this.idx(x, y)] === WALL;
  }
  isTunnel(x, y) { return this.tunnel[this.idx(this.wrapX(x), this.wrapY(y))] === 1; }

  // Поиск в ширину: для каждой клетки — сколько шагов до (sx, sy).
  bfs(sx, sy) {
    const dist = new Int16Array(this.w * this.h).fill(FAR);
    const queue = new Int16Array(this.w * this.h * 2);
    let head = 0, tail = 0;
    dist[this.idx(sx, sy)] = 0;
    queue[tail++] = sx; queue[tail++] = sy;
    while (head < tail) {
      const x = queue[head++], y = queue[head++];
      const d = dist[this.idx(x, y)] + 1;
      for (const dir of DIRS) {
        const nx = this.wrapX(x + dir.x), ny = this.wrapY(y + dir.y);
        const i = this.idx(nx, ny);
        if (this.cells[i] === OPEN && dist[i] > d) {
          dist[i] = d;
          queue[tail++] = nx; queue[tail++] = ny;
        }
      }
    }
    return dist;
  }

  distAt(map, x, y) { return map[this.idx(this.wrapX(x), this.wrapY(y))]; }

  nearestOpen(fx, fy) {
    let best = null, bestD = Infinity;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.cells[this.idx(x, y)] !== OPEN || this.tunnel[this.idx(x, y)]) continue;
        const d = (x - fx) ** 2 + (y - fy) ** 2;
        if (d < bestD) { bestD = d; best = { x, y }; }
      }
    }
    return best;
  }

  // Видит ли (ax, ay) клетку (bx, by) по прямой без стен.
  lineOfSight(ax, ay, bx, by, max) {
    if (ax === bx && Math.abs(ay - by) <= max) {
      const s = Math.sign(by - ay);
      for (let y = ay; y !== by; y += s) if (!this.isOpen(ax, y)) return false;
      return true;
    }
    if (ay === by && Math.abs(ax - bx) <= max) {
      const s = Math.sign(bx - ax);
      for (let x = ax; x !== bx; x += s) if (!this.isOpen(x, ay)) return false;
      return true;
    }
    return false;
  }
}
