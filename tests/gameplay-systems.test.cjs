"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
require("../gameplay-systems.js");
test("mission keys use stable IDs and reject duplicates",()=>{
 const inventory=new globalThis.GameGameplay.KeyInventory();
 assert.equal(inventory.add("wardrobe-key:0",{label:"Chave do armário"}),true);
 assert.equal(inventory.add("wardrobe-key:0"),false);
 assert.equal(inventory.has("wardrobe-key:0"),true);
 assert.deepEqual(inventory.serialize(),["wardrobe-key:0"]);
});
test("mission keys restore safely and can be consumed by locks",()=>{
 const inventory=new globalThis.GameGameplay.KeyInventory();
 const restored=inventory.restore(["front-door","front-door",null,42,"cabinet"]);
 assert.equal(restored.restored,2);
 assert.equal(inventory.consume("front-door"),true);
 assert.equal(inventory.has("front-door"),false);
 assert.equal(inventory.consume("missing"),false);
});
test("invalid and oversized key IDs are rejected",()=>{
 const inventory=new globalThis.GameGameplay.KeyInventory();
 assert.equal(inventory.add(""),false);
 assert.equal(inventory.add("x".repeat(97)),false);
 assert.equal(inventory.restore(null).restored,0);
});
