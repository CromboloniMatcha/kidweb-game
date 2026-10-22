/**
 * config.js
 * Shared helpers and game settings (levels, stages, scoring).
 */
const $=id=>document.getElementById(id);
const r=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[r(0,a.length-1)];
const LV=[
 {id:"beginner",name:"Beginner",icon:"🌱",desc:"Adding and subtracting small numbers",time:20},
 {id:"intermediate",name:"Intermediate",icon:"🚀",desc:"Times tables and bigger numbers",time:15},
 {id:"expert",name:"Expert",icon:"👑",desc:"Mixed challenges with two steps",time:15}
];
const STAGES=10,BASE=10,BONUS=5;
