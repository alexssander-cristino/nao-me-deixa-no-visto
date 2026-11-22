/* Valdirene — animação procedural articulada com blending por estado.
 * Usa os pivôs do rig criado em models.js; não teletransporta a entidade.
 */
(function(root){
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const damp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));
  function update(model,enemy,dt,distance=Infinity){
    if(!model||!model.arms||!model.legs||!enemy)return;
    const d=model.userData||(model.userData={});
    d.phase=(d.phase||0)+clamp(dt,0,.05)*(enemy.st==="chase"?13.5:enemy.st==="relocate"?8:2.8);
    const chase=enemy.st==="chase",search=enemy.st==="search"||enemy.st==="inv";
    const move=chase?1:search?.55:enemy.st==="pat"||enemy.st==="relocate"?.32:0;
    const phase=d.phase,breath=Math.sin(phase*.42);
    model.rotation.z=damp(model.rotation.z,Math.sin(phase*.5)*(chase?.045:.018),5,dt);
    if(model.torso){
      model.torso.rotation.x=damp(model.torso.rotation.x,chase?-.09:search?-.035:0,4,dt);
      model.torso.scale.y=1+breath*.006;
    }
    model.arms.forEach((arm,i)=>{
      const side=i===0?-1:1, swing=Math.sin(phase+(i?Math.PI:0));
      const target=(chase?.78:search?.32:.12)+swing*move*(chase?.48:.2);
      arm.rotation.x=damp(arm.rotation.x,target,7,dt);
      arm.rotation.z=damp(arm.rotation.z,side*(chase?.16:.07)+swing*.035,5,dt);
      if(arm.userData.fore)arm.userData.fore.rotation.x=damp(arm.userData.fore.rotation.x,chase?-.16:.04,4,dt);
    });
    model.legs.forEach((leg,i)=>{
      const swing=Math.sin(phase+(i?Math.PI:0));
      leg.rotation.x=damp(leg.rotation.x,swing*move*(chase?.56:.32),8,dt);
      if(leg.userData.knee)leg.userData.knee.rotation.x=damp(leg.userData.knee.rotation.x,Math.max(0,-swing)*move*(chase?.72:.24),8,dt);
    });
    if(model.head){
      const look=search?Math.sin(phase*.7)*.12:Math.sin(phase*.32)*.035;
      model.head.rotation.z=damp(model.head.rotation.z,look,3,dt);
      model.head.rotation.x=damp(model.head.rotation.x,chase?-.08:0,3,dt);
    }
    const face=d.face;
    if(face){
      const threat=chase?1:search?.42:0;
      if(face.mouth){
        face.mouth.scale.y=damp(face.mouth.scale.y,1+threat*.85,8,dt);
        face.mouth.scale.x=damp(face.mouth.scale.x,1+threat*.28,6,dt);
      }
      for(const eye of face.eyes||[]){
        if(eye.sclera&&eye.sclera.material){
          eye.sclera.material.emissiveIntensity=damp(eye.sclera.material.emissiveIntensity??.12,.12+threat*.95,5,dt);
        }
        if(eye.pupil)eye.pupil.scale.y=damp(eye.pupil.scale.y,threat>.7?.004:.01,7,dt);
      }
    }
    d.animationState=enemy.st;
    d.distance=Number.isFinite(distance)?distance:null;
  }
  root.GameEnemyAnimation=Object.freeze({update});
})(typeof window!=="undefined"?window:globalThis);
