import assert from 'node:assert/strict';
import { test } from 'node:test';

import Box3D from '../dist/box3d.mjs';

const b3 = await Box3D();

const DT = 1 / 60;
const SUBSTEPS = 4;

function stepSeconds(world, seconds) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    world.step(DT, SUBSTEPS);
  }
}

test('module reports single threaded build', () => {
  assert.equal(b3.threaded, false);
  assert.ok(b3.maxWorkers >= 1);
});

test('world creation, gravity, destroy', () => {
  const world = new b3.World({ gravity: { x: 0, y: -9.81, z: 0 } });
  assert.ok(world.isValid());
  const g = world.getGravity();
  assert.ok(Math.abs(g.y + 9.81) < 1e-6);
  world.setGravity({ x: 0, y: -5, z: 0 });
  assert.ok(Math.abs(world.getGravity().y + 5) < 1e-6);
  world.destroy();
  assert.equal(world.isValid(), false);
  world.delete();
});

test('dynamic box falls onto static ground and settles', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
  ground.createBox({ halfExtents: { x: 20, y: 0.5, z: 20 } });

  const box = world.createBody({ type: 'dynamic', position: { x: 0, y: 5, z: 0 } });
  const boxShape = box.createBox({ halfExtents: { x: 0.5, y: 0.5, z: 0.5 }, density: 1 });
  assert.ok(Math.abs(box.getMass() - 1) < 1e-5);
  const unitMass = boxShape.computeMassData();
  assert.ok(Math.abs(unitMass.mass - 1) < 1e-5);
  assert.deepEqual(unitMass.center, { x: 0, y: 0, z: 0 });
  assert.ok(Math.abs(unitMass.inertia.cx.x - (1 / 6)) < 1e-5);
  boxShape.setDensity(3, true);
  assert.ok(Math.abs(boxShape.computeMassData().mass - 3) < 1e-5);
  assert.ok(Math.abs(box.getMass() - 3) < 1e-5);

  stepSeconds(world, 4);

  const p = box.getPosition();
  assert.ok(Math.abs(p.y - 0.5) < 0.01, `expected y near 0.5, got ${p.y}`);
  assert.equal(box.isAwake(), false, 'box should fall asleep after settling');

  world.destroy();
  world.delete();
});

test('sphere with restitution bounces', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
  ground.createBox({ halfExtents: { x: 20, y: 0.5, z: 20 }, restitution: 0.8 });

  const ball = world.createBody({ type: 'dynamic', position: { x: 0, y: 4, z: 0 } });
  ball.createSphere({ radius: 0.5, density: 1, restitution: 0.8 });

  let touchedGround = false;
  let bounceHeight = 0;
  for (let i = 0; i < 600; i++) {
    world.step(DT, SUBSTEPS);
    const y = ball.getPosition().y;
    if (!touchedGround && y < 0.55) {
      touchedGround = true;
    }
    if (touchedGround) {
      bounceHeight = Math.max(bounceHeight, y);
    }
  }
  assert.ok(touchedGround, 'ball should reach the ground');
  assert.ok(bounceHeight > 1.0, `ball should bounce back up, peaked at ${bounceHeight}`);

  world.destroy();
  world.delete();
});

test('box stack settles at expected heights', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
  ground.createBox({ halfExtents: { x: 20, y: 0.5, z: 20 } });

  const boxes = [];
  for (let i = 0; i < 5; i++) {
    const body = world.createBody({ type: 'dynamic', position: { x: 0, y: 0.6 + i * 1.05, z: 0 } });
    body.createBox({ halfExtents: { x: 0.5, y: 0.5, z: 0.5 }, density: 1, friction: 0.6 });
    boxes.push(body);
  }

  stepSeconds(world, 5);

  for (let i = 0; i < 5; i++) {
    const y = boxes[i].getPosition().y;
    const expected = 0.5 + i;
    assert.ok(Math.abs(y - expected) < 0.05, `box ${i} expected y near ${expected}, got ${y}`);
  }

  world.destroy();
  world.delete();
});

