import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

for (const artifact of ['box3d.mjs', 'box3d.deluxe.mjs']) {
  test(`${artifact} does not require script-src unsafe-eval`, async () => {
    const source = await readFile(new URL(`../dist/${artifact}`, import.meta.url), 'utf8');

    assert.ok(!source.includes('new Function('), `${artifact} contains new Function()`);
    assert.ok(!source.includes('eval('), `${artifact} contains eval()`);
  });
}
