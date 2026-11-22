/* Modelos procedurais de personagem — geometria de silhueta, camadas e detalhes.
 * Sem dependência de primitivas simples como malha final do antagonista.
 */
(function(root){
  "use strict";
  function createValdirene(THREE,ghost=false){
    const rootMesh=new THREE.Group();
    const mat=(color,roughness=.78,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
    const skin=mat(ghost?0xc8c2cb:0xb88e7d,.86);
    const skinShade=mat(ghost?0xaaa3b0:0x75544d,.92);
    const dress=mat(ghost?0xbbb5c2:0x321017,.94);
    const dressRed=mat(ghost?0xd4ccd6:0x681c29,.88);
    const lace=mat(ghost?0xe2dce5:0x9b6a64,.82);
    const hair=mat(ghost?0x302d37:0x100d12,.94);
    const hairHi=mat(ghost?0x514b59:0x34242b,.9);
    const black=mat(0x08070a,.45);
    const eye=mat(ghost?0xe5e8f0:0xe0c9bd,.32,.05,{emissive:ghost?0x9aaac8:0x1a0505,emissiveIntensity:ghost?.8:.12});
    const metal=mat(0x8d714a,.32,.72);
    const add=(parent,geo,material,x=0,y=0,z=0)=>{
      const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    };
    const lathe=(profile,segments=20)=>new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(p[0],p[1])),segments);
    const tube=(parent,points,radius,material,segments=16)=>{
      const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
      return add(parent,new THREE.TubeGeometry(curve,segments,radius,7,false),material);
    };
    const ell=(parent,material,x,y,z,sx,sy,sz)=>{
      const m=add(parent,new THREE.SphereGeometry(1,24,18),material,x,y,z);m.scale.set(sx,sy,sz);return m;
    };
    // Estrutura do vestido: saia em perfil contínuo, cintura e costuras em camadas.
    const torso=new THREE.Group();torso.position.y=1.16;rootMesh.add(torso);
    add(torso,lathe([[.13,-.48],[.2,-.43],[.25,-.2],[.19,.04],[.17,.25],[.2,.39],[.14,.45]],28),dress,0,0,0);
    const skirt=add(torso,lathe([[.17,-.28],[.2,-.2],[.31,-.03],[.39,.18],[.47,.46],[.43,.5],[.18,.38]],32),dressRed,0,-.24,0);
    skirt.rotation.x=.015;
    add(torso,lathe([[.19,-.045],[.205,-.015],[.205,.035],[.19,.06]],28),lace,0,0,0);
    for(let y of [-.35,-.19,.02]){
      const band=add(torso,new THREE.TorusGeometry(y<0?.28:.2,.012,7,36),lace,0,y,0);
      band.rotation.x=Math.PI/2;
    }
    // Pequenos botões e costura frontal.
    for(let i=0;i<5;i++)ell(torso,metal,0,.31-i*.115,.178-i*.012,.018,.018,.012);
    tube(torso,[[0,.35,.178],[.012,.1,.205],[0,-.12,.26],[0,-.38,.3]],.008,lace,24);
    const neck=add(torso,lathe([[.09,0],[.105,.08],[.09,.19]],16),skin,0,.42,0);
    // Cabeça com mandíbula e planos faciais próprios.
    const head=new THREE.Group();head.position.set(0,1.82,.02);rootMesh.add(head);
    ell(head,skin,0,.05,0,.205,.29,.19);
    ell(head,skinShade,0,-.15,.105,.125,.085,.095);
    ell(head,skin,0,-.035,.17,.12,.075,.045);
    // Cabelo como touca e mechas tubulares longas, não blocos.
    ell(head,hair,0,.22,-.015,.225,.19,.205);
    ell(head,hair,0,.025,-.145,.22,.29,.105);
    for(let i=0;i<17;i++){
      const side=i%2?1:-1,u=Math.floor(i/2),x=side*(.045+u*.018);
      const startY=.29-(u%4)*.025;
      const endY=-.38-(u%3)*.08;
      tube(head,[[x*.4,startY,-.04],[x,.12,-.17],[x*1.18,-.12,-.12],[x*1.05,endY,-.015]],.018+(i%3)*.003,i%4===0?hairHi:hair,18);
    }
    // Franja irregular cobre parte dos olhos; a face continua legível à curta distância.
    for(let i=0;i<7;i++){
      const x=(i-3)*.052;
      tube(head,[[x*.6,.34,.08],[x,.22,.18],[x*.9,.04,.19],[x*1.15,-.12,.12]],.024,i%2?hair:hairHi,12);
    }
    const face={eyes:[],mouth:null};
    [-1,1].forEach(side=>{
      ell(head,skin,side*.205,.015,0,.045,.075,.055);
      ell(head,black,side*.082,.075,.17,.052,.034,.018);
      const sclera=ell(head,eye,side*.082,.074,.188,.018,.013,.008);
      const pupil=ell(head,black,side*.082,.074,.195,.006,.01,.004);
      face.eyes.push({sclera,pupil});
    });
    // Nariz e boca articulável para expressões de ameaça durante perseguições.
    ell(head,skinShade,0,-.015,.204,.025,.052,.03);
    face.mouth=tube(head,[[-.075,-.105,.18],[-.035,-.13,.205],[0,-.135,.21],[.04,-.13,.205],[.075,-.105,.18]],.009,skinShade,14);
    // Véu translúcido ondulado atrás da cabeça e dos ombros.
    const veilGeo=new THREE.BufferGeometry(),verts=[],indices=[];
    const rows=10,cols=8;
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
      const u=x/cols,v=y/rows;
      verts.push((u-.5)*.58+Math.sin(v*7+u*5)*.018,.19-v*.92,-.13-v*.12+Math.sin(u*12+v*4)*.018);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;indices.push(a,c,b,b,c,d);
    }
    veilGeo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));veilGeo.setIndex(indices);veilGeo.computeVertexNormals();
    const veilMat=mat(ghost?0xe3dfea:0x8f7c7e,.92,0,{transparent:true,opacity:ghost?.24:.32,side:THREE.DoubleSide,depthWrite:false});
    add(head,veilGeo,veilMat,0,0,0);
    // Ombros, mangas, antebraços e dedos articulados.
    const arms=[-1,1].map(side=>{
      const shoulder=new THREE.Group();shoulder.position.set(side*.245,1.48,.005);rootMesh.add(shoulder);
      ell(shoulder,dress,0,0,0,.14,.15,.14);
      const sleeve=add(shoulder,lathe([[.075,-.43],[.105,-.3],[.12,-.08],[.105,.08],[.09,.15]],16),dressRed,0,-.19,0);
      const cuff=add(shoulder,new THREE.TorusGeometry(.073,.012,7,20),lace,0,-.39,0);cuff.rotation.x=Math.PI/2;
      const fore=new THREE.Group();fore.position.set(side*.025,-.39,.015);shoulder.add(fore);
      add(fore,lathe([[.047,-.39],[.06,-.26],[.052,-.08],[.068,.04]],16),skin,0,-.16,0);
      ell(fore,skin,0,-.39,.015,.065,.055,.06);
      for(let f=0;f<4;f++){
        const fx=(f-1.5)*.026,len=.12+(f===1?0:.025);
        tube(fore,[[fx,-.4,.035],[fx*1.12,-.4-len*.55,.05],[fx*1.15,-.4-len,.035]],.012,skin,9);
      }
      tube(fore,[[-.045,-.37,.03],[-.085,-.43,.06],[-.09,-.49,.07]],.014,skin,9);
      shoulder.userData.fore=fore;return shoulder;
    });
    // Pernas longas sob a saia, com pivôs independentes para a marcha.
    const legs=[-1,1].map(side=>{
      const hip=new THREE.Group();hip.position.set(side*.125,.57,0);rootMesh.add(hip);
      add(hip,lathe([[.065,-.53],[.09,-.42],[.085,-.14],[.11,.05]],16),skin,0,-.2,0);
      const knee=new THREE.Group();knee.position.set(0,-.47,0);hip.add(knee);
      add(knee,lathe([[.045,-.42],[.065,-.3],[.07,-.08],[.085,.05]],16),skin,0,-.17,0);
      const foot=add(knee,lathe([[.045,-.05],[.07,-.015],[.09,.045],[.075,.1]],16),mat(0x211b1c,.62,.08),0,-.42,.075);
      foot.rotation.x=Math.PI/2;
      hip.userData.knee=knee;return hip;
    });
    // Pingente e aliança: pequenos detalhes metálicos captam a lanterna.
    const pendant=add(torso,new THREE.TorusGeometry(.045,.009,8,20),metal,0,.22,.19);pendant.rotation.x=Math.PI/2;
    // Rig hierárquico: os grupos de malha existentes passam a ser conduzidos por ossos nomeados.
    const bone=(name,parent,position)=>{const b=new THREE.Bone();b.name=name;b.position.set(position[0],position[1],position[2]);if(parent)parent.add(b);return b;};
    const rootBone=bone("root",null,[0,0,0]);
    const pelvisBone=bone("pelvis",rootBone,[0,.95,0]);
    const spineBone=bone("spine",pelvisBone,[0,.21,0]);
    const neckBone=bone("neck",spineBone,[0,.42,0]);
    const headBone=bone("head",neckBone,[0,.24,.02]);
    torso.position.set(0,0,0);spineBone.add(torso);
    head.position.set(0,0,0);headBone.add(head);
    const shoulderBones=arms.map((part,index)=>{
      const side=index===0?-1:1,b=bone(side<0?"shoulder.L":"shoulder.R",spineBone,[side*.245,.32,.005]);
      part.position.set(0,0,0);b.add(part);b.userData.fore=part.userData.fore;return b;
    });
    const hipBones=legs.map((part,index)=>{
      const side=index===0?-1:1,b=bone(side<0?"hip.L":"hip.R",pelvisBone,[side*.125,-.38,0]);
      part.position.set(0,0,0);b.add(part);b.userData.knee=part.userData.knee;return b;
    });
    const bones=[rootBone,pelvisBone,spineBone,neckBone,headBone,...shoulderBones,...hipBones];
    rootBone.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);skeleton.calculateInverses();
    rootMesh.add(rootBone);
    rootMesh.arms=shoulderBones;rootMesh.legs=hipBones;rootMesh.head=headBone;rootMesh.torso=spineBone;
    rootMesh.userData={model:"valdirene-procedural-v4",height:2.42,ghost:!!ghost,face,rig:{root:rootBone,pelvis:pelvisBone,spine:spineBone,neck:neckBone,head:headBone,shoulders:shoulderBones,hips:hipBones,bones,skeleton}};
    if(ghost){
      rootMesh.traverse(o=>{
        if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=Math.min(o.material.opacity??1,.48);o.material.depthWrite=false}
      });
    }
    return rootMesh;
  }

  function createAnderson(THREE){
    const root=new THREE.Group();root.name="anderson-full-character";
    const mat=(color,rough=.82,metal=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,...extra});
    const skin=mat(0x9a7462,.9),skinDark=mat(0x684b42,.94),hair=mat(0x171316,.94),hairHi=mat(0x342a2b,.9);
    const jacket=mat(0x292d32,.92),jacketEdge=mat(0x45464a,.88),shirt=mat(0xaaa08d,.95),jeans=mat(0x202b37,.96),shoe=mat(0x101114,.72,.08);
    const eye=mat(0xe2d8c8,.38,0,{emissive:0x24100b,emissiveIntensity:.08}),pupil=mat(0x09090b,.3),mouthMat=mat(0x3b1718,.9);
    const add=(parent,geo,material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
    const ell=(parent,material,x,y,z,sx,sy,sz)=>{const m=add(parent,new THREE.SphereGeometry(1,20,16),material,x,y,z);m.scale.set(sx,sy,sz);return m};
    const tube=(parent,points,radius,material)=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return add(parent,new THREE.TubeGeometry(curve,16,radius,7,false),material)};
    const limb=(parent,material,rTop,rBottom,length,x,y,z)=>{const mesh=add(parent,new THREE.CylinderGeometry(rTop,rBottom,length,14,1),material,x,y,z);return mesh};
    const torso=new THREE.Group();torso.position.y=1.02;root.add(torso);
    ell(torso,jacket,0,.03,0,.31,.42,.18);
    ell(torso,jacketEdge,0,.31,-.01,.32,.13,.185);
    ell(torso,shirt,0,.04,.17,.19,.32,.035);
    // Gola, lapelas e costuras tornam a roupa identificável de perto.
    const lapelL=add(torso,new THREE.BufferGeometry(),jacketEdge);lapelL.geometry.setAttribute("position",new THREE.Float32BufferAttribute([-.2,.35,.16,-.04,.28,.2,-.11,-.04,.19],3));lapelL.geometry.setIndex([0,1,2]);lapelL.geometry.computeVertexNormals();
    const lapelR=add(torso,new THREE.BufferGeometry(),jacketEdge);lapelR.geometry.setAttribute("position",new THREE.Float32BufferAttribute([.2,.35,.16,.04,.28,.2,.11,-.04,.19],3));lapelR.geometry.setIndex([0,1,2]);lapelR.geometry.computeVertexNormals();
    for(let i=0;i<4;i++)ell(torso,mat(0x171719,.42,.45),.015,.17-i*.105,.21,.012,.012,.009);
    const neck=add(root,new THREE.CylinderGeometry(.075,.09,.16,14),skin,0,1.48,0);
    const head=new THREE.Group();head.position.set(0,1.66,.015);root.add(head);
    ell(head,skin,0,.045,0,.19,.245,.17);
    ell(head,skinDark,0,-.12,.09,.11,.075,.08);
    ell(head,hair,0,.22,-.015,.198,.115,.177);
    // Laterais curtas e mechas individuais.
    for(let side of [-1,1]){
      ell(head,hair,side*.17,.09,-.005,.045,.16,.14);
      tube(head,[[side*.15,.2,.03],[side*.18,.08,.045],[side*.16,-.02,.055]],.018,hairHi);
      ell(head,skin,side*.19,.005,0,.035,.055,.04);
      ell(head,skinDark,side*.19,.005,.033,.012,.025,.009);
      ell(head,skinDark,side*.078,.075,.145,.057,.026,.018);
      ell(head,eye,side*.078,.065,.158,.035,.022,.012);
      ell(head,pupil,side*.078,.065,.17,.012,.015,.006);
      tube(head,[[side*.12,.115,.15],[side*.075,.13,.16],[side*.035,.115,.15]],.012,hair);
    }
    ell(head,skinDark,0,-.005,.17,.025,.05,.027);
    ell(head,mouthMat,0,-.105,.15,.052,.012,.012);
    tube(head,[[-.055,-.15,.12],[0,-.17,.14],[.055,-.15,.12]],.008,skinDark);
    // Braços com pivôs separados, punhos e dedos.
    const arms=[-1,1].map(side=>{
      const shoulder=new THREE.Group();shoulder.position.set(side*.29,.31,0);torso.add(shoulder);
      ell(shoulder,jacket,0,0,0,.13,.15,.13);
      limb(shoulder,jacket,.105,.085,.34,0,-.19,0);
      const elbow=new THREE.Group();elbow.position.set(0,-.36,0);shoulder.add(elbow);
      ell(elbow,jacketEdge,0,0,0,.09,.09,.09);
      limb(elbow,skin,.065,.052,.29,0,-.15,.01);
      const hand=new THREE.Group();hand.position.set(0,-.31,.02);elbow.add(hand);
      ell(hand,skin,0,-.015,0,.064,.075,.045);
      for(let i=0;i<4;i++){const x=(i-1.5)*.027;tube(hand,[[x,-.04,.015],[x,-.085,.02],[x*1.08,-.11,.015]],.009,skin)}
      tube(hand,[[side*.045,-.01,.02],[side*.075,-.055,.03],[side*.07,-.085,.03]],.011,skin);
      return {shoulder,elbow,hand,side};
    });
    const legs=[-1,1].map(side=>{
      const hip=new THREE.Group();hip.position.set(side*.14,.69,0);root.add(hip);
      limb(hip,jeans,.125,.09,.48,0,-.23,0);
      const knee=new THREE.Group();knee.position.set(0,-.46,0);hip.add(knee);
      ell(knee,jeans,0,0,0,.09,.095,.095);
      limb(knee,jeans,.085,.06,.39,0,-.19,0);
      const foot=new THREE.Group();foot.position.set(0,-.39,.025);knee.add(foot);
      ell(foot,shoe,0,-.01,-.055,.085,.06,.15);
      return {hip,knee,foot,side};
    });
    // Pequenos vincos no jeans e costuras do casaco.
    for(let side of [-1,1])tube(root,[[side*.14,.7,.105],[side*.15,.42,.1],[side*.14,.2,.08]],.006,jacketEdge);
    root.userData={model:"anderson-procedural-v1",head,torso,arms,legs,phase:0,expression:0};
    return root;
  }
  function updateAnderson(model,dt,mode="idle"){
    if(!model||!model.userData)return;
    const d=model.userData;d.phase+=Math.max(0,Math.min(.05,dt||0))*(mode==="run"?13:mode==="walk"?7:1.4);
    const moving=mode==="run"||mode==="walk",amp=mode==="run"?.72:.38;
    d.legs.forEach((leg,i)=>{const s=Math.sin(d.phase+(i?Math.PI:0));leg.hip.rotation.x=moving?s*amp:Math.sin(d.phase*.4)*.018;leg.knee.rotation.x=moving?Math.max(0,-s)*.55:0});
    d.arms.forEach((arm,i)=>{const s=Math.sin(d.phase+(i?0:Math.PI));arm.shoulder.rotation.x=moving?s*amp*.62:Math.sin(d.phase*.5+i)*.025;arm.elbow.rotation.x=mode==="run"?.48:.12});
    d.head.rotation.z=Math.sin(d.phase*.42)*.035;
    d.head.rotation.x=mode==="run"?.07:Math.sin(d.phase*.3)*.018;
  }
\n  root.GameModels={createValdirene,createAnderson,updateAnderson};
})(typeof window!=="undefined"?window:globalThis);
