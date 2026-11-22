/* Áudio externo licenciado + áudio procedural do jogo.
 * Os arquivos SFXMint são CC0 1.0 e servidos como MP3 hotlinkáveis.
 * O catálogo SFXMint informa que esses efeitos são gerados por IA/procedimento:
 * não são apresentados como gravações ou falas originais dos personagens.
 */
(function(root){
"use strict";
const sources={
 ambience:"https://sfxmint.com/dl/horror-ambience-dark-81.mp3",
 wind:"https://sfxmint.com/dl/horror-wind-whisper-56.mp3",
 stinger:"https://sfxmint.com/dl/horror-stinger-54.mp3",
 valdireneScream:"https://sfxmint.com/dl/female-scream-01.mp3",
 andersonScream:"https://sfxmint.com/dl/male-pain-scream-02.mp3",
 breathing:"https://sfxmint.com/dl/nervous-breathing-02.mp3",
 door:"https://sfxmint.com/dl/door-creak-01.mp3",
 footstep:"https://sfxmint.com/dl/footsteps-concrete-75.mp3",
 growl:"https://sfxmint.com/dl/horror-growl-11.mp3"
};
const cache=new Map();
let ambienceName=null,lastBreath=0,lastWind=0,lastStep=0,master=.8;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function get(name){
 if(!sources[name])return null;
 let entry=cache.get(name);if(entry)return entry;
 const audio=new Audio();audio.crossOrigin="anonymous";audio.preload="auto";audio.src=sources[name];audio.volume=.7;
 entry={audio,source:null,panner:null,gain:null,failed:false};
 audio.addEventListener("error",()=>{entry.failed=true});
 cache.set(name,entry);return entry;
}
function connect(entry){
 if(entry.source||!AC||!mg)return;
 try{
  const source=AC.createMediaElementSource(entry.audio),gain=AC.createGain();
  source.connect(gain);
  if(AC.createPanner){
   const panner=AC.createPanner();panner.panningModel="HRTF";panner.distanceModel="inverse";
   panner.refDistance=1;panner.maxDistance=32;panner.rolloffFactor=1.25;
   gain.connect(panner);panner.connect(mg);entry.panner=panner;
  }else gain.connect(mg);
  entry.source=source;entry.gain=gain;
 }catch(error){entry.failed=true}
}
function setPosition(entry,position){
 if(!entry.panner||!position)return;
 const p=entry.panner;
 if(p.positionX){p.positionX.setValueAtTime(position.x,AC.currentTime);p.positionY.setValueAtTime(position.y||0,AC.currentTime);p.positionZ.setValueAtTime(position.z,AC.currentTime)}
 else p.setPosition(position.x,position.y||0,position.z);
}
function play(name,options={}){
 const entry=get(name);if(!entry||entry.failed)return false;
 const audio=entry.audio;
 try{
  if(AC&&AC.state==="suspended")AC.resume();
  connect(entry);setPosition(entry,options.position);
  audio.pause();audio.currentTime=0;audio.loop=!!options.loop;
  audio.volume=clamp((options.volume===undefined?.65:options.volume)*master*(typeof S!=="undefined"?S.vol:1),0,1);
  const result=audio.play();if(result&&result.catch)result.catch(()=>{});
  return true;
 }catch(error){return false}
}
function stop(name){
 const entry=cache.get(name);if(!entry)return;
 entry.audio.pause();entry.audio.currentTime=0;entry.audio.loop=false;
}
function stopAll(){for(const name of cache.keys())stop(name)}
function unlock(){
 try{if(typeof ai==="function")ai();if(AC&&AC.state==="suspended")AC.resume()}catch(error){}
}
function startLevel(level){
 stop("ambience");stop("wind");ambienceName="ambience";
 play("ambience",{loop:true,volume:level>=10?.18:.13});
 lastWind=performance.now()+18000+Math.random()*16000;
}
function update(){
 if(AC&&AC.listener&&camera&&typeof THREE!=="undefined"){
  const listener=AC.listener,pos=camera.getWorldPosition(new THREE.Vector3()),forward=camera.getWorldDirection(new THREE.Vector3());
  if(listener.positionX){listener.positionX.setValueAtTime(pos.x,AC.currentTime);listener.positionY.setValueAtTime(pos.y,AC.currentTime);listener.positionZ.setValueAtTime(pos.z,AC.currentTime);listener.forwardX.setValueAtTime(forward.x,AC.currentTime);listener.forwardY.setValueAtTime(forward.y,AC.currentTime);listener.forwardZ.setValueAtTime(forward.z,AC.currentTime);listener.upX.setValueAtTime(0,AC.currentTime);listener.upY.setValueAtTime(1,AC.currentTime);listener.upZ.setValueAtTime(0,AC.currentTime)}
  else listener.setPosition(pos.x,pos.y,pos.z);
 }
 if(state!=="play"||paused)return;
 const now=performance.now(),speed=Math.hypot(pl.mx||0,pl.mz||0);
 if(!pl.hid&&speed>.8&&now-lastStep>(pl.run?340:pl.crouch?850:570)){
  lastStep=now;play("footstep",{volume:pl.run?.32:.22,position:{x:pl.x,y:.1,z:pl.z}});
 }
 const fear=pl.fear||0;
 if(fear>.48&&now-lastBreath>Math.max(1700,3700-fear*1500)){
  lastBreath=now;play("breathing",{volume:.28+fear*.2,position:{x:pl.x,y:1.4,z:pl.z}});
 }
 if(now>lastWind&&fear<.75){
  lastWind=now+42000+Math.random()*36000;
  const a=pl.y+(Math.random()-.5)*2.5,r=5+Math.random()*7;
  play("wind",{volume:.2,position:{x:pl.x+Math.sin(a)*r,y:1,z:pl.z+Math.cos(a)*r}});
 }
}
function setMaster(value){master=clamp(Number(value)||0,0,1)}
document.addEventListener("pointerdown",unlock,{once:true,capture:true});
document.addEventListener("keydown",unlock,{once:true,capture:true});
root.GameAudio=Object.freeze({play,stop,stopAll,unlock,startLevel,update,setMaster,sources});
const originalBuild=build;
build=function(n){originalBuild(n);startLevel(n)};
const originalDoor=odoor;
odoor=function(door,open){originalDoor(door,open);play("door",{volume:.52,position:{x:door.x,y:1,z:door.z}})};
const originalAppar=appar;
appar=function(){play("valdireneScream",{volume:.8,position:{x:V.x,y:1.5,z:V.z}});play("stinger",{volume:.6});originalAppar()};
const originalAttack=startAttack;
startAttack=function(){play("valdireneScream",{volume:.95,position:{x:V.x,y:1.5,z:V.z}});play("stinger",{volume:.78});originalAttack()};
const originalUpd=upd;
upd=function(dt){originalUpd(dt);update()};
})(typeof window!=="undefined"?window:globalThis);