test('capsule and hull shapes simulate', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
  ground.createBox({ halfExtents: { x: 20, y: 0.5, z: 20 } });

  const capsuleBody = world.createBody({ type: 'dynamic', position: { x: -3, y: 3, z: 0 } });
  const capsule = capsuleBody.createCapsule({ height: 1, radius: 0.4, density: 1 });
  assert.equal(capsule.getType(), 'capsule');

  const hullBody = world.createBody({ type: 'dynamic', position: { x: 3, y: 3, z: 0 } });
  const hull = hullBody.createHull({
    points: [
      { x: -0.5, y: -0.5, z: -0.5 },
      { x: 0.5, y: -0.5, z: -0.5 },
      { x: 0.5, y: -0.5, z: 0.5 },
      { x: -0.5, y: -0.5, z: 0.5 },
      { x: 0, y: 0.7, z: 0 },
    ],
    density: 1,
  });
  assert.equal(hull.getType(), 'hull');
  assert.ok(hull.isValid());

  stepSeconds(world, 4);

  assert.ok(capsuleBody.getPosition().y < 1.0, 'capsule should come to rest near the ground');
  assert.ok(hullBody.getPosition().y < 1.0, 'hull should come to rest near the ground');

  world.destroy();
  world.delete();
});

test('castRayClosest hits the nearest included shape', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const bodyA = world.createBody({ type: 'static', position: { x: 0, y: 0, z: 0 }, userData: 101 });
  const shapeA = bodyA.createSphere({ radius: 1, userData: 1001 });
  const bodyB = world.createBody({ type: 'static', position: { x: 5, y: 0, z: 0 }, userData: 202 });
  const shapeB = bodyB.createSphere({ radius: 1, userData: 2002 });

  const result = world.castRayClosest({ x: -5, y: 0, z: 0 }, { x: 20, y: 0, z: 0 }, undefined);
  assert.equal(result.hit, true);
  assert.ok(Math.abs(result.point.x + 1) < 1e-3, `nearest surface at x=-1, got ${result.point.x}`);
  assert.equal(result.shapeUserData, shapeA.getUserData());
  assert.equal(result.bodyUserData, bodyA.getUserData());
  assert.equal(Number.isInteger(result.triangleIndex), true);
  assert.equal(Number.isInteger(result.childIndex), true);
  assert.ok(result.shape.isValid());
  result.shape.delete();

  const withoutBodyA = world.castRayClosest(
    { x: -5, y: 0, z: 0 },
    { x: 20, y: 0, z: 0 },
    { excludeBodyUserData: [bodyA.getUserData()] },
  );
  assert.equal(withoutBodyA.hit, true);
  assert.equal(withoutBodyA.shapeUserData, shapeB.getUserData());
  withoutBodyA.shape.delete();

  const withoutShapeA = world.castRayClosest(
    { x: -5, y: 0, z: 0 },
    { x: 20, y: 0, z: 0 },
    { excludeShapeUserData: [shapeA.getUserData()] },
  );
  assert.equal(withoutShapeA.hit, true);
  assert.equal(withoutShapeA.bodyUserData, bodyB.getUserData());
  withoutShapeA.shape.delete();

  const miss = world.castRayClosest({ x: -5, y: 10, z: 0 }, { x: 20, y: 0, z: 0 }, undefined);
  assert.equal(miss.hit, false);

  world.destroy();
  world.delete();
});

