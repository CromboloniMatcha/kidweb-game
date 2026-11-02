/**
 * odds/game.js
 * Odds Lab: screens, game flow and scoring.
 * Each puzzle is solved in guided steps. You type a number for each step and the
 * frequency tree (or lab notebook) fills in as you go.
 * Uses shared helpers from config.js / storage.js / effects.js / game.js:
 * $, show, starText, burst, floatText. Puzzles come from engine.js.
 * Wrapped in a function so its names never clash with the other games.
 */
(function () {
  "use strict";

  const KEY = "sapioOdds";
  const O = OddsEngine;
  const FIRST = 10, SECOND = 5;               // points per step: first try, second try
  let G = {};                                 // current game state

  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveBest(id, score, stars) {
    try {
      const b = loadBest();
      if (!b[id] || score > b[id].score) { b[id] = { score, stars }; localStorage.setItem(KEY, JSON.stringify(b)); }
    } catch (e) { /* storage not available: ignore */ }
  }

  function sayIt(text, cls) {
    $("odSay").textContent = text;
    const m = $("odMascot");
    m.classList.remove("hop", "sad"); void m.offsetWidth;
    if (cls) m.classList.add(cls);
  }
  function note(text, cls) {
    const el = $("odMsg");
    el.textContent = text; el.className = "mxmsg" + (cls ? " " + cls : "");
  }
  function shakeInput() {
    const i = $("odInput");
    i.classList.remove("bad"); void i.offsetWidth; i.classList.add("bad");
  }

  /* ---------- level list ---------- */
  function renderLevels() {
    const best = loadBest();
    $("odLevelList").innerHTML = O.LEVELS.map((l, i) => {
      const b = best[l.id];
      return `<button class="ocard" data-i="${i}"><span class="ic">${l.icon}</span><span>
        <b>${l.name}</b><small>${l.desc}</small><small>📝 10 puzzles, no timer: take your time!</small>
        <span class="best">${b ? starText(b.stars) + " Best: " + b.score + " / " + O.maxFor(l) : "☆☆☆ Not played yet"}</span></span></button>`;
    }).join("");
  }

  /* ---------- drawing the frequency tree / notebook ---------- */
  function visualHTML(p, done) {
    if (p.tree) {
      const t = p.tree, v = (k, x) => (done >= k ? x : "?");
      return `<div class="tree">
        <div class="tn root">${t.N} ${t.pop}</div>
        <div class="tn half">Have it<b>${v(1, t.a)}</b></div><div class="tn half">Don’t<b>${v(1, t.H)}</b></div>
        <div class="tn flag">Flagged<b>${v(2, t.TP)}</b></div><div class="tn">Missed<b>${v(2, t.FN)}</b></div>
        <div class="tn flag">Flagged by mistake<b>${v(3, t.FP)}</b></div><div class="tn">Not flagged<b>${v(3, t.TN)}</b></div>
      </div>` + (done >= 4 ? `<div class="treefoot">${t.TP} real out of ${t.TP + t.FP} flagged</div>` : "");
    }
    return `<ul class="notebook">${p.notes.map((label, i) =>
      `<li class="${i < done ? "done" : ""}">${label}: <b>${i < done ? O.answerText(p.steps[i]) : "?"}</b></li>`).join("")}</ul>`;
  }

  /* ---------- game flow ---------- */
  function start(i) {
    const lv = O.LEVELS[i], puzzles = lv.stages.map(make => make());
    G = { i, lv, puzzles, n: 0, score: 0, hist: [], lessons: [], first: 0, total: 0,
          max: puzzles.reduce((n, p) => n + p.steps.length * FIRST, 0), locked: true };
    $("odLvName").textContent = lv.icon + " " + lv.name;
    $("odScore").textContent = 0;
    show("odds-game");
    next(true);
  }

  function drawDots() {
    $("odDots").innerHTML = G.puzzles.map((_, k) => {
      const h = G.hist[k];
      return `<i class="${h || (k + 1 === G.n ? "cur" : "")}"></i>`;
    }).join("");
  }

  function next(first) {
    G.n++;
    if (G.n > G.puzzles.length) return finish();
    const p = G.p = G.puzzles[G.n - 1];
    G.si = 0; G.done = 0; G.perfect = true;
    $("odStage").textContent = "Puzzle " + G.n + " of " + G.puzzles.length;
    $("odIntro").textContent = p.intro;
    $("odVisual").innerHTML = visualHTML(p, 0);
    sayIt(first ? "Think in counts of people, not just percentages!" : "A new puzzle for the lab!");
    drawDots();
    showStep();
  }

  function showStep() {
    const step = G.p.steps[G.si];
    G.tries = 0; G.locked = false;
    $("odAsk").innerHTML = `<b>Step ${G.si + 1} of ${G.p.steps.length}:</b> ${step.ask}`;
    const input = $("odInput");
    input.value = ""; input.disabled = false; input.className = "mxinput";
    $("odCheck").disabled = false; $("odSign").disabled = false;
    $("odLesson").hidden = true; $("odFoot").hidden = true;
    note("");
    input.focus();
  }

  function submit() {
    if (G.locked) { advance(); return; }                       // Enter after a step goes on
    const step = G.p.steps[G.si], value = O.parse($("odInput").value);
    if (value === null) { note("Type a number, like 12, −3, 1.5 or 25%.", "warn"); shakeInput(); return; }
    if (O.check(step, value)) { resolve(true); return; }
    G.tries++;
    if (G.tries === 1) {
      note("Not quite. Hint: " + step.hint, "warn");
      sayIt("Check the hint and try once more.", "sad");
      shakeInput();
      $("odInput").select();
    } else {
      resolve(false);
    }
  }

  function resolve(correct) {
    G.locked = true;
    const p = G.p, step = p.steps[G.si], last = G.si === p.steps.length - 1;
    $("odInput").disabled = true; $("odCheck").disabled = true; $("odSign").disabled = true;
    const pts = correct ? (G.tries === 0 ? FIRST : SECOND) : 0;
    G.score += pts; G.total++;
    if (correct && G.tries === 0) G.first++; else G.perfect = false;
    $("odScore").textContent = G.score;
    G.done = G.si + 1;
    $("odVisual").innerHTML = visualHTML(p, G.done);
    if (correct) { $("odInput").classList.add("good"); burst($("odCheck"), 8); floatText("+" + pts, $("odCheck")); }
    note(correct ? (G.tries === 0 ? "Correct!" : "Correct on the second try!") : "The answer is " + O.answerText(step) + ".", correct ? "ok" : "warn");
    $("odLesson").innerHTML = `<p>${step.explain}</p>` + (last ? `<p class="fixline"><b>💡 Lesson:</b> ${p.lesson}</p>` : "");
    $("odLesson").hidden = false;
    if (last) {
      G.hist.push(G.perfect ? "ok" : "mid");
      G.lessons.push(p.lesson);
      drawDots();
    }
    $("odNext").textContent = last ? (G.n >= G.puzzles.length ? "Finish 🎉" : "Next puzzle ➜") : "Next step ➜";
    $("odFoot").hidden = false;
    sayIt(correct ? "Nice counting!" : "No worries. Read the explanation!", correct ? "hop" : "sad");
  }

  function advance() {
    if (G.si < G.p.steps.length - 1) { G.si++; showStep(); }
    else next(false);
  }

  function finish() {
    const ratio = G.score / G.max, stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
    saveBest(G.lv.id, G.score, stars);
    $("odResTitle").textContent = stars === 3 ? "Odds master!" : stars === 2 ? "Sharp with numbers!" : "Keep counting!";
    $("odResStars").innerHTML = [0, 1, 2].map(k =>
      `<span style="animation-delay:${k * 0.25}s">${k < stars ? "⭐" : "☆"}</span>`).join("");
    $("odResScore").textContent = G.score + " / " + G.max;
    $("odResInfo").textContent = G.first + " of " + G.total + " steps right on the first try.";
    $("odLessons").innerHTML = G.lessons.map(t => `<li>${t}</li>`).join("");
    show("odds-result");
    setTimeout(() => { if (stars > 1) burst($("odResStars"), 24); }, 300);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("[data-odds]")) { renderLevels(); show("odds-levels"); return; }
    const c = e.target.closest(".ocard");
    if (c) start(+c.dataset.i);
  });
  $("odInput").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
  $("odCheck").onclick = submit;
  $("odSign").onclick = () => {
    const i = $("odInput"), v = i.value.replace(/^[-−]/, "");
    i.value = /^[-−]/.test(i.value) ? v : "−" + v;
    i.focus();
  };
  $("odNext").onclick = advance;
  $("odQuit").onclick = () => { renderLevels(); show("odds-levels"); };
  $("odAgain").onclick = () => start(G.i);
  $("odChoose").onclick = () => { renderLevels(); show("odds-levels"); };
})();
