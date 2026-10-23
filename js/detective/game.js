/**
 * detective/game.js
 * Argument Detective: screens, game flow and scoring.
 * Each case has 2 steps:
 *   1. tap the statement where the reasoning goes wrong
 *   2. name the kind of weak argument
 * Uses shared helpers from config.js / storage.js / effects.js / game.js:
 * $, show, starText, burst, floatText. Case files live in data.js.
 * Wrapped in a function so its names never clash with the other games.
 */
(function () {
  "use strict";

  const KEY = "pinkDetective";
  const PTS = 10;                  // points per step on the first try
  const D = DETECTIVE;
  let G = {};                      // current game state

  const shuffle = a => a.sort(() => Math.random() - 0.5);
  const award = wrong => Math.max(2, PTS - 4 * wrong);   // 10, 6, then 2
  const flawsOf = c => [].concat(c.flaw);

  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveBest(id, score, stars) {
    try {
      const b = loadBest();
      if (!b[id] || score > b[id].score) { b[id] = { score, stars }; localStorage.setItem(KEY, JSON.stringify(b)); }
    } catch (e) { /* storage not available: ignore */ }
  }

  function sayIt(text, cls) {
    $("detSay").textContent = text;
    const m = $("detMascot");
    m.classList.remove("hop", "sad"); void m.offsetWidth;
    if (cls) m.classList.add(cls);
  }

  /* ---------- level list ---------- */
  function renderLevels() {
    const best = loadBest();
    $("detLevelList").innerHTML = D.LEVELS.map((l, i) => {
      const b = best[l.id], max = l.cases.length * PTS * 2;
      return `<button class="dcard" data-i="${i}"><span class="ic">${l.icon}</span><span>
        <b>${l.name}</b><small>${l.desc}</small><small>📝 ${l.cases.length} cases, no timer: take your time!</small>
        <span class="best">${b ? starText(b.stars) + " Best: " + b.score + " / " + max : "☆☆☆ Not played yet"}</span></span></button>`;
    }).join("");
  }

  /* ---------- game flow ---------- */
  function start(i) {
    const lv = D.LEVELS[i];
    G = { i, lv, n: 0, score: 0, max: lv.cases.length * PTS * 2, hist: [], log: [] };
    $("detLvName").textContent = lv.icon + " " + lv.name;
    $("detScore").textContent = 0;
    show("detective-game");
    next();
  }

  function drawDots() {
    $("detDots").innerHTML = Array.from({ length: G.lv.cases.length }, (_, k) => {
      const h = G.hist[k];
      return `<i class="${h || (k + 1 === G.n ? "cur" : "")}"></i>`;
    }).join("");
  }

  function addScore(pts, el) {
    G.score += pts;
    $("detScore").textContent = G.score;
    burst(el, 8); floatText("+" + pts, el);
  }

  function next() {
    G.n++;
    if (G.n > G.lv.cases.length) return finish();
    const c = G.c = G.lv.cases[G.n - 1];
    G.step = 1; G.w1 = 0; G.w2 = 0;
    $("detCase").textContent = "Case " + G.n + " of " + G.lv.cases.length + ": " + c.title;
    $("detStmts").innerHTML = c.s.map((t, i) =>
      `<button class="stmt" data-i="${i}"><span class="n">${i + 1}</span><span>${t}</span></button>`).join("");
    document.querySelectorAll("#detStmts .stmt").forEach(b => b.onclick = () => pickStatement(+b.dataset.i, b));
    $("detStep").textContent = "Step 1: tap the statement where the reasoning goes wrong.";
    $("detAns").hidden = true; $("detVerdict").hidden = true; $("detFoot").hidden = true;
    sayIt(G.n === 1 ? "Read the case file carefully, detective!" : "A new case just came in!");
    drawDots();
  }

  /* Step 1: find the weak statement */
  function pickStatement(i, btn) {
    if (G.step !== 1) return;
    if (!flawsOf(G.c).includes(i)) {
      G.w1++; btn.disabled = true; btn.classList.add("miss");
      sayIt("That statement sounds fine. Look for where the reasoning jumps.", "sad");
      return;
    }
    addScore(award(G.w1), btn);
    document.querySelectorAll("#detStmts .stmt").forEach(b => {
      b.disabled = true;
      if (flawsOf(G.c).includes(+b.dataset.i)) b.classList.add("flag");
    });
    G.step = 2;
    sayIt("Good eye! Now name the trick.", "hop");
    $("detStep").textContent = "Step 2: what kind of weak argument is it?";
    drawOptions();
  }

  /* Step 2: name the fallacy (1 correct + 3 different ones from this level) */
  function drawOptions() {
    const c = G.c, skip = [c.f].concat(c.not || []);
    const wrong = shuffle(G.lv.cases.map(x => x.f).filter(f => !skip.includes(f))).slice(0, 3);
    const keys = shuffle([c.f].concat(wrong));
    $("detAns").innerHTML = keys.map(k =>
      `<button class="ans word long" data-k="${k}">${D.FALLACIES[k].name}</button>`).join("");
    $("detAns").hidden = false;
    document.querySelectorAll("#detAns .ans").forEach(b => b.onclick = () => pickFallacy(b.dataset.k, b));
  }

  function pickFallacy(k, btn) {
    if (G.step !== 2) return;
    const c = G.c, F = D.FALLACIES[k];
    if (k !== c.f) {
      G.w2++; btn.disabled = true; btn.classList.add("wrong");
      sayIt("Not quite. " + F.name + ": " + F.def, "sad");
      return;
    }
    addScore(award(G.w2), btn);
    btn.classList.add("right");
    document.querySelectorAll("#detAns .ans").forEach(b => b.disabled = true);
    G.step = 3;
    const perfect = G.w1 === 0 && G.w2 === 0;
    G.hist.push(perfect ? "ok" : "mid");
    G.log.push({ f: c.f, perfect });
    $("detVerdict").innerHTML = `<h4>🔎 ${F.name}</h4><p>${F.def}</p>
      <p><b>Why here:</b> ${c.why}</p><p class="fixline"><b>Stronger version:</b> ${c.fix}</p>`;
    $("detVerdict").hidden = false;
    $("detStep").textContent = "Case solved!";
    $("detNext").textContent = G.n >= G.lv.cases.length ? "Finish 🎉" : "Next case ➜";
    $("detFoot").hidden = false;
    sayIt("Case solved!", "hop");
    drawDots();
  }

  function finish() {
    const ratio = G.score / G.max, stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
    saveBest(G.lv.id, G.score, stars);
    $("detResTitle").textContent = stars === 3 ? "Master detective!" : stars === 2 ? "Sharp thinking!" : "Keep investigating!";
    $("detResStars").innerHTML = [0, 1, 2].map(k =>
      `<span style="animation-delay:${k * 0.25}s">${k < stars ? "⭐" : "☆"}</span>`).join("");
    $("detResScore").textContent = G.score + " / " + G.max;
    $("detBook").innerHTML = G.log.map(e => {
      const F = D.FALLACIES[e.f];
      return `<li><b>${F.name}</b>${e.perfect ? " ⭐" : ""}<br><small>${F.def}</small></li>`;
    }).join("");
    show("detective-result");
    setTimeout(() => { if (stars > 1) burst($("detResStars"), 24); }, 300);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("[data-det]")) { renderLevels(); show("detective-levels"); return; }
    const c = e.target.closest(".dcard");
    if (c) start(+c.dataset.i);
  });
  $("detQuit").onclick = () => { renderLevels(); show("detective-levels"); };
  $("detNext").onclick = next;
  $("detAgain").onclick = () => start(G.i);
  $("detChoose").onclick = () => { renderLevels(); show("detective-levels"); };
})();