test('cylinder shape preserves its transform and mass', () => {
  const world = new b3.World({ gravity: { x: 0, y: 0, z: 0 } });
  const body = world.createBody({ type: 'dynamic' });
  const shape = body.createCylinder({
    height: 2,
    radius: 0.5,
    sides: 20,
    center: { x: 2, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
    density: 1,
  });
  assert.ok(shape.isValid());
  assert.ok(shape.computeMassData().mass > 1.4);
  const aabb = shape.getAABB();
  assert.ok(aabb.lowerBound.x < 1.1 && aabb.upperBound.x > 2.9);
  world.destroy();
  world.delete();
});

test('castRay collects sorted hits and filters body or shape userData', () => {
  const world = new b3.World({ gravity: { x: 0, y: 0, z: 0 } });
  const bodyA = world.createBody({ type: 'static', position: { x: 0, y: 0, z: 0 }, userData: 101 });
  const shapeA = bodyA.createSphere({ radius: 1, userData: 1001, userMaterialId: 11 });
  const bodyB = world.createBody({ type: 'static', position: { x: 5, y: 0, z: 0 }, userData: 202 });
  bodyB.createSphere({ radius: 1, userData: 2002, userMaterialId: 22 });

  const allHits = world.castRay({ x: -5, y: 0, z: 0 }, { x: 15, y: 0, z: 0 }, undefined);
  assert.equal(allHits.length, 2);
  assert.ok(allHits[0].fraction < allHits[1].fraction);
  assert.equal(allHits[0].bodyUserData, 101);
  assert.equal(allHits[0].userMaterialId, 11);

  const withoutBodyA = world.castRay(
    { x: -5, y: 0, z: 0 },
    { x: 15, y: 0, z: 0 },
    { excludeBodyUserData: [101], maxHits: 1 },
  );
  assert.equal(withoutBodyA.length, 1);
  assert.equal(withoutBodyA[0].bodyUserData, 202);

  const withoutShapeA = world.castRay(
    { x: -5, y: 0, z: 0 },
    { x: 15, y: 0, z: 0 },
    { excludeShapeUserData: [shapeA.getUserData()] },
  );
  assert.equal(withoutShapeA.length, 1);
  assert.equal(withoutShapeA[0].shapeUserData, 2002);

  for (const hit of [...allHits, ...withoutBodyA, ...withoutShapeA]) {
    hit.shape.delete();
  }
  world.destroy();
  world.delete();
});

test('triangle meshes collide and release resources with their shape or body', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });
  const ground = world.createBody({ type: 'static' });
  const meshOptions = {
    vertices: new Float32Array([-5, 0, -5, -5, 0, 5, 5, 0, 5, 5, 0, -5]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    identifyEdges: true,
    friction: 0.8,
  };
  const mesh = ground.createMesh(meshOptions);
  assert.ok(mesh.isValid());
  assert.equal(mesh.getType(), 'mesh');

  const ball = world.createBody({ type: 'dynamic', position: { x: 0, y: 3, z: 0 } });
  ball.createSphere({ radius: 0.5, density: 1 });
  stepSeconds(world, 3);
  assert.ok(Math.abs(ball.getPosition().y - 0.5) < 0.03);

  mesh.destroy(false);
  assert.equal(mesh.isValid(), false);
  mesh.delete();

  const replacement = ground.createMesh(meshOptions);
  assert.ok(replacement.isValid());
  ground.destroy();
  assert.equal(replacement.isValid(), false);
  replacement.delete();

  const invalidBody = world.createBody({ type: 'static' });
  const invalid = invalidBody.createMesh({
    vertices: [0, 0, 0, 1, 0, 0, 0, 0, 1],
    indices: [0, 1, 9],
  });
  assert.equal(invalid.isValid(), false);
  invalid.delete();

  world.destroy();
  world.delete();
});

test('shapes expose closest-point and signed box-contact queries', () => {
  const world = new b3.World({ gravity: { x: 0, y: 0, z: 0 } });
  const boxBody = world.createBody({ type: 'static' });
  const box = boxBody.createBox({ halfExtents: { x: 1, y: 1, z: 1 } });

  const boxContact = box.contactBox({
    center: { x: 1.25, y: 0, z: 0 },
    halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
  });
  assert.ok(boxContact);
  assert.ok(Math.abs(boxContact.distance + 0.25) < 1e-4, `unexpected hull separation ${boxContact.distance}`);
  assert.ok(boxContact.normal.x > 0.99, `unexpected hull normal ${JSON.stringify(boxContact.normal)}`);
  assert.equal(box.containsPoint({ x: 0.5, y: 0, z: 0 }), true);
  assert.equal(box.containsPoint({ x: 1.5, y: 0, z: 0 }), false);
  assert.equal(box.contactBox({
    center: { x: 3, y: 0, z: 0 },
    halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
  }), null);

  const meshBody = world.createBody({ type: 'static', position: { x: 0, y: 2, z: 0 } });
  const mesh = meshBody.createMesh({
    vertices: new Float32Array([-5, 0, -5, -5, 0, 5, 5, 0, 5, 5, 0, -5]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    identifyEdges: true,
  });
  const closest = mesh.getClosestPoint({ x: 1, y: 5, z: -1 });
  assert.ok(Math.abs(closest.x - 1) < 1e-5);
  assert.ok(Math.abs(closest.y - 2) < 1e-5);
  assert.ok(Math.abs(closest.z + 1) < 1e-5);
  const meshContact = mesh.contactBox({
    center: { x: 0, y: 2.25, z: 0 },
    halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
  });
  assert.ok(meshContact);
  assert.ok(Math.abs(meshContact.distance + 0.25) < 1e-4, `unexpected mesh separation ${meshContact.distance}`);
  assert.ok(meshContact.normal.y > 0.99, `unexpected mesh normal ${JSON.stringify(meshContact.normal)}`);

  const volumeBody = world.createBody({ type: 'static', position: { x: 10, y: 2, z: -4 } });
  const volume = volumeBody.createMesh({
    vertices: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]),
    indices: new Uint32Array([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3]),
    identifyEdges: true,
  });
  assert.equal(volume.containsPoint({ x: 10.1, y: 2.1, z: -3.9 }), true);
  assert.equal(volume.containsPoint({ x: 11, y: 3, z: -3 }), false);
  const embeddedContact = volume.contactBox({
    center: { x: 10.1, y: 2.1, z: -3.9 },
    halfExtents: { x: 0.2, y: 0.2, z: 0.2 },
  });
  assert.ok(embeddedContact);
  assert.ok(embeddedContact.distance < -0.05);

  world.destroy();
  world.delete();
});

