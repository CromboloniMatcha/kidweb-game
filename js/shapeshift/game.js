/**
 * shapeshift/game.js
 * Shape Shifter: screens, drawing (SVG made in code, no image files), game flow and scoring.
 * Uses shared helpers from config.js / storage.js / effects.js / game.js:
 * $, show, starText, burst, floatText. Puzzles come from engine.js.
 * Wrapped in a function so its names never clash with the other games.
 */
(function () {
  "use strict";

  const KEY = "sapioShape";
  const PTS = 10;                       // points per puzzle on the first try
  const E = ShapeEngine;
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
    $("ssSay").textContent = text;
    const m = $("ssMascot");
    m.classList.remove("hop", "sad"); void m.offsetWidth;
    if (cls) m.classList.add(cls);
  }

  /* ---------- drawing ---------- */
  /* flat shape made of squares */
  function shapeSVG(cells, cs, fill) {
    const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1;
    const rects = cells.map(([x, y]) =>
      `<rect x="${x * cs + 1}" y="${y * cs + 1}" width="${cs - 2}" height="${cs - 2}" rx="${cs / 5}" style="fill:${fill}" stroke="rgba(0,0,0,.25)"/>`).join("");
    return `<svg class="shape" viewBox="0 0 ${w * cs} ${h * cs}" width="${w * cs}" height="${h * cs}" aria-hidden="true">${rects}</svg>`;
  }

  /* lighter / darker version of a #rrggbb colour */
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16), parts = [n >> 16, (n >> 8) & 255, n & 255];
    const c = parts.map(v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  /* object made of cubes, drawn in isometric view (three visible faces per cube) */
  function cubesSVG(cubes, color, S) {
    const w = 0.866 * S, hh = 0.5 * S;
    const P = (x, y, z) => [(x - y) * w, (x + y) * hh - z * S];
    const order = cubes.slice().sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]) || a[2] - b[2]);
    const pts = [], polys = [];
    const face = (arr, fill) => {
      arr.forEach(p => pts.push(p));
      polys.push(`<polygon points="${arr.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}" style="fill:${fill}" stroke="rgba(0,0,0,.45)" stroke-width="1" stroke-linejoin="round"/>`);
    };
    order.forEach(([x, y, z]) => {
      face([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], shade(color, 1.4));   // top
      face([P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], shade(color, 0.78));  // left side
      face([P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)], color);               // right side
    });
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs) - 2, y0 = Math.min(...ys) - 2;
    const W = Math.max(...xs) - Math.min(...xs) + 4, H = Math.max(...ys) - Math.min(...ys) + 4;
    return `<svg class="shape" viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}" width="${W.toFixed(0)}" height="${H.toFixed(0)}" aria-hidden="true">${polys.join("")}</svg>`;
  }

  function draw(p, cells, size, fill) {
    return p.dim === 3 ? cubesSVG(cells, p.color, size) : shapeSVG(cells, size, fill || p.color);
  }

  /* ---------- level list ---------- */
  function renderLevels() {
    const best = loadBest();
    $("ssLevelList").innerHTML = E.LEVELS.map((l, i) => {
      const b = best[l.id];
      return `<button class="xcard" data-i="${i}"><span class="ic">${l.icon}</span><span>
        <b>${l.name}</b><small>${l.desc}</small><small>📝 10 puzzles, no timer: take your time!</small>
        <span class="best">${b ? starText(b.stars) + " Best: " + b.score + " / " + E.maxFor(l) : "☆☆☆ Not played yet"}</span></span></button>`;
    }).join("");
  }

  /* ---------- game flow ---------- */
  function start(i) {
    const lv = E.LEVELS[i];
    G = { i, lv, puzzles: lv.stages.map(make => make()), n: 0, score: 0, hist: [], max: E.maxFor(lv) };
    $("ssLvName").textContent = lv.icon + " " + lv.name;
    $("ssScore").textContent = 0;
    show("shape-game");
    next(true);
  }

  function drawDots() {
    $("ssDots").innerHTML = G.puzzles.map((_, k) => {
      const h = G.hist[k];
      return `<i class="${h || (k + 1 === G.n ? "cur" : "")}"></i>`;
    }).join("");
  }

  function next(first) {
    G.n++;
    if (G.n > G.puzzles.length) return finish();
    const p = G.p = G.puzzles[G.n - 1];
    G.w = 0; G.locked = false;
    $("ssStage").textContent = "Puzzle " + G.n + " of " + G.puzzles.length;
    $("ssDone").hidden = true; $("ssFoot").hidden = true;
    const isMatch = p.kind === "match";
    $("ssMatch").hidden = !isMatch; $("ssFit").hidden = isMatch;
    if (isMatch) drawMatch(); else drawFit();
    sayIt(first ? "Let’s shift some shapes!" : "Here’s a new puzzle!");
    drawDots();
  }

  /* --- match: find the same shape, just turned --- */
  function drawMatch() {
    const p = G.p, size = p.dim === 3 ? 22 : 24, osize = p.dim === 3 ? 17 : 20;
    $("ssPrompt").textContent = p.dim === 3 ? "Which object is the same as this one, just turned around?"
                                            : "Which shape is the same as this one, just turned around?";
    $("ssTarget").innerHTML = draw(p, p.target, size);
    $("ssOpts").innerHTML = p.options.map((o, i) => `<button class="ssopt" data-i="${i}">${draw(p, o.cells, osize)}</button>`).join("");
    document.querySelectorAll("#ssOpts .ssopt").forEach(b => b.onclick = () => chooseOption(+b.dataset.i, b));
  }

  function chooseOption(i, btn) {
    if (G.locked) return;
    if (!G.p.options[i].ok) {
      G.w++; btn.disabled = true; btn.classList.add("wrong");
      sayIt("Not that one. " + G.p.hint, "sad");
      return;
    }
    btn.classList.add("right");
    document.querySelectorAll("#ssOpts .ssopt").forEach(b => b.disabled = true);
    solved(btn);
  }

  /* --- fit: turn (and flip) the piece until it fills the hole --- */
  function drawFit() {
    const p = G.p;
    G.piece = p.piece;
    $("ssPrompt").textContent = p.canFlip ? "Turn and flip the piece so it fits the hole." : "Turn the piece so it fits the hole.";
    $("ssHole").innerHTML = shapeSVG(p.hole, 24, "var(--ink)");
    $("ssFlip").hidden = !p.canFlip;
    $("ssHole").parentNode.classList.remove("solved");
    drawPiece();
  }
  function drawPiece() { $("ssPiece").innerHTML = shapeSVG(G.piece, 24, G.p.color); }

  function tryFit() {
    if (G.locked) return;
    if (!E.fits(G.piece, G.p.hole)) {
      G.w++;
      sayIt("Not yet. " + G.p.hint, "sad");
      return;
    }
    $("ssHole").innerHTML = shapeSVG(G.p.hole, 24, G.p.color);
    $("ssHole").parentNode.classList.add("solved");
    solved($("ssGo"));
  }

  /* --- puzzle solved --- */
  function solved(el) {
    G.locked = true;
    const pts = award(G.w);
    G.score += pts;
    $("ssScore").textContent = G.score;
    burst(el, 10); floatText("+" + pts, el);
    G.hist.push(G.w === 0 ? "ok" : "mid");
    drawDots();
    $("ssDone").innerHTML = `<h4>🦎 Shape shifted!</h4><p>${G.p.done}</p>`;
    $("ssDone").hidden = false;
    $("ssNext").textContent = G.n >= G.puzzles.length ? "Finish 🎉" : "Next puzzle ➜";
    $("ssFoot").hidden = false;
    sayIt("Great spatial thinking!", "hop");
  }

  function finish() {
    const ratio = G.score / G.max, stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
    saveBest(G.lv.id, G.score, stars);
    $("ssResTitle").textContent = stars === 3 ? "Shape master!" : stars === 2 ? "Great shifting!" : "Nice try!";
    $("ssResStars").innerHTML = [0, 1, 2].map(k =>
      `<span style="animation-delay:${k * 0.25}s">${k < stars ? "⭐" : "☆"}</span>`).join("");
    $("ssResScore").textContent = G.score + " / " + G.max;
    $("ssResInfo").textContent = "You got " + G.hist.filter(h => h === "ok").length + " of " + G.puzzles.length + " puzzles right on the first try.";
    show("shape-result");
    setTimeout(() => { if (stars > 1) burst($("ssResStars"), 24); }, 300);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("[data-ss]")) { renderLevels(); show("shape-levels"); return; }
    const c = e.target.closest(".xcard");
    if (c) start(+c.dataset.i);
  });
  $("ssQuit").onclick = () => { renderLevels(); show("shape-levels"); };
  $("ssTurn").onclick = () => { if (!G.locked) { G.piece = E.turn2(G.piece, 1); drawPiece(); } };
  $("ssFlip").onclick = () => { if (!G.locked) { G.piece = E.flip2(G.piece); drawPiece(); } };
  $("ssGo").onclick = tryFit;
  $("ssNext").onclick = () => next(false);
  $("ssAgain").onclick = () => start(G.i);
  $("ssChoose").onclick = () => { renderLevels(); show("shape-levels"); };
})();
