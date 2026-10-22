/**
 * silly/engine.js
 * Pure logic (no screen code) for Silly Sentence Lab:
 *  - parse a story template into text parts and slots
 *  - find which words still fit the sentence (so it always makes sense)
 *  - build the 4 answer choices for a slot (correct words + wrong-type words)
 */
const SillyEngine = (() => {
  const isNoun = t => t === "noun" || t === "plural";
  const isMod = t => t === "adj" || t === "verb" || t === "past";
  const fits = (list, tags) => list.includes("*") || list.some(x => tags.includes(x));
  const shuffle = a => a.sort(() => Math.random() - 0.5);
  const rnd = a => a[Math.floor(Math.random() * a.length)];

  /** "The {adj} {noun:doer} {past=ran|hopped}." -> { parts, slots, subj } */
  function parse(story) {
    const parts = story.split(/\{([^}]+)\}/);          // text, slot, text, slot, ...
    const slots = [];
    for (let i = 1; i < parts.length; i += 2) {
      const m = /^(\w+)(?::(\w+)|=(.+))?$/.exec(parts[i]);
      slots.push({ type: m[1], tag: m[2] || null, only: m[3] ? m[3].split("|") : null, free: false });
      parts[i] = m[1];
    }
    const subj = slots.findIndex(s => isNoun(s.type));  // the first noun is the subject
    slots.forEach((s, k) => {
      if (subj < 0 || k <= subj || !isMod(s.type)) return;
      let between = "";
      for (let p = 2 * subj + 2; p <= 2 * k; p += 2) between += parts[p] + " ";
      s.free = /\b(we|I)\b/i.test(between);              // "we danced" is not about the noun
    });
    return { parts, slots, subj };
  }

  /** Do the words filled so far fit together? (null = not filled yet) */
  function valid(st, as) {
    for (let j = 0; j < st.slots.length; j++) {
      const w = as[j], s = st.slots[j];
      if (!w) continue;
      if (isNoun(s.type) && s.tag && !w.tags.includes(s.tag)) return false;
      if (isMod(s.type) && st.subj >= 0 && j !== st.subj && !s.free) {
        const sw = as[st.subj];
        if (sw && !fits(w.n, sw.tags)) return false;      // adjective / verb must fit the noun
      }
      if (s.type === "adv") {
        for (let p = j - 1; p >= 0; p--) {                // adverb must fit the verb before it
          const t = st.slots[p].type;
          if (t === "verb" || t === "past") {
            if (as[p] && !w.a.some(x => as[p].k.includes(x))) return false;
            break;
          }
        }
      }
      for (let p = 0; p < j; p++) {                       // no repeated word of the same type
        if (as[p] && st.slots[p].type === s.type && as[p].w === w.w) return false;
      }
    }
    return true;
  }

  function pool(st, i, WORDS) {
    const s = st.slots[i];
    let p = WORDS[s.type];
    if (s.only) p = p.filter(x => s.only.includes(x.w));
    if (s.tag && isNoun(s.type)) p = p.filter(x => x.tags.includes(s.tag));
    return p;
  }

  /** Can the remaining slots (from..end) still be filled sensibly? */
  function feasible(st, as, from, WORDS) {
    if (from >= st.slots.length) return true;
    for (const w of pool(st, from, WORDS)) {
      as[from] = w;
      const ok = valid(st, as) && feasible(st, as, from + 1, WORDS);
      as[from] = null;
      if (ok) return true;
    }
    return false;
  }

  /** Words that fit slot i now AND leave the rest of the sentence completable. */
  function candidates(st, filled, i, WORDS) {
    const as = st.slots.map((_, k) => filled[k] || null);
    return pool(st, i, WORDS).filter(w => {
      as[i] = w;
      const ok = valid(st, as) && feasible(st, as, i + 1, WORDS);
      as[i] = null;
      return ok;
    });
  }

  /** 4 choices: up to 2 words that fit + wrong-type words (clearly wrong). */
  function makeOptions(st, filled, i, level, marked, WORDS) {
    const t = st.slots[i].type;
    let good = candidates(st, filled, i, WORDS);
    if (!good.length) good = pool(st, i, WORDS);          // safety net
    good = shuffle(good.slice()).slice(0, 2).map(o => ({ ...o, t }));

    let types = (level.confuse[t] || []).slice();
    if (t === "past" && marked) types = ["verb", "adj", "adv"];          // tense lesson
    const next = st.slots[i + 1];
    if (t === "adj" && next && isNoun(next.type)) types = types.filter(x => !isNoun(x)); // avoid "pizza robot"
    types = shuffle(types);

    const bad = [];
    for (let n = 0; bad.length < 4 - good.length; n++) {
      const ty = types[n % types.length];
      const w = rnd(WORDS[ty]);
      if (bad.some(b => b.w === w.w) || good.some(g => g.w === w.w)) continue;
      bad.push({ ...w, t: ty });
    }
    return shuffle(good.concat(bad));
  }

  return { parse, valid, candidates, makeOptions };
})();