test('height fields collide, support holes, and validate their dimensions', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });
  const terrain = world.createBody({ type: 'static' });
  const heightField = terrain.createHeightField({
    heights: new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]),
    countX: 3,
    countZ: 3,
    scale: { x: 1, y: 1, z: 1 },
    materialIndices: new Uint8Array([255, 0, 0, 0]),
    friction: 0.8,
  });
  assert.ok(heightField.isValid());
  assert.equal(heightField.getType(), 'heightField');

  const box = world.createBody({ type: 'dynamic', position: { x: 1.5, y: 3, z: 1.5 } });
  box.createBox({ halfExtents: { x: 0.25, y: 0.25, z: 0.25 }, density: 1 });
  stepSeconds(world, 3);
  assert.ok(Math.abs(box.getPosition().y - 0.25) < 0.03);

  const invalid = terrain.createHeightField({ heights: [0, 0, 0], countX: 2, countZ: 2 });
  assert.equal(invalid.isValid(), false);
  invalid.delete();

  world.destroy();
  world.delete();
});

test('body exposes world point velocity, world inverse inertia, and touching manifolds', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });
  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 }, userData: 7 });
  ground.createBox({ halfExtents: { x: 5, y: 0.5, z: 5 }, userData: 70 });

  const box = world.createBody({
    type: 'dynamic',
    position: { x: 0, y: 2, z: 0 },
    linearVelocity: { x: 3, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 2 },
    userData: 8,
  });
  box.createBox({ halfExtents: { x: 0.5, y: 0.5, z: 0.5 }, density: 1, userData: 80 });

  const pointVelocity = box.getWorldPointVelocity({ x: 0, y: 3, z: 0 });
  assert.ok(Math.abs(pointVelocity.x - 1) < 1e-5);
  assert.ok(Math.abs(pointVelocity.y) < 1e-5);

  const inertia = box.getWorldInverseRotationalInertia();
  assert.ok(inertia.cx.x > 0);
  assert.ok(inertia.cy.y > 0);
  assert.ok(inertia.cz.z > 0);

  box.setLinearVelocity({ x: 0, y: 0, z: 0 });
  box.setAngularVelocity({ x: 0, y: 0, z: 0 });
  stepSeconds(world, 3);
  const contacts = box.getContactData();
  assert.ok(contacts.length >= 1);
  const groundContact = contacts.find((contact) =>
    [contact.shapeUserDataA, contact.shapeUserDataB].includes(70),
  );
  assert.ok(groundContact);
  assert.ok(groundContact.manifolds.length >= 1);
  assert.ok(Math.abs(groundContact.manifolds[0].normal.y) > 0.9);
  assert.ok(groundContact.manifolds[0].points.length >= 1);

  world.destroy();
  world.delete();
});

test('native material callbacks apply Rapier-style combine precedence', () => {
  function reboundHeight(restitutionCombine) {
    const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });
    world.setMaterialCallbacks();
    const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
    ground.createBox({ halfExtents: { x: 5, y: 0.5, z: 5 }, restitution: 0 });
    const ball = world.createBody({ type: 'dynamic', position: { x: 0, y: 3, z: 0 } });
    ball.createSphere({ radius: 0.5, density: 1, restitution: 1, restitutionCombine });

    let touched = false;
    let peak = 0;
    for (let index = 0; index < 240; index++) {
      world.step(DT, SUBSTEPS);
      const y = ball.getPosition().y;
      touched ||= y < 0.55;
      if (touched) peak = Math.max(peak, y);
    }
    world.destroy();
    world.delete();
    return peak;
  }

  const defaultPeak = reboundHeight(undefined);
  const minPeak = reboundHeight('min');
  assert.ok(defaultPeak > 2, `default max restitution should bounce, peaked at ${defaultPeak}`);
  assert.ok(minPeak < 0.7, `min restitution should suppress the bounce, peaked at ${minPeak}`);
});

