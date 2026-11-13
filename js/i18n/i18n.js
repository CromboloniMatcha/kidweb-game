/**
 * i18n/i18n.js
 * Language switch (English / Bahasa Indonesia).
 *
 * How it works
 *  - Dictionaries map the ENGLISH text to the translation: I18N.register("id", { "Play again": "Main lagi" }).
 *  - A key may contain placeholders: {name} matches any text, {#n} matches digits only.
 *      "Puzzle {#n} of {#m}": "Teka-teki {n} dari {m}"
 *    Captured text is translated too (nested), so "Not quite. Hint: {h}" also translates the hint.
 *  - The page is translated in place: all text on screen, and text the games add later
 *    (a MutationObserver watches for changes). Switching back to English restores the original.
 *  - Long content (case files) is swapped with I18N.overlay(data, patch).
 *  - Mark an element translate="no" to keep it untouched.
 * Games need no changes, except where a string contains HTML (see I18N.s).
 */
const I18N = (() => {
  const dict = {};                    // dict[lang][english] = translation
  const compiled = {};                // placeholder keys turned into regular expressions
  const hooks = [];                   // functions called when the language changes
  const nodeState = new WeakMap();    // text node -> { src, out }
  const attrState = new WeakMap();    // element -> { attr: { src, out } }
  const ATTRS = ["aria-label", "placeholder", "title"];
  let lang = "en", observer = null;

  function register(l, entries) { dict[l] = Object.assign(dict[l] || {}, entries); compiled[l] = null; }

  function compile(l) {
    compiled[l] = Object.keys(dict[l]).filter(k => /\{#?\w+\}/.test(k)).map(k => {
      const names = [];
      const src = k.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(#?)(\w+)\}/g, (_, num, n) => {
        names.push(n);
        return num ? "(\\d+)" : "([\\s\\S]+?)";
      });
      return { re: new RegExp("^" + src + "$"), names, out: dict[l][k], weight: k.replace(/\{#?\w+\}/g, "").length };
    }).sort((a, b) => b.weight - a.weight);          // the most specific pattern wins
  }

  /** Translate one whole string. Returns null when there is no translation. */
  function tr(s, l = lang) {
    const d = dict[l];
    if (!d) return null;
    if (Object.prototype.hasOwnProperty.call(d, s)) return d[s];
    if (!compiled[l]) compile(l);
    for (const p of compiled[l]) {
      const m = p.re.exec(s);
      if (m) {
        return p.out.replace(/\{#?(\w+)\}/g, (_, n) => {
          const g = m[1 + p.names.indexOf(n)];
          return g === undefined ? "" : (tr(g, l) ?? g);
        });
      }
    }
    return null;
  }

  /** Translate a string (HTML allowed) before a game puts it on screen. Falls back to the original. */
  const s = text => (lang === "en" ? text : (tr(String(text).trim()) ?? text));

  /* ---------- translating the page ---------- */
  const noTranslate = node => { const el = node.nodeType === 1 ? node : node.parentElement; return !!(el && el.closest('[translate="no"]')); };

  function xText(n) {
    const raw = n.nodeValue, st = nodeState.get(n);
    if (st && raw === st.out) return;                 // we wrote this
    const t = raw.trim();
    if (!t || lang === "en" || noTranslate(n)) { nodeState.delete(n); return; }
    const out = tr(t);
    if (out === null) { nodeState.delete(n); return; }
    const res = raw.replace(t, () => out);
    nodeState.set(n, { src: raw, out: res });
    n.nodeValue = res;
  }

  function xAttrs(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      let st = attrState.get(el);
      if (!st) attrState.set(el, st = {});
      if (st[a] && st[a].out === v) continue;
      const out = lang === "en" ? null : tr(v.trim());
      if (out === null) { delete st[a]; continue; }
      st[a] = { src: v, out };
      el.setAttribute(a, out);
    }
  }

  function walk(node) {
    if (node.nodeType === 3) { xText(node); return; }
    if (node.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(node.tagName) || noTranslate(node)) return;
    xAttrs(node);
    node.childNodes.forEach(walk);
  }

  function restore(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const st = nodeState.get(n);
      if (st && n.nodeValue === st.out) n.nodeValue = st.src;
      nodeState.delete(n);
    }
    root.querySelectorAll("*").forEach(el => {
      const st = attrState.get(el);
      if (!st) return;
      for (const a in st) if (el.getAttribute(a) === st[a].out) el.setAttribute(a, st[a].src);
      attrState.delete(el);
    });
  }

  function watch() { if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  function unwatch() { if (observer) observer.disconnect(); }

  function onChange(list) {
    if (lang === "en") return;
    unwatch();
    for (const m of list) {
      if (m.type === "characterData") xText(m.target);
      else m.addedNodes.forEach(walk);
    }
    watch();
  }

  /* ---------- content overlays ---------- */
  /** Swap the text in a data object for a translated copy of the same shape. */
  function overlay(target, patch) {
    const en = JSON.parse(JSON.stringify(target));
    const merge = (t, p) => { for (const k in p) { if (p[k] && typeof p[k] === "object") merge(t[k], p[k]); else t[k] = p[k]; } };
    hooks.push(l => { merge(target, en); if (l !== "en" && patch[l]) merge(target, patch[l]); });
  }
  const addOverlay = (target, patchByLang) => overlay(target, patchByLang);

  /* ---------- switching ---------- */
  function updateButton() {
    const b = document.getElementById("langBtn");
    if (b) b.textContent = lang === "en" ? "🌐 Bahasa Indonesia" : "🌐 English";
  }

  function apply() {
    unwatch();
    restore(document.body);
    hooks.forEach(h => h(lang));
    if (lang !== "en") walk(document.body);
    document.documentElement.lang = lang;
    updateButton();
    watch();
  }

  function set(l) {
    lang = l;
    try { localStorage.setItem("sapioLang", l); } catch (e) { /* ignore */ }
    const active = document.querySelector(".view.active");
    if (active && /(^game$|^result$|-game$|-result$)/.test(active.id) && typeof show === "function") show("games");
    apply();
  }

  function init() {
    let saved = null;
    try { saved = localStorage.getItem("sapioLang"); } catch (e) { /* ignore */ }
    lang = saved || ((navigator.language || "").toLowerCase().startsWith("id") ? "id" : "en");
    observer = new MutationObserver(onChange);
    const b = document.getElementById("langBtn");
    if (b) b.onclick = () => set(lang === "en" ? "id" : "en");
    apply();
  }

  return { register, tr, s, overlay: addOverlay, init, set, get lang() { return lang; } };
})();
