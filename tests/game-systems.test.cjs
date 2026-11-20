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
  for (const file of ["physics.js", "controller.js", "models.js"]) {
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
