/* Diretor de sustos: câmera, luz e áudio em pulsos curtos sem alterar yaw/pitch do jogador. */
(function(root){
"use strict";
let remaining=0,intensity=0,phase=0,nextFake=62+Math.random()*24,lastReal=0;
function trigger(power=.65,duration=.72){intensity=Math.max(intensity,Math.max(0,Math.min(1,power)));remaining=Math.max(remaining,duration);phase=0;lastReal=performance.now()/1000}
function fakeEvent(){
 if(lv<2||state!=="play"||paused||attackSequence||remaining>0)return;
 const kind=Math.floor(Math.random()*4);
 if(kind===0){flick=Math.max(flick,.18);th(58,.32,.2);sub("A luz falhou. Por um instante, havia alguém no corredor.",2100)}
 else if(kind===1){at(pl.x+Math.sin(pl.y+Math.PI/2)*6,pl.z+Math.cos(pl.y+Math.PI/2)*6,q=>nz(.8,170,.24,q,"lowpass"));sub("Um passo ecoa atrás de você.",1700)}
 else if(kind===2){th(42,.45,.18);if(root.GameAudio)root.GameAudio.play("door",{volume:.28,position:{x:pl.x-Math.sin(pl.y)*4,y:1,z:pl.z-Math.cos(pl.y)*4}})}
 else{const overlay=document.getElementById("dg");if(overlay){overlay.style.opacity=".28";setTimeout(()=>{if(state==="play")overlay.style.opacity="0"},110)}}
}
const originalAppar=appar;
appar=function(){originalAppar();trigger(.72,.8)};
const originalAttack=startAttack;
startAttack=function(){originalAttack();trigger(1,1.05)};
const originalUpdate=upd;
upd=function(dt){
 originalUpdate(dt);
 if(state!=="play"||paused)return;
 if(remaining>0){
  remaining=Math.max(0,remaining-dt);phase+=dt*34;
  const envelope=Math.min(1,remaining/.18)*Math.min(1,(1.05-remaining)/.12+1);
  const shake=intensity*envelope;
  if(camera){camera.rotation.x+=Math.sin(phase)*.012*shake;camera.rotation.y+=Math.cos(phase*.83)*.009*shake;camera.rotation.z+=Math.sin(phase*.61)*.006*shake}
  const overlay=document.getElementById("dg");if(overlay)overlay.style.opacity=String(Math.max(Number(overlay.style.opacity)||0,shake*.22));
  intensity=Math.max(0,intensity-dt*.45);
 }else intensity=0;
 nextFake-=dt;if(nextFake<=0){nextFake=58+Math.random()*48;fakeEvent()}
};
root.GameScareDirector=Object.freeze({trigger});
})(typeof window!=="undefined"?window:globalThis);
