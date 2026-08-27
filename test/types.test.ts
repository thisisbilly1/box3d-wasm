import Box3D, {
  type ContactData,
  type HeightFieldOptions,
  type Matrix3,
  type MeshOptions,
  type RayHit,
  type Vec3,
} from 'box3d-wasm';
import DeluxeBox3D from 'box3d-wasm/deluxe';
import IsoBox3D from 'box3d-wasm/iso';
import StandardBox3D from 'box3d-wasm/standard';

async function exerciseDeclarations() {
  const b3 = await Box3D();
  const world = new b3.World({ gravity: { x: 0, y: -10, z: 0 }, workerCount: 4 });
  const terrain = world.createBody({ type: 'static', userData: 1 });
  const heightFieldOptions: HeightFieldOptions = {
    heights: new Float32Array([0, 0, 0, 0]),
    countX: 2,
    countZ: 2,
    restitutionCombine: 'min',
  };
  terrain.createHeightField(heightFieldOptions);

  const meshOptions: MeshOptions = {
    vertices: new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, 1]),
    indices: new Uint32Array([0, 1, 2]),
    identifyEdges: true,
  };
  terrain.createMesh(meshOptions);

  const body = world.createBody({ type: 'dynamic', userData: 2 });
  const box = body.createBox({ halfExtents: { x: 1, y: 1, z: 1 }, density: 1 });
  const massData = box.computeMassData();
  void massData.mass;
  void massData.center.x;
  void massData.inertia.cx.x;
  const velocity: Vec3 = body.getWorldPointVelocity({ x: 1, y: 0, z: 0 });
  const inertia: Matrix3 = body.getWorldInverseRotationalInertia();
  const contacts: ContactData[] = body.getContactData();
  const hits: RayHit[] = world.castRay(
    { x: 0, y: 10, z: 0 },
    { x: 0, y: -20, z: 0 },
    { excludeBodyUserData: [2], maxHits: 1 },
  );

  const standard = await StandardBox3D();
  const deluxe = await DeluxeBox3D();
  const iso = await IsoBox3D();
  return { contacts, deluxe, hits, inertia, iso, standard, velocity };
}

void exerciseDeclarations;
