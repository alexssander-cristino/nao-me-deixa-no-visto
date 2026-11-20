const test = require("node:test");
const assert = require("node:assert/strict");
require("../physics.js");
const { PhysicsWorld } = globalThis.GamePhysics;

test("continuous collision prevents tunneling through a wall", () => {
  const world = new PhysicsWorld({ maxSubstep: 0.1 });
  world.addAABB(0, 0, 2, 2, "wall");
  const player = { x: -5, z: 0 };
  const result = world.moveCircle(player, 10, 0, 0.38);
  assert.equal(result.blockedX, true);
  assert.ok(player.x <= -2.379 && player.x >= -2.39);
});

test("player slides along a wall instead of stopping on both axes", () => {
  const world = new PhysicsWorld({ maxSubstep: 0.1 });
  world.addAABB(0, 0, 0.2, 5, "wall");
  const player = { x: -1, z: -3 };
  world.moveCircle(player, 2, 1, 0.38);
  assert.ok(player.x <= -0.579);
  assert.ok(player.z > -2.5);
});

test("oriented door collider blocks along its rotated axis", () => {
  const world = new PhysicsWorld({ maxSubstep: 0.1 });
  world.addOBB(0, 0, 2, 0.15, Math.PI / 2, "door", true);
  const player = { x: 0, z: -3 };
  const result = world.moveCircle(player, 0, 5, 0.35);
  assert.equal(result.blockedZ, true);
  assert.ok(player.z < -2.34);
});

test("raycast reports the first wall intersection", () => {
  const world = new PhysicsWorld();
  world.addAABB(0, 0, 2, 2, "wall");
  const hit = world.raycast(-4, 0, 4, 0);
  assert.equal(hit.hit, true);
  assert.equal(hit.collider.tag, "wall");
  assert.ok(hit.t > 0 && hit.t < 1);
});

test("dynamic collider can be moved and removed", () => {
  const world = new PhysicsWorld();
  const id = world.addOBB(0, 0, 2, 0.15, 0, "door", true);
  assert.equal(world.updateOBB(id, 10, 0, 2, 0.15, 0), true);
  assert.equal(world.raycast(-2, 0, 2, 0).hit, false);
  assert.equal(world.remove(id), true);
  assert.equal(world.byId.has(id), false);
});
