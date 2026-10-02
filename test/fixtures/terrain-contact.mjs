// Small physical fixtures; no game code, drive forces or saved solver caches.
// The nine-height seam and wheel pose reduce a reproduced terrain launch.
export function runTerrainContactFixture(module, name, workerCount = 1) {
  const world = new module.World({ gravity: { x: 0, y: name === 'seam' ? -18 : 0, z: 0 },
    enableSleep: false, workerCount });
  let body;
  try {
    if (name === 'seam') {
      const terrain = world.createBody({ type: 'static', position: { x: 551.25, y: 0, z: 236.25 } });
      terrain.createHeightField({ countX: 3, countZ: 3, scale: { x: 5.625, y: 1, z: 5.625 },
        heights: [42.76078414916992,42.76078414916992,42.76078414916992,
          42.76059341430664,42.76078414916992,42.76078414916992,
          42.20060729980469,42.76059341430664,42.76078414916992],
        globalMinimumHeight: 3.3176469802856445, globalMaximumHeight: 94, friction: 1.18 });
      body = world.createBody({ type: 'dynamic', enableSleep: false,
        position: { x: 559.9907836914062, y: 42.76582336425781, z: 241.2306365966797 },
        rotation: { x: 0.000027449688786873594, y: -0.9041532874107361,
          z: -0.000023734122805763036, w: 0.42720818519592285 },
        linearVelocity: { x: -32.435638427734375, y: 0.20407220721244812, z: -26.92473030090332 },
        angularVelocity: { x: 0.008951914496719837, y: -0.14176011085510254, z: -0.010048562660813332 } });
      body.createBox({ halfExtents: { x: 1, y: 1, z: .5 }, offset: { x: 3, y: 1, z: 1 },
        rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }, density: 100, friction: 1.4 });
      world.step(1 / 60, 4);
    } else if (name === 'wall' || name === 'mesh-boundary') {
      const obstacle = world.createBody({ type: 'static' });
      if (name === 'wall') obstacle.createBox({ halfExtents: { x: 5, y: 3, z: .5 }, friction: 0 });
      else obstacle.createMesh({ vertices: [0,0,0, 6,0,0, 0,4,0], indices: [0,1,2], identifyEdges: true, friction: 0 });
      body = world.createBody({ type: 'dynamic', position: { x: name === 'wall' ? 0 : 4.4, y: 1, z: 2 },
        linearVelocity: { x: 0, y: 0, z: -10 }, enableSleep: false });
      body.createBox({ halfExtents: { x: .5, y: .5, z: .5 }, density: 1, friction: 0 });
      for (let tick = 0; tick < 18; tick++) world.step(1 / 60, 4);
    } else if (name === 'ridge') {
      const terrain = world.createBody({ type: 'static', position: { x: -5, y: 0, z: -5 } });
      terrain.createHeightField({ countX: 3, countZ: 3, scale: { x: 5, y: 1, z: 5 },
        heights: [-2.5,-2.5,-2.5, 0,0,0, -2.5,-2.5,-2.5], friction: 0 });
      body = world.createBody({ type: 'dynamic', position: { x: 0, y: .52, z: 0 },
        linearVelocity: { x: 0, y: -3, z: 0 }, enableSleep: false });
      body.createBox({ halfExtents: { x: .5, y: .5, z: .5 }, density: 1, friction: 0 });
      world.step(1 / 60, 4);
    } else throw new Error('Unknown physical fixture');
    return { position: body.getPosition(), velocity: body.getLinearVelocity(), angular: body.getAngularVelocity(),
      manifolds: body.getContactData().flatMap(contact => contact.manifolds) };
  } finally { world.destroy(); world.delete(); }
}
