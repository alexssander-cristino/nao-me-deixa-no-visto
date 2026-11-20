/* Corpo em primeira pessoa — malha procedural articulada e animação sincronizada ao controlador.
 * A cabeça é omitida deliberadamente: a câmera FPS ocupa essa posição e não deve ficar obstruída.
 */
(function(root){
  "use strict";
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function create(THREE){
    if(!THREE||!THREE.Group||!THREE.Mesh)throw new TypeError("Three.js indisponível para o corpo do jogador");
    const avatar=new THREE.Group();
    avatar.name="player-first-person-body";
    const material=(color,roughness=.88,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
    const skin=material(0x987568),shirt=material(0x292326),shirtEdge=material(0x403237),pants=material(0x17191d),shoe=material(0x090a0c,.72,.08);
    const add=(parent,geometry,mat,x,y,z,sx=1,sy=1,sz=1)=>{
      const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    };
    const sphere=(parent,mat,x,y,z,sx,sy,sz)=>add(parent,new THREE.SphereGeometry(1,16,12),mat,x,y,z,sx,sy,sz);
    const segment=(parent,mat,r1,r2,length,y)=>add(parent,new THREE.CylinderGeometry(r1,r2,length,12,1),mat,0,y,0);
    const torso=new THREE.Group();torso.position.y=.96;avatar.add(torso);
    sphere(torso,shirt,0,0,0,.285,.43,.17);
    sphere(torso,shirtEdge,0,.31,-.012,.29,.12,.18);
    sphere(torso,shirt,0,-.34,0,.245,.16,.16);
    const arms=[-1,1].map(side=>{
      const shoulder=new THREE.Group();shoulder.position.set(side*.29,.29,-.055);torso.add(shoulder);
      sphere(shoulder,shirtEdge,0,0,0,.115,.13,.12);
      segment(shoulder,shirt,.105,.082,.34,-.18);
      const elbow=new THREE.Group();elbow.position.y=-.35;shoulder.add(elbow);
      sphere(elbow,shirtEdge,0,0,0,.082,.085,.085);
      segment(elbow,skin,.066,.052,.31,-.16);
      const hand=new THREE.Group();hand.position.set(0,-.33,-.025);elbow.add(hand);
      sphere(hand,skin,0,-.015,-.015,.065,.085,.045);
      for(let finger=0;finger<4;finger++){
        const x=(finger-1.5)*.027;
        const f=add(hand,new THREE.SphereGeometry(.012,8,6),skin,x,-.075,-.018,.8,1.8,.8);
        f.rotation.x=-.12;
      }
      sphere(hand,skin,side*.055,-.035,.005,.022,.052,.025).rotation.z=side*.5;
      return {shoulder,elbow,hand,side};
    });
    const legs=[-1,1].map(side=>{
      const hip=new THREE.Group();hip.position.set(side*.135,-.2,0);torso.add(hip);
      sphere(hip,pants,0,-.035,0,.13,.16,.15);
      segment(hip,pants,.12,.085,.43,-.23);
      const knee=new THREE.Group();knee.position.y=-.42;hip.add(knee);
      sphere(knee,pants,0,0,0,.09,.095,.095);
      segment(knee,pants,.078,.058,.34,-.17);
      const foot=new THREE.Group();foot.position.set(0,-.34,-.045);knee.add(foot);
      sphere(foot,shoe,0,-.015,-.075,.085,.065,.16);
      return {hip,knee,foot,side};
    });
    avatar.userData={torso,arms,legs,phase:0,model:"player-articulated-procedural-v1"};
    return avatar;
  }
  function update(avatar,player,dt){
    if(!avatar||!avatar.userData||!player)return;
    const data=avatar.userData,delta=clamp(Number(dt)||0,0,.05);
    const speed=Math.hypot(player.mx||0,player.mz||0),moving=speed>.12;
    const amount=clamp(speed/3.15,0,1.8),running=!!player.run,crouched=!!player.crouch;
    data.phase+=delta*(running?13.5:crouched?5.2:8.1)*amount;
    const gait=moving?Math.sin(data.phase):0,opposite=moving?Math.sin(data.phase+Math.PI):0;
    avatar.position.set(player.x||0,player.feetY||0,player.z||0);
    avatar.rotation.y=Number.isFinite(player.y)?player.y:0;
    avatar.visible=!player.hid;
    data.torso.position.y=crouched?.76:.96;
    data.torso.rotation.x=crouched?-.12:Math.sin(data.phase*2)*.012*amount;
    data.torso.position.y+=(moving?Math.abs(Math.sin(data.phase*2))*(running?.018:.008):0);
    data.legs.forEach((leg,index)=>{
      const swing=index===0?gait:opposite;
      leg.hip.rotation.x=swing*(running?.62:.42)*amount;
      leg.knee.rotation.x=Math.max(0,-swing)*(running?.9:.48)*amount;
      leg.foot.rotation.x=-leg.knee.rotation.x*.55-leg.hip.rotation.x*.22;
    });
    data.arms.forEach((arm,index)=>{
      const swing=index===0?opposite:gait;
      arm.shoulder.rotation.x=(moving?swing*(running?.58:.32)*amount:0)+(running?-.12:0);
      arm.shoulder.rotation.z=arm.side*(crouched?-.12:0);
      arm.elbow.rotation.x=running?.55:crouched?.28:.12;
      arm.hand.rotation.x=Math.sin(data.phase+index)*.035*amount;
    });
  }
  root.GamePlayerAnimation=Object.freeze({create,update});
})(typeof window!=="undefined"?window:globalThis);
