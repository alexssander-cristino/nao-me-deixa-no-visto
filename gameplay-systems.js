/* Inventário de chaves de missão. IDs são persistentes e não dependem do texto exibido. */
(function(root){
  "use strict";
  class KeyInventory{
    constructor(){this.items=[];this.metadata=new Map();}
    add(id,details={}){
      if(typeof id!=="string"||!id.trim()||id.length>96)return false;
      if(this.items.includes(id))return false;
      this.items.push(id);
      this.metadata.set(id,{label:String(details.label||id).slice(0,80),source:String(details.source||"world").slice(0,40)});
      return true;
    }
    has(id){return this.items.includes(id);}
    consume(id){const index=this.items.indexOf(id);if(index<0)return false;this.items.splice(index,1);this.metadata.delete(id);return true;}
    serialize(){return this.items.slice(0,64);}
    restore(records){
      this.items.length=0;this.metadata.clear();
      if(!Array.isArray(records))return {restored:0,ignored:0};
      let ignored=0;
      for(const id of records.slice(0,128)){if(!this.add(id)){ignored++;}}
      return {restored:this.items.length,ignored:ignored+Math.max(0,records.length-128)};
    }
  }
  root.GameGameplay=Object.freeze({KeyInventory});
})(typeof window!=="undefined"?window:globalThis);
