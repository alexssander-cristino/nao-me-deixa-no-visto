/* Player humanoid procedural rig — corpo visível em primeira pessoa e animação procedural.
 * Geometria visual independente do colisor; não altera a física nem a posição da câmera.
 */
(function(root){
  "use strict";
  function create(THREE, options={}){
    if(!THREE || !THREE.Group) throw new TypeError("Three.js indisponível");
    const body=new THREE.Group();
    body.name="PlayerVisualRig";
    const materials={
      shirt:new THREE.MeshStandardMaterial({color:0x29282a,roughness:.92}),
      shirtEdge:new THREE.MeshStandardMaterial({color:0x454044,roughness:.88}),
      pants:new THREE.MeshStandardMaterial({color:0x17191d,roughness:.94}),
      skin:new THREE.MeshStandardMaterial({color:0x9a7565,roughness:.9}),
      shoe:new THREE.MeshStandardMaterial({color:0x111013,roughness:.78}),
      seam:new THREE.MeshStandardMaterial({color:0x77706c,roughness:.8})
    };
    const mesh=(parent,geometry,material,pos,scale)=>{
      const m=new THREE.Mesh(geometry,material);
      if(pos)m.position.set(pos[0],pos[1],pos[2]);
      if(scale)m.scale.set(scale[0],scale[1],scale[2]);
      m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    };
    const sphere=(parent,material,pos,scale)=>mesh(parent,new THREE.SphereGeometry(1,16,12),material,pos,scale);
    const limb=(parent,material,length,radius)=>{
      const g=new THREE.Group();parent.add(g);
      mesh(g,new THREE.CylinderGeometry(radius*.82,radius,length,12),material,[0,-length/2,0]);
      sphere(g,material,[0,-length,0],[radius*.88,radius*.88,radius*.88]);
      return g;
    };
    const pelvis=new THREE.Group();pelvis.position.y=.91;body.add(pelvis);
    mesh(pelvis,new THREE.BoxGeometry(.39,.25,.23),materials.pants,[0,0,0],[1,1,1]);
    const torso=new THREE.Group();torso.position.set(0,.2,0);pelvis.add(torso);
    sphere(torso,materials.shirt,[0,.22,0],[.235,.37,.17]);
    mesh(torso,new THREE.BoxGeometry(.46,.13,.28),materials.shirtEdge,[0,.49,0]);
    const neck=sphere(torso,materials.skin,[0,.58,0],[.075,.12,.075]);
    const head=new THREE.Group();head.position.set(0,.76,0);torso.add(head);
    sphere(head,materials.skin,[0,.04,0],[.12,.16,.115]);
    // O rosto é mantido no rig, mas oculto na câmera FPS para nunca bloquear a visão.
    if(options.firstPerson!==false)head.visible=false;
    const arms=[-1,1].map(side=>{
      const shoulder=new THREE.Group();shoulder.position.set(side*.27,.48,0);torso.add(shoulder);
      sphere(shoulder,materials.shirt,[0,0,0],[.105,.12,.11]);
      const upper=limb(shoulder,materials.shirt,.31,.075);
      const elbow=new THREE.Group();elbow.position.y=-.31;shoulder.add(elbow);
      sphere(elbow,materials.skin,[0,0,0],[.067,.067,.067]);
      const fore=limb(elbow,materials.shirtEdge,.29,.058);
      const hand=new THREE.Group();hand.position.y=-.29;elbow.add(hand);
      sphere(hand,materials.skin,[0,-.045,.005],[.055,.075,.035]);
      const fingers=[];
      for(let i=0;i<4;i++){
        const f=new THREE.Group();f.position.set((i-1.5)*.022,-.085,.018);hand.add(f);
        mesh(f,new THREE.CylinderGeometry(.009,.011,.065,7),materials.skin,[0,-.03,0]);
        fingers.push(f);
      }
      const thumb=new THREE.Group();thumb.position.set(side*.052,-.04,.012);hand.add(thumb);
      mesh(thumb,new THREE.CylinderGeometry(.011,.013,.052,7),materials.skin,[0,-.025,0]);
      return {shoulder,upper,elbow,fore,hand,fingers,thumb};
    });
    const legs=[-1,1].map(side=>{
      const hip=new THREE.Group();hip.position.set(side*.115,-.05,0);pelvis.add(hip);
      const thigh=limb(hip,materials.pants,.43,.095);
      const knee=new THREE.Group();knee.position.y=-.43;hip.add(knee);
      sphere(knee,materials.pants,[0,0,0],[.083,.085,.09]);
      const shin=limb(knee,materials.pants,.39,.067);
      const ankle=new THREE.Group();ankle.position.y=-.39;knee.add(ankle);
      mesh(ankle,new THREE.BoxGeometry(.13,.11,.25),materials.shoe,[0,-.045,-.055]);
      mesh(ankle,new THREE.BoxGeometry(.14,.035,.27),materials.seam,[0,-.095,-.055]);
      return {hip,thigh,knee,shin,ankle};
    });
    body.userData={torso,pelvis,arms,legs,head,firstPerson:options.firstPerson!==false,phase:0,action:0};
    body.traverse(o=>{if(o.isMesh){o.frustumCulled=true}});
    return body;
  }
  function update(body,state={},dt=1/60){
    if(!body||!body.userData)return;
    const u=body.userData;
    const delta=Math.max(0,Math.min(.05,Number(dt)||0));
    const speed=Math.max(0,Number(state.speed)||0);
    const run=!!state.running,crouch=!!state.crouching;
    const moving=speed>.12;
    const normalized=Math.min(1,speed/(run?5.7:crouch?1.75:3.15));
    u.phase+=delta*(moving?(run?13.5:crouch?5.2:8):1.15);
    const swing=moving?Math.sin(u.phase)*normalized:Math.sin(u.phase)*.025;
    const breath=Math.sin(u.phase*.42)*.012;
    u.pelvis.position.y=.91-(crouch?.2:0)+Math.abs(swing)*.018;
    u.torso.rotation.x=(run?.055:crouch?-.12:0)+(moving?-.035*normalized:0);
    u.torso.rotation.z=Math.sin(u.phase*.5)*.012;
    u.torso.position.y=.2+breath;
    u.arms.forEach((arm,i)=>{
      const side=i===0?-1:1;
      arm.shoulder.rotation.x=moving?-swing*.62+(run?-.1:0):Math.sin(u.phase+side)*.018;
      arm.shoulder.rotation.z=side*(crouch?-.12:0)+Math.sin(u.phase*.5+side)*.012;
      arm.elbow.rotation.x=run?-.42:moving?-.18:0;
      arm.fore.rotation.x=run?-.18:0;
      arm.hand.rotation.x=Math.sin(u.phase+side)*.025;
    });
    u.legs.forEach((leg,i)=>{
      const side=i===0?-1:1;
      leg.hip.rotation.x=moving?swing*(i===0?1:-1)*.72:Math.sin(u.phase+side)*.008;
      leg.knee.rotation.x=moving?Math.max(0,-swing*(i===0?1:-1))*(run?.85:.48):0;
      leg.ankle.rotation.x=moving?-leg.hip.rotation.x*.25:0;
    });
    body.rotation.y=Number(state.yaw)||0;
    body.position.set(Number(state.x)||0,0,Number(state.z)||0);
    body.visible=state.visible!==false;
  }
  root.GamePlayerModel=Object.freeze({create,update});
})(typeof window!=="undefined"?window:globalThis);
