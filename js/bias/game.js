/**
 * bias/game.js
 * Bias Buster: screens, game flow and scoring.
 * Each case has 2 steps:
 *   1. name the thinking bias (a mystery monster is hiding behind the scene)
 *   2. pick the strategy that busts it
 * Uses shared helpers from config.js / storage.js / effects.js / game.js:
 * $, show, starText, burst, floatText. Case files live in data.js.
 * Wrapped in a function so its names never clash with the other games.
 */
(function () {
  "use strict";

  const KEY = "sapioBias";
  const PTS = 10;                  // points per step on the first try
  const D = BIAS;
  let G = {};                      // current game state

  const shuffle = a => a.sort(() => Math.random() - 0.5);
  const award = wrong => Math.max(2, PTS - 4 * wrong);   // 10, 6, then 2

  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveBest(id, score, stars) {
    try {
      const b = loadBest();
      if (!b[id] || score > b[id].score) { b[id] = { score, stars }; localStorage.setItem(KEY, JSON.stringify(b)); }
    } catch (e) { /* storage not available: ignore */ }
  }

  function sayIt(text, cls) {
    $("bbSay").textContent = text;
    const m = $("bbMascot");
    m.classList.remove("hop", "sad"); void m.offsetWidth;
    if (cls) m.classList.add(cls);
  }

  /* ---------- level list ---------- */
  function renderLevels() {
    const best = loadBest();
    $("bbLevelList").innerHTML = D.LEVELS.map((l, i) => {
      const b = best[l.id], max = l.cases.length * PTS * 2;
      return `<button class="bcard" data-i="${i}"><span class="ic">${l.icon}</span><span>
        <b>${l.name}</b><small>${l.desc}</small><small>📝 ${l.cases.length} cases, no timer: take your time!</small>
        <span class="best">${b ? starText(b.stars) + " Best: " + b.score + " / " + max : "☆☆☆ Not played yet"}</span></span></button>`;
    }).join("");
  }

  /* ---------- game flow ---------- */
  function start(i) {
    const lv = D.LEVELS[i];
    G = { i, lv, n: 0, score: 0, max: lv.cases.length * PTS * 2, hist: [], log: [] };
    $("bbLvName").textContent = lv.icon + " " + lv.name;
    $("bbScore").textContent = 0;
    show("bias-game");
    next();
  }

  function drawDots() {
    $("bbDots").innerHTML = Array.from({ length: G.lv.cases.length }, (_, k) => {
      const h = G.hist[k];
      return `<i class="${h || (k + 1 === G.n ? "cur" : "")}"></i>`;
    }).join("");
  }

  function addScore(pts, el) {
    G.score += pts;
    $("bbScore").textContent = G.score;
    burst(el, 8); floatText("+" + pts, el);
  }

  function next() {
    G.n++;
    if (G.n > G.lv.cases.length) return finish();
    const c = G.c = G.lv.cases[G.n - 1];
    G.step = 1; G.w1 = 0; G.w2 = 0;
    $("bbCase").textContent = "Case " + G.n + " of " + G.lv.cases.length + ": " + c.title;
    $("bbText").textContent = c.text;
    const mon = $("bbMonster");
    mon.className = "monster"; mon.textContent = "❓";
    $("bbStep").textContent = "Step 1: which thinking bias is hiding in this story?";
    $("bbVerdict").hidden = true; $("bbFoot").hidden = true;
    drawBiasOptions();
    sayIt(G.n === 1 ? "A mystery bias monster is hiding. Can you name it?" : "Another monster is hiding!");
    drawDots();
  }

  function setOptions(items, handler) {
    $("bbAns").innerHTML = items.map((t, i) => `<button class="ans word long" data-i="${i}">${t.label}</button>`).join("");
    document.querySelectorAll("#bbAns .ans").forEach(b => b.onclick = () => handler(items[+b.dataset.i], b));
    $("bbAns").hidden = false;
  }

  /* Step 1: name the bias (1 correct + 3 different ones from this level) */
  function drawBiasOptions() {
    const c = G.c, skip = [c.b].concat(c.not || []);
    const wrong = shuffle(G.lv.cases.map(x => x.b).filter(b => !skip.includes(b))).slice(0, 3);
    setOptions(shuffle([c.b].concat(wrong)).map(k => ({ key: k, label: D.BIASES[k].name })), pickBias);
  }

  function pickBias(item, btn) {
    if (G.step !== 1) return;
    const B = D.BIASES[item.key];
    if (item.key !== G.c.b) {
      G.w1++; btn.disabled = true; btn.classList.add("wrong");
      sayIt("Not quite. " + B.name + ": " + B.def, "sad");
      return;
    }
    addScore(award(G.w1), btn);
    btn.classList.add("right");
    G.step = 2;
    const mon = $("bbMonster");
    mon.textContent = B.e; mon.classList.add("reveal");
    $("bbStep").textContent = "Step 2: how do you bust it? Pick the best strategy.";
    sayIt("Monster found! Now bust it.", "hop");
    setTimeout(drawBustOptions, 500);
  }

  /* Step 2: pick the strategy that busts the bias */
  function drawBustOptions() {
    const c = G.c;
    setOptions(shuffle(c.bust.map((t, i) => ({ good: i === 0, label: t }))), pickBust);
  }

  function pickBust(item, btn) {
    if (G.step !== 2) return;
    if (!item.good) {
      G.w2++; btn.disabled = true; btn.classList.add("wrong");
      sayIt("That would not remove the bias. Think about what gives better evidence.", "sad");
      return;
    }
    addScore(award(G.w2), btn);
    btn.classList.add("right");
    document.querySelectorAll("#bbAns .ans").forEach(b => b.disabled = true);
    G.step = 3;
    const c = G.c, B = D.BIASES[c.b], perfect = G.w1 === 0 && G.w2 === 0;
    G.hist.push(perfect ? "ok" : "mid");
    G.log.push({ b: c.b, perfect });
    const mon = $("bbMonster");
    mon.classList.remove("reveal"); void mon.offsetWidth; mon.classList.add("busted");
    $("bbVerdict").innerHTML = `<h4>💥 ${B.name} busted!</h4><p>${B.def}</p>
      <p><b>In this story:</b> ${c.why}</p><p class="fixline"><b>Bust it by:</b> ${c.bust[0]}.</p>`;
    $("bbVerdict").hidden = false;
    $("bbStep").textContent = "Bias busted!";
    $("bbNext").textContent = G.n >= G.lv.cases.length ? "Finish 🎉" : "Next case ➜";
    $("bbFoot").hidden = false;
    sayIt("Bias busted!", "hop");
    drawDots();
  }

  function finish() {
    const ratio = G.score / G.max, stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
    saveBest(G.lv.id, G.score, stars);
    $("bbResTitle").textContent = stars === 3 ? "Master bias buster!" : stars === 2 ? "Sharp thinker!" : "Keep busting!";
    $("bbResStars").innerHTML = [0, 1, 2].map(k =>
      `<span style="animation-delay:${k * 0.25}s">${k < stars ? "⭐" : "☆"}</span>`).join("");
    $("bbResScore").textContent = G.score + " / " + G.max;
    $("bbBook").innerHTML = G.log.map(e => {
      const B = D.BIASES[e.b];
      return `<li>${B.e} <b>${B.name}</b>${e.perfect ? " ⭐" : ""}<br><small>${B.def}</small></li>`;
    }).join("");
    show("bias-result");
    setTimeout(() => { if (stars > 1) burst($("bbResStars"), 24); }, 300);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("[data-bias]")) { renderLevels(); show("bias-levels"); return; }
    const c = e.target.closest(".bcard");
    if (c) start(+c.dataset.i);
  });
  $("bbQuit").onclick = () => { renderLevels(); show("bias-levels"); };
  $("bbNext").onclick = next;
  $("bbAgain").onclick = () => start(G.i);
  $("bbChoose").onclick = () => { renderLevels(); show("bias-levels"); };
})();
