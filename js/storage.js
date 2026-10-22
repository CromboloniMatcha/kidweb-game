/**
 * storage.js
 * Saves and loads best scores in the browser (localStorage).
 */
function loadBest(){try{return JSON.parse(localStorage.getItem("pinkMath"))||{}}catch(e){return{}}}
function saveBest(id,score,stars){try{const b=loadBest();if(!b[id]||score>b[id].score){b[id]={score,stars};localStorage.setItem("pinkMath",JSON.stringify(b));}}catch(e){}}
const starText=n=>"⭐".repeat(n)+"☆".repeat(3-n);

