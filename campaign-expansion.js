/* Expansão da campanha e reconstrução procedural de velas — Não Me Deixa no Visto.
 * Mantém a engine e os sistemas originais; os capítulos adicionais usam o mesmo contrato L[].
 */
(function(){
"use strict";
const chapterData=[
 ["O PRÉDIO VAZIO","#51413a","#201815",3.4,"cartões de acesso","O elevador parou entre andares. O interfone chama pelo seu nome."],
 ["A ESCOLA FECHADA","#454b52","#171b22",4.2,"chaves da diretoria","As salas estão trancadas. Há uma chamada sendo feita no quadro."],
 ["A CLÍNICA","#4b4147","#1c1419",3.8,"prontuários","Seu prontuário foi preenchido antes de você chegar."],
 ["O ESTACIONAMENTO","#454044","#171519",4.8,"fusíveis","O carro está ligado. Alguém ocupa o banco traseiro."],
 ["A ESTAÇÃO","#465052","#151d20",4.4,"bilhetes","O último trem não aparece no painel. O alto-falante anuncia sua plataforma."],
 ["A CASA DE FESTAS","#51423d","#211716",3.6,"convites","Os convidados estão sentados. Nenhum deles tem rosto."],
 ["O HOTEL 13","#4b3940","#1d1117",4.1,"chaves dos quartos","Todos os quartos estão ocupados. O seu está esperando."],
 ["O SUBSOLO","#45434d","#17151d",3.2,"fusíveis","Há passos no teto. Você está no último andar subterrâneo."],
 ["A MATERNIDADE","#4d4543","#1b1514",4.0,"pulseiras","Um berço balança sozinho. A etiqueta tem seu nome."],
 ["A IGREJA INVERTIDA","#48464a","#19171c",6.2,"velas","As gravações reproduzem conversas que ainda não aconteceram. O altar está esperando por você."]
];
function makeMap(seed){
 const h=15,w=15,a=Array.from({length:h},()=>Array(w).fill("."));
 for(let r=0;r<h;r++)for(let c=0;c<w;c++)if(r===0||c===0||r===h-1||c===w-1)a[r][c]="#";
 const shift=seed%3;
 // Divisórias com aberturas alternadas formam setores distintos, mas conectados.
 for(const col of [4,9])for(let r=1;r<h-1;r++)if(![2+shift,7,12-shift].includes(r))a[r][col]="#";
 for(const row of [5,10])for(let c=1;c<w-1;c++)if(![2+shift,7,12-shift].includes(c))a[row][c]="#";
 for(const [r,c] of [[2+shift,4],[7,4],[12-shift,4],[2+shift,9],[7,9],[12-shift,9],[5,2+shift],[5,7],[5,12-shift],[10,2+shift],[10,7],[10,12-shift]])a[r][c]="D";
 const place=(r,c,ch)=>{if(a[r]&&a[r][c]!==undefined)a[r][c]=ch};
 place(1,1,"S");place(13,13,"E");
 const keys=[[2,2],[3,7],[7,12],[12,3],[11,11]];
 keys.forEach(([r,c],i)=>place(r,c,i<3?"K":"B"));
 place(3,12,"N");place(11,2,"N");place(8,7,"H");place(2,11,"H");
 return a.map(row=>row.join(""));
}
const newChapters=chapterData.map((d,i)=>({n:d[0],h:d[3],w:d[1],f:"#29221f",fg:parseInt(d[2].slice(1),16),o:d[4],i:d[5],g:makeMap(i+1),t:[
 "A mensagem foi enviada às 03h17. O remetente está parado do outro lado da porta.",
 "Há marcas recentes no chão, mas nenhuma pegada de saída.",
 "No verso do objeto: 'Você demorou demais para responder.'"
]}));
const originalBuild=build;
const candleSystems=[];
function candleMaterial(color,roughness,extra){return new THREE.MeshStandardMaterial({color,roughness,...(extra||{})})}
function makeFlameGeometry(){
 return new THREE.LatheGeometry([
 new THREE.Vector2(0,0),new THREE.Vector2(.035,.035),new THREE.Vector2(.052,.10),
 new THREE.Vector2(.041,.17),new THREE.Vector2(.022,.23),new THREE.Vector2(0,.29)
 ],12);
}
function createCandle(x,z,scale=1){
 const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);
 const wax=candleMaterial(0xd8c7a8,.94),waxLight=candleMaterial(0xe8d9bd,.9),wick=candleMaterial(0x17110e,1),
 flameMat=candleMaterial(0xff8a24,.32,{emissive:0xff4a08,emissiveIntensity:2.1}),
 coreMat=candleMaterial(0xffe5a0,.25,{emissive:0xffb33e,emissiveIntensity:2.8});
 const add=(geo,mat,px,py,pz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m};
 const profile=[[.075,0],[.082,.025],[.084,.12],[.079,.3],[.082,.48],[.076,.62],[.061,.645],[.025,.638],[0,.635]].map(p=>new THREE.Vector2(p[0],p[1]));
 const body=add(new THREE.LatheGeometry(profile,28),wax,0,0,0);
 body.geometry.computeVertexNormals();
 // Cera escorrida: pequenas gotas integradas ao corpo, sem aparência de plástico.
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2+.35,drip=add(new THREE.SphereGeometry(1,12,9),waxLight,Math.cos(a)*.071,.48-(i%2)*.12,Math.sin(a)*.071);
  drip.scale.set(.018,.065+(i%2)*.025,.018);drip.rotation.z=(i%2?-.12:.12);
 }
 const top=add(new THREE.TorusGeometry(.068,.009,8,24),waxLight,0,.635,0);top.rotation.x=Math.PI/2;
 add(new THREE.CylinderGeometry(.008,.009,.075,8),wick,0,.675,0);
 const flame=add(makeFlameGeometry(),flameMat,0,.70,0);
 flame.rotation.z=-.08;
 const core=add(new THREE.SphereGeometry(1,12,10),coreMat,0,.77,.003);core.scale.set(.023,.075,.023);
 const light=new THREE.PointLight(0xff9b45,.85,5.5,2);light.position.set(0,.82,0);group.add(light);
 const halo=new THREE.Mesh(new THREE.SphereGeometry(.19,12,10),new THREE.MeshBasicMaterial({color:0xff8a34,transparent:true,opacity:.055,depthWrite:false}));
 halo.position.set(0,.79,0);group.add(halo);
 candleSystems.push({group,flame,core,light,halo,phase:Math.random()*Math.PI*2,baseY:.70});
 return group;
}
function disposeObject(object){
 if(!object)return;const geos=new Set(),mats=new Set();
 object.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m))});
 geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
}
function addCandlesToLevel(){
 candleSystems.length=0;
 const collectibleItems=items.filter(item=>item.k==="K");
 for(const item of collectibleItems){
  if(item.m){scene.remove(item.m);disposeObject(item.m)}
  const cluster=new THREE.Group();cluster.position.set(item.x,0,item.z);
  const count=2+(Math.abs(Math.round(item.x+item.z))%3);
  const offsets=[[0,0],[-.28,.12],[.28,-.13],[-.12,-.3]];
  for(let i=0;i<count;i++){
   const [ox,oz]=offsets[i],candle=createCandle(ox,oz,i===0?1:.78+(i%2)*.08);
   cluster.add(candle);
  }
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.42,.018,8,28),new THREE.MeshBasicMaterial({color:0xffc46b,transparent:true,opacity:.0,depthWrite:false}));
  halo.rotation.x=Math.PI/2;halo.position.y=.035;cluster.add(halo);
  cluster.userData.pickupHalo=halo;
  scene.add(cluster);item.m=cluster;item.candle=true;item.spawnValid=true;
 }
}
const pickupParticles=[];
function playCandlePickup(){
 if(!AC||!mg)return;
 th(740,.16,.24);scheduleAudio(()=>{if(AC&&mg)th(1110,.24,.2)},90);
}
function spawnPickupParticles(x,y,z){
 const group=new THREE.Group();group.position.set(x,y,z);
 const material=new THREE.MeshBasicMaterial({color:0xffc46b,transparent:true,opacity:1});
 for(let i=0;i<12;i++){
  const particle=new THREE.Mesh(new THREE.TetrahedronGeometry(.035+Math.random()*.025),material.clone());
  particle.position.set((Math.random()-.5)*.18,(Math.random()-.5)*.12,(Math.random()-.5)*.18);
  particle.userData.velocity=new THREE.Vector3((Math.random()-.5)*1.8,.7+Math.random()*1.5,(Math.random()-.5)*1.8);
  group.add(particle);
 }
 scene.add(group);pickupParticles.push({group,age:0,duration:.62});
}
function updatePickupParticles(dt){
 for(let i=pickupParticles.length-1;i>=0;i--){
  const p=pickupParticles[i];p.age+=dt;
  for(const mesh of p.group.children){
   mesh.position.addScaledVector(mesh.userData.velocity,dt);
   mesh.userData.velocity.y-=2.4*dt;
   mesh.rotation.x+=dt*5;mesh.rotation.y+=dt*7;
   mesh.material.opacity=Math.max(0,1-p.age/p.duration);
  }
  if(p.age>=p.duration){scene.remove(p.group);for(const mesh of p.group.children){mesh.geometry.dispose();mesh.material.dispose()}pickupParticles.splice(i,1)}
 }
}
const originalPick=pick;
pick=function(item){
 if(item&&item.k==="K"&&item.candle){
  const x=item.x,y=.82,z=item.z;
  spawnPickupParticles(x,y,z);playCandlePickup();
 }
 return originalPick(item);
};
const originalUpdWithCandles=upd;
upd=function(dt){
 originalUpdWithCandles(dt);
 updatePickupParticles(dt);
 const counter=document.getElementById("candle-progress");
 if(counter)counter.textContent="VELAS  "+pl.got+" / "+pl.need+"   ·   FALTAM "+Math.max(0,pl.need-pl.got);
 for(const item of items){
  if(!item.candle||!item.m)continue;
  const d=Math.hypot(item.x-pl.x,item.z-pl.z),halo=item.m.userData.pickupHalo;
  if(halo){
   const visible=d<3.4;
   halo.material.opacity=visible?.2+(.18*(1+Math.sin(performance.now()*.008))):0;
   const pulse=visible?1+Math.sin(performance.now()*.006)*.12:1;
   halo.scale.setScalar(pulse);
  }
 }
};
function installCandleHUD(){
 if(document.getElementById("candle-progress"))return;
 const el=document.createElement("div");el.id="candle-progress";
 el.textContent="VELAS  0 / 0";
 Object.assign(el.style,{position:"fixed",top:"18px",left:"50%",transform:"translateX(-50%)",zIndex:"25",padding:"9px 15px",border:"1px solid rgba(255,190,110,.28)",borderRadius:"3px",background:"rgba(10,7,8,.72)",color:"#f4d3a0",font:"600 11px/1.2 system-ui,sans-serif",letterSpacing:".16em",textShadow:"0 1px 8px #000",pointerEvents:"none",whiteSpace:"nowrap"});
 document.body.appendChild(el);
}
function animateCandles(dt){
 const t=performance.now()*.001;
 for(const c of candleSystems){
  c.phase+=dt*(5.2+Math.sin(t+c.phase)*.35);
  const sway=Math.sin(c.phase)*.045,flutter=Math.sin(c.phase*2.17);
  c.flame.rotation.z=sway;c.flame.scale.set(1+flutter*.09,1+Math.sin(c.phase*1.43)*.12,1);
  c.core.position.x=sway*.16;c.halo.scale.setScalar(1+flutter*.06);
  c.light.intensity=.72+Math.sin(c.phase*2.3)*.13+Math.sin(c.phase*4.1)*.045;
  c.light.distance=5.1+Math.sin(c.phase*1.7)*.3;
 }
}
function addChapterAudio(){
 if(!AC||!mg)return;
 const level=lv,base=[48,54,42,39,58,46,35,31,52,37,44,29,50,33,26][level]||42;
 th(base,.9,.035);
 if(level>=5&&Math.random()<.55)scheduleAudio(()=>{if(!AC)return;at(pl.x+Math.sin(pl.y+Math.PI/2)*5,pl.z+Math.cos(pl.y+Math.PI/2)*5,q=>nz(.75,180+level*11,.24,q,"bandpass"))},900+Math.random()*1700);
}
const originalAppar=appar;
appar=function(){originalAppar();if(gh&&gh.visible){const pitch=lv>=10?1.55:lv>=5?1.25:1;th(110*pitch,.42,.55);nz(.55,950+lv*70,.28,mg,"bandpass");scheduleAudio(()=>th(48,.65,.65),160)}};
const originalStartAttack=startAttack;
startAttack=function(){originalStartAttack();if(attackSequence){const intensity=lv>=10?1.25:lv>=5?1.08:1;th(82/intensity,.82,.85);th(510*intensity,.22,.32);nz(.48,1250+lv*95,.52,mg,"highpass");scheduleAudio(()=>{if(AC&&mg)nz(.65,220,.62,mg,"lowpass")},180)}};
const originalEv=ev;
ev=function(){
 if(lv>=5&&Math.random()<.35){
  const kind=Math.floor(Math.random()*4);
  if(kind===0){at(pl.x+Math.sin(pl.y+Math.PI/2)*7,pl.z+Math.cos(pl.y+Math.PI/2)*7,q=>nz(1.3,260+lv*12,.34,q,"bandpass"));sub("Tem alguém chamando você de outro cômodo.",2200);return}
  if(kind===1){flick=1;th(62,.65,.38);return}
  if(kind===2){scheduleAudio(()=>{if(state==="play")say("Anderson... responde...",1)},350+Math.random()*800);return}
 }
 originalEv();
};
const originalUpd=upd;
upd=function(dt){originalUpd(dt);animateCandles(dt)};
const originalDie=die;
die=function(){if(lv===L.length-1&&state==="play"){originalDie();return}originalDie()};
const originalBuildWrapper=build;
build=function(n){
 originalBuildWrapper(n);
 L5=n===L.length-1;
 installCandleHUD();
 addCandlesToLevel();
 addChapterAudio();
};
L.push(...newChapters);
window.__NDMVV_CAMPAIGN={chapters:L.length,candles:()=>candleSystems.length};
})();
