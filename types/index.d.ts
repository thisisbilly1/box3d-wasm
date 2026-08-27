export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat extends Vec3 {
  w: number;
}

export interface Transform {
  position: Vec3;
  rotation: Quat;
}

export interface Matrix3 {
  cx: Vec3;
  cy: Vec3;
  cz: Vec3;
}

export interface AABB {
  lowerBound: Vec3;
  upperBound: Vec3;
}

export interface CollisionFilter {
  categoryBits?: number;
  maskBits?: number;
  groupIndex?: number;
}

export type MaterialCombineRule = 'average' | 'min' | 'multiply' | 'max';

export interface SurfaceMaterialOptions {
  friction?: number;
  restitution?: number;
  rollingResistance?: number;
  tangentVelocity?: Vec3;
  userMaterialId?: number;
  frictionCombine?: MaterialCombineRule;
  restitutionCombine?: MaterialCombineRule;
}

export interface ShapeOptions extends SurfaceMaterialOptions {
  density?: number;
  filter?: CollisionFilter;
  userData?: number;
  isSensor?: boolean;
  enableSensorEvents?: boolean;
  enableContactEvents?: boolean;
  enableHitEvents?: boolean;
  invokeContactCreation?: boolean;
  updateBodyMass?: boolean;
}

export interface SphereOptions extends ShapeOptions {
  center?: Vec3;
  radius?: number;
}

export interface CapsuleOptions extends ShapeOptions {
  radius?: number;
  height?: number;
  center1?: Vec3;
  center2?: Vec3;
}

export interface BoxOptions extends ShapeOptions {
  halfExtents?: Vec3;
  hx?: number;
  hy?: number;
  hz?: number;
  offset?: Vec3;
  rotation?: Quat;
}

export interface HullOptions extends ShapeOptions {
  points: readonly Vec3[];
  maxVertices?: number;
}

export interface MeshOptions extends ShapeOptions {
  vertices: readonly Vec3[] | ArrayLike<number>;
  indices: ArrayLike<number>;
  materialIndices?: ArrayLike<number>;
  materials?: readonly SurfaceMaterialOptions[];
  scale?: Vec3;
  weldTolerance?: number;
  weldVertices?: boolean;
  useMedianSplit?: boolean;
  identifyEdges?: boolean;
}

export interface HeightFieldOptions extends ShapeOptions {
  heights: ArrayLike<number>;
  countX: number;
  countZ: number;
  materialIndices?: ArrayLike<number>;
  materials?: readonly SurfaceMaterialOptions[];
  scale?: Vec3;
  globalMinimumHeight?: number;
  globalMaximumHeight?: number;
  clockwiseWinding?: boolean;
}

export interface MotionLocks {
  linearX?: boolean;
  linearY?: boolean;
  linearZ?: boolean;
  angularX?: boolean;
  angularY?: boolean;
  angularZ?: boolean;
}

export type BodyType = 'static' | 'kinematic' | 'dynamic';

export interface BodyOptions {
  type?: BodyType;
  name?: string;
  userData?: number;
  position?: Vec3;
  rotation?: Quat;
  linearVelocity?: Vec3;
  angularVelocity?: Vec3;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
  sleepThreshold?: number;
  enableSleep?: boolean;
  isAwake?: boolean;
  isBullet?: boolean;
  isEnabled?: boolean;
  allowFastRotation?: boolean;
  enableContactRecycling?: boolean;
  motionLocks?: MotionLocks;
}

export interface ManifoldPoint {
  anchorA: Vec3;
  anchorB: Vec3;
  separation: number;
  normalImpulse: number;
  totalNormalImpulse: number;
  normalVelocity: number;
  featureId: number;
  triangleIndex: number;
  persisted: boolean;
}

export interface ContactManifold {
  normal: Vec3;
  twistImpulse: number;
  frictionImpulse: Vec3;
  rollingImpulse: Vec3;
  points: ManifoldPoint[];
}

