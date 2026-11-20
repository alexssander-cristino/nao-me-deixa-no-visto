/* Mecanismos interativos determinísticos: estados estáveis, animação e persistência. */
(function(root){
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const finite=(v,f=0)=>Number.isFinite(v)?v:f;
  class MechanismSystem{
    constructor(){this.items=new Map();this.clock=0;}
    register(def){
      if(!def||typeof def.id!=="string"||!def.id.trim()||this.items.has(def.id))throw new TypeError("Mecanismo inválido ou ID duplicado");
      if(!["hinge","drawer","switch","lever","button","lock"].includes(def.type))throw new TypeError("Tipo de mecanismo inválido");
      const duration=clamp(finite(def.duration,.32),.08,4);
      const closed=finite(def.closed,0),open=finite(def.open,def.type==="drawer"?.34:1);
      const item={id:def.id,type:def.type,label:String(def.label||def.id),object:def.object||null,
        axis:def.axis==="rotation"?"rotation":"position",component:["x","y","z"].includes(def.component)?def.component:"z",
        closed,open,duration,progress:def.initialOpen?1:0,target:def.initialOpen?1:0,locked:!!def.locked,
        key:def.key||null,consumable:!!def.consumable,usedKey:false,enabled:def.enabled!==false,
        onUpdate:typeof def.onUpdate==="function"?def.onUpdate:null,onToggle:typeof def.onToggle==="function"?def.onToggle:null,
        metadata:def.metadata&&typeof def.metadata==="object"?def.metadata:{},busy:false};
      this.items.set(item.id,item);this._apply(item);return item;
    }
    get(id){return this.items.get(id)||null;}
    toggle(id,inventory){
      const item=this.get(id);if(!item||!item.enabled||item.busy)return {ok:false,reason:"unavailable"};
      if(item.locked){
        if(!item.key||!inventory||!inventory.includes(item.key))return {ok:false,reason:"locked",key:item.key};
        item.locked=false;item.usedKey=true;
        if(item.consumable&&Array.isArray(inventory)){const i=inventory.indexOf(item.key);if(i>=0)inventory.splice(i,1);}
      }
      item.target=item.target?0:1;
      if(item.onToggle)item.onToggle(item,item.target===1);
      return {ok:true,open:item.target===1,usedKey:item.usedKey};
    }
    set(id,open){const item=this.get(id);if(!item)return false;item.target=open?1:0;return true;}
    update(dt){
      const delta=clamp(finite(dt),0,.05);this.clock+=delta;
      for(const item of this.items.values()){
        if(item.progress===item.target)continue;
        const step=delta/item.duration;
        item.progress=item.target?Math.min(1,item.progress+step):Math.max(0,item.progress-step);
        this._apply(item);
      }
    }
    _apply(item){
      if(item.object&&item.object[item.axis])item.object[item.axis][item.component]=item.closed+(item.open-item.closed)*item.progress;
      if(item.onUpdate)item.onUpdate(item,item.progress);
    }
    serialize(){
      return Array.from(this.items.values(),item=>({id:item.id,progress:item.progress,target:item.target,locked:item.locked,usedKey:item.usedKey,enabled:item.enabled}));
    }
    restore(records){
      if(!Array.isArray(records))return {ok:false,restored:0,ignored:0};
      let restored=0,ignored=0;
      for(const record of records){
        if(!record||typeof record.id!=="string"){ignored++;continue;}
        const item=this.get(record.id);if(!item){ignored++;continue;}
        const progress=Number(record.progress),target=Number(record.target);
        if(!Number.isFinite(progress)||!Number.isFinite(target)){ignored++;continue;}
        item.usedKey=record.usedKey===true;
        item.locked=item.key?(record.locked===false?!item.usedKey:true):record.locked===true;
        item.progress=item.locked?0:clamp(progress,0,1);
        item.target=item.locked?0:(target>=.5?1:0);
        item.enabled=record.enabled!==false;
        this._apply(item);restored++;
      }
      return {ok:true,restored,ignored};
    }
  }
  root.GameMechanisms=Object.freeze({MechanismSystem});
})(typeof window!=="undefined"?window:globalThis);
