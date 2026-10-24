/**
 * shapeshift/engine.js
 * Pure logic (no screen code) for Shape Shifter, the spatial puzzle game.
 *
 * Puzzle types:
 *   match (2D)  find the same flat shape, just turned around (mirror images are traps)
 *   fit   (2D)  turn (and flip) a piece until it fills the hole
 *   match (3D)  find the same cube object, just turned around (mirror images are traps)
 *
 * A 2D shape is a list of [x, y] cells, a 3D object is a list of [x, y, z] cubes.
 * "Turning" never changes a shape; "flipping" (mirror image) makes a different one
 * for most shapes. The generators guarantee exactly one correct answer.
 */
const ShapeEngine = (() => {
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rnd(0, a.length - 1)];
  const shuffle = a => a.sort(() => Math.random() - 0.5);
  const COLORS = ["#4c6ef5", "#f08c00", "#12b886", "#9c36b5", "#e03131", "#1c8ab8"];

  /* =============== 2D shapes =============== */
  const parse = rows => {
    const c = [];
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === "#") c.push([x, y]); }));
    return c;
  };
  const norm2 = cells => {
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  };
  const rot2 = cells => norm2(cells.map(([x, y]) => [-y, x]));       // 90° clockwise
  const flip2 = cells => norm2(cells.map(([x, y]) => [-x, y]));      // mirror image
  const key2 = cells => norm2(cells).map(c => c.join(",")).join(";");
  const turn2 = (cells, k) => { let c = norm2(cells); for (let i = 0; i < k; i++) c = rot2(c); return c; };
  function same2(a, b, flips) {                                       // equal after turning (and flipping)?
    const kb = key2(b);
    for (const f of flips ? [false, true] : [false]) {
      for (let r = 0; r < 4; r++) if (key2(turn2(f ? flip2(a) : a, r)) === kb) return true;
    }
    return false;
  }
  const chiral2 = c => !same2(c, flip2(c), false);                    // mirror image is a different shape
  const spin2 = c => new Set([0, 1, 2, 3].map(r => key2(turn2(c, r)))).size;   // 1, 2 or 4 different turns

  const TETRO = [["####"], ["##", "##"], ["###", ".#."], [".##", "##."], ["#.", "#.", "##"]].map(parse);
  const PENTO = [
    [".##", "##.", ".#."], ["#####"], ["#.", "#.", "#.", "##"], [".#", ".#", "##", "#."],
    ["##", "##", "#."], ["###", ".#.", ".#."], ["#.#", "###"], ["#..", "#..", "###"],
    ["#..", "##.", ".##"], [".#.", "###", ".#."], [".#", "##", ".#", ".#"], ["##.", ".#.", ".##"]
  ].map(parse);

  const HINTS = {
    match: "Turning a shape doesn’t change it. Compare how many blocks stick out and where.",
    mirror: "Careful: a flipped shape is a different shape. You may only turn it, not flip it.",
    fit: "Use the turn button to rotate the piece until it matches the hole.",
    fitflip: "You can turn AND flip this piece. Try the flip button too.",
    match3: "Imagine turning the whole object around. Don’t flip it. Count the cubes in each arm."
  };

  function match2(n, mirror) {
    const pool = n === 4 ? TETRO : PENTO;
    const base = pick(mirror ? pool.filter(chiral2) : pool);
    const target = turn2(base, rnd(0, 3));
    const wrong = [];
    if (mirror) wrong.push(turn2(flip2(base), rnd(0, 3)));            // the classic trap
    const others = shuffle(pool.filter(c => !same2(c, base, true)));
    for (let i = 0; wrong.length < 3; i++) wrong.push(turn2(others[i], rnd(0, 3)));
    const options = shuffle([{ cells: turn2(target, rnd(1, 3)), ok: true }].concat(wrong.map(c => ({ cells: c, ok: false }))));
    return { kind: "match", dim: 2, target, options, color: pick(COLORS), hint: mirror ? HINTS.mirror : HINTS.match,
             done: "Yes! It is the same shape, just turned around." };
  }

  function fit2(n, canFlip) {
    const pool = (n === 4 ? TETRO : PENTO).filter(c => spin2(c) > 1 && (!canFlip || chiral2(c)));
    const hole = turn2(pick(pool), rnd(0, 3));
    let piece;
    if (canFlip) {
      piece = turn2(flip2(hole), rnd(0, 3));                          // needs a flip to fit
    } else {
      do { piece = turn2(hole, rnd(1, 3)); } while (key2(piece) === key2(hole));
    }
    return { kind: "fit", dim: 2, hole, piece, canFlip, color: pick(COLORS),
             hint: canFlip ? HINTS.fitflip : HINTS.fit, done: "It fits! Great turning." };
  }
  const fits = (piece, hole) => key2(piece) === key2(hole);

  /* =============== 3D objects =============== */
  const norm3 = v => {
    const m = [0, 1, 2].map(i => Math.min(...v.map(c => c[i])));
    return v.map(c => c.map((x, i) => x - m[i])).sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0]);
  };
  const key3 = v => norm3(v).map(c => c.join(",")).join(";");
  const ROTS = [];                                                    // the 24 ways to turn a cube
  [[[0, 1, 2], 1], [[1, 2, 0], 1], [[2, 0, 1], 1], [[0, 2, 1], -1], [[1, 0, 2], -1], [[2, 1, 0], -1]].forEach(([p, par]) => {
    for (const s0 of [1, -1]) for (const s1 of [1, -1]) for (const s2 of [1, -1]) {
      if (par * s0 * s1 * s2 === 1) ROTS.push(c => [s0 * c[p[0]], s1 * c[p[1]], s2 * c[p[2]]]);
    }
  });
  const mirror3 = v => norm3(v.map(([x, y, z]) => [-x, y, z]));
  const zturn3 = (v, k) => { let c = norm3(v); for (let i = 0; i < k; i++) c = norm3(c.map(([x, y, z]) => [-y, x, z])); return c; };
  function same3(a, b) {                                              // equal after any turn?
    const kb = key3(b);
    return ROTS.some(R => key3(a.map(R)) === kb);
  }
  const dims3 = v => [0, 1, 2].map(i => Math.max(...v.map(c => c[i])) + 1);
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const cKey = c => c.join(",");

  function connected(cells) {
    const set = new Set(cells.map(cKey)), seen = new Set([cKey(cells[0])]), stack = [cells[0]];
    while (stack.length) {
      const c = stack.pop();
      for (const d of DIRS) {
        const nc = [c[0] + d[0], c[1] + d[1], c[2] + d[2]], k = cKey(nc);
        if (set.has(k) && !seen.has(k)) { seen.add(k); stack.push(nc); }
      }
    }
    return seen.size === cells.length;
  }

  function randomCubes(n) {                                           // a chiral, solid-looking object
    for (;;) {
      const map = new Map([["0,0,0", [0, 0, 0]]]);
      while (map.size < n) {
        const c = pick([...map.values()]), d = pick(DIRS), nc = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
        map.set(cKey(nc), nc);
      }
      const v = norm3([...map.values()]);
      if (dims3(v).every(d => d >= 2 && d <= 3) && !same3(v, mirror3(v))) return v;
    }
  }

  function modify(v) {                                                // move one cube somewhere else
    for (let t = 0; t < 40; t++) {
      const i = rnd(0, v.length - 1), rest = v.filter((_, j) => j !== i);
      if (!connected(rest)) continue;
      const free = [];
      rest.forEach(c => DIRS.forEach(d => {
        const nc = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
        if (!rest.some(r => cKey(r) === cKey(nc)) && cKey(nc) !== cKey(v[i])) free.push(nc);
      }));
      if (!free.length) continue;
      const m = norm3(rest.concat([pick(free)]));
      if (dims3(m).every(d => d <= 3) && !same3(m, v) && !same3(m, mirror3(v))) return m;
    }
    return null;
  }

  function match3(n) {
    const base = randomCubes(n), target = zturn3(base, rnd(0, 3));
    const wrong = [zturn3(mirror3(base), rnd(0, 3))];                // the classic trap
    while (wrong.length < 3) {
      const m = modify(base);
      if (m && !wrong.some(w => same3(w, m))) wrong.push(zturn3(m, rnd(0, 3)));
    }
    const options = shuffle([{ cells: zturn3(target, rnd(1, 3)), ok: true }].concat(wrong.map(c => ({ cells: c, ok: false }))));
    return { kind: "match", dim: 3, target, options, color: pick(COLORS), hint: HINTS.match3,
             done: "Yes! It is the same object, just turned around." };
  }

  /* =============== levels (10 stages each) =============== */
  const rep = (n, f) => Array.from({ length: n }, () => f);
  const LEVELS = [
    {
      id: "beginner", name: "Beginner", icon: "🌱", desc: "Turn flat shapes and fit pieces into holes",
      stages: [].concat(rep(3, () => match2(4, false)), rep(3, () => match2(5, false)),
                        rep(2, () => fit2(4, false)), rep(2, () => fit2(5, false)))
    },
    {
      id: "intermediate", name: "Intermediate", icon: "🚀", desc: "Spot flipped shapes and flip pieces to fit",
      stages: [].concat(rep(3, () => match2(4, true)), rep(2, () => match2(5, true)),
                        rep(3, () => fit2(4, true)), rep(2, () => fit2(5, true)))
    },
    {
      id: "expert", name: "Expert", icon: "👑", desc: "3D cube objects: which one is the same?",
      stages: [].concat(rep(4, () => match3(5)), rep(3, () => match3(6)), rep(3, () => match3(7)))
    }
  ];

  const maxFor = level => level.stages.length * 10;

  return { LEVELS, maxFor, fits, turn2, flip2, same2, same3, key2, key3, zturn3, mirror3 };
})();
