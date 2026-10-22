/**
 * effects.js
 * Fun visual effects: star bursts, floating score text, background bubbles.
 */
function burst(el,n=12){
  if(!el)return;const b=el.getBoundingClientRect(),em=["⭐","💖","✨","🌸"];
  for(let i=0;i<n;i++){
    const s=document.createElement("span");s.className="spark";s.textContent=em[i%4];
    s.style.left=(b.left+b.width/2)+"px";s.style.top=(b.top+b.height/2)+"px";
    s.style.setProperty("--dx",r(-140,140)+"px");s.style.setProperty("--dy",r(-160,-20)+"px");
    document.body.appendChild(s);setTimeout(()=>s.remove(),1000);
  }
}
function floatText(t,el){
  if(!el)return;const b=el.getBoundingClientRect(),p=document.createElement("div");
  p.className="plus";p.textContent=t;p.style.left=(b.left+b.width/2-20)+"px";p.style.top=(b.top-10)+"px";
  document.body.appendChild(p);setTimeout(()=>p.remove(),900);
}
(function bubbles(){
  const em=["💖","⭐","🌸","✨","🎀","🍭"],bg=$("bg");
  for(let i=0;i<14;i++){
    const s=document.createElement("span");s.textContent=em[i%em.length];
    s.style.left=r(2,95)+"%";s.style.fontSize=r(16,34)+"px";
    s.style.animationDuration=r(12,24)+"s";s.style.animationDelay="-"+r(0,20)+"s";
    bg.appendChild(s);
  }
})();
