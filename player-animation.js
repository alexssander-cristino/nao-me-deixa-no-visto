/* Player FPS: um único rig hierárquico, dois braços, duas pernas e socket da lanterna na mão direita.
 * A cabeça existe no mesmo modelo, mas fica numa layer fora da câmera FPS para não obstruir a visão.
 */
(function(root){
 "use strict";
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let activeAvatar=null;
 function mat(THREE,color,roughness=.88,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
 function create(THREE){
  if(!THREE||!THREE.Group||!THREE.Bone||!THREE.Skeleton)throw new TypeError("Three.js indisponível para o rig do jogador");
  if(activeAvatar)dispose(activeAvatar);
  const avatar=new THREE.Group();avatar.name="player-single-rig";avatar.userData.model="player-single-rig-v3";
  const skin=mat(THREE,0x987568),skinShadow=mat(THREE,0x76564c),shirt=mat(THREE,0x292326),shirtEdge=mat(THREE,0x403237),pants=mat(THREE,0x17191d),shoe=mat(THREE,0x090a0c,.72,.08);
  const bones=[];
  const bone=(name,parent,pos)=>{const b=new THREE.Bone();b.name=name;b.position.set(pos[0],pos[1],pos[2]);if(parent)parent.add(b);bones.push(b);return b};
  const mesh=(parent,geo,material,pos,scale)=>{const m=new THREE.Mesh(geo,material);m.position.set(pos[0],pos[1],pos[2]);if(scale)m.scale.set(scale[0],scale[1],scale[2]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
  const ellipsoid=(parent,material,pos,scale)=>mesh(parent,new THREE.SphereGeometry(1,18,14),material,pos,scale);
  const cylinder=(parent,material,rTop,rBottom,length,y)=>mesh(parent,new THREE.CylinderGeometry(rTop,rBottom,length,14,1),material,[0,y,0]);
  const rootBone=bone("root",null,[0,0,0]);
  const pelvis=bone("pelvis",rootBone,[0,.82,0]);
  ellipsoid(pelvis,pants,[0,0,0],[.205,.16,.145]);
  const spine=bone("spine",pelvis,[0,.12,0]);
  ellipsoid(spine,shirt,[0,.16,0],[.285,.37,.17]);
  ellipsoid(spine,shirtEdge,[0,.43,-.005],[.285,.09,.17]);
  ellipsoid(spine,shirt,[0,-.16,0],[.235,.12,.15]);
  const neck=bone("neck",spine,[0,.51,0]);
  cylinder(neck,skin,.075,.085,.12,-.035);
  const head=bone("head",neck,[0,.12,0]);
  ellipsoid(head,skin,[0,.055,0],[.125,.16,.12]);
  ellipsoid(head,skinShadow,[0,-.045,-.005],[.112,.075,.118]);
  const hair=mat(THREE,0x171216,.96),eye=mat(THREE,0x171014,.62);
  ellipsoid(head,hair,[0,.145,.005],[.13,.075,.125]);
  for(const side of [-1,1])ellipsoid(head,eye,[side*.045,.07,-.108],[.012,.009,.006]);
  // A cabeça integra o mesmo rig, mas não entra no frustum da câmera FPS.
  head.traverse(o=>o.layers&&o.layers.set(1));
  const arms=[],legs=[];
  for(const side of [-1,1]){
   const label=side<0?"L":"R";
   const clavicle=bone("clavicle."+label,spine,[side<0?-.245:.14,side<0?.39:.55,-.005]);
   ellipsoid(clavicle,shirtEdge,[0,0,0],[.105,.105,.11]);
   const upper=bone("upperArm."+label,clavicle,[side*.055,-.055,-.005]);
   cylinder(upper,shirt,.075,.095,.30,-.16);
   ellipsoid(upper,shirtEdge,[0,-.025,0],[.09,.105,.09]);
   const elbow=bone("elbow."+label,upper,[0,-.31,0]);
   ellipsoid(elbow,shirtEdge,[0,0,0],[.07,.075,.075]);
   cylinder(elbow,skin,.052,.067,.29,-.145);
   const wrist=bone("wrist."+label,elbow,[0,-.29,-.005]);
   ellipsoid(wrist,skin,[0,-.025,-.015],[.062,.07,.047]);
   // Palma e dedos são parte do mesmo braço; não existe um segundo braço de primeira pessoa.
   ellipsoid(wrist,skin,[0,-.075,-.035],[.07,.075,.045]);
   for(let finger=0;finger<4;finger++){
    const x=(finger-1.5)*.031;
    const f=ellipsoid(wrist,skin,[x,-.135,-.048],[.014,.052,.014]);
    f.rotation.z=(finger-1.5)*-.055;
   }
   const thumb=ellipsoid(wrist,skin,[side*.073,-.075,-.018],[.022,.055,.022]);thumb.rotation.z=side*.55;
   arms.push({side,clavicle,upper,elbow,wrist});
   const hip=bone("hip."+label,pelvis,[side*.12,-.07,0]);
   ellipsoid(hip,pants,[0,-.04,0],[.12,.14,.13]);
   cylinder(hip,pants,.085,.12,.39,-.22);
   const knee=bone("knee."+label,hip,[0,-.41,0]);
   ellipsoid(knee,pants,[0,0,0],[.083,.085,.09]);
   cylinder(knee,pants,.06,.08,.34,-.17);
   const ankle=bone("ankle."+label,knee,[0,-.34,-.005]);
   ellipsoid(ankle,shoe,[0,-.025,-.065],[.083,.065,.15]);
   legs.push({side,hip,knee,ankle});
  }
  rootBone.updateMatrixWorld(true);
  const skeleton=new THREE.Skeleton(bones);skeleton.calculateInverses();
  avatar.add(rootBone);
  avatar.userData={rig:{root:rootBone,pelvis,spine,neck,head,arms,legs,bones,skeleton},arms,legs,phase:0,state:"IDLE",stateBlend:1,model:"player-single-rig-v3"};
  activeAvatar=avatar;
  assertIntegrity(avatar);
  return avatar;
 }
 function attachFlashlight(avatar,flashlight){
  if(!avatar||!flashlight)throw new TypeError("Player ou lanterna indisponível");
  const rig=avatar.userData&&avatar.userData.rig;if(!rig)throw new Error("Rig do jogador não encontrado");
  const socket=rig.arms.find(a=>a.side===1)?.wrist;if(!socket)throw new Error("Socket da mão direita não encontrado");
  if(flashlight.parent)flashlight.parent.remove(flashlight);
  flashlight.name="player-flashlight-hand-attachment";
  flashlight.position.set(-.28,-.055,-.12);
  flashlight.rotation.set(0,0,0);
  flashlight.userData.cameraMounted=false;
  socket.add(flashlight);rig.flashlight=flashlight;rig.flashlightSocket=socket;
  assertIntegrity(avatar);
  return flashlight;
 }
 function update(avatar,player,dt,camera){
  if(!avatar||!avatar.userData||!player)return;
  const d=avatar.userData,rig=d.rig,delta=clamp(Number(dt)||0,0,.05);
  const speed=Math.hypot(player.mx||0,player.mz||0),moving=speed>.12,amount=clamp(speed/3.15,0,1.8),running=!!player.run,crouched=!!player.crouch;
  if(d.wasCrouched&&!crouched)d.standUpRemaining=.28;
  d.standUpRemaining=Math.max(0,(d.standUpRemaining||0)-delta);
  const state=player.actionTime>0?"INTERACTING":d.standUpRemaining>0?"STANDING_UP":crouched?(moving?"CROUCH_WALKING":"CROUCHING"):running?"RUNNING":moving?"WALKING":"IDLE";
  if(state!==d.state){d.previousState=d.state;d.state=state;d.stateTime=0}else d.stateTime+=delta;
  const targetBlend=1;d.stateBlend+=(targetBlend-d.stateBlend)*(1-Math.exp(-11*delta));d.wasCrouched=crouched;
  d.phase+=delta*(running?13.5:crouched?5.2:8.1)*amount;
  const gait=moving?Math.sin(d.phase):0,opposite=moving?Math.sin(d.phase+Math.PI):0;
  avatar.position.set(player.x||0,player.feetY||0,player.z||0);avatar.rotation.y=Number.isFinite(player.y)?player.y:0;avatar.visible=!player.hid;
  rig.pelvis.position.y=.82-(crouched?.12:0);
  rig.spine.position.y=.12+(crouched?-.12:0)+(moving?Math.abs(Math.sin(d.phase*2))*(running?.018:.008):0);
  rig.spine.rotation.x=crouched?-.16:Math.sin(d.phase*2)*.012*amount;
  rig.spine.rotation.z=Math.sin(d.phase*1.7)*(clamp(player.fear||0,0,1))*.018;
  rig.head.rotation.x=-rig.spine.rotation.x*.35;
  rig.legs.forEach((leg,index)=>{
   const swing=index===0?gait:opposite;
   leg.hip.rotation.x=swing*(running?.58:.38)*amount+(crouched?-.24:0);
   leg.knee.rotation.x=Math.max(0,-swing)*(running?.88:.46)*amount+(crouched?.68:0);
   leg.ankle.rotation.x=-leg.knee.rotation.x*.5-leg.hip.rotation.x*.2;
  });
  const progress=clamp(1-(player.actionTime||0)/.46,0,1),reach=Math.sin(progress*Math.PI),fear=clamp(player.fear||0,0,1);
  if(player.actionTime>0)player.actionTime=Math.max(0,player.actionTime-delta);
  rig.arms.forEach((arm,index)=>{
   const swing=index===0?opposite:gait;
   const useReach=index===1?reach:reach*.12;
   arm.clavicle.rotation.z=arm.side*(crouched?-.08:0);
   arm.upper.rotation.x=(index===1?.65:0)+(moving?swing*(running?.48:.25)*amount:0)+(running?-.1:0)-useReach*.42+Math.sin(d.phase*2+index)*fear*.04;
   arm.upper.rotation.z=(index===1?1.15:0)+arm.side*(crouched?-.12:0)+arm.side*useReach*.13;
   arm.elbow.rotation.x=(index===1?-.15:0)+(running?.42:crouched?.34:.10)+useReach*.62+fear*.07;
   arm.elbow.rotation.z=index===1?.5:0;
   arm.wrist.rotation.x=(index===1?-.08:0)+Math.sin(d.phase+index)*.025*amount;
  });
  if(rig.flashlight&&camera&&root.THREE&&root.THREE.Quaternion){avatar.updateMatrixWorld(true);const parent=rig.flashlight.parent;if(parent){parent.updateWorldMatrix(true,false);const parentWorld=new root.THREE.Quaternion(),cameraWorld=new root.THREE.Quaternion();parent.getWorldQuaternion(parentWorld);camera.getWorldQuaternion(cameraWorld);rig.flashlight.quaternion.copy(parentWorld.invert().multiply(cameraWorld));}}
  d.animationState=state;
 }
 function assertIntegrity(avatar){
  const rig=avatar&&avatar.userData&&avatar.userData.rig;if(!rig)throw new Error("Player sem rig");
  const named=rig.bones.map(b=>b.name),arms=named.filter(n=>n.startsWith("upperArm.")),legs=named.filter(n=>n.startsWith("hip."));
  const flashlight=rig.flashlight;
  const result={armChains:arms.length,legChains:legs.length,bones:named.length,oneSkeleton:!!rig.skeleton&&rig.skeleton.bones.length===named.length,flashlightAttached:!flashlight||flashlight.parent===rig.flashlightSocket};
  if(result.armChains!==2||result.legChains!==2||!result.oneSkeleton||!result.flashlightAttached)throw new Error("Integridade do player inválida: "+JSON.stringify(result));
  return result;
 }
 function dispose(avatar){
  if(!avatar)return;
  const rig=avatar.userData&&avatar.userData.rig;
  if(rig&&rig.flashlight&&rig.flashlight.parent)rig.flashlight.parent.remove(rig.flashlight);
  if(avatar.parent)avatar.parent.remove(avatar);
  avatar.traverse(o=>{if(o.isMesh){o.geometry&&o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material&&o.material.dispose()}});
  if(activeAvatar===avatar)activeAvatar=null;
 }
 root.GamePlayerAnimation=Object.freeze({create,update,attachFlashlight,assertIntegrity,dispose,getState:avatar=>avatar&&avatar.userData?avatar.userData.state:"IDLE"});
})(typeof window!=="undefined"?window:globalThis);
