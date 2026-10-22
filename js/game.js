/**
 * game.js
 * Screens, game flow, timer and scoring.
 */
let S = {}; // current game state

function show(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));
  if(id==="levels")renderLevels();
  window.scrollTo(0,0);
}
function renderLevels(){
  const best=loadBest();
  $("levelList").innerHTML=LV.map((l,i)=>{
    const b=best[l.id];
    return `<button class="lcard" data-i="${i}"><span class="ic">${l.icon}</span><span><b>${l.name}</b><small>${l.desc}</small><small>⏱ ${l.time} seconds per stage</small><span class="best">${b?starText(b.stars)+" Best: "+b.score:"☆☆☆ Not played yet"}</span></span></button>`;
  }).join("");
}
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]");if(g)show(g.dataset.go);
  const c=e.target.closest(".lcard");if(c)startLevel(+c.dataset.i);
});
$("quit").onclick=()=>{clearInterval(S.tm);clearTimeout(S.nx);show("levels");};
$("again").onclick=()=>startLevel(S.i);

/* ---------- game ---------- */
function startLevel(i){
  clearInterval(S.tm);clearTimeout(S.nx);
  S={i,stage:0,score:0,ok:0,locked:true,hist:[]};
  $("lvName").textContent=LV[i].icon+" "+LV[i].name;
  $("score").textContent=0;
  show("game");nextStage();
}
function drawDots(){
  $("dots").innerHTML=Array.from({length:STAGES},(_,k)=>{
    const h=S.hist[k];return `<i class="${h===undefined?(k+1===S.stage?"cur":""):(h?"ok":"bad")}"></i>`;
  }).join("");
}
function say(t,cls){
  $("say").textContent=t;const m=$("mascot");
  m.classList.remove("hop","sad");void m.offsetWidth;if(cls)m.classList.add(cls);
}
function nextStage(){
  S.stage++;
  if(S.stage>STAGES)return finish();
  S.q=makeQ(S.i,S.stage);S.locked=false;
  $("stg").textContent="Stage "+S.stage+" of "+STAGES;
  const q=$("q");q.textContent=S.q.t+" = ?";q.classList.remove("pop");void q.offsetWidth;q.classList.add("pop");
  $("ans").innerHTML=options(S.q.a).map(o=>`<button class="ans" data-v="${o}">${o}</button>`).join("");
  document.querySelectorAll(".ans").forEach(b=>b.onclick=()=>answer(+b.dataset.v,b));
  drawDots();
  if(S.stage===1)say("Ready? Let’s go!");
  S.total=LV[S.i].time;S.left=S.total;
  clearInterval(S.tm);tick();
  S.tm=setInterval(()=>{S.left=Math.max(0,S.left-.1);tick();if(S.left<=0)answer(null,null);},100);
}
function tick(){
  $("bar").style.width=(S.left/S.total*100)+"%";
  $("bar").classList.toggle("low",S.left<=5);
  $("sec").textContent=Math.ceil(S.left)+"s";
}
function answer(v,btn){
  if(S.locked)return;S.locked=true;clearInterval(S.tm);
  const ok=v===S.q.a;S.hist.push(ok);
  document.querySelectorAll(".ans").forEach(b=>{b.disabled=true;if(+b.dataset.v===S.q.a)b.classList.add("right");});
  if(ok){
    const pts=BASE+Math.round(BONUS*S.left/S.total);
    S.score+=pts;S.ok++;$("score").textContent=S.score;
    say(pick(["Great job!","You did it!","Super star!","Yay, correct!"]),"hop");
    burst(btn);floatText("+"+pts,btn);
  }else{
    if(btn)btn.classList.add("wrong");
    say(v===null?"Time’s up! Next one!":"Oops! Try the next one!","sad");
  }
  drawDots();
  S.nx=setTimeout(nextStage,1400);
}
function finish(){
  const stars=S.ok>=8?3:S.ok>=5?2:1;
  saveBest(LV[S.i].id,S.score,stars);
  $("resTitle").textContent=stars===3?"Amazing!":stars===2?"Great work!":"Nice try!";
  $("resStars").innerHTML=[0,1,2].map(k=>`<span style="animation-delay:${k*.25}s">${k<stars?"⭐":"☆"}</span>`).join("");
  $("resScore").textContent=S.score;
  $("resInfo").textContent="You got "+S.ok+" out of "+STAGES+" right on "+LV[S.i].name+".";
  show("result");
  setTimeout(()=>{if(stars>1)burst($("resStars"),24);},300);
}

