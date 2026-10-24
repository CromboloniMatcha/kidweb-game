/**
 * pattern/engine.js
 * Pure logic (no screen code) for Pattern Puzzle:
 *  - generators that build a random pattern (a "train") with a few hidden carriages
 *  - levels (10 stages each)
 *  - the pieces the player can choose from (correct ones + believable wrong ones)
 *
 * A puzzle looks like:
 *   { kind, items: [...], gaps: [indexes of hidden carriages], rule, hint, alts: [wrong pieces] }
 * An item is one of:
 *   { k: "s", shape, color, rot }   a coloured shape (drawn with CSS, no images)
 *   { k: "e", e }                   an emoji
 *   { k: "n", n }                   a number
 *   { k: "d", n, e }                a group of n emoji (a growing pattern)
 */
const PatternEngine = (() => {
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rnd(0, a.length - 1)];
  const shuffle = a => a.sort(() => Math.random() - 0.5);
  const sample = (a, n) => shuffle(a.slice()).slice(0, n);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  const COLORS = ["#4c6ef5", "#f08c00", "#12b886", "#9c36b5", "#fcc419", "#e03131"];
  const SHAPES = ["circle", "square", "triangle", "star", "diamond", "hexagon"];
  const EMOJI = [
    ["🐶", "🐱", "🐭", "🐸", "🐵"],
    ["🍌", "🍇", "🍓", "🍊", "🍉"],
    ["🚗", "🚌", "🚲", "🚀", "✈️"],
    ["🌞", "🌙", "⭐", "☁️", "🌈"]
  ];

  const sh = (shape, color, rot = 0) => ({ k: "s", shape, color, rot });
  const em = e => ({ k: "e", e });
  const nu = n => ({ k: "n", n });
  const dt = (n, e) => ({ k: "d", n, e });
  const key = it => [it.k, it.shape, it.color, it.rot, it.e, it.n].join("|");

  const HINTS = {
    cycle: "Look for the part that repeats.",
    num: "Look at how the numbers change from one carriage to the next.",
    two: "Colours and shapes may repeat at different speeds.",
    rot: "Watch which way the arrow turns each time.",
    grow: "Count how many more there are each time."
  };

  /* ---------- helpers ---------- */
  const gapsEnd = (len, g) => Array.from({ length: g }, (_, i) => len - g + i);
  function gapsMid(len, g, min) {                 // g hidden carriages that are not next to each other
    for (let t = 0; t < 60; t++) {
      const set = sample(range(min, len - 1), g).sort((a, b) => a - b);
      if (set.every((x, i) => i === 0 || x - set[i - 1] > 1)) return set;
    }
    return gapsEnd(len, g);
  }
  const gapsFor = (mode, len, g, min) => (mode === "mid" ? gapsMid(len, g, min) : gapsEnd(len, g));

  function make(kind, items, gaps, rule, alts) {
    return { kind, items, gaps, rule, hint: HINTS[kind], alts };
  }
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => (a * b) / gcd(a, b);

  /* wrong number pieces: close to the right answer(s) */
  function numAlts(vals, d) {
    const s = new Set(), step = d || 1;
    vals.forEach(v => [1, 2, 3, step, 2 * step].forEach(x => { s.add(v + x); s.add(v - x); }));
    return [...s].filter(x => x > 0).map(nu);
  }

  /* ---------- repeating patterns (cycles) ---------- */
  function cycleOf(unit, len) { return Array.from({ length: len }, (_, i) => unit[i % unit.length]); }

  function cycColor(L, len, g) {
    const shape = pick(SHAPES), colors = sample(COLORS, L);
    const unit = colors.map(c => sh(shape, c));
    const alts = unit.concat(COLORS.map(c => sh(shape, c)));
    return make("cycle", cycleOf(unit, len), gapsEnd(len, g), `The colours repeat every ${L} pieces.`, alts);
  }
  function cycShape(L, len, g) {
    const color = pick(COLORS), shapes = sample(SHAPES, L);
    const unit = shapes.map(s => sh(s, color));
    const alts = unit.concat(SHAPES.map(s => sh(s, color)));
    return make("cycle", cycleOf(unit, len), gapsEnd(len, g), `The shapes repeat every ${L} pieces.`, alts);
  }
  function cycEmoji(L, len, g) {
    const set = pick(EMOJI), unit = sample(set, L).map(em);
    const alts = unit.concat(set.map(em));
    return make("cycle", cycleOf(unit, len), gapsEnd(len, g), `The pictures repeat every ${L} pieces.`, alts);
  }
  function cycFull(L, len, g) {                    // colour and shape change together
    const colors = sample(COLORS, L), shapes = sample(SHAPES, L);
    const unit = colors.map((c, i) => sh(shapes[i], c));
    const alts = unit.slice();
    colors.forEach(c => shapes.forEach(s => alts.push(sh(s, c))));
    return make("cycle", cycleOf(unit, len), gapsEnd(len, g), `The same ${L} pieces repeat again and again.`, alts);
  }
  function numCycle(L, len, g) {
    const unit = sample(range(1, 9), L).map(nu);
    const alts = range(1, 9).map(nu);
    return make("cycle", cycleOf(unit, len), gapsEnd(len, g), `The same ${L} numbers repeat again and again.`, alts);
  }
  function twoAttr(colorL, shapeL, len, g, mode) {  // colours and shapes repeat at different speeds
    const cs = sample(COLORS, colorL), ss = sample(SHAPES, shapeL);
    const items = Array.from({ length: len }, (_, i) => sh(ss[i % shapeL], cs[i % colorL]));
    const alts = [];
    cs.forEach(c => ss.forEach(s => alts.push(sh(s, c))));
    const period = lcm(colorL, shapeL);
    return make("two", items, gapsFor(mode, len, g, period), `Colours repeat every ${colorL} and shapes every ${shapeL}, so the whole pattern repeats every ${period}.`, alts);
  }

  /* ---------- number patterns ---------- */
  function fromValues(vals, g, mode, min, rule, d) {
    const gaps = gapsFor(mode, vals.length, g, min);
    return make("num", vals.map(nu), gaps, rule, numAlts(gaps.map(i => vals[i]), d));
  }
  function arith(start, d, len, g, mode, down) {
    const vals = Array.from({ length: len }, (_, i) => (down ? start - d * i : start + d * i));
    return fromValues(vals, g, mode, 3, down ? `Subtract ${d} each time.` : `Add ${d} each time.`, d);
  }
  function geom(start, r, len, g) {
    const vals = Array.from({ length: len }, (_, i) => start * Math.pow(r, i));
    return fromValues(vals, g, "end", 2, `Multiply by ${r} each time.`, start);
  }
  function squares(n0, len, g, mode) {
    const vals = Array.from({ length: len }, (_, i) => Math.pow(n0 + i, 2));
    return fromValues(vals, g, mode, 3, "These are square numbers: 1×1, 2×2, 3×3 and so on.", 2);
  }
  function alt2(start, a, b, len, g) {
    const vals = [start];
    for (let i = 1; i < len; i++) vals.push(vals[i - 1] + (i % 2 === 1 ? a : b));
    return fromValues(vals, g, "end", 2, `Add ${a}, then add ${b}, and repeat.`, a);
  }
  function fib(a, b, len, g) {
    const vals = [a, b];
    for (let i = 2; i < len; i++) vals.push(vals[i - 1] + vals[i - 2]);
    return fromValues(vals, g, "end", 2, "Add the two numbers before it.", a);
  }
  function growDiff(start, len, g) {
    const vals = [start];
    for (let i = 1; i < len; i++) vals.push(vals[i - 1] + i);
    return fromValues(vals, g, "end", 2, "The jump grows each time: +1, +2, +3 and so on.", 1);
  }
  function primes(len, g) {
    const vals = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29].slice(0, len);
    return fromValues(vals, g, "end", 2, "These are prime numbers: they can only be divided by 1 and by themselves.", 2);
  }
  function altOps(start, add, mul, len, g) {
    const vals = [start];
    for (let i = 1; i < len; i++) vals.push(i % 2 === 1 ? vals[i - 1] + add : vals[i - 1] * mul);
    return fromValues(vals, g, "end", 2, `Add ${add}, then multiply by ${mul}, and repeat.`, add);
  }
  function interleave(a0, da, b0, db, len, g) {
    const vals = Array.from({ length: len }, (_, i) => (i % 2 === 0 ? a0 + da * (i / 2) : b0 + db * ((i - 1) / 2)));
    return fromValues(vals, g, "end", 4, `Two patterns take turns: one goes up by ${da}, the other by ${db}.`, db);
  }

  /* ---------- picture patterns that grow or turn ---------- */
  function growth(start, step, len, g) {
    const e = pick(["🔵", "⭐", "🍓", "🌸"]);
    const vals = Array.from({ length: len }, (_, i) => start + step * i);
    const gaps = gapsEnd(len, g);
    const alts = range(1, 8).map(n => dt(n, e));
    return make("grow", vals.map(n => dt(n, e)), gaps, `Each carriage has ${step} more than the one before.`, alts);
  }
  function rotate(step, len, g, mode) {
    const color = pick(COLORS), start = pick([0, 90, 180, 270]);
    const items = Array.from({ length: len }, (_, i) => sh("arrow", color, (start + step * i) % 360));
    const alts = range(0, 7).map(k => sh("arrow", color, k * 45));
    return make("rot", items, gapsFor(mode, len, g, 3), `The arrow turns ${step}° clockwise each time.`, alts);
  }

  /* ---------- levels (10 stages each) ---------- */
  const LEVELS = [
    {
      id: "beginner", name: "Beginner", icon: "🌱", desc: "Colours, shapes and easy number patterns",
      stages: [
        () => cycColor(2, 6, 1), () => cycShape(2, 6, 1), () => cycEmoji(2, 6, 1),
        () => cycColor(3, 7, 1), () => cycShape(3, 7, 1), () => cycEmoji(3, 8, 2),
        () => arith(rnd(1, 5), pick([1, 2]), 6, 1), () => arith(rnd(1, 10), pick([2, 3, 5]), 6, 2),
        () => cycFull(3, 7, 2), () => cycColor(4, 8, 2)
      ]
    },
    {
      id: "intermediate", name: "Intermediate", icon: "🚀", desc: "Number rules, growing and turning patterns",
      stages: [
        () => arith(rnd(1, 10), rnd(2, 5), 6, 1), () => arith(rnd(5, 20), rnd(3, 9), 6, 2),
        () => { const d = rnd(2, 6); return arith(rnd(d * 6 + 3, 60), d, 6, 1, "end", true); },
        () => arith(rnd(5, 25), rnd(4, 9), 7, 2, "mid"), () => twoAttr(2, 3, 8, 2),
        () => growth(1, 1, 5, 1), () => geom(rnd(1, 3), 2, 5, 1),
        () => numCycle(3, 8, 2), () => rotate(90, 6, 1, "end"),
        () => arith(rnd(10, 40), rnd(7, 12), 7, 2, "mid")
      ]
    },
    {
      id: "expert", name: "Expert", icon: "👑", desc: "Tricky rules: two steps, squares, primes and more",
      stages: [
        () => geom(rnd(1, 2), 3, 5, 1), () => alt2(rnd(1, 5), pick([2, 3]), pick([5, 6, 7]), 8, 2),
        () => squares(rnd(1, 3), 6, 2, "mid"), () => { const s = pick([[1, 1], [1, 2], [2, 1], [2, 3]]); return fib(s[0], s[1], 7, 2); },
        () => growDiff(rnd(1, 5), 7, 2), () => twoAttr(3, 2, 9, 2),
        () => rotate(90, 7, 2, "mid"), () => primes(7, 2),
        () => altOps(rnd(1, 3), 3, 2, 7, 2), () => interleave(1, 1, 10, 10, 8, 2)
      ]
    }
  ];

  /* ---------- answer pieces ---------- */
  /** The pieces to choose from: every correct piece plus believable wrong ones. */
  function palette(p, size = 5) {
    const out = [];
    p.gaps.forEach(i => { if (!out.some(o => key(o) === key(p.items[i]))) out.push(p.items[i]); });
    const correct = new Set(out.map(key));
    for (const a of shuffle(p.alts.slice())) {
      if (out.length >= size) break;
      if (correct.has(key(a)) || out.some(o => key(o) === key(a))) continue;
      out.push(a);
    }
    return shuffle(out);
  }

  /** Highest possible score of a level (10 points per hidden carriage). */
  function maxFor(level) {
    return level.stages.reduce((n, make) => n + make().gaps.length * 10, 0);
  }

  return { LEVELS, palette, maxFor, key };
})();
