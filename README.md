# Pinky Math Sprint

A free, kid-friendly math game website. Pure HTML, CSS and JavaScript: no build tools, no framework, no image files.

## Run it
Open `index.html` in a browser (double-click works). The game needs internet only for the Google Font; without it, a fallback font is used.

## Structure
```
pinky-games/
├── index.html        Landing page and all screens
├── css/
│   └── style.css     Pink theme, layout, animations
└── js/
    ├── config.js     Helpers and settings (levels, stages, scoring)
    ├── questions.js  Question and answer generator
    ├── storage.js    Best scores saved in the browser
    ├── effects.js    Star bursts, floating text, background bubbles
    └── game.js       Screens, game flow, timer, score
```
Scripts are loaded in this order (see the bottom of `index.html`).

## Common changes
- Timer per level and number of stages: `js/config.js`
- Points per answer and speed bonus: `js/config.js` (`BASE`, `BONUS`)
- Difficulty of each level: `js/questions.js` (`makeQ`)
- Colors: the `:root` variables at the top of `css/style.css`

## Free hosting
Upload the folder to GitHub Pages, Netlify, or Cloudflare Pages.
