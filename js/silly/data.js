/**
 * silly/data.js
 * Word types, word lists and story templates for Silly Sentence Lab.
 *
 * A story is a sentence with {slots}. The kid fills each slot with a word of the
 * right type (noun, adjective, ...). Any word of the right type makes a correct,
 * but silly, sentence.
 *
 * Tips for adding words: keep them unambiguous (not both a noun and a verb) and
 * start nouns/adjectives with a consonant so "a ___" always sounds right.
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

  // [word, emoji]. The emoji pops up when the sentence is finished.
  const NOUNS = [
    ["dog", "🐶"], ["cat", "🐱"], ["pizza", "🍕"], ["robot", "🤖"], ["dragon", "🐉"],
    ["banana", "🍌"], ["monkey", "🐵"], ["rocket", "🚀"], ["cake", "🍰"], ["ghost", "👻"],
    ["penguin", "🐧"], ["balloon", "🎈"], ["tiger", "🐯"], ["rabbit", "🐰"], ["cookie", "🍪"]
  ];
  const list = s => s.split(" ").map(w => ({ w }));

  const WORDS = {
    noun:   NOUNS.map(([w, e]) => ({ w, e })),
    plural: NOUNS.map(([w, e]) => ({ w: w + "s", e })),
    adj:    list("happy tiny sleepy funny shiny noisy brave fluffy silly sparkly clever lazy jolly speedy tall"),
    verb:   list("sings sleeps swims jumps eats glows"),
    past:   list("jumped danced laughed smiled waved climbed kicked clapped hugged sang swam"),
    adv:    list("quickly slowly happily loudly quietly bravely sleepily politely"),
    prep:   list("under behind beside over above beneath"),
    conj:   list("because although unless while when")
  };

  // Wrong answers for a slot come from these types (chosen so they are clearly wrong).
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
        "A {noun} {verb} in the park.",
        "My {adj} {noun} likes to play.",
        "The {noun} {verb} every day.",
        "Look! The {adj} {noun} {verb}!",
        "Today I met a {adj} {noun}.",
        "The {adj} {noun} {verb} loudly.",
        "A {noun} and a {noun} are best friends.",
        "The {adj} {noun} {verb} and {verb}."
      ]
    },
    {
      id: "intermediate", name: "Intermediate", icon: "🚀", desc: "Plurals, past tense and adverbs", confuse: CONFUSE,
      stories: [
        "Yesterday, the {noun} {past}.",
        "Many {plural} live in the {noun}.",
        "Yesterday, the {noun} {past} {adv}.",
        "Two {adj} {plural} {past} yesterday.",
        "Last night, my {noun} {past} {adv}.",
        "Last week, the {plural} {past} {adv} at the party.",
        "Last Sunday, my {adj} {noun} {past} with three {plural}.",
        "Every morning, the {adj} {noun} {verb}.",
        "Last year, the {adj} {noun} {past} {adv}.",
        "Yesterday, the {adj} {plural} {past} {adv}."
      ]
    },
    {
      id: "expert", name: "Expert", icon: "👑", desc: "Prepositions and conjunctions", confuse: CONFUSE,
      stories: [
        "The {noun} hid {prep} the box.",
        "A {adj} {noun} sat {prep} the tree.",
        "I was happy {conj} the {noun} danced.",
        "The {noun} jumped {prep} the {noun}.",
        "We ate {noun} {conj} we played games.",
        "The {noun} walked {adv} {prep} the bridge.",
        "{conj} it rained, the {noun} {past}.",
        "The {noun} {past} {adv} because it was late.",
        "{conj} the {noun} was {adj}, we {past}.",
        "The {adj} {noun} {past} {prep} the box."
      ]
    }
  ];

  return { TYPES, WORDS, LEVELS };
})();