test('body move events report motion and sleep', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
  ground.createBox({ halfExtents: { x: 20, y: 0.5, z: 20 } });

  const box = world.createBody({ type: 'dynamic', position: { x: 0, y: 3, z: 0 }, userData: 42 });
  box.createBox({ halfExtents: { x: 0.5, y: 0.5, z: 0.5 }, density: 1 });

  world.step(DT, SUBSTEPS);
  const events = world.getBodyEvents();
  assert.ok(events.length >= 1, 'falling body should emit a move event');
  const e = events.find((ev) => ev.userData === 42);
  assert.ok(e, 'move event should carry the body userData tag');
  assert.ok(typeof e.position.y === 'number');
  assert.ok(typeof e.rotation.w === 'number');

  let sleepReported = false;
  for (let i = 0; i < 400 && !sleepReported; i++) {
    world.step(DT, SUBSTEPS);
    for (const ev of world.getBodyEvents()) {
      if (ev.userData === 42 && ev.fellAsleep) {
        sleepReported = true;
      }
    }
  }
  assert.ok(sleepReported, 'body should report falling asleep');

  world.destroy();
  world.delete();
});

test('contact events fire with shape tags', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
  const groundShape = ground.createBox({
    halfExtents: { x: 20, y: 0.5, z: 20 },
    enableContactEvents: true,
  });

  const box = world.createBody({ type: 'dynamic', position: { x: 0, y: 2, z: 0 } });
  const boxShape = box.createBox({
    halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
    density: 1,
    enableContactEvents: true,
  });

  let began = false;
  for (let i = 0; i < 240 && !began; i++) {
    world.step(DT, SUBSTEPS);
    const events = world.getContactEvents();
    for (const e of events.begin) {
      const tags = [e.shapeUserDataA, e.shapeUserDataB];
      if (tags.includes(groundShape.getUserData()) && tags.includes(boxShape.getUserData())) {
        began = true;
      }
    }
  }
  assert.ok(began, 'begin touch event should fire between box and ground');

  world.destroy();
  world.delete();
});

test('sensor events fire when a body passes through', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const sensorBody = world.createBody({ type: 'static', position: { x: 0, y: 1, z: 0 } });
  const sensorShape = sensorBody.createBox({
    halfExtents: { x: 2, y: 0.5, z: 2 },
    isSensor: true,
    enableSensorEvents: true,
  });

  const ball = world.createBody({ type: 'dynamic', position: { x: 0, y: 4, z: 0 } });
  ball.createSphere({ radius: 0.3, density: 1, enableSensorEvents: true });

  let begin = false;
  for (let i = 0; i < 240 && !begin; i++) {
    world.step(DT, SUBSTEPS);
    const events = world.getSensorEvents();
    for (const e of events.begin) {
      if (e.sensorUserData === sensorShape.getUserData()) {
        begin = true;
      }
    }
  }
  assert.ok(begin, 'sensor begin event should fire');

  world.destroy();
  world.delete();
});

test('distance joint holds bodies at rest length', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const anchor = world.createBody({ type: 'static', position: { x: 0, y: 5, z: 0 } });
  const bob = world.createBody({ type: 'dynamic', position: { x: 0, y: 3, z: 0 } });
  bob.createSphere({ radius: 0.2, density: 1 });

  const joint = world.createDistanceJoint(anchor, bob, { length: 2 });
  assert.equal(joint.getType(), 'distance');

  stepSeconds(world, 3);

  const p = bob.getPosition();
  const dist = Math.hypot(p.x - 0, p.y - 5, p.z - 0);
  assert.ok(Math.abs(dist - 2) < 0.05, `bob should hang 2 units below anchor, at distance ${dist}`);

  joint.delete();
  world.destroy();
  world.delete();
});

test('revolute joint motor spins a wheel', () => {
  const world = new b3.World({ gravity: { x: 0, y: 0, z: 0 } });

  const base = world.createBody({ type: 'static', position: { x: 0, y: 0, z: 0 } });
  const wheel = world.createBody({ type: 'dynamic', position: { x: 0, y: 0, z: 0 } });
  wheel.createSphere({ radius: 0.5, density: 1 });

  const joint = world.createRevoluteJoint(base, wheel, {
    enableMotor: true,
    motorSpeed: 5,
    maxMotorTorque: 100,
  });

  stepSeconds(world, 1);

  const w = wheel.getAngularVelocity();
  const spin = Math.hypot(w.x, w.y, w.z);
  assert.ok(spin > 4, `wheel should spin near motor speed, got ${spin}`);

  joint.delete();
  world.destroy();
  world.delete();
});

