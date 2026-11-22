/* Objetivos específicos por capítulo. Cada etapa exige uma sequência interativa
 * própria e bloqueia a saída até o puzzle ser concluído. */
(function(root){
"use strict";
const definitions=[
 {title:"Reconstruir o código do quadro",hint:"Ative os terminais na ordem 2 → 1 → 3.",kind:"terminal",labels:["TERMINAL 2","TERMINAL 1","TERMINAL 3"]},
 {title:"Restaurar os circuitos do corredor",hint:"Religue os circuitos na ordem VERMELHO → AZUL → BRANCO.",kind:"breaker",labels:["VERMELHO","AZUL","BRANCO"]},
 {title:"Rastrear o enxoval desaparecido",hint:"Confira as etiquetas na ordem CORREDOR → DEPÓSITO → CAIXA.",kind:"tag",labels:["CORREDOR","DEPÓSITO","CAIXA"]},
 {title:"Rastrear a ligação do quarto 13",hint:"Ative os pontos RECEPÇÃO → QUARTO 13 → CENTRAL.",kind:"phone",labels:["RECEPÇÃO","QUARTO 13","CENTRAL"]},
 {title:"Reacender o altar",hint:"Acenda os suportes na ordem NORTE → CENTRO → SUL.",kind:"altar",labels:["NORTE","CENTRO","SUL"]},
 {title:"Liberar o prédio vazio",hint:"Desbloqueie os leitores A → C → B.",kind:"card",labels:["LEITOR A","LEITOR C","LEITOR B"]},
 {title:"Encontrar a chamada correta",hint:"Confira os registros SALA 3 → BIBLIOTECA → DIRETORIA.",kind:"book",labels:["SALA 3","BIBLIOTECA","DIRETORIA"]},
 {title:"Reativar a ala clínica",hint:"Ajuste os controles OXIGÊNIO → PRESSÃO → ENERGIA.",kind:"medical",labels:["OXIGÊNIO","PRESSÃO","ENERGIA"]},
 {title:"Restaurar a saída do estacionamento",hint:"Recoloque os fusíveis F2 → F1 → F3.",kind:"fuse",labels:["FUSÍVEL F2","FUSÍVEL F1","FUSÍVEL F3"]},
 {title:"Liberar a plataforma",hint:"Alinhe os sinais LINHA 2 → LINHA 1 → LINHA 3.",kind:"signal",labels:["LINHA 2","LINHA 1","LINHA 3"]},
 {title:"Preparar a saída da festa",hint:"Confira os convites MESA 4 → MESA 1 → PALCO.",kind:"invite",labels:["MESA 4","MESA 1","PALCO"]},
 {title:"Abrir a rota do hotel",hint:"Gire os seletores 13 → 08 → 01.",kind:"hotel",labels:["QUARTO 13","QUARTO 08","QUARTO 01"]},
 {title:"Controlar a pressão do subsolo",hint:"Abra as válvulas A → C → B.",kind:"valve",labels:["VÁLVULA A","VÁLVULA C","VÁLVULA B"]},
 {title:"Reunir as pulseiras",hint:"Valide as pulseiras BERÇÁRIO → ALA 2 → RECEPÇÃO.",kind:"bracelet",labels:["BERÇÁRIO","ALA 2","RECEPÇÃO"]},
 {title:"Completar o ritual invertido",hint:"Ative os símbolos LUA → OLHO → COROA.",kind:"ritual",labels:["LUA","OLHO","COROA"]}
];
let active=null;
function mat(color,metal=0,rough=.72,emissive=0){
 return new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough,emissive,emissiveIntensity:emissive?0.35:0});
}
function makeStation(def,index){
 const group=new THREE.Group(),dark=mat(0x171317,.18,.84),metal=mat(0x78634b,.72,.34),glow=mat(0x9b252d,.2,.3,0x4c080c),paper=mat(0xc9b99a,0,.94);
 const add=(geo,material,x,y,z)=>{const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 add(new THREE.CylinderGeometry(.22,.26,.12,16),dark,0,.08,0);
 if(def.kind==="breaker"||def.kind==="fuse"||def.kind==="medical"){
  add(new THREE.BoxGeometry(.34,.52,.13),dark,0,.39,0);
  add(new THREE.BoxGeometry(.24,.36,.035),metal,0,.4,.085);
  const lever=add(new THREE.BoxGeometry(.055,.2,.07),glow,0,.42,.13);lever.rotation.z=index%2?.4:-.4;
  for(let i=0;i<3;i++)add(new THREE.SphereGeometry(.025,8,6),i===index?glow:metal,-.075+i*.075,.62,.1);
 }else if(def.kind==="phone"||def.kind==="signal"){
  add(new THREE.BoxGeometry(.38,.18,.25),dark,0,.22,0);
  add(new THREE.BoxGeometry(.28,.09,.035),glow,0,.25,.14);
  add(new THREE.TorusGeometry(.11,.025,8,18),metal,0,.43,0);
  add(new THREE.CylinderGeometry(.035,.035,.08,10),metal,0,.49,0);
 }else if(def.kind==="tag"||def.kind==="book"||def.kind==="invite"||def.kind==="card"||def.kind==="bracelet"){
  const note=add(new THREE.BoxGeometry(.27,.36,.035),paper,0,.32,.04);note.rotation.z=(index-1)*.08;
  for(let i=0;i<3;i++)add(new THREE.BoxGeometry(.18,.012,.012),dark,0,.4-i*.065,.065);
  add(new THREE.TorusGeometry(.09,.018,8,18),metal,0,.57,.02);
 }else if(def.kind==="altar"||def.kind==="ritual"){
  add(new THREE.CylinderGeometry(.13,.2,.48,12),dark,0,.34,0);
  add(new THREE.TorusGeometry(.14,.025,8,20),metal,0,.58,0);
  const crystal=add(new THREE.OctahedronGeometry(.105),glow,0,.72,0);crystal.rotation.y=index*.7;
 }else if(def.kind==="valve"||def.kind==="hotel"){
  add(new THREE.CylinderGeometry(.13,.13,.36,12),metal,0,.31,0);
  const wheel=add(new THREE.TorusGeometry(.16,.025,8,20),glow,0,.57,0);wheel.rotation.x=Math.PI/2;
  add(new THREE.CylinderGeometry(.025,.025,.22,8),metal,0,.57,0);
 }else{
  add(new THREE.BoxGeometry(.34,.4,.12),dark,0,.32,0);
  add(new THREE.BoxGeometry(.22,.18,.025),glow,0,.34,.08);
  add(new THREE.TorusGeometry(.12,.018,8,20),metal,0,.62,0);
 }
 const label=add(new THREE.BoxGeometry(.32,.055,.035),paper,0,.72,.04);
 label.userData.stationIndex=index;
 group.userData.stationLabel=def.labels[index];
 return group;
}
function getReachableCells(){
 const start=[Math.round(pl.z/4),Math.round(pl.x/4)],queue=[start],dist=new Map([[start.join(","),0]]);
 for(let head=0;head<queue.length;head++){
  const [r,c]=queue[head],d=dist.get(r+","+c);
  for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]){
   const nr=r+dr,nc=c+dc,k=ch(nr,nc),id=nr+","+nc;
   if(k==="#"||k==="H"||dist.has(id))continue;
   dist.set(id,d+1);queue.push([nr,nc]);
  }
 }
 return [...dist.entries()].map(([key,d])=>{const [r,c]=key.split(",").map(Number);return {r,c,d,x:c*4,z:r*4}}).filter(p=>ch(p.r,p.c)===".");
}
function spawnPoints(){
 const candidates=getReachableCells().filter(p=>
  Math.hypot(p.x-pl.x,p.z-pl.z)>7&&
  !items.some(it=>Math.hypot(it.x-p.x,it.z-p.z)<3.8)&&
  (!ex||Math.hypot(ex.x-p.x,ex.z-p.z)>4)&&
  !physics.overlapsCircle(p.x,p.z,.48)
 ).sort((a,b)=>a.d-b.d);
 if(candidates.length<3)return candidates.slice(0,3);
 const max=candidates[candidates.length-1].d,targets=[max*.32,max*.57,max*.82],chosen=[];
 for(const target of targets){
  const ordered=candidates.slice().sort((a,b)=>Math.abs(a.d-target)-Math.abs(b.d-target));
  const pick=ordered.find(p=>chosen.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>6));
  if(pick)chosen.push(pick);
 }
 for(const p of candidates){if(chosen.length===3)break;if(chosen.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>5))chosen.push(p)}
 return chosen.slice(0,3);
}
function installHUD(){
 let el=document.getElementById("chapter-objective");
 if(!el){el=document.createElement("div");el.id="chapter-objective";Object.assign(el.style,{position:"fixed",top:"58px",left:"50%",transform:"translateX(-50%)",zIndex:"25",maxWidth:"min(92vw,620px)",padding:"8px 13px",background:"rgba(8,7,9,.7)",border:"1px solid rgba(190,160,125,.22)",color:"#d8c8b4",font:"500 10px/1.5 system-ui,sans-serif",letterSpacing:".08em",textAlign:"center",pointerEvents:"none"});document.body.appendChild(el)}
}
function refreshHUD(){
 const def=definitions[lv],el=document.getElementById("chapter-objective");
 if(el&&def)el.textContent="DESAFIO · "+def.title.toUpperCase()+"  |  "+(active?.progress||0)+"/3  ·  "+def.hint;
}
function setup(){
 active={level:lv,progress:0,done:false,stations:[]};
 const def=definitions[lv];if(!def)return;
 const points=spawnPoints();
 points.forEach((p,index)=>{
  const mesh=makeStation(def,index);mesh.position.set(p.x,0,p.z);scene.add(mesh);
  const item={k:"Q",x:p.x,z:p.z,m:mesh,challengeIndex:index,collecting:false};
  const key="Q:"+item.x+":"+item.z;
  const restored=!!(resumeCheckpoint&&SG&&SG.lv===lv&&Array.isArray(SG.collected)&&SG.collected.includes(key));
  if(restored){scene.remove(mesh);active.progress++}else items.push(item);
  active.stations.push(item);
 });
 active.done=active.progress>=3;
 installHUD();refreshHUD();
}
const originalBuild=build;
build=function(n){originalBuild(n);setup()};
const originalPick=pick;
pick=function(item){
 if(item&&item.k==="Q"){
  if(!active||active.done||item.collecting)return;
  if(item.challengeIndex!==active.progress){
   active.progress=0;refreshHUD();note("Sequência incorreta. A pista foi reiniciada.",2600);th(120,.28,.3);return;
  }
  item.collecting=true;const index=items.indexOf(item);if(index>=0)items.splice(index,1);
  interactionTweens.push({object:item.m,elapsed:0,duration:.3,baseY:item.m.position.y});
  active.progress++;th(430+active.progress*130,.18,.28);
  if(active.progress===3){active.done=true;note("Desafio concluído: "+definitions[lv].title+".",4500);th(880,.35,.32)}
  else note(definitions[lv].labels[item.challengeIndex]+" confirmado.",1800);
  refreshHUD();saveProgress(item,true);return;
 }
 return originalPick(item);
};
const originalGo=go;
go=function(next){
 if(active&&next===lv+1&&!active.done){note("Objetivo obrigatório pendente: "+definitions[lv].title+".",3800);refreshHUD();return}
 return originalGo(next);
};
const originalAlt=alt;
alt=function(choice){
 if(active&&lv===14&&!active.done){note("O ritual ainda não foi concluído. "+definitions[lv].hint,4000);refreshHUD();return}
 return originalAlt(choice);
};
root.GameChapterObjectives=Object.freeze({definitions,getState:()=>active?{level:active.level,progress:active.progress,done:active.done}:null});
})(typeof window!=="undefined"?window:globalThis);
