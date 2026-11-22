/* Percepção da IA: visão e audição explícitas, sem conhecimento global do jogador. */
(function(root){
  "use strict";
  const DIFFICULTY=Object.freeze({
    easy:Object.freeze({vision:15,hearing:.72,investigationSpeed:2.1,searchSpeed:1.8,chaseSpeed:3.7,loseSight:2.2,searchDuration:4.2,hideSearchDelay:3.2,hideSearchChance:.15}),
    normal:Object.freeze({vision:22,hearing:1,investigationSpeed:2.6,searchSpeed:2.2,chaseSpeed:4.4,loseSight:1.5,searchDuration:5,hideSearchDelay:2.5,hideSearchChance:.3}),
    hard:Object.freeze({vision:29,hearing:1.28,investigationSpeed:3,searchSpeed:2.55,chaseSpeed:5.2,loseSight:1.8,searchDuration:6.5,hideSearchDelay:2.1,hideSearchChance:.55})
  });
  function tuning(difficulty="normal",finalChapter=false){
    const base=DIFFICULTY[difficulty]||DIFFICULTY.normal;
    return Object.freeze({...base,chaseSpeed:base.chaseSpeed*(finalChapter?1.09:1)});
  }
  function perceive(enemy,player,context={}){
    if(!enemy||!player)throw new TypeError("Percepção exige entidade e jogador");
    const distance=Number.isFinite(context.distance)?Math.max(0,context.distance):Infinity;
    const vision=Number.isFinite(context.vision)?Math.max(0,context.vision):0;
    if(!player.hid&&context.lineOfSight===true&&distance<=vision){
      const position={x:player.x,z:player.z};
      enemy.last=[position.x,position.z];
      enemy.lost=0;
      return {type:"sight",position,distance};
    }
    const noise=context.noise,now=Number.isFinite(context.now)?context.now:0;
    if(noise&&Number.isFinite(noise.id)&&noise.id!==enemy.heard&&Number.isFinite(noise.expires)&&noise.expires>now){
      const dx=(Number(noise.x)||0)-(Number(enemy.x)||0),dz=(Number(noise.z)||0)-(Number(enemy.z)||0);
      const heardDistance=Math.hypot(dx,dz),radius=Number.isFinite(noise.radius)?Math.max(0,noise.radius):0;
      if(heardDistance<=radius){
        enemy.heard=noise.id;
        return {type:"hearing",position:{x:noise.x,z:noise.z},distance:heardDistance,kind:noise.kind||"unknown"};
      }
    }
    return {type:"none",distance};
  }
  root.GameEnemyAI=Object.freeze({perceive,tuning,difficulties:DIFFICULTY});
})(typeof window!=="undefined"?window:globalThis);
