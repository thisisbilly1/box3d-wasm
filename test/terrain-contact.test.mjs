import assert from 'node:assert/strict';
import { test } from 'node:test';
import Standard from '../dist/box3d.mjs';
import Deluxe from '../dist/box3d.deluxe.mjs';
import { runTerrainContactFixture } from './fixtures/terrain-contact.mjs';

for (const [flavour, factory, workers] of [['standard', Standard, 1], ['deluxe', Deluxe, 2]]) {
  const module = await factory();
  test(`${flavour}: a gentle welded seam does not contribute a sideways wheel-edge normal`, () => {
    const result = runTerrainContactFixture(module, 'seam', workers);
    assert.ok(result.manifolds.length >= 2, 'neighboring surface contacts must remain');
    assert.ok(result.manifolds.every(m => m.normal.y > .98), JSON.stringify(result.manifolds.map(m => m.normal)));
    assert.ok(result.velocity.y < 6, `unexpected bare-wheel vertical kick: ${result.velocity.y}`);
  });
  for (const name of ['wall', 'mesh-boundary']) test(`${flavour}: ${name} still blocks incoming motion`, () => {
    const result = runTerrainContactFixture(module, name, workers);
    assert.ok(result.position.z >= (name === 'wall' ? .98 : .48), JSON.stringify(result));
    assert.ok(result.velocity.z > -.1, 'body must stop at the real obstacle');
    assert.ok(result.manifolds.some(m => m.normal.z > .9), 'real opposing contact must remain');
  });
  test(`${flavour}: a sharp convex ridge retains an upward supporting normal`, () => {
    const result = runTerrainContactFixture(module, 'ridge', workers);
    assert.ok(result.manifolds.some(m => m.normal.y > .85), 'ridge support must remain');
    assert.ok(result.position.y >= .49, 'body must not tunnel through the ridge');
    assert.ok(result.velocity.y > -1, 'ridge must oppose the incoming fall');
  });
}
