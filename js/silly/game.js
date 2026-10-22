/**
 * silly/game.js
 * Silly Sentence Lab: screens, game flow and scoring.
 * Uses shared helpers from config.js / storage.js / effects.js / game.js:
 * $, pick, show, starText, burst, floatText.
 * Word matching lives in engine.js; word lists in data.js.
 * Wrapped in a function so its names never clash with Math Sprint.
 */
(function () {
  "use strict";

  const KEY = "pinkSilly";
  const PER_BLANK = 10; // points for a correct word on the first try
  let G = {};           // current game state

  /* ---------- small helpers ---------- */
  const art = l => (/^[aeiou]/i.test(l) ? "an " : "a ") + l;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const maxFor = lv => lv.stories.reduce((n, s) => n + (s.match(/\{/g) || []).length * PER_BLANK, 0);

  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveBest(id, score, stars) {
    try {
      const b = loadBest();
      if (!b[id] || score > b[id].score) { b[id] = { score, stars }; localStorage.setItem(KEY, JSON.stringify(b)); }
    } catch (e) { /* storage not available: ignore */ }
  }

  function stopSpeech() { try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (e) {} }
  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.85;
      speechSynthesis.speak(u);
    } catch (e) { /* no speech support: ignore */ }
  }

  function sayIt(text, cls) {
    $("sillySay").textContent = text;
    const m = $("sillyMascot");
    m.classList.remove("hop", "sad"); void m.offsetWidth;
    if (cls) m.classList.add(cls);
  }

  /* ---------- level list ---------- */
  function renderLevels() {
    const best = loadBest();
    $("sillyLevelList").innerHTML = SILLY.LEVELS.map((l, i) => {
      const b = best[l.id];
      return `<button class="scard" data-i="${i}"><span class="ic">${l.icon}</span><span>
        <b>${l.name}</b><small>${l.desc}</small><small>📝 10 stages, no timer: take your time!</small>
        <span class="best">${b ? starText(b.stars) + " Best: " + b.score + " / " + maxFor(l) : "☆☆☆ Not played yet"}</span></span></button>`;
    }).join("");
  }

  /* ---------- game flow ---------- */
  function start(i) {
    stopSpeech();
    const lv = SILLY.LEVELS[i];
    G = { i, lv, stage: 0, score: 0, max: maxFor(lv), hist: [], made: [], locked: true };
    $("sillyLvName").textContent = lv.icon + " " + lv.name;
    $("sillyScore").textContent = 0;
    show("silly-game");
    next();
  }

  function next() {
    G.stage++;
    if (G.stage > G.lv.stories.length) return finish();
    const story = G.lv.stories[G.stage - 1];
    G.st = SillyEngine.parse(story);
    G.marked = /yesterday|last /i.test(story);               // story has a past-time word
    G.filled = []; G.bi = 0; G.wrong = 0; G.stagePts = 0; G.locked = false;
    $("sillyStg").textContent = "Stage " + G.stage + " of " + G.lv.stories.length;
    $("sillyFoot").hidden = true; $("sillyType").hidden = false; $("sillyAns").hidden = false;
    sayIt(G.stage === 1 ? "Pick the right kind of word to build a silly sentence!" : "Here comes a new sentence!");
    drawDots(); drawSentence(); drawChoices();
  }

  function drawDots() {
    $("sillyDots").innerHTML = Array.from({ length: G.lv.stories.length }, (_, k) => {
      const h = G.hist[k];
      return `<i class="${h || (k + 1 === G.stage ? "cur" : "")}"></i>`;
    }).join("");
  }

  function drawSentence() {
    const { parts, slots } = G.st;
    $("sillySentence").innerHTML = parts.map((p, i) => {
      if (i % 2 === 0) return p;
      const idx = (i - 1) / 2, T = SILLY.TYPES[slots[idx].type], f = G.filled[idx];
      const first = i === 1 && parts[0] === "";
      if (f) return `<span class="fill" style="--c:${T.color}">${first ? cap(f.w) : f.w}</span>`;
      const cur = idx === G.bi && !G.locked ? " cur" : "";
      return `<span class="blank${cur}" style="--c:${T.color}">${T.label}</span>`;
    }).join("");
  }

  function sentenceText() {
    return cap(G.st.parts.map((p, i) => (i % 2 === 0 ? p : G.filled[(i - 1) / 2].w)).join(""));
  }

  function drawChoices() {
    const slot = G.st.slots[G.bi], T = SILLY.TYPES[slot.type];
    const clue = slot.tag && SILLY.TAGHINT[slot.tag] ? " (here: " + SILLY.TAGHINT[slot.tag] + ")" : "";
    G.opts = SillyEngine.makeOptions(G.st, G.filled, G.bi, G.lv, G.marked, SILLY.WORDS);
    $("sillyType").innerHTML = `<span class="chip" style="--c:${T.color}">${T.label}</span><span>${T.hint}${clue}</span>`;
    $("sillyAns").innerHTML = G.opts.map((o, i) => `<button class="ans word" data-i="${i}">${o.w}</button>`).join("");
    document.querySelectorAll("#sillyAns .ans").forEach(b => b.onclick = () => choose(+b.dataset.i, b));
  }

  function choose(i, btn) {
    if (G.locked) return;
    const o = G.opts[i], t = G.st.slots[G.bi].type, T = SILLY.TYPES[t];
    if (o.t !== t) {                                   // wrong type: explain, fewer points
      G.wrong++; btn.disabled = true; btn.classList.add("wrong");
      sayIt("“" + o.w + "” is " + art(SILLY.TYPES[o.t].label) + ". We need " + art(T.label) + "!", "sad");
      return;
    }
    const pts = Math.max(2, PER_BLANK - 4 * G.wrong);  // 10, 6, then 2 points
    G.score += pts; G.stagePts += pts; G.wrong = 0; G.filled[G.bi] = o;
    $("sillyScore").textContent = G.score;
    btn.classList.add("right"); burst(btn, 8); floatText("+" + pts, btn);
    sayIt("Yes! " + cap(art(T.label)) + " " + T.hint + ".", "hop");
    G.bi++; G.locked = true; drawSentence();
    if (G.bi < G.st.slots.length) {
      setTimeout(() => { G.locked = false; drawSentence(); drawChoices(); }, 700);
    } else {
      setTimeout(done, 700);
    }
  }

  function done() {
    const full = sentenceText();
    G.made.push(full);
    G.hist.push(G.stagePts === G.st.slots.length * PER_BLANK ? "ok" : "mid");
    drawDots(); drawSentence();
    $("sillyType").hidden = true; $("sillyAns").hidden = true;
    $("sillyEmoji").innerHTML = G.filled.filter(f => f.e)
      .map((f, k) => `<span style="animation-delay:${k * 0.2}s">${f.e}</span>`).join("");
    $("sillyNext").textContent = G.stage >= G.lv.stories.length ? "Finish 🎉" : "Next ➜";
    $("sillyFoot").hidden = false;
    sayIt(pick(["Great sentence!", "That sounds just right!", "Wow, I love that one!"]), "hop");
    burst($("sillySentence"), 14);
    G.locked = true;
  }

  function finish() {
    const ratio = G.score / G.max, stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
    saveBest(G.lv.id, G.score, stars);
    $("sillyResTitle").textContent = stars === 3 ? "Word wizard!" : stars === 2 ? "Great work!" : "Nice try!";
    $("sillyResStars").innerHTML = [0, 1, 2].map(k =>
      `<span style="animation-delay:${k * 0.25}s">${k < stars ? "⭐" : "☆"}</span>`).join("");
    $("sillyResScore").textContent = G.score + " / " + G.max;
    $("sillyStory").innerHTML = G.made.map(s => `<li>${s}</li>`).join("");
    show("silly-result");
    setTimeout(() => { if (stars > 1) burst($("sillyResStars"), 24); }, 300);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("[data-silly]")) { renderLevels(); show("silly-levels"); return; }
    const c = e.target.closest(".scard");
    if (c) start(+c.dataset.i);
  });
  $("sillyQuit").onclick = () => { stopSpeech(); renderLevels(); show("silly-levels"); };
  $("sillyNext").onclick = () => { stopSpeech(); next(); };
  $("sillyListen").onclick = () => speak(G.made[G.made.length - 1]);
  $("sillyRead").onclick = () => speak(G.made.join(" "));
  $("sillyAgain").onclick = () => start(G.i);
  $("sillyChoose").onclick = () => { stopSpeech(); renderLevels(); show("silly-levels"); };
})();