export interface ContactData {
  shapeUserDataA: number;
  shapeUserDataB: number;
  bodyUserDataA: number;
  bodyUserDataB: number;
  manifolds: ContactManifold[];
}

export interface RayHit {
  point: Vec3;
  normal: Vec3;
  fraction: number;
  shapeUserData: number;
  bodyUserData: number;
  userMaterialId: number;
  triangleIndex: number;
  childIndex: number;
  shape: Shape;
}

export type ClosestRayResult = { hit: false } | ({ hit: true } & Omit<RayHit, 'userMaterialId' | 'triangleIndex' | 'childIndex'>);

export interface RayFilter {
  categoryBits?: number;
  maskBits?: number;
  excludeShapeUserData?: readonly number[];
  excludeBodyUserData?: readonly number[];
  maxHits?: number;
}

export interface EmbindHandle {
  delete(): void;
}

export interface ShapeMassData {
  mass: number;
  center: Vec3;
  inertia: Matrix3;
}

export interface Shape extends EmbindHandle {
  isValid(): boolean;
  destroy(updateBodyMass: boolean): void;
  getType(): 'sphere' | 'capsule' | 'hull' | 'mesh' | 'heightField' | 'compound' | 'unknown';
  getUserData(): number;
  setUserData(tag: number): void;
  getFriction(): number;
  setFriction(friction: number): void;
  getRestitution(): number;
  setRestitution(restitution: number): void;
  getDensity(): number;
  setDensity(density: number, updateBodyMass: boolean): void;
  computeMassData(): ShapeMassData;
  isSensor(): boolean;
  enableSensorEvents(flag: boolean): void;
  enableContactEvents(flag: boolean): void;
  enableHitEvents(flag: boolean): void;
  getFilter(): Required<CollisionFilter>;
  setFilter(filter: CollisionFilter): void;
  getAABB(): AABB;
  rayCast(origin: Vec3, translation: Vec3): { hit: false } | { hit: true; point: Vec3; normal: Vec3; fraction: number };
}

export interface Body extends EmbindHandle {
  isValid(): boolean;
  destroy(): void;
  getType(): BodyType | 'unknown';
  setType(type: BodyType): void;
  getName(): string;
  setName(name: string): void;
  getUserData(): number;
  setUserData(tag: number): void;
  getPosition(): Vec3;
  getRotation(): Quat;
  getTransform(): Transform;
  setTransform(position: Vec3, rotation: Quat): void;
  setTargetTransform(target: Partial<Transform>, timeStep: number, wake: boolean): void;
  getLinearVelocity(): Vec3;
  setLinearVelocity(value: Vec3): void;
  getAngularVelocity(): Vec3;
  setAngularVelocity(value: Vec3): void;
  applyForce(force: Vec3, worldPoint: Vec3, wake: boolean): void;
  applyForceToCenter(force: Vec3, wake: boolean): void;
  applyTorque(torque: Vec3, wake: boolean): void;
  applyLinearImpulse(impulse: Vec3, worldPoint: Vec3, wake: boolean): void;
  applyLinearImpulseToCenter(impulse: Vec3, wake: boolean): void;
  applyAngularImpulse(impulse: Vec3, wake: boolean): void;
  getMass(): number;
  applyMassFromShapes(): void;
  getLocalCenterOfMass(): Vec3;
  getWorldCenterOfMass(): Vec3;
  getLocalPoint(worldPoint: Vec3): Vec3;
  getWorldPoint(localPoint: Vec3): Vec3;
  getWorldPointVelocity(worldPoint: Vec3): Vec3;
  getWorldInverseRotationalInertia(): Matrix3;
  getLinearDamping(): number;
  setLinearDamping(damping: number): void;
  getAngularDamping(): number;
  setAngularDamping(damping: number): void;
  getGravityScale(): number;
  setGravityScale(scale: number): void;
  isAwake(): boolean;
  setAwake(awake: boolean): void;
  enableSleep(flag: boolean): void;
  isEnabled(): boolean;
  setEnabled(flag: boolean): void;
  isBullet(): boolean;
  setBullet(flag: boolean): void;
  setMotionLocks(locks: MotionLocks): void;
  getMotionLocks(): Required<MotionLocks>;
  getShapeCount(): number;
  computeAABB(): AABB;
  getContactData(): ContactData[];
  createSphere(options?: SphereOptions): Shape;
  createCapsule(options?: CapsuleOptions): Shape;
  createBox(options?: BoxOptions): Shape;
  createHull(options: HullOptions): Shape;
  createMesh(options: MeshOptions): Shape;
  createHeightField(options: HeightFieldOptions): Shape;
}

