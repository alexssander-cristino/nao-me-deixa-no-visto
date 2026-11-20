/* Percepção da IA: visão e audição explícitas, sem conhecimento global do jogador. */
(function(root){
  "use strict";
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
  root.GameEnemyAI=Object.freeze({perceive});
})(typeof window!=="undefined"?window:globalThis);
