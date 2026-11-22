const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("all browser scripts parse and local modules are wired into the game", () => {
  const html = read("index.html");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1]).filter((source) => source.trim());
  // The Three.js CDN fallback is a separate inline bootstrap script.
  // Keep validating every inline block instead of assuming a single monolithic block.
  assert.equal(scripts.length, 2);
  for (const source of scripts) new vm.Script(source);
  for (const file of ["input.js", "save-system.js", "rendering.js", "physics.js", "controller.js", "models.js", "gameplay-systems.js", "materials.js"]) {
    new vm.Script(read(file), { filename: file });
    assert.ok(html.includes('src="./' + file + '"'));
  }
  assert.doesNotMatch(html, /\.innerHTML\s*=/);
  assert.match(html, /v\.st=='relocate'/);
  assert.doesNotMatch(html, /v\.x=c\[1\]\*4;v\.z=c\[0\]\*4/);
  assert.match(html, /id="iv"/);
  assert.match(html, /KeyI/);
  assert.match(html, /function sanitizeSave/);
  assert.doesNotMatch(html, /Object\.assign\(S/);
});

test("articulated first-person body follows movement, crouch and hiding", () => {
  require("../player-animation.js");
  const THREE = require("three");
  const avatar = globalThis.GamePlayerAnimation.create(THREE);
  const player = {x:2,z:3,y:1.2,feetY:.4,mx:2,mz:0,run:1,crouch:false,hid:null};
  globalThis.GamePlayerAnimation.update(avatar,player,1/60);
  assert.equal(avatar.position.x,2);
  assert.equal(avatar.position.y,.4);
  assert.equal(avatar.position.z,3);
  assert.equal(avatar.rotation.y,1.2);
  assert.equal(avatar.visible,true);
  assert.equal(avatar.userData.arms.length,2);
  assert.equal(avatar.userData.legs.length,2);
  assert.ok(avatar.userData.rig.skeleton instanceof THREE.Skeleton);
  assert.equal(avatar.userData.rig.spine.parent,avatar.userData.rig.pelvis);
  assert.equal(avatar.userData.rig.shoulders.length,2);
  assert.equal(avatar.userData.rig.hips.length,2);
  player.crouch=true;
  player.hid={};
  player.actionTime=.46;
  player.fear=.8;
  globalThis.GamePlayerAnimation.update(avatar,player,1/60);
  assert.ok(player.actionTime<.46);
  assert.equal(avatar.visible,false);
  assert.ok(avatar.userData.torso.position.y<.9);
});

test("Valdirene animation blends patrol, search and chase poses without teleporting", () => {
  require("../enemy-animation.js");
  const model = {
    rotation: { z: 0 },
    torso: { rotation: { x: 0 }, scale: { y: 1 } },
    arms: [
      { rotation: { x: 0, z: 0 }, userData: { fore: { rotation: { x: 0 } } } },
      { rotation: { x: 0, z: 0 }, userData: { fore: { rotation: { x: 0 } } } }
    ],
    legs: [
      { rotation: { x: 0 }, userData: { knee: { rotation: { x: 0 } } } },
      { rotation: { x: 0 }, userData: { knee: { rotation: { x: 0 } } } }
    ],
    head: { rotation: { x: 0, z: 0 } },
    userData: {}
  };
  const enemy = { st: "pat" };
  globalThis.GameEnemyAnimation.update(model, enemy, 1 / 60, 12);
  enemy.st = "chase";
  for (let i = 0; i < 30; i++) globalThis.GameEnemyAnimation.update(model, enemy, 1 / 60, 4);
  assert.equal(model.userData.animationState, "chase");
  assert.ok(model.arms.some(arm => Math.abs(arm.rotation.x) > .1));
  assert.ok(model.legs.some(leg => Math.abs(leg.rotation.x) > .05));
  assert.ok(Number.isFinite(model.head.rotation.z));
});

