"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
require("../mechanisms.js");
test("mechanisms animate drawers and hinged doors with bounded progress",()=>{
 const system=new globalThis.GameMechanisms.MechanismSystem();
 const drawer={position:{x:0,y:0,z:0}};
 system.register({id:"drawer:a",type:"drawer",object:drawer,axis:"position",component:"z",closed:0,open:.4,duration:.2});
 assert.equal(system.toggle("drawer:a").open,true);
 for(let i=0;i<4;i++)system.update(.05);
 assert.equal(drawer.position.z,.4);
 system.toggle("drawer:a");for(let i=0;i<8;i++)system.update(.05);
 assert.equal(drawer.position.z,0);
});
test("locked mechanisms require the matching key and can consume it",()=>{
 const system=new globalThis.GameMechanisms.MechanismSystem();
 const inv=["cabinet-key"];
 system.register({id:"lock:front",type:"lock",locked:true,key:"cabinet-key",consumable:true});
 assert.equal(system.toggle("lock:front",[]).reason,"locked");
 const result=system.toggle("lock:front",inv);
 assert.equal(result.ok,true);assert.equal(result.usedKey,true);assert.deepEqual(inv,[]);
});
test("mechanism IDs are unique and snapshots restore only known valid records",()=>{
 const system=new globalThis.GameMechanisms.MechanismSystem();
 const door={rotation:{y:0}};
 system.register({id:"door:1",type:"hinge",object:door,axis:"rotation",component:"y",open:1});
 assert.throws(()=>system.register({id:"door:1",type:"hinge"}),/ID duplicado/);
 system.restore([{id:"door:1",progress:.7,target:1},{id:"unknown",progress:1,target:1},{id:"door:1",progress:"bad",target:1},null]);
 assert.ok(Math.abs(door.rotation.y-.7)<1e-9);
 assert.equal(system.serialize()[0].target,1);
});
test("disabled mechanisms cannot be toggled and state remains bounded",()=>{
 const system=new globalThis.GameMechanisms.MechanismSystem();
 system.register({id:"button:power",type:"button",enabled:false});
 assert.equal(system.toggle("button:power").reason,"unavailable");
 system.register({id:"lever:1",type:"lever"});
 system.set("lever:1",true);for(let i=0;i<100;i++)system.update(.05);
 assert.equal(system.get("lever:1").progress,1);
});