export interface JointFrameOptions {
  localFrameA?: Partial<Transform>;
  localFrameB?: Partial<Transform>;
  anchorA?: Vec3;
  anchorB?: Vec3;
  collideConnected?: boolean;
  forceThreshold?: number;
  torqueThreshold?: number;
}

export interface DistanceJointOptions extends JointFrameOptions {
  length?: number;
  enableSpring?: boolean;
  hertz?: number;
  dampingRatio?: number;
  lowerSpringForce?: number;
  upperSpringForce?: number;
  enableLimit?: boolean;
  minLength?: number;
  maxLength?: number;
  enableMotor?: boolean;
  maxMotorForce?: number;
  motorSpeed?: number;
}

export interface RevoluteJointOptions extends JointFrameOptions {
  targetAngle?: number;
  enableSpring?: boolean;
  hertz?: number;
  dampingRatio?: number;
  enableLimit?: boolean;
  lowerAngle?: number;
  upperAngle?: number;
  enableMotor?: boolean;
  maxMotorTorque?: number;
  motorSpeed?: number;
}

export interface SphericalJointOptions extends JointFrameOptions {
  enableSpring?: boolean;
  hertz?: number;
  dampingRatio?: number;
  targetRotation?: Quat;
  enableConeLimit?: boolean;
  coneAngle?: number;
  enableTwistLimit?: boolean;
  lowerTwistAngle?: number;
  upperTwistAngle?: number;
  enableMotor?: boolean;
  maxMotorTorque?: number;
  motorVelocity?: Vec3;
}

export interface PrismaticJointOptions extends JointFrameOptions {
  enableSpring?: boolean;
  hertz?: number;
  dampingRatio?: number;
  targetTranslation?: number;
  enableLimit?: boolean;
  lowerTranslation?: number;
  upperTranslation?: number;
  enableMotor?: boolean;
  maxMotorForce?: number;
  motorSpeed?: number;
}

export interface WeldJointOptions extends JointFrameOptions {
  linearHertz?: number;
  angularHertz?: number;
  linearDampingRatio?: number;
  angularDampingRatio?: number;
}

export interface MotorJointOptions extends JointFrameOptions {
  linearVelocity?: Vec3;
  maxVelocityForce?: number;
  angularVelocity?: Vec3;
  maxVelocityTorque?: number;
  linearHertz?: number;
  linearDampingRatio?: number;
  maxSpringForce?: number;
  angularHertz?: number;
  angularDampingRatio?: number;
  maxSpringTorque?: number;
}

export interface WheelJointOptions extends JointFrameOptions {
  enableSuspensionSpring?: boolean;
  suspensionHertz?: number;
  suspensionDampingRatio?: number;
  enableSuspensionLimit?: boolean;
  lowerSuspensionLimit?: number;
  upperSuspensionLimit?: number;
  enableSpinMotor?: boolean;
  maxSpinTorque?: number;
  spinSpeed?: number;
  enableSteering?: boolean;
  steeringHertz?: number;
  steeringDampingRatio?: number;
  targetSteeringAngle?: number;
  maxSteeringTorque?: number;
  enableSteeringLimit?: boolean;
  lowerSteeringLimit?: number;
  upperSteeringLimit?: number;
}

export interface ParallelJointOptions extends JointFrameOptions {
  hertz?: number;
  dampingRatio?: number;
  maxTorque?: number;
}

