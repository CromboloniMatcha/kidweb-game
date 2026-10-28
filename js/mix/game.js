/**
 * mix/game.js
 * Mix Master: screens, game flow and scoring.
 *  - 10 mixed problems per level, topic hidden until you answer
 *  - you type the answer (2 tries per problem)
 *  - a missed topic comes back later as a "Comeback" problem with new numbers
 * Uses shared helpers from config.js / storage.js / effects.js / game.js:
 * $, show, starText, burst, floatText. Problems come from engine.js.
 * Wrapped in a function so its names never clash with the other games.
 */
(function () {
  "use strict";

  const KEY = "sapioMix";
  const M = MixEngine;
  const FIRST = 10, SECOND = 5, BONUS = 5;       // points: first try, second try, comeback
  const LEN = 10;                                 // problems per level
  let G = {};                                     // current game state

  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveBest(id, score, stars) {
    try {
      const b = loadBest();
      if (!b[id] || score > b[id].score) { b[id] = { score, stars }; localStorage.setItem(KEY, JSON.stringify(b)); }
    } catch (e) { /* storage not available: ignore */ }
  }

  function sayIt(text, cls) {
    $("mxSay").textContent = text;
    const m = $("mxMascot");
    m.classList.remove("hop", "sad"); void m.offsetWidth;
    if (cls) m.classList.add(cls);
  }
  function note(text, cls) {
    const el = $("mxMsg");
    el.textContent = text; el.className = "mxmsg" + (cls ? " " + cls : "");
  }
  function shakeInput() {
    const i = $("mxInput");
    i.classList.remove("bad"); void i.offsetWidth; i.classList.add("bad");
  }

  /* ---------- level list ---------- */
  function renderLevels() {
    const best = loadBest();
    $("mxLevelList").innerHTML = M.LEVELS.map((l, i) => {
      const b = best[l.id];
      return `<button class="mcard" data-i="${i}"><span class="ic">${l.icon}</span><span>
        <b>${l.name}</b><small>${l.desc}</small><small>📝 ${LEN} mixed problems, no timer: take your time!</small>
        <span class="best">${b ? starText(b.stars) + " Best: " + b.score : "☆☆☆ Not played yet"}</span></span></button>`;
    }).join("");
  }

  /* ---------- game flow ---------- */
  function start(i) {
    const lv = M.LEVELS[i];
    G = { i, lv, q: M.plan(lv, LEN).map(t => ({ t, review: false })), base: 0, pts: 0, bonus: 0, score: 0,
          hist: [], rev: {}, stats: {}, locked: true };
    $("mxLvName").textContent = lv.icon + " " + lv.name;
    $("mxScore").textContent = 0;
    show("mix-game");
    next(true);
  }

  function drawDots() {
    $("mxDots").innerHTML = Array.from({ length: LEN }, (_, k) => {
      const h = G.hist[k];
      return `<i class="${h || (k + 1 === G.base && !G.item.review ? "cur" : "")}"></i>`;
    }).join("");
  }

  function next(first) {
    if (!G.q.length) return finish();
    const item = G.item = G.q.shift();
    G.prob = G.lv.topics[item.t].gen();
    G.tries = 0; G.locked = false;
    if (!item.review) G.base++;
    $("mxStage").textContent = item.review ? "🔁 Comeback: a type you missed earlier, with new numbers"
                                           : "Problem " + G.base + " of " + LEN + " · topic hidden";
    $("mxQ").innerHTML = G.prob.q;
    const input = $("mxInput");
    input.value = ""; input.disabled = false; input.className = "mxinput";
    $("mxCheck").disabled = false; $("mxSign").disabled = false;
    $("mxVerdict").hidden = true; $("mxFoot").hidden = true;
    note("");
    sayIt(first ? "Topics are mixed. First, work out which method fits!" : item.review ? "Let’s try that type again!" : "Next problem. Which method fits?");
    drawDots();
    input.focus();
  }

  function submit() {
    if (G.locked) { next(false); return; }                       // Enter after solving goes to the next problem
    const value = M.parse($("mxInput").value);
    if (value === null) { note("Type a number, like 12, −3, 1.5 or 3/4.", "warn"); shakeInput(); return; }
    if (M.check(G.prob, value)) { resolve(true); return; }
    G.tries++;
    if (G.tries === 1) {
      note("Not quite. Hint: " + G.lv.topics[G.item.t].hint, "warn");
      sayIt("Close! Check the hint and try once more.", "sad");
      shakeInput();
      $("mxInput").select();
    } else {
      resolve(false);
    }
  }

  /* put a missed topic back into the queue, a few problems later */
  function schedule(t) {
    const count = G.rev[t] || 0;
    if (count >= 2) return false;
    G.rev[t] = count + 1;
    let pos = Math.min(count === 0 ? 3 : 5, G.q.length);
    while (pos < G.q.length && (G.q[pos].t === t || (pos > 0 && G.q[pos - 1].t === t))) pos++;
    G.q.splice(pos, 0, { t, review: true });
    return true;
  }

  function resolve(correct) {
    G.locked = true;
    const item = G.item, topic = G.lv.topics[item.t];
    $("mxInput").disabled = true; $("mxCheck").disabled = true; $("mxSign").disabled = true;
    let pts = 0;
    if (correct) {
      if (item.review) { pts = BONUS; G.bonus += pts; }
      else { pts = G.tries === 0 ? FIRST : SECOND; G.pts += pts; }
    }
    G.score = G.pts + G.bonus;
    $("mxScore").textContent = G.score;
    if (!item.review) {
      G.hist.push(correct ? (G.tries === 0 ? "ok" : "mid") : "bad");
      const s = G.stats[topic.name] = G.stats[topic.name] || { seen: 0, first: 0 };
      s.seen++; if (correct && G.tries === 0) s.first++;
    }
    const back = !correct && schedule(item.t);
    if (correct) { $("mxInput").classList.add("good"); burst($("mxCheck"), 10); floatText("+" + pts, $("mxCheck")); }
    $("mxVerdict").innerHTML = `<h4>🎛️ <span class="mxtopic">${topic.name}</span></h4>
      <p>Answer: <b>${M.answerText(G.prob)}</b></p><p>${G.prob.sol}</p>` +
      (back ? `<p class="fixline">This type will come back later with new numbers. That’s how it sticks!</p>` : "");
    $("mxVerdict").hidden = false;
    note(correct ? (G.tries === 0 ? "Correct!" : "Correct on the second try!") : "The answer was " + M.answerText(G.prob) + ".", correct ? "ok" : "warn");
    $("mxNext").textContent = G.q.length ? "Next ➜" : "Finish 🎉";
    $("mxFoot").hidden = false;
    sayIt(correct ? "Nice thinking!" : "Mistakes are how we learn. Read the solution!", correct ? "hop" : "sad");
    drawDots();
  }

  function finish() {
    const ratio = Math.min(1, G.score / (LEN * FIRST)), stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
    saveBest(G.lv.id, G.score, stars);
    $("mxResTitle").textContent = stars === 3 ? "Mix master!" : stars === 2 ? "Strong mixing!" : "Keep mixing!";
    $("mxResStars").innerHTML = [0, 1, 2].map(k =>
      `<span style="animation-delay:${k * 0.25}s">${k < stars ? "⭐" : "☆"}</span>`).join("");
    $("mxResScore").textContent = G.score;
    $("mxResInfo").textContent = "Problems: " + G.pts + " points" + (G.bonus ? " + comeback bonus: " + G.bonus : "") + ".";
    $("mxReport").innerHTML = G.lv.topics.filter(t => G.stats[t.name]).map(t => {
      const s = G.stats[t.name];
      return `<li><b>${t.name}</b>: ${s.first === s.seen ? "✅ solid" : "🔁 keep practising"} <small>(${s.first} of ${s.seen} right on the first try)</small></li>`;
    }).join("");
    show("mix-result");
    setTimeout(() => { if (stars > 1) burst($("mxResStars"), 24); }, 300);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("[data-mix]")) { renderLevels(); show("mix-levels"); return; }
    const c = e.target.closest(".mcard");
    if (c) start(+c.dataset.i);
  });
  $("mxInput").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
  $("mxCheck").onclick = submit;
  $("mxSign").onclick = () => {
    const i = $("mxInput"), v = i.value.replace(/^[-−]/, "");
    i.value = /^[-−]/.test(i.value) ? v : "−" + v;
    i.focus();
  };
  $("mxNext").onclick = () => next(false);
  $("mxQuit").onclick = () => { renderLevels(); show("mix-levels"); };
  $("mxAgain").onclick = () => start(G.i);
  $("mxChoose").onclick = () => { renderLevels(); show("mix-levels"); };
})();
