/**
 * pattern/game.js
 * Pattern Puzzle: screens, game flow and scoring.
 * The player completes a train: tap the piece that fits the next empty carriage.
 * Uses shared helpers from config.js / storage.js / effects.js / game.js:
 * $, show, starText, burst, floatText. Patterns come from engine.js.
 * Wrapped in a function so its names never clash with the other games.
 */
(function () {
  "use strict";

  const KEY = "sapioPattern";
  const PTS = 10;                       // points per hidden carriage on the first try
  const P = PatternEngine;
  let G = {};                           // current game state

  const award = wrong => Math.max(2, PTS - 4 * wrong);   // 10, 6, then 2

  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveBest(id, score, stars) {
    try {
      const b = loadBest();
      if (!b[id] || score > b[id].score) { b[id] = { score, stars }; localStorage.setItem(KEY, JSON.stringify(b)); }
    } catch (e) { /* storage not available: ignore */ }
  }

  function sayIt(text, cls) {
    $("patSay").textContent = text;
    const m = $("patMascot");
    m.classList.remove("hop", "sad"); void m.offsetWidth;
    if (cls) m.classList.add(cls);
  }

  /* one piece (a shape, emoji, number or group of emoji) as HTML */
  function itemHTML(it) {
    if (it.k === "s") return `<span class="pc ${it.shape}" style="--c:${it.color};--r:${it.rot}deg"></span>`;
    if (it.k === "e") return `<span class="pe">${it.e}</span>`;
    if (it.k === "n") return `<span class="pn">${it.n}</span>`;
    return `<span class="pd">${it.e.repeat(it.n)}</span>`;
  }

  /* ---------- level list ---------- */
  function renderLevels() {
    const best = loadBest();
    $("patLevelList").innerHTML = P.LEVELS.map((l, i) => {
      const b = best[l.id];
      return `<button class="pcard" data-i="${i}"><span class="ic">${l.icon}</span><span>
        <b>${l.name}</b><small>${l.desc}</small><small>📝 10 trains, no timer: take your time!</small>
        <span class="best">${b ? starText(b.stars) + " Best: " + b.score + " / " + P.maxFor(l) : "☆☆☆ Not played yet"}</span></span></button>`;
    }).join("");
  }

  /* ---------- game flow ---------- */
  function start(i) {
    const lv = P.LEVELS[i];
    const puzzles = lv.stages.map(make => make());
    G = { i, lv, puzzles, n: 0, score: 0, hist: [], rules: [], max: puzzles.reduce((n, p) => n + p.gaps.length * PTS, 0) };
    $("patLvName").textContent = lv.icon + " " + lv.name;
    $("patScore").textContent = 0;
    show("pattern-game");
    next(true);
  }

  function drawDots() {
    $("patDots").innerHTML = G.puzzles.map((_, k) => {
      const h = G.hist[k];
      return `<i class="${h || (k + 1 === G.n ? "cur" : "")}"></i>`;
    }).join("");
  }

  function drawTrain() {
    const p = G.p, cur = p.gaps[G.gi];
    $("patTrain").innerHTML = `<div class="engine">🚂</div>` + p.items.map((it, i) => {
      const style = `style="--i:${i}"`;
      if (!p.gaps.includes(i)) return `<div class="car" ${style}>${itemHTML(it)}</div>`;
      if (G.filled[i]) return `<div class="car filled" ${style}>${itemHTML(it)}</div>`;
      return `<div class="car gap${i === cur && !G.locked ? " cur" : ""}" ${style}>?</div>`;
    }).join("");
    const el = document.querySelector("#patTrain .gap.cur");
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  function drawPalette() {
    G.pal = P.palette(G.p, 5);
    $("patPal").innerHTML = G.pal.map((it, i) => `<button class="piece" data-i="${i}">${itemHTML(it)}</button>`).join("");
    document.querySelectorAll("#patPal .piece").forEach(b => b.onclick = () => place(+b.dataset.i, b));
  }

  function next(first) {
    G.n++;
    if (G.n > G.puzzles.length) return finish();
    const p = G.p = G.puzzles[G.n - 1];
    G.gi = 0; G.w = 0; G.wrongs = 0; G.filled = {}; G.locked = false;
    $("patStage").textContent = "Train " + G.n + " of " + G.puzzles.length;
    $("patStep").textContent = "Tap the piece that fits the next empty carriage.";
    $("patRule").hidden = true; $("patFoot").hidden = true; $("patPal").hidden = false;
    const train = $("patTrain");
    train.classList.remove("cheer", "leave", "arrive"); void train.offsetWidth; train.classList.add("arrive");
    sayIt(first ? "Complete the train, engineer!" : "Here comes another train!");
    drawDots(); drawTrain(); drawPalette();
  }

  function place(i, btn) {
    if (G.locked) return;
    const p = G.p, idx = p.gaps[G.gi];
    if (P.key(G.pal[i]) !== P.key(p.items[idx])) {          // wrong piece: hint, fewer points
      G.w++; G.wrongs++;
      btn.classList.remove("miss"); void btn.offsetWidth; btn.classList.add("miss");
      sayIt("Not that one. " + p.hint, "sad");
      return;
    }
    const pts = award(G.w);
    G.score += pts; G.w = 0; G.filled[idx] = true;
    $("patScore").textContent = G.score;
    burst(btn, 8); floatText("+" + pts, btn);
    G.gi++;
    if (G.gi < p.gaps.length) {
      sayIt("Yes! One more carriage to fill.", "hop");
      drawTrain();
    } else {
      complete();
    }
  }

  function complete() {
    const p = G.p;
    G.locked = true;
    G.hist.push(G.wrongs === 0 ? "ok" : "mid");
    G.rules.push(p.rule);
    drawTrain(); drawDots();
    const train = $("patTrain");
    train.classList.remove("arrive"); void train.offsetWidth; train.classList.add("cheer");
    $("patPal").hidden = true;
    $("patStep").textContent = "All aboard!";
    $("patRule").innerHTML = `<h4>🚂 Pattern found!</h4><p>${p.rule}</p>`;
    $("patRule").hidden = false;
    $("patNext").textContent = G.n >= G.puzzles.length ? "Finish 🎉" : "Next train ➜";
    $("patFoot").hidden = false;
    sayIt("Choo choo! You found the pattern!", "hop");
    burst($("patTrain"), 14);
  }

  function leaveThenNext() {
    const train = $("patTrain");
    train.classList.remove("cheer", "arrive"); void train.offsetWidth; train.classList.add("leave");
    $("patFoot").hidden = true;
    setTimeout(() => next(false), 550);
  }

  function finish() {
    const ratio = G.score / G.max, stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
    saveBest(G.lv.id, G.score, stars);
    $("patResTitle").textContent = stars === 3 ? "Pattern master!" : stars === 2 ? "Great train driving!" : "Nice try!";
    $("patResStars").innerHTML = [0, 1, 2].map(k =>
      `<span style="animation-delay:${k * 0.25}s">${k < stars ? "⭐" : "☆"}</span>`).join("");
    $("patResScore").textContent = G.score + " / " + G.max;
    $("patList").innerHTML = G.rules.map(r => `<li>${r}</li>`).join("");
    show("pattern-result");
    setTimeout(() => { if (stars > 1) burst($("patResStars"), 24); }, 300);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("[data-pat]")) { renderLevels(); show("pattern-levels"); return; }
    const c = e.target.closest(".pcard");
    if (c) start(+c.dataset.i);
  });
  $("patQuit").onclick = () => { renderLevels(); show("pattern-levels"); };
  $("patNext").onclick = leaveThenNext;
  $("patAgain").onclick = () => start(G.i);
  $("patChoose").onclick = () => { renderLevels(); show("pattern-levels"); };
})();
