/**
 * silly/data.js
 * Word types, word lists and story templates for Silly Sentence Lab.
 *
 * Sentences stay sensible because words carry "meaning tags":
 *   - nouns have tags (animal, doer, food, swim, bark, ...)
 *   - adjectives, verbs and past verbs list the nouns they fit ("n")
 *   - verbs also have a kind ("k": motion, sound, rest, eat, face, glow)
 *   - adverbs list the verb kinds they fit ("a")
 * The engine (engine.js) only offers words that fit together, so
 * "a tall robot swims" can never happen, but "a tall robot jumps" can.
 *
 * Story slots:  {noun}  {noun:animal} (noun must have that tag)
 *               {prep=under|behind} (only these words are correct)
 * Keep nouns and adjectives starting with a consonant so "a ___" sounds right.
 */
const SILLY = (() => {
  const TYPES = {
    noun:   { label: "noun",            hint: "names a person, animal, place or thing", color: "#6f42c1" },
    plural: { label: "plural noun",     hint: "names more than one thing",              color: "#a24bd0" },
    adj:    { label: "adjective",       hint: "describes a noun, like big or red",      color: "#e8590c" },
    verb:   { label: "verb",            hint: "tells what someone does right now",     color: "#1a9a6c" },
    past:   { label: "past-tense verb", hint: "tells what already happened",            color: "#1971c2" },
    adv:    { label: "adverb",          hint: "tells how something is done",            color: "#d6336c" },
    prep:   { label: "preposition",     hint: "tells where something is",               color: "#0b7285" },
    conj:   { label: "conjunction",     hint: "joins two ideas together",               color: "#9c6b00" }
  };

  // Extra clue shown when a slot needs a certain kind of noun.
  const TAGHINT = { animal: "an animal", doer: "a character that can do things", food: "a food" };

  const T = s => s.split(" ");
  const plural = w => (/(ch|sh|s|x)$/.test(w) ? w + "es" : w + "s");

  // [word, emoji, tags]
  const NOUNS = [
    ["dog", "🐶", "animal doer swim bark soft pet"],
    ["cat", "🐱", "animal doer climb meow soft pet"],
    ["monkey", "🐵", "animal doer climb fun soft"],
    ["penguin", "🐧", "animal doer swim fun soft"],
    ["tiger", "🐯", "animal doer swim climb soft"],
    ["rabbit", "🐰", "animal doer hop soft pet"],
    ["bear", "🐻", "animal doer swim climb soft"],
    ["frog", "🐸", "animal doer swim hop"],
    ["duck", "🦆", "animal doer swim"],
    ["dragon", "🐉", "animal doer fun magic"],
    ["robot", "🤖", "machine doer fun glow"],
    ["ghost", "👻", "magic doer fun glow"],
    ["rocket", "🚀", "machine glow"],
    ["balloon", "🎈", "thing glow"],
    ["pizza", "🍕", "food"],
    ["banana", "🍌", "food sweet"],
    ["cake", "🍰", "food sweet soft"],
    ["cookie", "🍪", "food sweet"],
    ["donut", "🍩", "food sweet"],
    ["sandwich", "🥪", "food"]
  ];

  // [word, nouns it fits]  ("*" = fits any noun)
  const ADJ = [
    ["happy", "doer thing"], ["tiny", "*"], ["sleepy", "animal"], ["funny", "doer"],
    ["shiny", "machine thing"], ["noisy", "animal machine"], ["brave", "doer"],
    ["fluffy", "soft"], ["silly", "doer thing"], ["sparkly", "machine magic thing"],
    ["clever", "doer"], ["lazy", "animal"], ["jolly", "doer"], ["speedy", "machine animal"],
    ["tall", "animal machine"], ["tasty", "food"], ["yummy", "food"], ["sweet", "sweet"],
    ["hungry", "animal"], ["big", "*"], ["little", "*"]
  ];

  // [word, nouns it fits, kind of action]
  const VERB = [
    ["jumps", "doer", "motion"], ["sleeps", "animal", "rest"], ["eats", "animal", "eat"],
    ["swims", "swim", "motion"], ["runs", "animal", "motion"], ["hops", "hop", "motion"],
    ["barks", "bark", "sound"], ["meows", "meow", "sound"], ["glows", "glow", "glow"]
  ];
  const PAST = [
    ["jumped", "doer", "motion"], ["danced", "doer", "motion"], ["laughed", "fun", "sound"],
    ["smiled", "fun pet", "face"], ["waved", "fun", "face"], ["clapped", "fun", "sound"],
    ["sang", "fun", "sound"], ["climbed", "climb", "motion"], ["swam", "swim", "motion"],
    ["slept", "animal", "rest"], ["ate", "animal", "eat"], ["ran", "animal", "motion"],
    ["hopped", "hop", "motion"], ["barked", "bark", "sound"], ["meowed", "meow", "sound"],
    ["glowed", "glow", "glow"]
  ];

  // [word, kinds of action it fits]
  const ADV = [
    ["quickly", "motion eat"], ["slowly", "motion eat"], ["happily", "motion sound eat face rest"],
    ["loudly", "sound"], ["quietly", "motion sound eat face rest glow"], ["bravely", "motion"],
    ["sleepily", "motion eat face sound"], ["politely", "eat sound face"],
    ["brightly", "glow"], ["softly", "sound rest glow face"]
  ];

  const list = s => T(s).map(w => ({ w }));

  const WORDS = {
    noun:   NOUNS.map(([w, e, t]) => ({ w, e, tags: T(t) })),
    plural: NOUNS.map(([w, e, t]) => ({ w: plural(w), e, tags: T(t) })),
    adj:    ADJ.map(([w, n]) => ({ w, n: T(n) })),
    verb:   VERB.map(([w, n, k]) => ({ w, n: T(n), k: [k] })),
    past:   PAST.map(([w, n, k]) => ({ w, n: T(n), k: [k] })),
    adv:    ADV.map(([w, a]) => ({ w, a: T(a) })),
    prep:   list("under behind beside near over above beneath"),
    conj:   list("because although unless while when")
  };

  // Wrong answers for a slot come from these types (clearly wrong in that spot).
  const CONFUSE_EASY = { noun: ["adj", "verb"], adj: ["noun", "verb"], verb: ["noun", "adj"] };
  const CONFUSE = {
    noun:   ["verb", "prep"],
    plural: ["verb", "adv", "past"],
    adj:    ["verb", "adv"],
    verb:   ["noun", "adj", "adv"],
    past:   ["adj", "adv", "noun"],
    adv:    ["verb", "noun", "conj"],
    prep:   ["conj", "adv", "noun"],
    conj:   ["prep", "adj", "noun"]
  };

  const LEVELS = [
    {
      id: "beginner", name: "Beginner", icon: "🌱", desc: "Nouns, adjectives and verbs", confuse: CONFUSE_EASY,
      stories: [
        "I see a {adj} {noun}.",
        "The {noun} is very {adj}.",
        "A {noun:doer} {verb} all day.",
        "My {adj} {noun:doer} likes to play.",
        "The {noun} {verb} every day.",
        "Look! The {adj} {noun} {verb}!",
        "Today I met a {adj} {noun:doer}.",
        "The {adj} {noun} {verb} at night.",
        "A {noun:animal} and a {noun:animal} are best friends.",
        "The {adj} {noun} {verb} and {verb}."
      ]
    },
    {
      id: "intermediate", name: "Intermediate", icon: "🚀", desc: "Plurals, past tense and adverbs", confuse: CONFUSE,
      stories: [
        "Yesterday, the {noun:doer} {past}.",
        "Many {adj} {plural:animal} like to play.",
        "Yesterday, the {noun:doer} {past} {adv}.",
        "Two {adj} {plural:doer} {past} yesterday.",
        "Last night, my {noun:doer} {past} {adv}.",
        "Last week, the {plural:doer} {past} {adv}.",
        "On Sunday, my {adj} {noun:animal} {past} {adv}.",
        "Every morning, the {adj} {noun} {verb}.",
        "Last year, the {adj} {noun:doer} {past} {adv}.",
        "Yesterday, the {adj} {plural:doer} {past} {adv}."
      ]
    },
    {
      id: "expert", name: "Expert", icon: "👑", desc: "Prepositions and conjunctions", confuse: CONFUSE,
      stories: [
        "The {noun:doer} hid {prep=under|behind|beside|near} the box.",
        "A {adj} {noun:doer} sat {prep=beside|behind|near|under} the tree.",
        "I was happy {conj=because|when|while} the {noun:doer} danced.",
        "The {noun:doer} jumped {prep=over|beside|behind|near} the {noun}.",
        "We ate {plural:food} {conj=while|when} we played games.",
        "The {noun:doer} walked {adv=quickly|slowly|happily|quietly|bravely|sleepily} {prep=beside|behind|near|under} the bridge.",
        "{conj=because|although|when} it rained, the {noun:doer} {past}.",
        "The {noun:doer} {past} {adv} because it was late.",
        "{conj=although|when|because} the {noun:doer} was {adj}, we {past=danced|laughed|smiled|clapped|sang|waved}.",
        "The {adj} {noun:doer} {past=jumped|ran|slept|hopped|danced|barked|meowed} {prep=under|behind|beside|near} the box."
      ]
    }
  ];

  return { TYPES, TAGHINT, WORDS, LEVELS };
})();
