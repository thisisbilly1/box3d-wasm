import type { BodyOptions, BoxOptions, ExplosionOptions, SphereOptions, Vec3 } from './index.js';

export interface IsoShape {
  destroy(): void;
}

export interface IsoBody {
  destroy(): void;
  getPosition(): Vec3;
  getRotation(): { x: number; y: number; z: number; w: number };
  getLinearVelocity(): Vec3;
  getAngularVelocity(): Vec3;
  setTransform(position: Vec3, rotation: { x: number; y: number; z: number; w: number }): void;
  setLinearVelocity(velocity: Vec3): void;
  setAngularVelocity(velocity: Vec3): void;
  setGravityScale(scale: number): void;
  setMotionLocks(locks: { angularX?: boolean; angularY?: boolean; angularZ?: boolean }): void;
  applyLinearImpulseToCenter(impulse: Vec3, wake: boolean): void;
  createBox(options: BoxOptions): IsoShape;
  createSphere(options: SphereOptions): IsoShape;
}

export interface IsoWorld {
  step(timeStep: number, subStepCount: number): void;
  setGravity(gravity: Vec3): void;
  explode(options: ExplosionOptions): void;
  createBody(options?: BodyOptions): IsoBody;
  destroy(): void;
}

export interface IsoModule {
  readonly threaded: boolean;
  readonly maxWorkers: number;
  readonly World: new (options?: { gravity?: Vec3; enableSleep?: boolean; workerCount?: number }) => IsoWorld;
}

declare const Box3D: () => Promise<IsoModule>;
export default Box3D;
