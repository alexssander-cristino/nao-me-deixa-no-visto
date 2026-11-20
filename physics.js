/* Não Me Deixa no Visto — colisão 2.5D determinística.
 * Círculo de jogador contra caixas orientadas, substeps e resolução de penetração.
 * O jogo mantém o eixo vertical fixo; gravidade de cenário não é simulada nesta camada.
 */
(function(root){
  "use strict";
  const EPS=1e-7;
  class PhysicsWorld{
    constructor(options={}){
      this.cellSize=options.cellSize||4;
      this.colliders=[];
      this.byId=new Map();
      this.nextId=1;
      this.maxSubstep=options.maxSubstep||.16;
      this.iterations=options.iterations||5;
      this.stats={tests:0,resolutions:0,substeps:0};
    }
    clear(){this.colliders.length=0;this.byId.clear();this.stats.tests=0;this.stats.resolutions=0;this.stats.substeps=0;}
    addOBB(x,z,hx,hz,angle=0,tag="solid",dynamic=false){
      const c={id:this.nextId++,x,z,hx:Math.max(.01,hx),hz:Math.max(.01,hz),angle,tag,dynamic,active:true};
      this.colliders.push(c);this.byId.set(c.id,c);return c.id;
    }
    addAABB(x,z,hx,hz,tag="solid"){
      return this.addOBB(x,z,hx,hz,0,tag,false);
    }
    updateOBB(id,x,z,hx,hz,angle){
      const c=this.byId.get(id);if(!c)return false;
      c.x=x;c.z=z;if(hx!=null)c.hx=Math.max(.01,hx);if(hz!=null)c.hz=Math.max(.01,hz);if(angle!=null)c.angle=angle;
      return true;
    }
    remove(id){const c=this.byId.get(id);if(!c)return false;c.active=false;this.byId.delete(id);return true;}
    _local(c,x,z){
      const dx=x-c.x,dz=z-c.z,co=Math.cos(c.angle),si=Math.sin(c.angle);
      return {x:dx*co+dz*si,z:-dx*si+dz*co};
    }
    _world(c,x,z){
      const co=Math.cos(c.angle),si=Math.sin(c.angle);
      return {x:c.x+x*co-z*si,z:c.z+x*si+z*co};
    }
    _resolveCircle(pos,r,c){
      this.stats.tests++;
      const p=this._local(c,pos.x,pos.z);
      const qx=Math.max(-c.hx,Math.min(c.hx,p.x));
      const qz=Math.max(-c.hz,Math.min(c.hz,p.z));
      let dx=p.x-qx,dz=p.z-qz,d2=dx*dx+dz*dz;
      if(d2>=r*r-EPS)return false;
      let nx,nz,depth;
      if(d2>EPS){
        const d=Math.sqrt(d2);nx=dx/d;nz=dz/d;depth=r-d;
      }else{
        const px=c.hx-Math.abs(p.x),pz=c.hz-Math.abs(p.z);
        if(px<pz){nx=p.x<0?-1:1;nz=0;depth=r+px;}
        else{nx=0;nz=p.z<0?-1:1;depth=r+pz;}
      }
      const co=Math.cos(c.angle),si=Math.sin(c.angle);
      pos.x+=(nx*co-nz*si)*(depth+1e-4);
      pos.z+=(nx*si+nz*co)*(depth+1e-4);
      this.stats.resolutions++;
      return true;
    }
    _nearby(x,z,r){
      const reach=r+5;
      return this.colliders.filter(c=>c.active&&Math.abs(c.x-x)<reach+c.hx+c.hz&&Math.abs(c.z-z)<reach+c.hx+c.hz);
    }
    moveCircle(pos,dx,dz,r=.38,options={}){
      const startX=pos.x,startZ=pos.z;
      const length=Math.hypot(dx,dz);
      const steps=Math.max(1,Math.ceil(length/this.maxSubstep));
      const sx=dx/steps,sz=dz/steps;
      const candidates=this._nearby(pos.x+dx*.5,pos.z+dz*.5,r+length*.5);
      for(let step=0;step<steps;step++){
        pos.x+=sx;pos.z+=sz;this.stats.substeps++;
        for(let pass=0;pass<this.iterations;pass++){
          let changed=false;
          for(const c of candidates){
            if(options.ignoreTag&&c.tag===options.ignoreTag)continue;
            if(this._resolveCircle(pos,r,c))changed=true;
          }
          if(!changed)break;
        }
      }
      return {x:pos.x-startX,z:pos.z-startZ,blockedX:Math.abs(dx-(pos.x-startX))>.025,blockedZ:Math.abs(dz-(pos.z-startZ))>.025};
    }
    overlapsCircle(x,z,r=.38,tag){
      const p={x,z};
      for(const c of this._nearby(x,z,r)){
        if(tag&&c.tag!==tag)continue;
        const beforeX=p.x,beforeZ=p.z;
        if(this._resolveCircle(p,r,c)){p.x=beforeX;p.z=beforeZ;return true;}
      }
      return false;
    }
    raycast(x1,z1,x2,z2,options={}){
      const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);
      const step=Math.max(.08,options.step||.16),n=Math.ceil(len/step);
      const radius=options.radius||.035;
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
  root.GamePhysics={PhysicsWorld};
})(typeof window!=="undefined"?window:globalThis);
