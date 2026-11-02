/**
 * odds/engine.js
 * Pure logic (no screen code) for Odds Lab, the risk and probability game (Hard list).
 *
 * Puzzle types (all answers are numbers you type, one guided step at a time):
 *   A  frequency tree   "how many are flagged, and how many of those are real?"  (natural frequencies)
 *   B  risk             absolute vs relative change, and number needed to treat / harm
 *   C  expected value   what a game or raffle returns on average
 *   D  two tests        how a second, independent test changes the picture
 *
 * Each generator returns:
 *   { type, intro, steps: [{ ask, a, tol, shown, unit, hint, explain }], tree | notes, lesson, p }
 * All numbers are chosen so every count is a whole number.
 */
const OddsEngine = (() => {
  const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[r(0, a.length - 1)];
  const num = n => String(n).replace("-", "−");
  const whole = x => Math.abs(x - Math.round(x)) < 1e-9;
  const two = x => +x.toFixed(2);

  const CONTEXTS = [
    { pop: "students", yes: "copied their essay", no: "wrote it themselves", tool: "plagiarism checker" },
    { pop: "emails", yes: "are spam", no: "are not spam", tool: "spam filter" },
    { pop: "phones", yes: "have a faulty battery", no: "have a healthy battery", tool: "factory scanner" },
    { pop: "people", yes: "have the flu", no: "do not have the flu", tool: "quick flu test" },
    { pop: "bags", yes: "hold a banned item", no: "hold nothing banned", tool: "airport scanner" },
    { pop: "photos", yes: "show a cat", no: "do not show a cat", tool: "photo app" }
  ];

  /* ---------- A: frequency tree ---------- */
  function genA(N, ps, ss, fs) {
    const cx = pick(CONTEXTS);
    for (;;) {
      const p = pick(ps), s = pick(ss), f = pick(fs);
      const a = N * p / 100, TP = a * s / 100, H = N - a, FP = H * f / 100;
      if (![a, TP, FP].every(whole) || TP < 1 || FP < 1) continue;
      const fl = TP + FP, pct = 100 * TP / fl, shown = String(Math.round(pct));
      return {
        type: "A",
        intro: `Imagine ${N} ${cx.pop}. ${p}% of them ${cx.yes}. The ${cx.tool} flags ${s}% of the ${cx.pop} that ${cx.yes}, but it also flags ${f}% of the ${cx.pop} that ${cx.no}.`,
        steps: [
          { ask: `How many of the ${N} ${cx.pop} ${cx.yes}?`, a, hint: `Take ${p}% of ${N}.`, explain: `${N} × ${p}% = ${a}.` },
          { ask: `How many of those ${a} does the ${cx.tool} flag?`, a: TP, hint: `Take ${s}% of ${a}.`, explain: `${a} × ${s}% = ${TP}.` },
          { ask: `How many of the other ${H} ${cx.pop} does it flag by mistake?`, a: FP, hint: `Use the ones that do NOT have it: take ${f}% of ${H}.`, explain: `${H} × ${f}% = ${FP}.` },
          { ask: `Of all the flagged ${cx.pop}, what percent really ${cx.yes}? (Round to a whole number.)`, a: pct, tol: 0.6, shown, unit: "%",
            hint: `Real flags ÷ all flags × 100. All flags = real flags + false alarms.`, explain: `${TP} real out of ${fl} flagged: ${TP} ÷ ${fl} × 100 ≈ ${shown}%.` }
        ],
        tree: { N, pop: cx.pop, a, TP, FN: a - TP, H, FP, TN: H - FP },
        lesson: `Only ${TP} of the ${fl} flagged ${cx.pop} are real: about ${shown}%. Counting people instead of percentages makes this easy, and you should always ask how common the condition is.`,
        p: { N, p, s, f, a, TP, FP, pct }
      };
    }
  }

  /* ---------- B: absolute vs relative risk ---------- */
  const B_DOWN = [
    { thing: "the new vaccine", verb: "get", outcome: "caught the infection" },
    { thing: "the new medicine", verb: "take", outcome: "had a heart attack" },
    { thing: "a helmet", verb: "wear", outcome: "suffered a head injury" },
    { thing: "the study programme", verb: "join", outcome: "failed the exam" }
  ];
  const B_UP = [
    { thing: "the new sweetener", verb: "use", outcome: "got headaches" },
    { thing: "late-night screen time", verb: "have", outcome: "slept badly" },
    { thing: "the new energy drink", verb: "drink", outcome: "had trouble sleeping" }
  ];
  function genB(mode, ns, ds, ms) {
    const cx = pick(mode === "down" ? B_DOWN : B_UP);
    for (;;) {
      const n = pick(ns), d = pick(ds), m = pick(ms), b = d * m, t = mode === "down" ? b - d : b + d;
      if (n % d !== 0 || b > n || t > n || t < 0) continue;
      const rel = 100 / m, nnt = n / d, absPts = two(100 * d / n), dir = mode === "down" ? "lower" : "raise";
      return {
        type: "B",
        intro: `Out of every ${n} people who did not ${cx.verb} ${cx.thing}, ${b} ${cx.outcome}. Out of every ${n} who did ${cx.verb} it, ${t} ${cx.outcome}.`,
        steps: [
          { ask: `By how many cases per ${n} people does ${cx.thing} ${dir} the risk?`, a: d, hint: `Subtract the two numbers.`, explain: `${Math.max(b, t)} − ${Math.min(b, t)} = ${d}.` },
          { ask: `What is the relative ${mode === "down" ? "reduction" : "increase"} in risk (in %)?`, a: rel, unit: "%", hint: `Change ÷ the starting risk (${b}) × 100.`, explain: `${d} ÷ ${b} × 100 = ${rel}%.` },
          { ask: `How many people need to ${cx.verb} ${cx.thing} to ${mode === "down" ? "prevent" : "cause"} one case? (${mode === "down" ? "number needed to treat" : "number needed to harm"})`, a: nnt,
            hint: `Out of ${n} people the effect is ${d} cases. How many people per case?`, explain: `${n} ÷ ${d} = ${nnt}.` }
        ],
        notes: ["Cases per " + n, "Relative change", mode === "down" ? "Number needed to treat" : "Number needed to harm"],
        lesson: `A ${rel}% relative change sounds big, but the absolute change is ${d} in ${n} (${absPts} percentage points). Always ask for both numbers.`,
        p: { mode, n, d, m, b, t, rel, nnt }
      };
    }
  }

  /* ---------- C: expected value ---------- */
  function genC(twoPrizes) {
    if (!twoPrizes) {
      const m = pick([4, 5, 10, 20, 50]), k = r(1, 3), W = m * r(2, 12), avg = k * W / m;
      let c;
      do { c = Math.max(1, avg + r(-5, 6)); } while (c === avg);
      const net = avg - c;
      return {
        type: "C",
        intro: `At the school fair, a raffle ticket costs $${c}. ${k} out of every ${m} tickets win a prize worth $${W}. The other tickets win nothing.`,
        steps: [
          { ask: `On average, how many dollars does one ticket win?`, a: avg, unit: "$", hint: `Prize × chance of winning (${k} out of ${m}).`, explain: `$${W} × ${k}/${m} = $${avg}.` },
          { ask: `What is your average gain per ticket after paying $${c}? (Use a minus sign for a loss.)`, a: net, unit: "$", hint: `Average winnings minus the price of the ticket.`, explain: `${avg} − ${c} = ${num(net)}.` }
        ],
        notes: ["Average prize per ticket", "Average net per ticket"],
        lesson: `Over many tickets you ${net < 0 ? "lose" : "gain"} about $${Math.abs(net)} per ticket on average. Expected value describes the long run, not one single play.`,
        p: { twoPrizes, m, k, W, c, avg, net }
      };
    }
    const m1 = pick([10, 20, 50]), m2 = pick([2, 4, 5]), W1 = m1 * r(3, 10), W2 = m2 * r(2, 6);
    const e1 = W1 / m1, e2 = W2 / m2, tot = e1 + e2;
    let c;
    do { c = Math.max(1, tot + r(-4, 5)); } while (c === tot);
    const net = tot - c;
    return {
      type: "C",
      intro: `A game costs $${c} to play. 1 in ${m1} plays wins $${W1}. A different 1 in ${m2} plays wins $${W2}. All other plays win nothing.`,
      steps: [
        { ask: `On average, how many dollars per play come from the $${W1} prize?`, a: e1, unit: "$", hint: `Prize × chance (1 in ${m1}).`, explain: `$${W1} ÷ ${m1} = $${e1}.` },
        { ask: `On average, how many dollars per play come from the $${W2} prize?`, a: e2, unit: "$", hint: `Prize × chance (1 in ${m2}).`, explain: `$${W2} ÷ ${m2} = $${e2}.` },
        { ask: `What is your average gain per play after paying $${c}? (Use a minus sign for a loss.)`, a: net, unit: "$", hint: `Add both averages, then subtract the price.`, explain: `${e1} + ${e2} − ${c} = ${num(net)}.` }
      ],
      notes: [`Average from $${W1} prize`, `Average from $${W2} prize`, "Average net per play"],
      lesson: `On average you ${net < 0 ? "lose" : "gain"} $${Math.abs(net)} per play. Add up every prize’s average to get the expected value.`,
      p: { twoPrizes, m1, m2, W1, W2, c, e1, e2, tot, net }
    };
  }

  /* ---------- D: two independent tests ---------- */
  function genD() {
    const cx = pick(CONTEXTS), N = 10000;
    for (;;) {
      const p = pick([1, 2, 5]), s1 = pick([90, 95]), f1 = pick([5, 10]), s2 = pick([90, 95, 100]), f2 = pick([5, 10, 20]);
      const a = N * p / 100, TP1 = a * s1 / 100, H = N - a, FP1 = H * f1 / 100, TP2 = TP1 * s2 / 100, FP2 = FP1 * f2 / 100;
      if (![a, TP1, FP1, TP2, FP2].every(whole) || TP2 < 1 || FP2 < 1) continue;
      const fl1 = TP1 + FP1, fl2 = TP2 + FP2, pct1 = Math.round(100 * TP1 / fl1), pct2 = 100 * TP2 / fl2, shown = String(Math.round(pct2));
      return {
        type: "D",
        intro: `Imagine ${N} ${cx.pop}. ${p}% of them ${cx.yes}. Test 1 flags ${s1}% of the ${cx.pop} that ${cx.yes} and ${f1}% of those that ${cx.no}. Test 2 is then run only on the flagged ones. It flags ${s2}% of the real cases and ${f2}% of the others. The tests are independent.`,
        steps: [
          { ask: `How many of the ${N} ${cx.pop} are flagged by Test 1 in total?`, a: fl1, hint: `Add the real cases that are flagged and the false alarms.`,
            explain: `Real: ${a} × ${s1}% = ${TP1}. False alarms: ${H} × ${f1}% = ${FP1}. Total ${fl1}.` },
          { ask: `Of those ${fl1} flagged, how many really ${cx.yes}?`, a: TP1, hint: `Only the real cases that Test 1 caught.`, explain: `${a} × ${s1}% = ${TP1}.` },
          { ask: `Test 2 is run on the ${fl1} flagged ${cx.pop}. How many get flagged again?`, a: fl2, hint: `Apply ${s2}% to the real ones and ${f2}% to the false alarms, then add.`,
            explain: `Real: ${TP1} × ${s2}% = ${TP2}. False alarms: ${FP1} × ${f2}% = ${FP2}. Total ${fl2}.` },
          { ask: `Of those flagged by both tests, what percent really ${cx.yes}? (Round to a whole number.)`, a: pct2, tol: 0.6, shown, unit: "%",
            hint: `Real cases flagged twice ÷ everyone flagged twice × 100.`, explain: `${TP2} ÷ ${fl2} × 100 ≈ ${shown}%.` }
        ],
        notes: ["Flagged by Test 1", "Real cases (of those)", "Flagged by both tests", "Percent real after 2 flags"],
        lesson: `One flag gave about ${pct1}% real cases. Two independent flags raise it to about ${shown}%. Independent evidence stacks up, and every test is worth counting.`,
        p: { N, p, s1, f1, s2, f2, a, TP1, FP1, TP2, FP2, fl1, fl2, pct2 }
      };
    }
  }

  /* ---------- levels (10 puzzles each) ---------- */
  const A100 = () => genA(100, [10, 20, 25, 40, 50], [80, 90, 100], [10, 20, 30]);
  const A1000 = () => genA(1000, [1, 2, 5, 10], [80, 90, 95, 100], [2, 5, 10, 20]);
  const A10000 = () => genA(10000, [0.5, 1, 2], [90, 95, 99], [1, 2, 5]);
  const B1 = () => genB("down", [100], [2, 4, 5], [2, 4, 5]);
  const B2 = () => genB(pick(["down", "up"]), [1000, 10000], [1, 2, 5, 10], [2, 5, 10, 20]);
  const B3 = () => genB(pick(["down", "up"]), [10000], [1, 2, 5], [10, 20, 25]);
  const LEVELS = [
    { id: "beginner", name: "Beginner", icon: "🌱", desc: "Counting people, simple risks and raffles",
      stages: [A100, () => genC(false), B1, A100, () => genC(false), B1, A100, () => genC(false), B1, A100] },
    { id: "intermediate", name: "Intermediate", icon: "🚀", desc: "Rare conditions, false alarms and risk headlines",
      stages: [A1000, B2, () => genC(true), A1000, B2, A1000, () => genC(true), A1000, B2, A1000] },
    { id: "expert", name: "Expert", icon: "👑", desc: "Tiny risks and two tests in a row",
      stages: [A10000, genD, B3, genD, A10000, genD, B3, genD, A10000, genD] }
  ];

  const maxFor = level => level.stages.reduce((n, make) => n + make().steps.length * 10, 0);

  /* ---------- reading and checking answers ---------- */
  function parse(text) {
    const s = String(text).trim().replace(/−/g, "-").replace(/\s+/g, "").replace(/^(-?)\$/, "$1").replace(/%$/, "");
    if (!s) return null;
    const m = /^-?(\d+([.,]\d+)?|[.,]\d+)$/.exec(s);
    return m ? parseFloat(s.replace(",", ".")) : null;
  }
  const check = (step, value) => value !== null && Math.abs(value - step.a) <= (step.tol || 0) + 1e-9;
  const answerText = step => step.unit === "$" ? (step.a < 0 ? "−" : "") + "$" + Math.abs(step.a)
    : (step.shown || num(step.a)) + (step.unit === "%" ? "%" : "");

  return { LEVELS, maxFor, parse, check, answerText };
})();