export interface Joint extends EmbindHandle {
  isValid(): boolean;
  destroy(wakeAttached: boolean): void;
  getType(): string;
  wakeBodies(): void;
  getCollideConnected(): boolean;
  setCollideConnected(flag: boolean): void;
  getLocalFrameA(): Transform;
  getLocalFrameB(): Transform;
  getConstraintForce(): Vec3;
  getConstraintTorque(): Vec3;
}

export interface DistanceJoint extends Joint {
  setLength(length: number): void;
  getLength(): number;
  getCurrentLength(): number;
  enableSpring(flag: boolean): void;
  setSpringHertz(hertz: number): void;
  setSpringDampingRatio(ratio: number): void;
  enableLimit(flag: boolean): void;
  setLengthRange(minLength: number, maxLength: number): void;
  enableMotor(flag: boolean): void;
  setMotorSpeed(speed: number): void;
  setMaxMotorForce(force: number): void;
}

export interface RevoluteJoint extends Joint {
  getAngle(): number;
  enableSpring(flag: boolean): void;
  setSpringHertz(hertz: number): void;
  setSpringDampingRatio(ratio: number): void;
  setTargetAngle(radians: number): void;
  enableLimit(flag: boolean): void;
  setLimits(lower: number, upper: number): void;
  enableMotor(flag: boolean): void;
  setMotorSpeed(speed: number): void;
  setMaxMotorTorque(torque: number): void;
  getMotorTorque(): number;
}

export interface SphericalJoint extends Joint {
  enableConeLimit(flag: boolean): void;
  setConeLimit(radians: number): void;
  getConeAngle(): number;
  enableTwistLimit(flag: boolean): void;
  setTwistLimits(lower: number, upper: number): void;
  getTwistAngle(): number;
  enableSpring(flag: boolean): void;
  setSpringHertz(hertz: number): void;
  setSpringDampingRatio(ratio: number): void;
  setTargetRotation(rotation: Quat): void;
  enableMotor(flag: boolean): void;
  setMotorVelocity(velocity: Vec3): void;
  setMaxMotorTorque(torque: number): void;
}

export interface PrismaticJoint extends Joint {
  getTranslation(): number;
  getSpeed(): number;
  enableSpring(flag: boolean): void;
  setSpringHertz(hertz: number): void;
  setSpringDampingRatio(ratio: number): void;
  setTargetTranslation(translation: number): void;
  enableLimit(flag: boolean): void;
  setLimits(lower: number, upper: number): void;
  enableMotor(flag: boolean): void;
  setMotorSpeed(speed: number): void;
  setMaxMotorForce(force: number): void;
}

export interface WeldJoint extends Joint {
  setLinearHertz(hertz: number): void;
  setLinearDampingRatio(ratio: number): void;
  setAngularHertz(hertz: number): void;
  setAngularDampingRatio(ratio: number): void;
}

export interface MotorJoint extends Joint {
  setLinearVelocity(velocity: Vec3): void;
  setAngularVelocity(velocity: Vec3): void;
  setMaxVelocityForce(force: number): void;
  setMaxVelocityTorque(torque: number): void;
  setLinearHertz(hertz: number): void;
  setLinearDampingRatio(ratio: number): void;
  setAngularHertz(hertz: number): void;
  setAngularDampingRatio(ratio: number): void;
  setMaxSpringForce(force: number): void;
  setMaxSpringTorque(torque: number): void;
}

export interface WheelJoint extends Joint {
  enableSuspension(flag: boolean): void;
  setSuspensionHertz(hertz: number): void;
  setSuspensionDampingRatio(ratio: number): void;
  enableSuspensionLimit(flag: boolean): void;
  setSuspensionLimits(lower: number, upper: number): void;
  enableSpinMotor(flag: boolean): void;
  setSpinMotorSpeed(speed: number): void;
  setMaxSpinTorque(torque: number): void;
  getSpinSpeed(): number;
  enableSteering(flag: boolean): void;
  setSteeringHertz(hertz: number): void;
  setSteeringDampingRatio(ratio: number): void;
  setMaxSteeringTorque(torque: number): void;
  enableSteeringLimit(flag: boolean): void;
  setSteeringLimits(lower: number, upper: number): void;
  setTargetSteeringAngle(radians: number): void;
  getSteeringAngle(): number;
}

