/* Aparição do duplo de Anderson no capítulo final.
 * Usa o modelo próprio sem alterar a câmera ou o corpo FPS do jogador. */
(function(root){
"use strict";
let model=null,revealed=false,vanished=false,fade=0;
function findPosition(){
 const candidates=[];
 for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++){
  if(ch(r,c)!==".")continue;
  const x=c*4,z=r*4,d=Math.hypot(x-pl.x,z-pl.z);
  if(d<8||d>22||Math.hypot(x-ex.x,z-ex.z)<5)continue;
  if(physics.overlapsCircle(x,z,.48)||!los(pl.x,pl.z,x,z))continue;
  candidates.push({x,z,d});
 }
 candidates.sort((a,b)=>Math.abs(a.d-14)-Math.abs(b.d-14));
 return candidates[0]||null;
}
function create(){
 model=null;revealed=false;vanished=false;fade=0;
 if(lv!==14||!root.GameModels||!root.GameModels.createAnderson)return;
 const p=findPosition();if(!p)return;
 model=root.GameModels.createAnderson(THREE);
 model.position.set(p.x,0,p.z);
 model.rotation.y=Math.atan2(pl.x-p.x,pl.z-p.z);
 model.scale.setScalar(.96);
 model.visible=false;
 model.traverse(o=>{
  if(!o.isMesh||!o.material)return;
  o.material=o.material.clone();o.material.transparent=true;o.material.opacity=0;o.material.depthWrite=false;
 });
 scene.add(model);
}
function update(dt){
 if(!model||vanished||state!=="play")return;
 if(!revealed&&pl.got>=Math.max(1,pl.need-1)){
  revealed=true;model.visible=true;fade=0;
  sub("Há alguém com o seu rosto perto do altar.",4200);
  th(54,.8,.48);scheduleAudio(()=>{if(AC&&mg)nz(.8,520,.35,mg,"bandpass")},260);
 }
 if(!revealed)return;
 fade=Math.min(1,fade+dt*.72);
 model.traverse(o=>{if(o.isMesh&&o.material)o.material.opacity=fade});
 const dx=pl.x-model.position.x,dz=pl.z-model.position.z,d=Math.hypot(dx,dz);
 model.rotation.y=Math.atan2(dx,dz);
 root.GameModels.updateAnderson(model,dt,d<9?"walk":"idle");
 if(d<4.2){
  vanished=true;model.visible=false;
  sub("O reflexo desapareceu. Você continua ouvindo seus passos.",3800);
  th(68,.55,.5);scheduleAudio(()=>{if(AC&&mg)nz(.65,170,.4,mg,"lowpass")},120);
 }
}
const originalBuild=build;
build=function(n){originalBuild(n);create()};
const originalUpdate=upd;
upd=function(dt){originalUpdate(dt);update(dt)};
root.GameAndersonEncounter=Object.freeze({isPresent:()=>!!model,isRevealed:()=>revealed});
})(typeof window!=="undefined"?window:globalThis);
