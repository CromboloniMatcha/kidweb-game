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
│   └── mix.css         Extra styles for Mix Master
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
    └── mix/
        ├── engine.js   Mix Master: problem generators (3 levels x 8 topics), answer checking
        └── game.js     Mix Master: mixed order, typed answers, comeback problems, scoring
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
- Colors: the `:root` variables at the top of `css/style.css` (light theme) and the dark-mode block right below it. The site follows the visitor's device setting.

## Free hosting
Upload the folder to GitHub Pages, Netlify, or Cloudflare Pages.