export interface ParallelJoint extends Joint {
  setSpringHertz(hertz: number): void;
  setSpringDampingRatio(ratio: number): void;
  setMaxTorque(torque: number): void;
}

export type FilterJoint = Joint;

export interface WorldOptions {
  gravity?: Vec3;
  restitutionThreshold?: number;
  hitEventThreshold?: number;
  contactHertz?: number;
  contactDampingRatio?: number;
  contactSpeed?: number;
  maximumLinearSpeed?: number;
  enableSleep?: boolean;
  enableContinuous?: boolean;
  workerCount?: number;
}

export interface ExplosionOptions {
  position?: Vec3;
  radius?: number;
  falloff?: number;
  impulsePerArea?: number;
  maskBits?: number;
}

export interface BodyMoveEvent extends Transform {
  userData: number;
  fellAsleep: boolean;
}

export interface ShapePairEvent {
  shapeUserDataA: number | null;
  shapeUserDataB: number | null;
}

export interface ContactHitEvent extends ShapePairEvent {
  point: Vec3;
  normal: Vec3;
  approachSpeed: number;
}

export interface SensorEvent {
  sensorUserData: number | null;
  visitorUserData: number | null;
}

export interface World extends EmbindHandle {
  isValid(): boolean;
  destroy(): void;
  step(timeStep: number, subStepCount: number): void;
  getGravity(): Vec3;
  setGravity(gravity: Vec3): void;
  enableSleeping(flag: boolean): void;
  enableContinuous(flag: boolean): void;
  getAwakeBodyCount(): number;
  getWorkerCount(): number;
  setMaterialCallbacks(): void;
  createBody(options?: BodyOptions): Body;
  createDistanceJoint(a: Body, b: Body, options?: DistanceJointOptions): DistanceJoint;
  createRevoluteJoint(a: Body, b: Body, options?: RevoluteJointOptions): RevoluteJoint;
  createSphericalJoint(a: Body, b: Body, options?: SphericalJointOptions): SphericalJoint;
  createPrismaticJoint(a: Body, b: Body, options?: PrismaticJointOptions): PrismaticJoint;
  createWeldJoint(a: Body, b: Body, options?: WeldJointOptions): WeldJoint;
  createMotorJoint(a: Body, b: Body, options?: MotorJointOptions): MotorJoint;
  createWheelJoint(a: Body, b: Body, options?: WheelJointOptions): WheelJoint;
  createParallelJoint(a: Body, b: Body, options?: ParallelJointOptions): ParallelJoint;
  createFilterJoint(a: Body, b: Body, options?: JointFrameOptions): FilterJoint;
  castRayClosest(origin: Vec3, translation: Vec3, filter?: RayFilter): ClosestRayResult;
  castRay(origin: Vec3, translation: Vec3, filter?: RayFilter): RayHit[];
  explode(options: ExplosionOptions): void;
  getBodyEvents(): BodyMoveEvent[];
  getContactEvents(): { begin: ShapePairEvent[]; end: ShapePairEvent[]; hit: ContactHitEvent[] };
  getSensorEvents(): { begin: SensorEvent[]; end: SensorEvent[] };
  getProfile(): { step: number; pairs: number; collide: number; solve: number };
}

export interface Box3DModule {
  readonly threaded: boolean;
  readonly maxWorkers: number;
  readonly World: {
    new (): World;
    new (options: WorldOptions): World;
  };
}

export type Box3DFactory = (moduleOverrides?: Record<string, unknown>) => Promise<Box3DModule>;

declare const Box3D: Box3DFactory;
export default Box3D;