test("loading manager reports weighted progress only after real tasks complete", async () => {
  require("../loading-manager.js");
  const manager = new globalThis.GameLoadingManager.LoadingManager();
  const completed = [];
  const progress = [];
  const result = await manager.run([
    { label: "scene", weight: 3, run: async () => { completed.push("scene"); } },
    { label: "compile", weight: 1, run: async () => { completed.push("compile"); } }
  ], value => progress.push(value));
  assert.deepEqual(completed, ["scene", "compile"]);
  assert.equal(result.ok, true);
  assert.equal(result.completed, 2);
  assert.deepEqual(progress.map(value => value.percent), [0, 75, 100, 100]);
  assert.equal(progress.at(-1).label, "Pronto");
});

test("loading manager rejects invalid tasks and always releases its running lock", async () => {
  require("../loading-manager.js");
  const manager = new globalThis.GameLoadingManager.LoadingManager();
  await assert.rejects(manager.run([{ label: "broken", run: () => { throw new Error("asset failed"); } }]), /asset failed/);
  assert.equal(manager.running, false);
  await assert.rejects(manager.run([{}]), /Tarefa de carregamento inválida/);
});

test("gameplay wires audible investigation and an animated lethal Valdirene attack", () => {
  const html = read("index.html");
  assert.match(html, /function emitNoise\(/);
  assert.match(html, /GameEnemyAI\.perceive\(v,pl/);
  assert.match(html, /emitNoise\(pl\.x,pl\.z,pl\.run\?16/);
  assert.match(html, /emitNoise\(b\.x,b\.z,10,'object-moved'\)/);
  assert.match(html, /function startAttack\(/);
  assert.match(html, /if\(attackSequence\)\{/);
  assert.match(html, /GameEnemyAnimation\.update\(vm,v,dt,dist\)/);
  assert.match(html, /if\(!pl\.hid&&dist<1\.2\)startAttack\(\)/);
});

test("manual saves include player state, collected progress and relevant settings", () => {
  const html = read("index.html");
  assert.match(html, /schema:5,mechanisms:mechanismSystem\.serialize\(\),keys:keyInventory\.serialize\(\),objects:serializePhysicsProps\(\),chapter:lv/);
  assert.match(html, /feetY:pl\.feetY\|\|0/);
  assert.match(html, /difficulty:S\.diff,quality:S\.quality/);
  assert.match(html, /openDoors:Object\.keys\(doors\)\.filter/);
  assert.match(html, /SG\.settings=p\.settings/);
});

test("loading a save restores the collider transform for every open door", () => {
  const html = read("index.html");
  assert.match(html, /d\.pv\.rotation\.y=d\.sx\?-1\.5:1\.5;updateDoorCollider\(d\)/);
});

test("enemy perception only acquires visible players or audible noise sources", () => {
  require("../enemy-ai.js");
  const enemy = { x: 0, z: 0, heard: 0, last: null };
  const player = { x: 5, z: 0, hid: null };
  let result = globalThis.GameEnemyAI.perceive(enemy, player, {
    distance: 5, vision: 8, lineOfSight: true, now: 10
  });
  assert.equal(result.type, "sight");
  assert.deepEqual(enemy.last, [5, 0]);
  player.hid = {};
  result = globalThis.GameEnemyAI.perceive(enemy, player, {
    distance: 1, vision: 8, lineOfSight: true, now: 10
  });
  assert.equal(result.type, "none");
  result = globalThis.GameEnemyAI.perceive(enemy, player, {
    distance: 20, vision: 8, lineOfSight: false, now: 10,
    noise: { id: 2, x: 3, z: 2, radius: 5, expires: 12, kind: "door-open" }
  });
  assert.equal(result.type, "hearing");
  assert.deepEqual(result.position, { x: 3, z: 2 });
  assert.equal(enemy.heard, 2);
  const occludedNoise = { id: 4, x: 3, z: 2, radius: 5, expires: 20, kind: "sprint" };
  result = globalThis.GameEnemyAI.perceive(enemy, player, {
    distance: 20, vision: 8, lineOfSight: false, now: 14,
    noise: occludedNoise, noiseTransmission: .4
  });
  assert.equal(result.type, "none");
  result = globalThis.GameEnemyAI.perceive(enemy, player, {
    distance: 20, vision: 8, lineOfSight: false, now: 14,
    noise: occludedNoise, noiseTransmission: .8
  });
  assert.equal(result.type, "hearing");
  result = globalThis.GameEnemyAI.perceive(enemy, player, {
    distance: 20, vision: 8, lineOfSight: false, now: 21,
    noise: { id: 5, x: 3, z: 2, radius: 5, expires: 12 }
  });
  assert.equal(result.type, "none");
  const easy = globalThis.GameEnemyAI.tuning("easy");
  const normal = globalThis.GameEnemyAI.tuning("normal");
  const hard = globalThis.GameEnemyAI.tuning("hard");
  assert.ok(easy.vision < normal.vision && normal.vision < hard.vision);
  assert.ok(easy.hearing < normal.hearing && normal.hearing < hard.hearing);
  assert.ok(easy.chaseSpeed < normal.chaseSpeed && normal.chaseSpeed < hard.chaseSpeed);
  assert.ok(easy.searchDuration < normal.searchDuration && normal.searchDuration < hard.searchDuration);
  assert.ok(globalThis.GameEnemyAI.tuning("hard", true).chaseSpeed > hard.chaseSpeed);
  const html = read("index.html");
  assert.doesNotMatch(html, /if\(!pl\.hid&&pl\.run&&dist<\(difficulty==/);
});

test("all 15 chapter objective sets retain their three-step sequences", () => {
  const sandbox = { build() {}, pick() {}, go() {}, alt() {} };
  sandbox.window = sandbox;
  vm.runInNewContext(read("chapter-objectives.js"), sandbox);
  const definitions = sandbox.GameChapterObjectives.definitions;
  assert.equal(definitions.length, 15);
  for (const chapter of definitions) {
    assert.equal(chapter.labels.length, 3);
    assert.ok(chapter.title && chapter.hint && chapter.kind);
  }
  const html = read("index.html");
  assert.match(html, /let head=0;while\(head<q\.length\)/);
  assert.doesNotMatch(html, /while\(q\.length\)\{const u=q\.shift\(\)/);
});

test("Valdirene voice manifest accounts for all 360 assets across 15 chapters", () => {
  const manifest = JSON.parse(read("audio/valdirene/voice-manifest.json"));
  assert.equal(manifest.recordingsAvailable, false);
  assert.equal(manifest.chapters.length, 15);
  const assets = manifest.chapters.flatMap(chapter => chapter.assets);
  assert.equal(assets.length, 360);
  assert.equal(new Set(assets.map(asset => asset.path)).size, 360);
  assert.ok(assets.every(asset => asset.status === "pending_recording"));
});

test("controller accelerates smoothly and respects the world collider", () => {
  require("../physics.js");
  require("../controller.js");
  const world = new globalThis.GamePhysics.PhysicsWorld();
  world.addAABB(0, 0, 2, 2, "wall");
  const controller = new globalThis.GameController.FirstPersonController();
  const player = { x: -3, z: 0, y: 0, p: 0, st: 100, bob: 0 };
  const camera = {
    position: { set() {} }, rotation: { set() {} },
    fov: 76, updateProjectionMatrix() {}
  };
  const move = (p, dx, dz, radius) => world.moveCircle(p, dx, dz, radius);
  let result = controller.update(1 / 60, player, { KeyD: true }, camera, null, move, { fov: 76 });
  assert.ok(result.speed > 0 && result.speed < 3.15);
  let maxSpeed = result.speed;
  for (let i = 0; i < 90; i++) {
    result = controller.update(1 / 60, player, { KeyD: true }, camera, null, move, { fov: 76 });
    maxSpeed = Math.max(maxSpeed, result.speed);
  }
  assert.ok(maxSpeed > 2.5);
  assert.ok(player.x <= -2.379);
  assert.equal(result.moving, false);
});

test("sprint consumes stamina and raises FOV while crouching lowers camera", () => {
  require("../controller.js");
  const controller = new globalThis.GameController.FirstPersonController();
  const player = { x: 0, z: 0, y: 0, p: 0, st: 100, bob: 0 };
  const camera = {
    position: { set(x, y) { this.y = y; } },
    rotation: { set() {} }, fov: 76, updateProjectionMatrix() {}
  };
  const move = () => ({ blockedX: false, blockedZ: false });
  controller.update(1 / 30, player, { KeyW: true, ShiftLeft: true }, camera, null, move, { fov: 76 });
  assert.ok(player.st < 100);
  assert.ok(camera.fov > 76);
  controller.update(1 / 30, player, { ControlLeft: true }, camera, null, move, { fov: 76 });
  assert.equal(player.crouch, true);
  assert.ok(camera.position.y < 1.65);
});


test("mouse input batches high-frequency deltas and applies them once per frame", () => {
  require("../input.js");
  const input = new globalThis.GameInput.MouseLookInput();
  input.setEnabled(true);
  for (let i = 0; i < 120; i++) {
    input.handle({ movementX: 1.25, movementY: -0.5 });
  }
  const delta = input.consume(0.85);
  assert.ok(Math.abs(delta.x - 127.5) < 1e-9);
  assert.ok(Math.abs(delta.y + 51) < 1e-9);
  assert.deepEqual(input.consume(0.85), { x: 0, y: 0 });
});

test("mouse input discards deltas outside pointer lock and clears on release", () => {
  require("../input.js");
  const input = new globalThis.GameInput.MouseLookInput();
  assert.equal(input.handle({ movementX: 40, movementY: 20 }), false);
  input.setEnabled(true);
  input.handle({ movementX: 40, movementY: 20 });
  input.setEnabled(false);
  assert.deepEqual(input.consume(1), { x: 0, y: 0 });
});


test("graphics profiles cap pixel ratio and scale shadow and atmosphere budgets", () => {
  require("../rendering.js");
  const rendering = globalThis.GameRendering;
  assert.equal(rendering.profile("low").shadows, false);
  assert.equal(rendering.profile("medium").shadowMapSize, 512);
  assert.equal(rendering.profile("high").particles, 160);
  assert.equal(rendering.profile("unknown"), rendering.profile("high"));

  const renderer = {
    shadowMap: {},
    setPixelRatio(value) { this.pixelRatio = value; }
  };
  const light = { shadow: { mapSize: { set(x, y) { this.x = x; this.y = y; } } } };
  const selected = rendering.applyQuality(renderer, light, "medium", 2);
  assert.equal(renderer.pixelRatio, 1);
  assert.equal(renderer.shadowMap.enabled, true);
  assert.equal(light.castShadow, true);
  assert.equal(light.shadow.mapSize.x, 512);
  assert.equal(selected.fog, 1);
});


test("3D character capsule collides with walls and remains grounded", () => {
  require("../physics.js");
  const world = new globalThis.GamePhysics.CharacterPhysicsWorld({gravity:18});
  const wall = {x:1,y:1.5,z:0,hx:.2,hy:1.5,hz:2};
  const position = {x:0,y:0,z:0};
  const velocity = {x:4,y:0,z:0};
  const result = world.moveCapsule(position,velocity,{x:2,y:0,z:0},{radius:.34,height:1.72},[wall]);
  assert.ok(position.x < .47 && position.x > .44);
  assert.equal(result.grounded,true);
  assert.equal(velocity.x,0);
  assert.equal(position.y,0);
});

test("3D capsule falls under gravity and lands on a raised platform", () => {
  require("../physics.js");
  const world = new globalThis.GamePhysics.CharacterPhysicsWorld({gravity:18});
  const platform = {x:0,y:.2,z:0,hx:2,hy:.2,hz:2};
  const position = {x:0,y:2,z:0};
  const velocity = {x:0,y:-8,z:0};
  let result;
  for(let i=0;i<30;i++) result=world.moveCapsule(position,velocity,{x:0,y:velocity.y/60,z:0},{radius:.34,height:1.72},[platform]);
  assert.equal(result.grounded,true);
  assert.ok(Math.abs(position.y-.4)<.02);
  assert.equal(velocity.y,0);
});

test("3D capsule respects ceiling clearance and crouch can fit", () => {
  require("../physics.js");
  const world = new globalThis.GamePhysics.CharacterPhysicsWorld({gravity:18});
  const ceiling = {x:0,y:1.75,z:0,hx:2,hy:.1,hz:2};
  const position = {x:0,y:0,z:0};
  assert.equal(world.canFit(position,{radius:.34,height:1.72},[ceiling]),false);
  assert.equal(world.canFit(position,{radius:.34,height:1.18},[ceiling]),true);
});

test("3D controller applies gravity, camera height and crouch clearance", () => {
  require("../controller.js");
  const controller = new globalThis.GameController.FirstPersonController();
  const player = {x:0,z:0,y:0,p:0,feetY:0,grounded:false,capsuleHeight:1.72,velocity3D:{x:0,y:0,z:0},st:100};
  const camera = {position:{set(x,y,z){this.x=x;this.y=y;this.z=z}},rotation:{set(){}},fov:76,updateProjectionMatrix(){}};
  const move = () => ({grounded:false,blockedY:false});
  move.canFit=(_p,shape)=>shape.height<1.3;
  let result=controller.update3D(1/60,player,{},camera,null,move,{fov:76});
  assert.ok(player.velocity3D.y<0);
  assert.equal(result.grounded,false);
  for(let i=0;i<30;i++)controller.update3D(1/60,player,{ControlLeft:true},camera,null,move,{fov:76});
  assert.equal(player.crouch,true);
  assert.ok(camera.position.y<1.3);
});


test("save system validates and isolates five independent slots", () => {
  require("../save-system.js");
  const store = globalThis.GameSaveSystem;
  const original = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  };
  try {
    assert.equal(store.SLOT_COUNT, 5);
    assert.equal(store.write(1, { chapter: 2, player: { x: 4 } }, { chapter: "Corredor" }).ok, true);
    assert.equal(store.write(2, { chapter: 4 }, {}).ok, true);
    assert.equal(store.read(1).payload.chapter, 2);
    assert.equal(store.read(2).payload.chapter, 4);
    assert.equal(store.read(6).ok, false);
    assert.equal(store.remove(1).ok, true);
    assert.equal(store.read(1).ok, false);
    assert.equal(store.readAll().find(slot => slot.slot === 2).occupied, true);
  } finally {
    globalThis.localStorage = original;
  }
});

test("Electron main and preload scripts parse and use isolated IPC", () => {
  new vm.Script(read("main.cjs"), { filename: "main.cjs" });
  new vm.Script(read("preload.cjs"), { filename: "preload.cjs" });
  const main = read("main.cjs");
  const preload = read("preload.cjs");
  assert.match(main, /app\.getPath\("userData"\)/);
  assert.match(main, /game-saves:write/);
  assert.match(preload, /contextBridge\.exposeInMainWorld/);
  assert.doesNotMatch(preload, /require\(["']node:|require\(["']fs/);
});


test("horizontal and vertical mouse settings are independently applied", () => {
  const html = read("index.html");
  assert.match(html, /id="r2y"/);
  assert.match(html, /id="invertY"/);
  assert.match(html, /mouseLook\.consume\(1\)/);
  assert.match(html, /look\.x\*\.00185\*S\.sensX/);
  assert.match(html, /look\.y\*\.00165\*S\.sensY/);
  assert.match(html, /S\.invertY\?-1:1/);
});


test("accessibility settings reduce head bob and jumpscare camera shake", () => {
  const html = read("index.html");
  const controller = read("controller.js");
  assert.match(html, /id="headBob"/);
  assert.match(html, /id="reduceCamera"/);
  assert.match(html, /reduceCameraEffects:S\.reduceCameraEffects/);
  assert.match(controller, /settings\.headBob!==false/);
  assert.match(controller, /!settings\.reduceCameraEffects/);
  assert.match(html, /const shake=S\.reduceCameraEffects\?0:1/);
});


test("fullscreen and reset-settings controls are connected to real behavior", () => {
  const html = read("index.html");
  const main = read("main.cjs");
  const preload = read("preload.cjs");
  assert.match(html, /function toggleFullscreen/);
  assert.match(html, /function resetSettings/);
  assert.match(main, /game-window:toggle-fullscreen/);
  assert.match(main, /setFullScreen\(!win\.isFullScreen\(\)\)/);
  assert.match(preload, /toggleFullscreen: \(\) => ipcRenderer\.send/);
});


test("resolution and FPS controls change the actual Electron window and frame loop", () => {
  const html = read("index.html");
  const main = read("main.cjs");
  const preload = read("preload.cjs");
  assert.match(html, /id="resolution"/);
  assert.match(html, /id="fpsLimit"/);
  assert.match(html, /1000\/fpsLimit/);
  assert.match(html, /gameWindowBridge\.setResolution/);
  assert.match(main, /game-window:set-resolution/);
  assert.match(main, /win\.setSize\(allowed\[size\]\[0\], allowed\[size\]\[1\], true\)/);
  assert.match(preload, /setResolution: size => ipcRenderer\.send/);
});


test("scheduled horror audio is invalidated across pause and resume", () => {
  const html = read("index.html");
  assert.match(html, /function invalidateAudioEvents\(\)\{audioEpoch\+\+\}/);
  assert.match(html, /function scheduleAudio\(callback,delay\)/);
  assert.match(html, /function pause\(\)\{if\(state!='play'\|\|paused\)return;invalidateAudioEvents\(\)/);
  assert.match(html, /scheduleAudio\(\(\)=>say\('Alô\? Amor\? Já comeu\?'\),2600\)/);
});

test("delayed horror audio callbacks are suppressed while paused", () => {
  const html = read("index.html");
  assert.match(html, /scheduleAudio\(\(\)=>th\(880/);
  assert.match(html, /scheduleAudio\(\(\)=>th\(50/);
});

test("wardrobe drawers spawn a collectible battery and restore it without duplication", () => {
  const html = read("index.html");
  assert.match(html, /function spawnDrawerLoot\(id,wardrobe\)/);
  assert.match(html, /items\.push\(\{k:'B',x,z,m:group,lootId:id\}\)/);
  assert.match(html, /spawnOpenedDrawerLoot\(\)/);
  assert.match(html, /mechanismSystem\.restore\(SG\.mechanisms\);spawnOpenedDrawerLoot\(\)/);
  assert.match(html, /Array\.isArray\(SG\.collected\)&&SG\.collected\.includes\(key\)/);
});

test("wardrobe mechanism setup is deferred until a scene with wardrobes exists", () => {
  const html = read("index.html");
  assert.match(html, /function setupWardrobeMechanisms\(\)\{\s*if\(!scene\|\|!Array\.isArray\(wards\)\|\|!wards\.length\)return;/);
  assert.match(html, /build=function\(n\)\{__buildWithMechanisms\(n\);setupWardrobeMechanisms\(\);\}/);
  assert.doesNotMatch(html, /\nsetupWardrobeMechanisms\(\);\n\nconst __updateSpatial/);
});

test("mission progression integrates collectible keys, a locked cabinet and a powered exit", () => {
  const html = read("index.html");
  assert.match(html, /locked:side>0&&wardrobe===wards\[0\],key:'wardrobe-key:'\+lv/);
  assert.match(html, /function spawnDrawerKey\(/);
  assert.match(html, /keyInventory\.add\(it\.keyId/);
  assert.match(html, /id:'breaker:'\+lv,type:'switch'/);
  assert.match(html, /id:'breaker-exit:'\+lv,type:'switch'/);
  assert.match(html, /exitPowerOn/);
  assert.match(html, /Religue o disjuntor da saída/);
  assert.match(html, /tag:'breaker-panel'/);
  assert.match(html, /A saída está sem energia/);
  assert.match(html, /powerOn\?\.3:\.075/);
  assert.match(html, /keys:keyInventory\.serialize\(\)/);
  assert.match(html, /keyInventory\.restore\(/);
});

test("Valdirene model exposes a named hierarchical skeleton used by animated limbs", () => {
  require("../models.js");
  const THREE = require("three");
  const model = globalThis.GameModels.createValdirene(THREE, false);
  const rig = model.userData.rig;
  assert.equal(model.userData.model, "valdirene-procedural-v4");
  assert.ok(rig.skeleton instanceof THREE.Skeleton);
  assert.equal(rig.spine.parent, rig.pelvis);
  assert.equal(rig.neck.parent, rig.spine);
  assert.equal(rig.head.parent, rig.neck);
  assert.equal(rig.shoulders.length, 2);
  assert.equal(rig.hips.length, 2);
  assert.equal(model.arms[0].userData.fore.parent.parent, model.arms[0]);
  assert.equal(model.legs[0].userData.knee.parent.parent, model.legs[0]);
});

test("procedural PBR surface maps contain normal and roughness variation", () => {
  require("../materials.js");
  const THREE = require("three");
  const maps = globalThis.GameMaterials.createSurfaceMaps(THREE, 42, 64);
  assert.ok(maps.normalMap.isDataTexture);
  assert.ok(maps.roughnessMap.isDataTexture);
  assert.equal(maps.normalMap.image.width, 64);
  assert.equal(maps.roughnessMap.image.height, 64);
  assert.notEqual(maps.roughnessMap.image.data[0], maps.roughnessMap.image.data[4]);
  const material = new THREE.MeshStandardMaterial({roughness:.9});
  globalThis.GameMaterials.apply(material, maps, .3);
  assert.equal(material.normalMap, maps.normalMap);
  assert.equal(material.roughnessMap, maps.roughnessMap);
});

test("static wall geometry is instanced and movable props switch to a distance LOD", () => {
  const html = read("index.html");
  assert.match(html, /new THREE\.InstancedMesh\(bx,wm,rows\*cols\)/);
  assert.match(html, /wallBatch\.setMatrixAt\(wallBatch\.count\+\+,wallDummy\.matrix\)/);
  assert.match(html, /new THREE\.LOD\(\),highDetail/);
  assert.match(html, /group\.addLevel\(lowDetail,16\)/);
});

test("Valdirene opens an unlocked wardrobe when searching for a hidden player", () => {
  const html = read("index.html");
  assert.match(html, /__updVWithCabinetInvestigation/);
  assert.match(html, /enemy-cabinet-search/);
  assert.match(html, /mechanismSystem\.toggle\(door\.id,mechanismInventory\)/);
});

test("continuing the active slot hydrates saved keys, mechanisms and player state", () => {
  const html = read("index.html");
  assert.match(html, /SG\.keys=Array\.isArray\(p\.keys\)\?p\.keys:\[\]/);
  assert.match(html, /SG\.mechanisms=Array\.isArray\(p\.mechanisms\)\?p\.mechanisms:\[\]/);
  assert.match(html, /SG\.playerState=\{feetY:/);
  assert.match(html, /SG\.settings=p\.settings/);
  assert.match(html, /SG\.objects=Array\.isArray\(p\.objects\)\?p\.objects:\[\]/);
});

test("movable physics props can be dragged and their transforms persist in saves", () => {
  const html = read("index.html");
  assert.match(html, /function serializePhysicsProps\(/);
  assert.match(html, /function restorePhysicsProps\(/);
  assert.match(html, /objects:serializePhysicsProps\(\)/);
  assert.match(html, /e\.code==='KeyG'/);
  assert.match(html, /object-dragged/);
  assert.match(html, /restorePhysicsProps\(resumed&&Array\.isArray\(SG\.objects\)/);
});


test("wall instancing stays compatible with Three.js 0.128 and avoids unsupported bounding-sphere calls", () => {
  const html = read("index.html");
  assert.match(html, /wallBatch\.instanceMatrix\.needsUpdate=true;wallBatch\.frustumCulled=false;scene\.add\(wallBatch\)/);
  assert.doesNotMatch(html, /wallBatch\.computeBoundingSphere\s*\(/);
});
