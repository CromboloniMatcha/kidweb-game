/**
 * mix/engine.js
 * Pure logic (no screen code) for Mix Master, the mixed-practice maths game (Hard list).
 *
 * Why it is built this way (practice research):
 *   - mixed topics (interleaving): problems from different topics are shuffled together,
 *     never the same topic twice in a row, and the topic is hidden until you answer
 *   - answers are typed, not picked from a list (retrieval practice)
 *   - missed topics come back later with NEW numbers (spaced review)
 *
 * Each topic has gen() that returns a fresh problem:
 *   { q: question (HTML), a: exact answer, tol: allowed error, shown: answer text,
 *     sol: short worked solution (HTML), p: the numbers used (for testing) }
 * Every answer is a number (integers where possible), so the checker is simple.
 */
const MixEngine = (() => {
  const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[r(0, a.length - 1)];
  const shuffle = a => a.sort(() => Math.random() - 0.5);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const ab = Math.abs;

  /* ---------- text helpers ---------- */
  const sup = n => `<sup>${n}</sup>`;
  const sub = n => `<sub>${n}</sub>`;
  const num = n => String(n).replace("-", "−");
  const paren = n => (n < 0 ? `(${num(n)})` : String(n));
  const sg = n => (n < 0 ? "−" : "+");
  const co = (a, v) => (ab(a) === 1 ? "" : ab(a)) + v;                         // 3x, x
  const lt = (a, v, first) => (first ? (a < 0 ? "−" : "") + co(a, v) : ` ${sg(a)} ${co(a, v)}`);
  const cst = n => ` ${sg(n)} ${ab(n)}`;                                        // " + 5", " − 5"
  const mat = M => `<span class="mat" style="--c:${M[0].length}">${M.flat().map(v => `<i>${num(v)}</i>`).join("")}</span>`;
  const C = (n, k) => { let v = 1; for (let i = 1; i <= k; i++) v = v * (n - k + i) / i; return Math.round(v); };
  const neg = () => (Math.random() < 0.3 ? -1 : 1);

  /* ---------- Level 1: high school ---------- */
  const TRI = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [20, 21, 29]];
  const L1 = [
    { name: "Linear equations", hint: "Undo the addition or subtraction first, then divide.", gen() {
        const x = r(-9, 12), a = r(2, 9), b = r(-15, 20) || 7, c = a * x + b;
        return { q: `Solve for x: ${a}x${cst(b)} = ${num(c)}`, a: x,
                 sol: `Move ${num(b)} to the other side: ${a}x = ${num(c)} − ${paren(b)} = ${num(c - b)}. Divide by ${a}: x = ${num(x)}.`, p: { a, b, c, x } };
    } },
    { name: "Percentages", hint: "Turn the percent into a fraction of 100 first.", gen() {
        const pc = pick([10, 15, 20, 25, 30, 40, 50, 60, 75]), N = 20 * r(2, 30);
        if (Math.random() < 0.5) {
          const a = pc * N / 100;
          return { q: `What is ${pc}% of ${N}?`, a, sol: `${pc}% = ${pc}/100, so ${N} × ${pc} ÷ 100 = ${a}.`, p: { mode: "of", pc, N } };
        }
        const a = N * (100 - pc) / 100;
        return { q: `A jacket costs $${N}. After a ${pc}% discount, what is the new price in $?`, a,
                 sol: `You pay ${100 - pc}% of the price: ${N} × ${100 - pc} ÷ 100 = ${a}.`, p: { mode: "disc", pc, N } };
    } },
    { name: "Pythagoras", hint: "In a right triangle, a² + b² = c², where c is the hypotenuse.", gen() {
        const [a, b, c] = pick(TRI);
        if (Math.random() < 0.5) {
          return { q: `A right triangle has legs ${a} and ${b}. How long is the hypotenuse?`, a: c,
                   sol: `${a}${sup(2)} + ${b}${sup(2)} = ${a * a} + ${b * b} = ${c * c}, and √${c * c} = ${c}.`, p: { a, b, c, mode: "hyp" } };
        }
        return { q: `A right triangle has hypotenuse ${c} and one leg ${a}. How long is the other leg?`, a: b,
                 sol: `${c}${sup(2)} − ${a}${sup(2)} = ${c * c} − ${a * a} = ${b * b}, and √${b * b} = ${b}.`, p: { a, b, c, mode: "leg" } };
    } },
    { name: "Exponent rules", hint: "Add the exponents when multiplying, subtract them when dividing.", gen() {
        const base = pick([2, 3, 5, 10]), m = r(2, 4), n = r(2, 4), e = r(1, Math.min(5, m + n - 1)), k = m + n - e, val = Math.pow(base, e);
        return { q: `Evaluate ${base}${sup(m)} × ${base}${sup(n)} ÷ ${base}${sup(k)}`, a: val,
                 sol: `Multiplying adds exponents: ${m} + ${n} = ${m + n}. Dividing subtracts: ${m + n} − ${k} = ${e}. So ${base}${sup(e)} = ${val}.`, p: { base, m, n, k } };
    } },
    { name: "Slope of a line", hint: "Slope = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁).", gen() {
        const m = r(-5, 6) || 2, dx = r(1, 5), x1 = r(-5, 5), y1 = r(-6, 6), x2 = x1 + dx, y2 = y1 + m * dx;
        return { q: `Find the slope of the line through (${num(x1)}, ${num(y1)}) and (${num(x2)}, ${num(y2)}).`, a: m,
                 sol: `slope = (y₂ − y₁) ÷ (x₂ − x₁) = (${num(y2 - y1)}) ÷ (${dx}) = ${num(m)}.`, p: { x1, y1, x2, y2, m } };
    } },
    { name: "Area and volume", hint: "Box: V = length × width × height. Triangle: A = ½ × base × height.", gen() {
        if (Math.random() < 0.5) {
          const l = r(2, 9), w = r(2, 9), h = r(2, 9);
          return { q: `A box is ${l} cm long, ${w} cm wide and ${h} cm tall. What is its volume in cm${sup(3)}?`, a: l * w * h,
                   sol: `Volume = length × width × height = ${l} × ${w} × ${h} = ${l * w * h}.`, p: { mode: "box", l, w, h } };
        }
        const b = 2 * r(2, 9), h = r(3, 12);
        return { q: `A triangle has base ${b} cm and height ${h} cm. What is its area in cm${sup(2)}?`, a: b * h / 2,
                 sol: `Area = ½ × base × height = ½ × ${b} × ${h} = ${b * h / 2}.`, p: { mode: "tri", b, h } };
    } },
    { name: "Mean", hint: "Add all the values, then divide by how many there are.", gen() {
        const m = r(22, 40), d = [r(-5, 5), r(-5, 5), r(-5, 5), r(-5, 5)];
        d.push(-d.reduce((s, x) => s + x, 0));
        const vals = shuffle(d.map(x => m + x)), s = vals.reduce((x, y) => x + y, 0);
        return { q: `Find the mean of: ${vals.join(", ")}.`, a: m,
                 sol: `Add them: ${vals.join(" + ")} = ${s}. Divide by 5: ${s} ÷ 5 = ${m}.`, p: { vals, m } };
    } },
    { name: "Probability", hint: "Probability = favourable outcomes ÷ all outcomes. Multiply by 100 for a percent.", gen() {
        const T = pick([10, 20, 25, 50]), R = r(1, T - 1), B = T - R, pc = 100 * R / T;
        return { q: `A bag has ${R} red and ${B} blue marbles. What is the probability (in %) of picking a red marble at random?`, a: pc,
                 sol: `${R} red out of ${T} marbles: ${R} ÷ ${T} = ${+(R / T).toFixed(2)}, which is ${pc}%.`, p: { R, T, pc } };
    } }
  ];

  /* ---------- Level 2: college prep ---------- */
  const TT = [["sin 30°", 0.5], ["cos 60°", 0.5], ["tan 45°", 1], ["sin 90°", 1], ["cos 180°", -1],
              ["sin 150°", 0.5], ["cos 120°", -0.5], ["tan 135°", -1], ["sin 270°", -1], ["cos 0°", 1]];
  const L2 = [
    { name: "Quadratic equations", hint: "Try to factor it into (x − p)(x − q) = 0.", gen() {
        let p, q;
        do { p = r(-8, 8); q = r(-8, 8); } while (!p || !q || p === q || p + q === 0);
        const b = -(p + q), c = p * q, big = Math.max(p, q);
        return { q: `Solve x²${lt(b, "x")}${cst(c)} = 0. What is the larger root?`, a: big,
                 sol: `Factor: (x${cst(-p)})(x${cst(-q)}) = 0, so x = ${num(p)} or x = ${num(q)}. The larger root is ${num(big)}.`, p: { p, q, b, c } };
    } },
    { name: "Systems of equations", hint: "Use elimination: make one variable cancel when you add or subtract the equations.", gen() {
        const x = r(-6, 9), y = r(-6, 9);
        let a1, b1, a2, b2, D;
        do { a1 = r(-3, 4) || 1; b1 = r(-3, 4) || 1; a2 = r(-3, 4) || 1; b2 = r(-3, 4) || 1; D = a1 * b2 - a2 * b1; } while (D === 0);
        const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y, askX = Math.random() < 0.5;
        return { q: `Solve the system: ${lt(a1, "x", true)}${lt(b1, "y")} = ${num(c1)} and ${lt(a2, "x", true)}${lt(b2, "y")} = ${num(c2)}. What is ${askX ? "x" : "y"}?`,
                 a: askX ? x : y,
                 sol: `The determinant is D = ${paren(a1)}·${paren(b2)} − ${paren(a2)}·${paren(b1)} = ${num(D)}. Then x = (${num(c1)}·${paren(b2)} − ${num(c2)}·${paren(b1)}) ÷ ${paren(D)} = ${num(x)} and y = (${paren(a1)}·${num(c2)} − ${paren(a2)}·${num(c1)}) ÷ ${paren(D)} = ${num(y)}.`,
                 p: { a1, b1, c1, a2, b2, c2, x, y, askX } };
    } },
    { name: "Logarithms", hint: "log_b(N) asks: which power of b gives N?", gen() {
        const m = r(0, 3);
        if (m === 0) { const k = r(3, 9); return { q: `Evaluate log${sub(2)}(${Math.pow(2, k)}).`, a: k, sol: `2${sup(k)} = ${Math.pow(2, k)}, so log₂(${Math.pow(2, k)}) = ${k}.`, p: { b: 2, k } }; }
        if (m === 1) { const k = r(2, 5); return { q: `Evaluate log${sub(3)}(${Math.pow(3, k)}).`, a: k, sol: `3${sup(k)} = ${Math.pow(3, k)}, so log₃(${Math.pow(3, k)}) = ${k}.`, p: { b: 3, k } }; }
        if (m === 2) {
          const k = r(-3, 4) || 2, vs = k >= 0 ? String(Math.pow(10, k)) : "0." + "0".repeat(-k - 1) + "1";
          return { q: `Evaluate log${sub(10)}(${vs}).`, a: k, sol: `10${sup(num(k))} = ${vs}, so the answer is ${num(k)}.`, p: { b: 10, k } };
        }
        const b = pick([2, 3, 5]), k = r(3, 6);
        return { q: `Solve ${b}${sup("x")} = ${Math.pow(b, k)}. What is x?`, a: k, sol: `${b}${sup(k)} = ${Math.pow(b, k)}, so x = ${k}.`, p: { b, k } };
    } },
    { name: "Trigonometry", hint: "Recall the exact values of sin, cos and tan at 0°, 30°, 45°, 60°, 90°, then use the quadrant.", gen() {
        const [t1, v1] = pick(TT);
        let t2, v2;
        do { [t2, v2] = pick(TT); } while (t2 === t1);
        const op = pick(["+", "−", "×"]), res = +(op === "+" ? v1 + v2 : op === "−" ? v1 - v2 : v1 * v2).toFixed(2);
        return { q: `Evaluate (give a decimal): ${t1} ${op} ${t2}`, a: res, tol: 0.01,
                 sol: `${t1} = ${num(v1)} and ${t2} = ${num(v2)}, so ${num(v1)} ${op} ${paren(v2)} = ${num(res)}.`, p: { t1, t2, v1, v2, op } };
    } },
    { name: "Arithmetic series", hint: "Sum of n terms = n ÷ 2 × (2a + (n − 1)d).", gen() {
        const a = r(2, 9), d = r(2, 7), n = r(8, 20), S = n * (2 * a + (n - 1) * d) / 2;
        return { q: `Find the sum of the first ${n} terms of the sequence ${a}, ${a + d}, ${a + 2 * d}, …`, a: S,
                 sol: `First term ${a}, difference ${d}. Sum = n/2 × (2a + (n − 1)d) = ${n}/2 × (${2 * a} + ${(n - 1) * d}) = ${S}.`, p: { a, d, n, S } };
    } },
    { name: "Combinations", hint: "Order does not matter, so use C(n, k) = n! ÷ (k! × (n − k)!).", gen() {
        const n = r(5, 10), k = r(2, 4), v = C(n, k);
        return { q: `In how many ways can you choose ${k} students from a group of ${n}? (The order does not matter.)`, a: v,
                 sol: `C(${n},${k}) = ${n}! ÷ (${k}! × ${n - k}!) = ${v}.`, p: { n, k, v } };
    } },
    { name: "Derivatives", hint: "Power rule: the derivative of axⁿ is n·a·xⁿ⁻¹.", gen() {
        const a = r(1, 5) * neg(), b = r(-8, 8), c = r(-9, 9) || 4, k = r(-3, 4), ans = 2 * a * k + b;
        return { q: `f(x) = ${lt(a, "x²", true)}${b ? lt(b, "x") : ""}${cst(c)}. Find f′(${num(k)}).`, a: ans,
                 sol: `f′(x) = ${num(2 * a)}x${b ? cst(b) : ""}. At x = ${num(k)}: ${num(2 * a)}·${paren(k)}${b ? cst(b) : ""} = ${num(ans)}.`, p: { a, b, c, k, ans } };
    } },
    { name: "Exponential growth", hint: "Count how many doublings (or halvings) happen, then use powers of 2.", gen() {
        const t = r(2, 6), m = r(2, 5);
        if (Math.random() < 0.5) {
          const N0 = r(2, 20) * 5, ans = N0 * Math.pow(2, m);
          return { q: `A culture starts with ${N0} bacteria and doubles every ${t} hours. How many bacteria are there after ${t * m} hours?`, a: ans,
                   sol: `${t * m} hours is ${m} doublings: ${N0} × 2${sup(m)} = ${ans}.`, p: { mode: "dbl", N0, m } };
        }
        const N0 = Math.pow(2, m) * r(1, 10), ans = N0 / Math.pow(2, m);
        return { q: `A sample of ${N0} mg halves every ${t} days. How many mg remain after ${t * m} days?`, a: ans,
                 sol: `${t * m} days is ${m} halvings: ${N0} ÷ 2${sup(m)} = ${ans}.`, p: { mode: "half", N0, m } };
    } }
  ];

  /* ---------- Level 3: university ---------- */
  const L3 = [
    { name: "Definite integrals", hint: "Find the antiderivative, then evaluate at the top limit minus the bottom limit.", gen() {
        const a = 3 * r(1, 4) * neg(), b = 2 * r(1, 5) * neg(), k = r(1, 4), ans = a * k ** 3 / 3 + b * k ** 2 / 2;
        return { q: `Evaluate ∫<sub>0</sub><sup>${k}</sup> (${lt(a, "x²", true)}${lt(b, "x")}) dx`, a: ans,
                 sol: `The antiderivative is ${lt(a / 3, "x³", true)}${lt(b / 2, "x²")}. At x = ${k}: ${num(a / 3)}·${k ** 3} ${sg(b / 2)} ${ab(b / 2)}·${k ** 2} = ${num(ans)}. At 0 it is 0.`, p: { a, b, k, ans } };
    } },
    { name: "Chain rule", hint: "Differentiate the outside, keep the inside, then multiply by the derivative of the inside.", gen() {
        const n = r(2, 4), a = r(1, 4) * neg(), x0 = r(-2, 3), u = r(-3, 3) || 2, b = u - a * x0, ans = n * a * Math.pow(u, n - 1);
        const inner = `${lt(a, "x", true)}${b ? cst(b) : ""}`;
        return { q: `f(x) = (${inner})${sup(n)}. Find f′(${num(x0)}).`, a: ans,
                 sol: `Chain rule: f′(x) = ${n}·${paren(a)}·(${inner})${sup(n - 1)}. At x = ${num(x0)} the bracket equals ${num(u)}, so f′ = ${n}·${paren(a)}·${paren(u)}${sup(n - 1)} = ${num(ans)}.`, p: { n, a, b, x0, ans } };
    } },
    { name: "3×3 determinants", hint: "Expand along the first row, using 2×2 determinants and alternating signs.", gen() {
        const M = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => r(-3, 4)));
        const [[a, b, c], [d, e, f], [g, h, i]] = M;
        const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
        return { q: `Find the determinant of ${mat(M)}`, a: det,
                 sol: `Expand along the first row: ${paren(a)}(${paren(e)}·${paren(i)} − ${paren(f)}·${paren(h)}) − ${paren(b)}(${paren(d)}·${paren(i)} − ${paren(f)}·${paren(g)}) + ${paren(c)}(${paren(d)}·${paren(h)} − ${paren(e)}·${paren(g)}) = ${num(det)}.`, p: { M, det } };
    } },
    { name: "Eigenvalues", hint: "Eigenvalues solve λ² − (trace)λ + (determinant) = 0.", gen() {
        let l1, l2, s, t;
        do { l1 = r(-4, 6); l2 = r(-4, 6); } while (l1 <= l2);
        do { s = r(-2, 2); t = r(-2, 2); } while (!s && !t);
        const M11 = l1 * (1 + s * t) - s * t * l2, M12 = s * (l2 - l1), M21 = t * (1 + s * t) * (l1 - l2), M22 = (1 + s * t) * l2 - s * t * l1;
        const tr = M11 + M22, det = M11 * M22 - M12 * M21;
        return { q: `Find the larger eigenvalue of ${mat([[M11, M12], [M21, M22]])}`, a: l1,
                 sol: `Trace = ${num(tr)} and determinant = ${num(det)}. Solve λ² − (${num(tr)})λ + (${num(det)}) = 0, which gives λ = ${num(l1)} or ${num(l2)}. The larger one is ${num(l1)}.`,
                 p: { M: [[M11, M12], [M21, M22]], l1, l2 } };
    } },
    { name: "Limits", hint: "Factor and cancel, use sin(u)/u → 1, or divide by the highest power of x.", gen() {
        const m = r(0, 2);
        if (m === 0) {
          const a = r(-5, 6) || 3;
          return { q: `Find lim<sub>x→${num(a)}</sub> (x² − ${a * a}) ÷ (x ${sg(-a)} ${ab(a)})`, a: 2 * a,
                   sol: `x² − ${a * a} = (x − ${paren(a)})(x ${sg(a)} ${ab(a)}). Cancel the common factor to get x ${sg(a)} ${ab(a)}; at x = ${num(a)} that is ${num(2 * a)}.`, p: { mode: "fac", a } };
        }
        if (m === 1) {
          const k = r(2, 9);
          return { q: `Find lim<sub>x→0</sub> sin(${k}x) ÷ x`, a: k,
                   sol: `sin(${k}x) ÷ x = ${k} · sin(${k}x) ÷ (${k}x). Since sin(u) ÷ u → 1, the limit is ${k}.`, p: { mode: "sin", k } };
        }
        const c = r(1, 4), A = c * r(1, 5) * neg(), b = r(-5, 5), d = r(1, 9);
        return { q: `Find lim<sub>x→∞</sub> (${lt(A, "x²", true)}${b ? lt(b, "x") : ""}) ÷ (${c === 1 ? "" : c}x² + ${d})`, a: A / c,
                 sol: `Divide top and bottom by x². The lower-order terms vanish as x → ∞, leaving ${num(A)} ÷ ${c} = ${num(A / c)}.`, p: { mode: "inf", A, b, c, d } };
    } },
    { name: "Dot products", hint: "Multiply matching components, then add: u·v = u₁v₁ + u₂v₂ + u₃v₃.", gen() {
        const u = [r(-4, 5), r(-4, 5), r(-4, 5)], v = [r(-4, 5), r(-4, 5), r(-4, 5)], ans = u.reduce((s, x, i) => s + x * v[i], 0);
        return { q: `Find u · v for u = (${u.map(num).join(", ")}) and v = (${v.map(num).join(", ")}).`, a: ans,
                 sol: `${paren(u[0])}·${paren(v[0])} + ${paren(u[1])}·${paren(v[1])} + ${paren(u[2])}·${paren(v[2])} = ${num(ans)}.`, p: { u, v, ans } };
    } },
    { name: "Binomial probability", hint: "P(k heads in n tosses) = C(n, k) × (½)ⁿ for a fair coin.", gen() {
        const n = r(3, 6), k = r(1, n - 1), exact = C(n, k) / Math.pow(2, n), shown = String(+exact.toFixed(3));
        return { q: `A fair coin is tossed ${n} times. What is the probability of exactly ${k} heads? (Give a decimal, 3 places.)`, a: exact, tol: 0.001, shown,
                 sol: `C(${n},${k}) × (½)${sup(n)} = ${C(n, k)} ÷ ${Math.pow(2, n)} = ${shown}.`, p: { n, k, exact } };
    } },
    { name: "Geometric series", hint: "An infinite geometric series with |r| < 1 has sum a ÷ (1 − r).", gen() {
        const [nu, de] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]), kk = r(1, 5), a = kk * (de - nu), ans = kk * de;
        return { q: `An infinite geometric series has first term ${a} and common ratio ${nu}/${de}. Find its sum.`, a: ans,
                 sol: `Sum = a ÷ (1 − r) = ${a} ÷ (${de - nu}/${de}) = ${a} × ${de}/${de - nu} = ${ans}.`, p: { a, nu, de, ans } };
    } }
  ];

  const LEVELS = [
    { id: "beginner", name: "Beginner", icon: "🌱", desc: "High school basics, all mixed together", topics: L1 },
    { id: "intermediate", name: "Intermediate", icon: "🚀", desc: "College-prep algebra, trig and calculus starters", topics: L2 },
    { id: "expert", name: "Expert", icon: "👑", desc: "University calculus and linear algebra", topics: L3 }
  ];

  /* ---------- planning, checking ---------- */
  /** 10 topic numbers in a mixed order, never the same topic twice in a row. */
  function plan(level, len = 10) {
    const n = level.topics.length;
    for (;;) {
      const seq = shuffle(range(0, n - 1)).concat(shuffle(range(0, n - 1)).slice(0, Math.max(0, len - n)));
      if (seq.every((x, i) => i === 0 || x !== seq[i - 1])) return seq.slice(0, len);
    }
  }

  /** Reads what the player typed: 12, -3, −3, 1.5, 1,5 or 3/4. Returns null if it is not a number. */
  function parse(text) {
    const s = String(text).trim().replace(/−/g, "-").replace(/\s+/g, "");
    if (!s) return null;
    let m = /^(-?\d+)\/(\d+)$/.exec(s);
    if (m) return +m[2] ? +m[1] / +m[2] : null;
    m = /^-?(\d+([.,]\d+)?|[.,]\d+)$/.exec(s);
    return m ? parseFloat(s.replace(",", ".")) : null;
  }

  const check = (problem, value) => value !== null && Math.abs(value - problem.a) <= (problem.tol || 0) + 1e-9;
  const answerText = problem => problem.shown || num(problem.a);

  return { LEVELS, plan, parse, check, answerText };
})();
