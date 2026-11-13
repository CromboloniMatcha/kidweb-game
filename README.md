# Sapio Lab

A free brain-game website for kids, teens and students. Pure HTML, CSS and JavaScript. Pure HTML, CSS and JavaScript: no build tools, no framework, no image files.

## Run it
Open `index.html` in a browser (double-click works). The game needs internet only for the Google Font; without it, a fallback font is used.

## Structure
```
sapio-lab/
├── index.html          Landing page, game picker and all screens
├── css/
│   ├── style.css       Theme (light + dark), layout, animations (shared + Math Sprint)
│   ├── silly.css       Extra styles for Silly Sentence Lab
│   ├── detective.css   Extra styles for Argument Detective
│   ├── pattern.css     Extra styles for Pattern Puzzle
│   ├── shapeshift.css  Extra styles for Shape Shifter
│   ├── mix.css         Extra styles for Mix Master
│   ├── bias.css        Extra styles for Bias Buster
│   └── odds.css        Extra styles for Odds Lab
└── js/
    ├── config.js       Helpers and settings (levels, stages, scoring)
    ├── questions.js    Math Sprint: question and answer generator
    ├── storage.js      Math Sprint: best scores saved in the browser
    ├── effects.js      Star bursts, floating text, background bubbles
    ├── game.js         Math Sprint: screens, game flow, timer, score
    ├── silly/
    │   ├── data.js     Silly Sentence Lab: word lists (with meaning tags) and sentence templates
    │   ├── engine.js   Silly Sentence Lab: keeps sentences sensible, builds answer choices
    │   └── game.js     Silly Sentence Lab: game flow and scoring
    ├── detective/
    │   ├── data.js     Argument Detective: fallacies and case files
    │   └── game.js     Argument Detective: game flow and scoring
    ├── pattern/
    │   ├── engine.js   Pattern Puzzle: pattern generators, levels and answer pieces
    │   └── game.js     Pattern Puzzle: game flow and scoring
    ├── shapeshift/
    │   ├── engine.js   Shape Shifter: 2D and 3D shapes, turning, mirror images, puzzle generators
    │   └── game.js     Shape Shifter: drawing (SVG made in code), game flow and scoring
    ├── mix/
    │   ├── engine.js   Mix Master: problem generators (3 levels x 8 topics), answer checking
    │   └── game.js     Mix Master: mixed order, typed answers, comeback problems, scoring
    ├── bias/
    │   ├── data.js     Bias Buster: biases and case files
    │   └── game.js     Bias Buster: game flow and scoring
    ├── odds/
    │   ├── engine.js   Odds Lab: puzzle generators (frequency trees, risk, expected value, two tests)
    │   └── game.js     Odds Lab: guided steps, frequency tree, scoring
    └── i18n/
        ├── i18n.js          Language switch (translator, page translation, overlays)
        ├── id.ui.js         Indonesian: interface, level texts, kids games, feedback lines
        ├── id.engines.js    Indonesian: Mix Master and Odds Lab problem templates
        ├── id.detective.js  Indonesian: Argument Detective case files
        ├── id.bias.js       Indonesian: Bias Buster case files
        └── boot.js          Starts the language switch (load last)
```
Scripts are loaded in this order (see the bottom of `index.html`).

## Common changes
- Timer per level and number of stages: `js/config.js`
- Points per answer and speed bonus: `js/config.js` (`BASE`, `BONUS`)
- Difficulty of each level: `js/questions.js` (`makeQ`)
- New sentences or words for Silly Sentence Lab: `js/silly/data.js`
- New cases for Argument Detective: `js/detective/data.js`
- Pattern types and levels for Pattern Puzzle: `js/pattern/engine.js` (`LEVELS`)
- Puzzle types and levels for Shape Shifter: `js/shapeshift/engine.js` (`LEVELS`)
- Topics and problem types for Mix Master: `js/mix/engine.js` (`L1`, `L2`, `L3`)
- New biases or cases for Bias Buster: `js/bias/data.js`
- Puzzle types and numbers for Odds Lab: `js/odds/engine.js` (`LEVELS`)
- Colors: the `:root` variables at the top of `css/style.css` (light theme) and the dark-mode block right below it. The site follows the visitor's device setting.

## Languages
The site has an English / Bahasa Indonesia switch (button at the top right). It starts in the visitor's
browser language and remembers the choice.
- **How it works:** `js/i18n/i18n.js` translates the page in place. Dictionaries map the English text to the
  translation, for example `"Play again": "Main lagi"`. In a key, `{name}` matches any text and `{#n}` matches
  digits, so `"Puzzle {#n} of {#m}": "Teka-teki {n} dari {m}"` also works for numbers. Games need no changes.
- **Edit or add a translation:** change the right side in `id.ui.js` (screens and messages) or `id.engines.js`
  (Mix Master and Odds Lab problems). The case files of Argument Detective and Bias Buster are in `id.detective.js`
  and `id.bias.js`, in the same order as `js/detective/data.js` and `js/bias/data.js`.
- **New text in a game:** if you add English text, add its Indonesian version to a dictionary. Untranslated
  text simply stays in English.
- **Silly Sentence Lab** teaches English, so its sentences and words stay in English. The instructions and the
  explanations of word types are in Indonesian.
- **Another language:** copy the `id.*` files, translate the right sides, register them with another language
  code, and add the language to the switch in `i18n.js`.

## Free hosting
Upload the folder to GitHub Pages, Netlify, or Cloudflare Pages.