test('kinematic body moves by velocity and ignores gravity', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const platform = world.createBody({ type: 'kinematic', position: { x: 0, y: 2, z: 0 } });
  platform.createBox({ halfExtents: { x: 1, y: 0.1, z: 1 } });
  platform.setLinearVelocity({ x: 1, y: 0, z: 0 });

  stepSeconds(world, 2);

  const p = platform.getPosition();
  assert.ok(Math.abs(p.x - 2) < 0.02, `platform should travel 2 units, at x=${p.x}`);
  assert.ok(Math.abs(p.y - 2) < 1e-3, 'kinematic body should not fall');

  world.destroy();
  world.delete();
});

test('forces, impulses, and explosions move bodies', () => {
  const world = new b3.World({ gravity: { x: 0, y: 0, z: 0 } });

  const a = world.createBody({ type: 'dynamic', position: { x: 0, y: 0, z: 0 } });
  a.createSphere({ radius: 0.5, density: 1 });
  a.applyLinearImpulseToCenter({ x: 3, y: 0, z: 0 }, true);
  const v = a.getLinearVelocity();
  assert.ok(Math.abs(v.x - 3 / a.getMass()) < 1e-3);

  const b = world.createBody({ type: 'dynamic', position: { x: 0, y: 5, z: 0 } });
  b.createSphere({ radius: 0.5, density: 1 });
  world.explode({ position: { x: 0, y: 4, z: 0 }, radius: 2, falloff: 2, impulsePerArea: 10 });
  world.step(DT, SUBSTEPS);
  assert.ok(b.getLinearVelocity().y > 0.1, 'explosion should push the body away');

  world.destroy();
  world.delete();
});

test('collision filters keep shapes from colliding', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const ground = world.createBody({ type: 'static', position: { x: 0, y: -0.5, z: 0 } });
  ground.createBox({
    halfExtents: { x: 20, y: 0.5, z: 20 },
    filter: { categoryBits: 0x2, maskBits: 0x2 },
  });

  const ghost = world.createBody({ type: 'dynamic', position: { x: 0, y: 2, z: 0 } });
  ghost.createSphere({ radius: 0.5, density: 1, filter: { categoryBits: 0x4, maskBits: 0x4 } });

  stepSeconds(world, 2);

  assert.ok(ghost.getPosition().y < -3, 'filtered body should fall through the ground');

  world.destroy();
  world.delete();
});

test('body and shape userData round trips', () => {
  const world = new b3.World();
  const body = world.createBody({ type: 'dynamic', position: { x: 0, y: 1, z: 0 } });
  const shape = body.createSphere({ radius: 0.5 });

  assert.ok(body.getUserData() > 0, 'auto tag should be assigned');
  assert.ok(shape.getUserData() > 0, 'auto tag should be assigned');
  body.setUserData(1234);
  shape.setUserData(5678);
  assert.equal(body.getUserData(), 1234);
  assert.equal(shape.getUserData(), 5678);

  body.setName('hero');
  assert.equal(body.getName(), 'hero');

  world.destroy();
  world.delete();
});

test('destroying bodies and shapes invalidates them', () => {
  const world = new b3.World();
  const body = world.createBody({ type: 'dynamic', position: { x: 0, y: 1, z: 0 } });
  const shape = body.createSphere({ radius: 0.5 });

  assert.ok(body.isValid());
  assert.ok(shape.isValid());
  shape.destroy(true);
  assert.equal(shape.isValid(), false);
  body.destroy();
  assert.equal(body.isValid(), false);

  world.destroy();
  world.delete();
});

test('motion locks restrict movement', () => {
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 } });

  const body = world.createBody({
    type: 'dynamic',
    position: { x: 0, y: 3, z: 0 },
    motionLocks: { linearY: true },
  });
  body.createSphere({ radius: 0.5, density: 1 });

  stepSeconds(world, 1);

  assert.ok(Math.abs(body.getPosition().y - 3) < 1e-3, 'linearY lock should prevent falling');

  world.destroy();
  world.delete();
});
