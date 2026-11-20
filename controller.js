/* Controlador FPS — aceleração física, colisão contínua e câmera amortecida. */
(function(root){
  "use strict";
  class FirstPersonController{
    constructor(options={}){
      this.radius=options.radius||.38;
      this.walkSpeed=options.walkSpeed||3.15;
      this.runSpeed=options.runSpeed||5.7;
      this.crouchSpeed=options.crouchSpeed||1.65;
      this.acceleration=options.acceleration||13;
      this.braking=options.braking||17;
      this.staminaDrain=options.staminaDrain||19;
      this.staminaRecover=options.staminaRecover||17;
      this.baseHeight=options.baseHeight||1.65;
      this.crouchHeight=options.crouchHeight||1.24;
      this.bobPhase=0;
      this.cameraHeight=this.baseHeight;
      this.lastFootstep=0;
    }
    update(dt,player,keys,camera,flashlight,move,settings={}){
      const delta=Math.min(.05,Math.max(0,dt||0));
      if(keys.ArrowLeft)player.y+=1.8*delta;
      if(keys.ArrowRight)player.y-=1.8*delta;
      const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
      const strafe=(keys.KeyD?1:0)-(keys.KeyA?1:0);
      player.crouch=!!(keys.ControlLeft||keys.ControlRight);
      const hasInput=!!(forward||strafe)&&!player.hid;
      player.run=0;
      let speed=0;
      if(hasInput){
        speed=player.crouch?this.crouchSpeed:this.walkSpeed;
        if(!player.crouch&&(keys.ShiftLeft||keys.ShiftRight)&&player.st>0&&!player.ex){
          speed=this.runSpeed;player.run=1;
          player.st=Math.max(0,player.st-this.staminaDrain*delta);
          if(player.st<=0)player.ex=1;
        }
      }
      const magnitude=Math.hypot(forward,strafe)||1;
      const sin=Math.sin(player.y),cos=Math.cos(player.y);
      const targetX=hasInput?(-sin*forward+cos*strafe)/magnitude*speed:0;
      const targetZ=hasInput?(-cos*forward-sin*strafe)/magnitude*speed:0;
      const blend=1-Math.exp(-delta*(hasInput?this.acceleration:this.braking));
      player.mx=(player.mx||0)+(targetX-(player.mx||0))*blend;
      player.mz=(player.mz||0)+(targetZ-(player.mz||0))*blend;
      const result=move(player,player.mx*delta,player.mz*delta,this.radius);
      if(result&&result.blockedX)player.mx=0;
      if(result&&result.blockedZ)player.mz=0;
      const actualSpeed=Math.hypot(player.mx||0,player.mz||0);
      if(actualSpeed>.12){
        this.bobPhase+=delta*(player.run?14:player.crouch?5.5:8.2);
        player.bob=this.bobPhase;
        player.sa=(player.sa||0)+actualSpeed*delta;
      }
      if(!player.run){
        player.st=Math.min(100,player.st+this.staminaRecover*delta);
        if(player.ex&&player.st>28)player.ex=0;
      }
      const targetHeight=player.crouch?this.crouchHeight:this.baseHeight;
      this.cameraHeight+=(targetHeight-this.cameraHeight)*(1-Math.exp(-delta*12));
      const bob=actualSpeed>.12?Math.sin(this.bobPhase)*(player.run?.065:player.crouch?.008:.022):0;
      camera.position.set(player.x,this.cameraHeight+bob,player.z);
      camera.rotation.set(player.p,player.y,actualSpeed>.2?Math.sin(this.bobPhase*.5)*(player.run?.012:.004):0);
      const baseFov=settings.fov||76;
      const targetFov=baseFov+(player.run?4:0);
      camera.fov+=(targetFov-camera.fov)*(1-Math.exp(-delta*5));
      camera.updateProjectionMatrix();
      if(flashlight){
        flashlight.position.x=.32+(player.run?Math.sin(this.bobPhase)*.025:0);
        flashlight.position.y=-.28+(player.run?Math.abs(Math.sin(this.bobPhase))*.025:0);
      }
      return {speed:actualSpeed,moving:actualSpeed>.12,running:!!player.run,crouching:!!player.crouch};
    }
  }
  root.GameController={FirstPersonController};
})(typeof window!=="undefined"?window:globalThis);
