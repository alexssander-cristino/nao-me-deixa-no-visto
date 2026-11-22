/* First-person controller: world-space velocity, gravity, collision and responsive mouse-look. */
(function(root){
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const approach=(value,target,rate,dt)=>value+(target-value)*(1-Math.exp(-rate*dt));
  class FirstPersonController{
    constructor(options={}){
      this.radius=options.radius||.38;
      this.walkSpeed=options.walkSpeed||3.15;
      this.runSpeed=options.runSpeed||5.7;
      this.crouchSpeed=options.crouchSpeed||1.65;
      this.acceleration=options.acceleration||16;
      this.braking=options.braking||20;
      this.airControl=clamp(options.airControl??.28,0,1);
      this.gravity=options.gravity||18;
      this.baseHeight=options.baseHeight||1.72;
      this.crouchHeight=options.crouchHeight||1.18;
      this.stepHeight=options.stepHeight||.28;
      this.staminaDrain=options.staminaDrain||19;
      this.staminaRecover=options.staminaRecover||17;
      this.bobPhase=0;
      this.cameraHeight=this.baseHeight-.12;
      this.lastFootstep=0;
    }
    update3D(dt,player,keys,camera,flashlight,moveCharacter,settings={}){
      const delta=clamp(Number(dt)||0,0,.05);
      if(!player.velocity3D)player.velocity3D={x:player.mx||0,y:0,z:player.mz||0};
      const v=player.velocity3D;
      if(!Number.isFinite(player.feetY))player.feetY=0;
      if(keys.ArrowLeft)player.y+=1.8*delta;
      if(keys.ArrowRight)player.y-=1.8*delta;
      const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
      const strafe=(keys.KeyD?1:0)-(keys.KeyA?1:0);
      const wantsCrouch=!!(keys.ControlLeft||keys.ControlRight);
      const targetHeight=wantsCrouch?this.crouchHeight:this.baseHeight;
      const nextHeight=approach(player.capsuleHeight||this.baseHeight,targetHeight,14,delta);
      const canStand=moveCharacter.canFit?moveCharacter.canFit(player,{radius:this.radius,height:nextHeight}):true;
      player.crouch=wantsCrouch||(!canStand&&nextHeight>this.crouchHeight+.04);
      player.capsuleHeight=(!wantsCrouch&&!canStand)?Math.min(nextHeight,this.crouchHeight):nextHeight;
      const hasInput=!!(forward||strafe)&&!player.hid;
      player.run=0;
      let maxSpeed=player.crouch?this.crouchSpeed:this.walkSpeed;
      if(hasInput&&!player.crouch&&(keys.ShiftLeft||keys.ShiftRight)&&player.st>0&&!player.ex){
        maxSpeed=this.runSpeed;player.run=1;
        player.st=Math.max(0,player.st-this.staminaDrain*delta);
        if(player.st<=0)player.ex=1;
      }
      const magnitude=Math.hypot(forward,strafe)||1;
      const sin=Math.sin(player.y),cos=Math.cos(player.y);
      const targetX=hasInput?(-sin*forward+cos*strafe)/magnitude*maxSpeed:0;
      const targetZ=hasInput?(-cos*forward-sin*strafe)/magnitude*maxSpeed:0;
      const control=player.grounded===false?this.airControl:1;
      const rate=hasInput?this.acceleration:this.braking;
      v.x=approach(v.x,targetX,rate*(hasInput?control:1),delta);
      v.z=approach(v.z,targetZ,rate*(hasInput?control:1),delta);
      if(!player.grounded)v.y-=this.gravity*delta;
      else if(v.y<0)v.y=0;
      const desired={x:v.x*delta,y:v.y*delta,z:v.z*delta};
      const result=moveCharacter(player,v,desired,{radius:this.radius,height:player.capsuleHeight,stepHeight:this.stepHeight});
      player.grounded=!!(result&&result.grounded);
      if(result&&result.blockedY&&v.y<0)v.y=0;
      player.mx=v.x;player.mz=v.z;
      const actualSpeed=Math.hypot(v.x,v.z);
      if(actualSpeed>.12){
        this.bobPhase+=delta*(player.run?14:player.crouch?5.2:8.2);
        player.bob=this.bobPhase;player.sa=(player.sa||0)+actualSpeed*delta;
      }
      if(!player.run){
        player.st=Math.min(100,player.st+this.staminaRecover*delta);
        if(player.ex&&player.st>28)player.ex=0;
      }
      const cameraTarget=player.capsuleHeight-(player.crouch?.12:.12);
      this.cameraHeight=approach(this.cameraHeight,cameraTarget,18,delta);
      const bob=settings.headBob!==false&&!settings.reduceCameraEffects&&actualSpeed>.12&&player.grounded?Math.sin(this.bobPhase)*(player.run?.045:player.crouch?.006:.014):0;
      camera.position.set(player.x,player.feetY+this.cameraHeight+bob,player.z);
      camera.rotation.set(player.p,player.y,!settings.reduceCameraEffects&&settings.headBob!==false&&actualSpeed>.25&&player.grounded?Math.sin(this.bobPhase*.5)*(player.run?.009:.003):0);
      const baseFov=clamp(Number(settings.fov)||76,60,110);
      camera.fov=approach(camera.fov,baseFov+(player.run?3:0),5,delta);
      camera.updateProjectionMatrix();
      if(flashlight&&flashlight.userData&&flashlight.userData.cameraMounted){
        flashlight.position.x=.32+(player.run?Math.sin(this.bobPhase)*.018:0);
        flashlight.position.y=-.28+(player.run?Math.abs(Math.sin(this.bobPhase))*.018:0);
      }
      return {speed:actualSpeed,moving:actualSpeed>.12,running:!!player.run,crouching:!!player.crouch,grounded:player.grounded,verticalSpeed:v.y};
    }
    // Compatibility path for old 2.5D test harnesses and tools.
    update(dt,player,keys,camera,flashlight,move,settings={}){
      const delta=clamp(Number(dt)||0,0,.05);
      if(keys.ArrowLeft)player.y+=1.8*delta;
      if(keys.ArrowRight)player.y-=1.8*delta;
      const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
      const strafe=(keys.KeyD?1:0)-(keys.KeyA?1:0);
      player.crouch=!!(keys.ControlLeft||keys.ControlRight);
      const hasInput=!!(forward||strafe)&&!player.hid;
      player.run=0;let speed=player.crouch?this.crouchSpeed:this.walkSpeed;
      if(hasInput&&!player.crouch&&(keys.ShiftLeft||keys.ShiftRight)&&player.st>0&&!player.ex){speed=this.runSpeed;player.run=1;player.st=Math.max(0,player.st-this.staminaDrain*delta);if(player.st<=0)player.ex=1}
      const magnitude=Math.hypot(forward,strafe)||1,sin=Math.sin(player.y),cos=Math.cos(player.y);
      const tx=hasInput?(-sin*forward+cos*strafe)/magnitude*speed:0,tz=hasInput?(-cos*forward-sin*strafe)/magnitude*speed:0;
      const blend=1-Math.exp(-delta*(hasInput?this.acceleration:this.braking));
      player.mx=(player.mx||0)+(tx-(player.mx||0))*blend;player.mz=(player.mz||0)+(tz-(player.mz||0))*blend;
      const result=move(player,player.mx*delta,player.mz*delta,this.radius);
      if(result&&result.blockedX)player.mx=0;if(result&&result.blockedZ)player.mz=0;
      const actualSpeed=Math.hypot(player.mx||0,player.mz||0);
      if(!player.run){player.st=Math.min(100,player.st+this.staminaRecover*delta);if(player.ex&&player.st>28)player.ex=0}
      const targetHeight=player.crouch?this.crouchHeight:this.baseHeight;
      this.cameraHeight=approach(this.cameraHeight,targetHeight,12,delta);
      camera.position.set(player.x,this.cameraHeight,player.z);camera.rotation.set(player.p,player.y,0);
      camera.fov=approach(camera.fov,(settings.fov||76)+(player.run?4:0),5,delta);camera.updateProjectionMatrix();
      return {speed:actualSpeed,moving:actualSpeed>.12,running:!!player.run,crouching:!!player.crouch};
    }
  }
  root.GameController={FirstPersonController};
})(typeof window!=="undefined"?window:globalThis);
