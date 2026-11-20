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
  assert.equal(scripts.length, 1);
  for (const source of scripts) new vm.Script(source);
  for (const file of ["input.js", "save-system.js", "rendering.js", "physics.js", "controller.js", "models.js"]) {
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
