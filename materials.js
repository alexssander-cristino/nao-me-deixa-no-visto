/* Texturas PBR procedurais em espaço linear: normal e roughness, sem assets externos. */
(function(root){
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function createSurfaceMaps(THREE,seed=1,size=128){
    if(!THREE||!THREE.DataTexture)throw new TypeError("Three.js DataTexture indisponível");
    size=Math.max(32,Math.min(512,Math.floor(size)||128));
    const normalData=new Uint8Array(size*size*4),roughData=new Uint8Array(size*size*4);
    const height=(x,y)=>{
      const sx=x/size* Math.PI*2,sy=y/size*Math.PI*2;
      return .5+.15*Math.sin(sx*7+seed*.31)*Math.cos(sy*5-seed*.23)
        +.07*Math.sin((sx+sy)*13+seed)+.035*Math.cos(sy*23-sx*3);
    };
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const dx=(height(x+1,y)-height(x-1,y))*7,dy=(height(x,y+1)-height(x,y-1))*7;
      let nx=-dx,ny=-dy,nz=1,len=Math.hypot(nx,ny,nz)||1;nx/=len;ny/=len;nz/=len;
      const i=(y*size+x)*4;
      normalData[i]=Math.round((nx*.5+.5)*255);
      normalData[i+1]=Math.round((ny*.5+.5)*255);
      normalData[i+2]=Math.round((nz*.5+.5)*255);
      normalData[i+3]=255;
      const variation=Math.sin(x/size*Math.PI*18+seed)*11+Math.cos(y/size*Math.PI*14-seed)*8;
      const rough=clamp(218+variation,150,250);
      roughData[i]=roughData[i+1]=roughData[i+2]=rough;roughData[i+3]=255;
    }
    const make=(data)=>{
      const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);
      texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
      texture.magFilter=THREE.LinearFilter;
      texture.minFilter=THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps=true;texture.needsUpdate=true;
      return texture;
    };
    return {normalMap:make(normalData),roughnessMap:make(roughData)};
  }
  function apply(material,maps,normalStrength=.35){
    if(!material||!maps)return material;
    material.normalMap=maps.normalMap;
    material.roughnessMap=maps.roughnessMap;
    if(material.normalScale&&material.normalScale.set)material.normalScale.set(normalStrength,normalStrength);
    material.needsUpdate=true;
    return material;
  }
  root.GameMaterials=Object.freeze({createSurfaceMaps,apply});
})(typeof window!=="undefined"?window:globalThis);
