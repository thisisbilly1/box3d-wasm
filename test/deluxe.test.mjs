import assert from 'node:assert/strict';
import { test } from 'node:test';

import Box3D from '../dist/box3d.deluxe.mjs';

const b3 = await Box3D();

const DT = 1 / 60;
const SUBSTEPS = 4;

function buildPile(world, count) {
  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
  ground.createBox({ halfExtents: { x: 40, y: 0.5, z: 40 } });

  const bodies = [];
  for (let i = 0; i < count; i++) {
    const body = world.createBody({
      type: 'dynamic',
      position: {
        x: (i % 10) * 1.1 - 5.5,
        y: 1 + Math.floor(i / 10) * 1.1,
        z: (i % 3) * 0.05,
      },
    });
    body.createBox({ halfExtents: { x: 0.5, y: 0.5, z: 0.5 }, density: 1 });
    bodies.push(body);
  }
  return bodies;
}

test('module reports threaded build', () => {
  assert.equal(b3.threaded, true);
});

test('multithreaded world simulates a pile of boxes', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 }, workerCount: 4 });
  assert.equal(world.getWorkerCount(), 4);

  const bodies = buildPile(world, 100);
  for (let i = 0; i < 240; i++) {
    world.step(DT, SUBSTEPS);
  }

  for (const body of bodies) {
    const p = body.getPosition();
    assert.ok(p.y > 0 && p.y < 15, `body should stay in a sane range, y=${p.y}`);
  }

  world.destroy();
  world.delete();
});

test('worker count above the maximum is clamped', () => {
  const world = new b3.World({ workerCount: 10000 });
  assert.ok(world.getWorkerCount() <= b3.maxWorkers);
  world.destroy();
  world.delete();
});

test('single worker and multi worker runs agree', () => {
  const run = (workerCount) => {
    const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 }, workerCount });
    const bodies = buildPile(world, 50);
    for (let i = 0; i < 120; i++) {
      world.step(DT, SUBSTEPS);
    }
    const out = bodies.map((body) => body.getPosition());
    world.destroy();
    world.delete();
    return out;
  };

  const serial = run(1);
  const parallel = run(4);

  for (let i = 0; i < serial.length; i++) {
    const d = Math.hypot(
      serial[i].x - parallel[i].x,
      serial[i].y - parallel[i].y,
      serial[i].z - parallel[i].z,
    );
    assert.ok(d < 0.01, `body ${i} diverged by ${d} between 1 and 4 workers`);
  }
});

test('production collision and query bindings work in a threaded world', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 }, workerCount: 4 });
  const terrain = world.createBody({ type: 'static', userData: 10 });
  const mesh = terrain.createMesh({
    vertices: new Float32Array([-5, 0, -5, -5, 0, 5, 5, 0, 5, 5, 0, -5]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    friction: 0.8,
    frictionCombine: 'min',
  });
  assert.ok(mesh.isValid());
  const closest = mesh.getClosestPoint({ x: 1, y: 3, z: -1 });
  assert.ok(Math.abs(closest.y) < 1e-5);
  const meshContact = mesh.contactBox({
    center: { x: 0, y: 0.25, z: 0 },
    halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
  });
  assert.ok(meshContact);
  assert.ok(Math.abs(meshContact.distance + 0.25) < 1e-4);
  assert.ok(meshContact.normal.y > 0.99);

  const heightTerrain = world.createBody({ type: 'static', position: { x: 10, y: 0, z: 0 } });
  const heightField = heightTerrain.createHeightField({
    heights: new Float32Array([0, 0, 0, 0]),
    countX: 2,
    countZ: 2,
  });
  assert.ok(heightField.isValid());

  const body = world.createBody({ type: 'dynamic', position: { x: 0, y: 3, z: 0 }, userData: 20 });
  const sphere = body.createSphere({ radius: 0.5, density: 1, frictionCombine: 'average' });
  assert.ok(sphere.computeMassData().mass > 0);
  const cylinder = body.createCylinder({ height: 1, radius: 0.25, density: 1 });
  assert.ok(cylinder.computeMassData().mass > 0);
  for (let index = 0; index < 180; index++) world.step(DT, SUBSTEPS);

  assert.ok(body.getContactData().length > 0);
  assert.ok(body.getWorldInverseRotationalInertia().cx.x > 0);
  assert.equal(typeof body.getWorldPointVelocity({ x: 0, y: 1, z: 0 }).x, 'number');

  const hits = world.castRay(
    { x: 0, y: 2, z: 0 },
    { x: 0, y: -4, z: 0 },
    { excludeBodyUserData: [20], maxHits: 1 },
  );
  assert.equal(hits.length, 1);
  assert.equal(hits[0].bodyUserData, 10);
  hits[0].shape.delete();

  world.destroy();
  world.delete();
});
