/**
 * questions.js
 * Generates a math question for a level and stage, and builds the answer choices.
 */
function makeQ(lv,s){
  if(lv===0){
    const m=8+s*2;
    if(s>=3&&Math.random()<.5){const x=r(Math.ceil(m/2),m),y=r(1,x);return{t:x+" − "+y,a:x-y};}
    const a=r(1,m),b=r(1,m);return{t:a+" + "+b,a:a+b};
  }
  if(lv===1){
    if(s<=3){const m=10*s+30,a=r(10,m),b=r(10,m);
      return Math.random()<.5?{t:a+" + "+b,a:a+b}:{t:Math.max(a,b)+" − "+Math.min(a,b),a:Math.abs(a-b)};}
    if(s<=7){const a=r(2,s+2),b=r(2,9);return{t:a+" × "+b,a:a*b};}
    if(Math.random()<.5){const a=r(6,12),b=r(3,12);return{t:a+" × "+b,a:a*b};}
    const q=r(2,12),d=r(2,9);return{t:q*d+" ÷ "+d,a:q};
  }
  const f=r(0,s<=3?1:3);
  if(f===0){const a=r(2,5+(s>>1)),b=r(2,9),c=r(1,10+s*2);return{t:a+" × "+b+" + "+c,a:a*b+c};}
  if(f===1){const a=r(2,9),b=r(2,9),c=r(2,3+(s>>1));return{t:"("+a+" + "+b+") × "+c,a:(a+b)*c};}
  if(f===2){const a=r(3,9),b=r(3,9),c=r(1,a*b-1);return{t:a+" × "+b+" − "+c,a:a*b-c};}
  const q=r(2,12),d=r(2,9),c=r(1,20);return{t:q*d+" ÷ "+d+" + "+c,a:q+c};
}
function options(ans){
  const set=new Set([ans]);let g=0;
  while(set.size<4&&g++<60){const v=ans+r(1,Math.max(3,Math.ceil(ans*.2)))*(Math.random()<.5?-1:1);if(v>=0)set.add(v);}
  let i=1;while(set.size<4)set.add(ans+i++);
  return[...set].sort(()=>Math.random()-.5);
}

