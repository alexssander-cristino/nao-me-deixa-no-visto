/* Não Me Deixa no Visto — física determinística de colisão e corpos rígidos.
 * O player usa colisão circular 2.5D contra OBBs; props usam solver AABB 3D
 * com passo fixo, amortecimento, fricção, restituição e sono de corpos.
 * Não é um solver 6DOF: as limitações são explícitas para evitar falsa precisão.
 */
(function(root){
  "use strict";
  const EPS=1e-7;
  const finite=(v,f=0)=>Number.isFinite(v)?v:f;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  class PhysicsWorld{
    constructor(options={}){
      this.cellSize=options.cellSize||4;
      this.colliders=[];this.byId=new Map();this.nextId=1;
      this.maxSubstep=Math.max(.025,finite(options.maxSubstep,.12));
      this.iterations=Math.max(1,Math.floor(finite(options.iterations,6)));
      this.stats={tests:0,resolutions:0,substeps:0};
    }
    clear(){
      this.colliders.length=0;this.byId.clear();this.nextId=1;
      this.stats.tests=0;this.stats.resolutions=0;this.stats.substeps=0;
    }
    addOBB(x,z,hx,hz,angle=0,tag="solid",dynamic=false){
      const c={id:this.nextId++,x:finite(x),z:finite(z),hx:Math.max(.01,finite(hx,.01)),
        hz:Math.max(.01,finite(hz,.01)),angle:finite(angle),tag,dynamic:!!dynamic,active:true};
      this.colliders.push(c);this.byId.set(c.id,c);return c.id;
    }
    addAABB(x,z,hx,hz,tag="solid"){return this.addOBB(x,z,hx,hz,0,tag,false)}
    updateOBB(id,x,z,hx,hz,angle){
      const c=this.byId.get(id);if(!c)return false;
      c.x=finite(x,c.x);c.z=finite(z,c.z);
      if(hx!=null)c.hx=Math.max(.01,finite(hx,c.hx));
      if(hz!=null)c.hz=Math.max(.01,finite(hz,c.hz));
      if(angle!=null)c.angle=finite(angle,c.angle);
      return true;
    }
    remove(id){
      const c=this.byId.get(id);if(!c)return false;
      c.active=false;this.byId.delete(id);return true;
    }
    _local(c,x,z){
      const dx=x-c.x,dz=z-c.z,co=Math.cos(c.angle),si=Math.sin(c.angle);
      return {x:dx*co+dz*si,z:-dx*si+dz*co};
    }
    _resolveCircle(pos,r,c){
      this.stats.tests++;
      const p=this._local(c,pos.x,pos.z);
      const qx=clamp(p.x,-c.hx,c.hx),qz=clamp(p.z,-c.hz,c.hz);
      const dx=p.x-qx,dz=p.z-qz,d2=dx*dx+dz*dz;
      if(d2>=r*r-EPS)return false;
      let nx,nz,depth;
      if(d2>EPS){
        const d=Math.sqrt(d2);nx=dx/d;nz=dz/d;depth=r-d;
      }else{
        const px=c.hx-Math.abs(p.x),pz=c.hz-Math.abs(p.z);
        if(px<pz){nx=p.x<0?-1:1;nz=0;depth=r+px}
        else{nx=0;nz=p.z<0?-1:1;depth=r+pz}
      }
      const co=Math.cos(c.angle),si=Math.sin(c.angle);
      pos.x+=(nx*co-nz*si)*(depth+1e-4);
      pos.z+=(nx*si+nz*co)*(depth+1e-4);
      this.stats.resolutions++;return true;
    }
    _nearby(x,z,r){
      const candidates=[];
      for(const c of this.colliders){
        if(!c.active)continue;
        // AABB conservador do OBB rotacionado: evita perder portas diagonais.
        const co=Math.abs(Math.cos(c.angle)),si=Math.abs(Math.sin(c.angle));
        const ex=c.hx*co+c.hz*si,ez=c.hx*si+c.hz*co;
        if(Math.abs(c.x-x)<=r+ex&&Math.abs(c.z-z)<=r+ez)candidates.push(c);
      }
      return candidates;
    }
    moveCircle(pos,dx,dz,r=.38,options={}){
      const startX=finite(pos.x),startZ=finite(pos.z);
      dx=finite(dx);dz=finite(dz);r=Math.max(.01,finite(r,.38));
      const length=Math.hypot(dx,dz);
      const steps=Math.max(1,Math.ceil(length/this.maxSubstep));
      const sx=dx/steps,sz=dz/steps;
      // O swept bounds cobre todo o deslocamento; candidatos permanecem estáveis
      // durante os substeps, evitando tunneling em movimentos rápidos.
      const midX=startX+dx*.5,midZ=startZ+dz*.5;
      const candidates=this._nearby(midX,midZ,Math.hypot(dx,dz)*.5+r);
      for(let step=0;step<steps;step++){
        pos.x+=sx;pos.z+=sz;this.stats.substeps++;
        for(let pass=0;pass<this.iterations;pass++){
          let changed=false;
          for(const c of candidates){
            if(options.ignoreTag&&c.tag===options.ignoreTag)continue;
            if(options.ignoreTags&&options.ignoreTags.includes(c.tag))continue;
            if(this._resolveCircle(pos,r,c))changed=true;
          }
          if(!changed)break;
        }
      }
      const actualX=pos.x-startX,actualZ=pos.z-startZ;
      // Bloqueio por eixo, não "qualquer colisão": o controlador pode zerar
      // apenas a componente impedida e preservar o deslizamento tangencial.
      return {x:actualX,z:actualZ,blockedX:Math.abs(dx-actualX)>.005,
        blockedZ:Math.abs(dz-actualZ)>.005};
    }
    overlapsCircle(x,z,r=.38,tag){
      const p={x,z};
      for(const c of this._nearby(x,z,r)){
        if(tag&&c.tag!==tag)continue;
        const beforeX=p.x,beforeZ=p.z;
        if(this._resolveCircle(p,r,c)){p.x=beforeX;p.z=beforeZ;return true}
      }
      return false;
    }
    raycast(x1,z1,x2,z2,options={}){
      const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);
      const step=Math.max(.04,options.step||.12),n=Math.max(1,Math.ceil(len/step));
      const radius=Math.max(.005,options.radius||.035);
      const p={x:x1,z:z1};
      for(let i=1;i<=n;i++){
        p.x=x1+dx*i/n;p.z=z1+dz*i/n;
        for(const c of this._nearby(p.x,p.z,radius)){
          if(options.ignoreTags&&options.ignoreTags.includes(c.tag))continue;
          const q={x:p.x,z:p.z};
          if(this._resolveCircle(q,radius,c))return {hit:true,collider:c,t:i/n,x:p.x,z:p.z};
        }
      }
      return {hit:false,t:1,x:x2,z:z2};
    }
  }

  class RigidBodyWorld{
    constructor(options={}){
      this.gravity=finite(options.gravity,9.81);
      this.fixedStep=Math.max(1/240,finite(options.fixedStep,1/60));
      this.maxSubSteps=Math.max(1,Math.floor(finite(options.maxSubSteps,8)));
      this.maxFrameDelta=Math.max(this.fixedStep,finite(options.maxFrameDelta,.1));
      this.sleepDelay=Math.max(.1,finite(options.sleepDelay,.65));
      this.sleepSpeed=Math.max(.001,finite(options.sleepSpeed,.045));
      this.accumulator=0;this.bodies=[];this.statics=[];this.nextBodyId=1;
      this.stats={steps:0,contacts:0,sleeping:0};
    }
    clear(){
      this.accumulator=0;this.bodies.length=0;this.statics.length=0;this.nextBodyId=1;
      this.stats.steps=0;this.stats.contacts=0;this.stats.sleeping=0;
    }
    addStaticBox(box={}){
      const b={x:finite(box.x),y:finite(box.y),z:finite(box.z),
        hx:Math.max(.001,finite(box.hx,.5)),hy:Math.max(.001,finite(box.hy,.5)),
        hz:Math.max(.001,finite(box.hz,.5)),tag:box.tag||"static"};
      this.statics.push(b);return b;
    }
    addBody(options={}){
      const p=options.position||{},h=options.halfExtents||{};
      const mass=Math.max(.01,finite(options.mass,1));
      const b={id:this.nextBodyId++,x:finite(p.x),y:finite(p.y),z:finite(p.z),
        vx:0,vy:0,vz:0,rotation:finite(options.rotation),angularVelocity:0,
        hx:Math.max(.025,finite(h.x,.15)),hy:Math.max(.025,finite(h.y,.15)),hz:Math.max(.025,finite(h.z,.15)),
        mass,invMass:1/mass,restitution:clamp(finite(options.restitution,.12),0,1),
        friction:clamp(finite(options.friction,.72),0,1.5),
        linearDamping:Math.max(0,finite(options.linearDamping,.12)),
        angularDamping:Math.max(0,finite(options.angularDamping,.3)),
        grounded:false,active:true,sleeping:false,sleepTime:0,userData:options.userData||null};
      this.bodies.push(b);return b;
    }
    _wake(b){b.sleeping=false;b.sleepTime=0}
    applyImpulse(bodyOrId,impulse={}){
      const b=typeof bodyOrId==="object"?bodyOrId:this.bodies.find(v=>v.id===bodyOrId);
      if(!b||!b.active)return false;
      this._wake(b);
      b.vx+=finite(impulse.x)*b.invMass;b.vy+=finite(impulse.y)*b.invMass;
      b.vz+=finite(impulse.z)*b.invMass;
      if(impulse.angular)b.angularVelocity+=finite(impulse.angular)*b.invMass;
      b.grounded=false;return true;
    }
    removeBody(bodyOrId){
      const b=typeof bodyOrId==="object"?bodyOrId:this.bodies.find(v=>v.id===bodyOrId);
      if(!b)return false;b.active=false;return true;
    }
    _contact(body,box){
      const ox=body.hx+box.hx-Math.abs(body.x-box.x);
      const oy=body.hy+box.hy-Math.abs(body.y-box.y);
      const oz=body.hz+box.hz-Math.abs(body.z-box.z);
      if(ox<=0||oy<=0||oz<=0)return false;
      let axis="x",depth=ox;
      if(oy<depth){axis="y";depth=oy}
      if(oz<depth){axis="z";depth=oz}
      const sign=body[axis]>=box[axis]?1:-1;
      body[axis]+=sign*(depth+1e-4);
      const velocity="v"+axis,normalSpeed=body[velocity]*sign;
      if(normalSpeed<0){
        const restitution=Math.abs(normalSpeed)>.35?body.restitution:0;
        body[velocity]=-normalSpeed*restitution*sign;
      }
      if(axis==="y"&&sign>0){
        body.grounded=true;
        const damp=Math.max(0,1-body.friction*this.fixedStep*8);
        body.vx*=damp;body.vz*=damp;
      }
      this._wake(body);this.stats.contacts++;return true;
    }
    _pair(a,b){
      const ox=a.hx+b.hx-Math.abs(a.x-b.x),oy=a.hy+b.hy-Math.abs(a.y-b.y),oz=a.hz+b.hz-Math.abs(a.z-b.z);
      if(ox<=0||oy<=0||oz<=0)return;
      let axis="x",depth=ox;
      if(oy<depth){axis="y";depth=oy}
      if(oz<depth){axis="z";depth=oz}
      const inv=a.invMass+b.invMass;if(inv<=0)return;
      const sign=a[axis]>=b[axis]?1:-1;
      const correction=Math.max(0,depth-.001)*.82/inv;
      a[axis]+=sign*correction*a.invMass;b[axis]-=sign*correction*b.invMass;
      const va="v"+axis,rel=(a[va]-b[va])*sign;
      if(rel<0){
        const e=Math.abs(rel)>.35?Math.min(a.restitution,b.restitution):0;
        const impulse=-(1+e)*rel/inv;
        a[va]+=sign*impulse*a.invMass;b[va]-=sign*impulse*b.invMass;
      }
      this._wake(a);this._wake(b);this.stats.contacts++;
    }
    _tick(dt){
      for(const b of this.bodies){
        if(!b.active||b.sleeping)continue;
        b.grounded=false;b.vy-=this.gravity*dt;
        b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
        b.rotation+=b.angularVelocity*dt;
        const linear=Math.exp(-b.linearDamping*dt),angular=Math.exp(-b.angularDamping*dt);
        b.vx*=linear;b.vy*=linear;b.vz*=linear;b.angularVelocity*=angular;
        if(b.y-b.hy<0){
          b.y=b.hy;
          if(b.vy<0){const e=Math.abs(b.vy)>.35?b.restitution:0;b.vy=-b.vy*e}
          b.grounded=true;
          const friction=Math.max(0,1-b.friction*dt*8);
          b.vx*=friction;b.vz*=friction;
        }
        for(let pass=0;pass<4;pass++){
          let changed=false;
          for(const wall of this.statics)if(this._contact(b,wall))changed=true;
          if(!changed)break;
        }
      }
      for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++){
        const a=this.bodies[i],b=this.bodies[j];
        if(a.active&&b.active&&!a.sleeping&&!b.sleeping)this._pair(a,b);
        else if(a.active&&b.active&&a.sleeping!==b.sleeping)this._pair(a,b);
      }
      for(const b of this.bodies){
        if(!b.active)continue;
        const speed=Math.hypot(b.vx,b.vy,b.vz)+Math.abs(b.angularVelocity)*.25;
        if(b.grounded&&speed<this.sleepSpeed){
          b.sleepTime+=dt;
          if(b.sleepTime>=this.sleepDelay){
            b.sleeping=true;b.vx=b.vy=b.vz=b.angularVelocity=0;this.stats.sleeping++;
          }
        }else{b.sleepTime=0;b.sleeping=false}
      }
      this.stats.steps++;
    }
    step(dt){
      this.accumulator+=clamp(finite(dt),0,this.maxFrameDelta);
      let n=0;
      while(this.accumulator>=this.fixedStep&&n<this.maxSubSteps){
        this._tick(this.fixedStep);this.accumulator-=this.fixedStep;n++;
      }
      if(n===this.maxSubSteps&&this.accumulator>=this.fixedStep)this.accumulator=0;
      return n;
    }
  }

  /* Character collision in world space. Position is the capsule feet, not camera. */
  class CharacterPhysicsWorld{
    constructor(options={}){
      this.gravity=finite(options.gravity,18);
      this.groundY=finite(options.groundY,0);
      this.maxSubstep=Math.max(.025,finite(options.maxSubstep,.08));
      this.iterations=Math.max(1,Math.floor(finite(options.iterations,5)));
      this.stepHeight=clamp(finite(options.stepHeight,.28),0,.6);
      this.skin=Math.max(.001,finite(options.skin,.012));
      this.stats={tests:0,contacts:0,substeps:0};this.ramps=[];
    }
    addRamp(def={}){
      const axis=def.axis==="z"?"z":"x",rise=Math.max(.01,finite(def.rise,1));
      const ramp={x:finite(def.x),z:finite(def.z),hx:Math.max(.1,finite(def.hx,1)),hz:Math.max(.1,finite(def.hz,1)),
        baseY:finite(def.baseY),rise,axis,direction:def.direction===-1?-1:1,tag:def.tag||"ramp",ramp:true};
      this.ramps.push(ramp);return ramp;
    }
    clearRamps(){this.ramps.length=0}
    _rampHeight(x,z,radius,ramp){
      const along=ramp.axis==="x"?x-ramp.x:z-ramp.z;
      const across=ramp.axis==="x"?z-ramp.z:x-ramp.x;
      const halfAlong=ramp.axis==="x"?ramp.hx:ramp.hz,halfAcross=ramp.axis==="x"?ramp.hz:ramp.hx;
      if(Math.abs(along)>halfAlong+radius||Math.abs(across)>halfAcross+radius)return null;
      const t=clamp(.5+(along*ramp.direction)/(halfAlong*2),0,1);
      return ramp.baseY+t*ramp.rise;
    }
    _overlapY(feet,height,b){
      return feet < b.y+b.hy-this.skin && feet+height > b.y-b.hy+this.skin;
    }
    canFit(position,shape,statics=[]){
      const radius=Math.max(.08,finite(shape.radius,.34)),height=Math.max(radius*2,finite(shape.height,1.7));
      if(position.y<this.groundY-this.skin)return false;
      for(const b of statics){if(!b||b.active===false||b.ramp)continue;if(!this._overlapY(position.y,height,b))continue;if(this._circleAabb(position.x,position.z,radius,b))return false;}
      for(const ramp of this.ramps){const surface=this._rampHeight(position.x,position.z,radius,ramp);if(surface!==null&&position.y<surface-this.skin)return false;}
      return true;
    }
    _circleAabb(x,z,r,b){
      const qx=clamp(x,b.x-b.hx,b.x+b.hx),qz=clamp(z,b.z-b.hz,b.z+b.hz);
      let dx=x-qx,dz=z-qz,d=Math.hypot(dx,dz);
      if(d>=r-this.skin)return null;
      if(d>EPS)return {nx:dx/d,nz:dz/d,depth:r-d};
      const px=b.hx-Math.abs(x-b.x),pz=b.hz-Math.abs(z-b.z);
      return px<pz?{nx:x<b.x?-1:1,nz:0,depth:r+px}:{nx:0,nz:z<b.z?-1:1,depth:r+pz};
    }
    moveCapsule(position,velocity,displacement,shape,statics=[]){
      const radius=Math.max(.08,finite(shape.radius,.34));
      const height=Math.max(radius*2,finite(shape.height,1.7));
      const dx=finite(displacement.x),dy=finite(displacement.y),dz=finite(displacement.z);
      const start={x:position.x,y:position.y,z:position.z};
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy,dz)/this.maxSubstep));
      let grounded=false,blockedX=false,blockedY=false,blockedZ=false;
      for(let step=0;step<steps;step++){
        const sx=dx/steps,sy=dy/steps,sz=dz/steps;
        const previousFeet=position.y;
        position.y+=sy;
        if(position.y<this.groundY){position.y=this.groundY;velocity.y=0;grounded=true;blockedY=sy<0}
        for(const b of statics){
          if(!b||b.active===false||b.ramp)continue;
          const horizontal=this._circleAabb(position.x,position.z,radius,b);
          if(!horizontal)continue;
          const bottom=b.y-b.hy,top=b.y+b.hy;
          if(sy>0&&previousFeet+height<=bottom+this.skin&&position.y+height>bottom){
            position.y=bottom-height-this.skin;velocity.y=0;blockedY=true;this.stats.contacts++;
          }else if(sy<0&&previousFeet>=top-this.skin&&position.y<top){
            position.y=top+this.skin;velocity.y=0;grounded=true;blockedY=true;this.stats.contacts++;
          }
        }
        for(let pass=0;pass<this.iterations;pass++){
          let changed=false;
          for(const b of statics){
            if(!b||b.active===false||b.ramp||!this._overlapY(position.y,height,b))continue;
            this.stats.tests++;
            const hit=this._circleAabb(position.x,position.z,radius,b);
            if(!hit)continue;
            const top=b.y+b.hy;
            if((grounded||velocity.y<=0)&&top>position.y+this.skin&&top-position.y<=this.stepHeight&&this.canFit({x:position.x,y:top+this.skin,z:position.z},{radius,height},statics)){
              position.y=top+this.skin;velocity.y=0;grounded=true;changed=true;continue;
            }
            position.x+=hit.nx*(hit.depth+this.skin);
            position.z+=hit.nz*(hit.depth+this.skin);
            const vn=velocity.x*hit.nx+velocity.z*hit.nz;
            if(vn<0){velocity.x-=vn*hit.nx;velocity.z-=vn*hit.nz}
            blockedX=true;blockedZ=true;changed=true;this.stats.contacts++;
          }
          if(!changed)break;
        }
        position.x+=sx;position.z+=sz;
        // Resolve horizontal overlap after each substep.
        for(let pass=0;pass<this.iterations;pass++){
          let changed=false;
          for(const b of statics){
            if(!b||b.active===false||b.ramp||!this._overlapY(position.y,height,b))continue;
            this.stats.tests++;
            const hit=this._circleAabb(position.x,position.z,radius,b);
            if(!hit)continue;
            position.x+=hit.nx*(hit.depth+this.skin);
            position.z+=hit.nz*(hit.depth+this.skin);
            const vn=velocity.x*hit.nx+velocity.z*hit.nz;
            if(vn<0){velocity.x-=vn*hit.nx;velocity.z-=vn*hit.nz}
            blockedX=true;blockedZ=true;changed=true;this.stats.contacts++;
          }
          if(!changed)break;
        }
        // A rampa fornece uma superfície inclinada contínua, sem degraus AABB.
        for(const ramp of this.ramps){
          const surface=this._rampHeight(position.x,position.z,radius,ramp);
          if(surface===null)continue;
          if(velocity.y<=0&&position.y<=surface+this.stepHeight+this.skin&&surface>=position.y-this.stepHeight){
            position.y=surface;velocity.y=0;grounded=true;
          }
        }
        this.stats.substeps++;
      }
      // Ground probe catches standing still and descending onto a surface.
      let support=this.groundY;
      for(const b of statics){
        if(!b||b.active===false)continue;
        const horizontal=this._circleAabb(position.x,position.z,radius,b);
        const top=b.y+b.hy;
        if(horizontal&&position.y>=top-this.stepHeight-this.skin&&position.y<=top+this.skin&&top>support)support=top;
      }
      for(const ramp of this.ramps){const surface=this._rampHeight(position.x,position.z,radius,ramp);if(surface!==null&&surface>support)support=surface;}
      if(position.y<=support+this.skin&&velocity.y<=0){
        position.y=support;velocity.y=0;grounded=true;
      }
      if(dy!==0&&Math.abs(position.y-start.y-dy)>this.skin)blockedY=true;
      return {grounded,blockedX,blockedY,blockedZ,actual:{x:position.x-start.x,y:position.y-start.y,z:position.z-start.z}};
    }
  }

  root.GamePhysics={PhysicsWorld,RigidBodyWorld,CharacterPhysicsWorld};
})(typeof window!=="undefined"?window:globalThis);
